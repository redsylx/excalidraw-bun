import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join, resolve } from 'path'
import { files } from './files.embed'

const PORT = parseInt(process.env.PORT || '3000')
const DRAWINGS_DIR = join(process.cwd(), 'drawings')
const MIME: Record<string, string> = {
  html: 'text/html;charset=utf-8',
  css: 'text/css;charset=utf-8',
  js: 'application/javascript;charset=utf-8',
  json: 'application/json',
  png: 'image/png',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  woff: 'font/woff',
  webmanifest: 'application/manifest+json',
}

mkdirSync(DRAWINGS_DIR, { recursive: true })

function safePath(name: string): string | null {
  const safe = name.replace(/\.\./g, '').replace(/\//g, '').replace(/\\/g, '')
  if (!safe) return null
  const resolved = resolve(join(DRAWINGS_DIR, `${safe}.excalidraw`))
  if (!resolved.startsWith(resolve(DRAWINGS_DIR))) return null
  return resolved
}

async function apiRoutes(req: Request, url: URL): Promise<Response | null> {
  const match = url.pathname.match(/^\/api\/drawings(?:\/(.+))?$/)
  if (!match) return null
  const name = match[1]

  switch (req.method) {
    case 'GET': {
      if (!name) {
        try {
          const files = readdirSync(DRAWINGS_DIR)
            .filter((f: string) => f.endsWith('.excalidraw'))
            .map((f: string) => f.replace('.excalidraw', ''))
          return Response.json(files)
        } catch { return Response.json({ error: 'Failed to list' }, { status: 500 }) }
      }
      const fp = safePath(name)
      if (!fp) return Response.json({ error: 'Invalid name' }, { status: 400 })
      if (!existsSync(fp)) return Response.json({ error: 'Not found' }, { status: 404 })
      try { return Response.json(JSON.parse(readFileSync(fp, 'utf-8'))) }
      catch { return Response.json({ error: 'Failed to read' }, { status: 500 }) }
    }
    case 'POST': {
      if (!name) return Response.json({ error: 'Name required' }, { status: 400 })
      const fp = safePath(name)
      if (!fp) return Response.json({ error: 'Invalid name' }, { status: 400 })
      if (existsSync(fp)) return Response.json({ error: 'Already exists' }, { status: 409 })
      try {
        writeFileSync(fp, JSON.stringify({
          type: 'excalidraw', version: 2, source: 'https://excalidraw.com',
          elements: [], appState: {}, files: {},
        }))
        return Response.json({ message: 'Created' }, { status: 201 })
      } catch { return Response.json({ error: 'Failed to create' }, { status: 500 }) }
    }
    case 'PUT': {
      if (!name) return Response.json({ error: 'Name required' }, { status: 400 })
      const fp = safePath(name)
      if (!fp) return Response.json({ error: 'Invalid name' }, { status: 400 })
      try {
        const body = await req.json()
        writeFileSync(fp, JSON.stringify(body))
        return Response.json({ message: 'Saved' })
      } catch { return Response.json({ error: 'Failed to save' }, { status: 500 }) }
    }
    case 'DELETE': {
      if (!name) return Response.json({ error: 'Name required' }, { status: 400 })
      const fp = safePath(name)
      if (!fp) return Response.json({ error: 'Invalid name' }, { status: 400 })
      if (!existsSync(fp)) return Response.json({ error: 'Not found' }, { status: 404 })
      try { unlinkSync(fp); return Response.json({ message: 'Deleted' }) }
      catch { return Response.json({ error: 'Failed to delete' }, { status: 500 }) }
    }
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const apiRes = await apiRoutes(req, url)
    if (apiRes) return apiRes

    const filePath = url.pathname === '/' ? '/index.html' : url.pathname
    const embedded = files[filePath]

    if (embedded) {
      const contentType = MIME[embedded.ext] || 'application/octet-stream'
      const buf = Buffer.from(embedded.data, 'base64')
      return new Response(buf, {
        headers: { 'Content-Type': contentType },
      })
    }

    const fallback = files['/index.html']
    if (fallback) {
      const buf = Buffer.from(fallback.data, 'base64')
      return new Response(buf, {
        headers: { 'Content-Type': 'text/html;charset=utf-8' },
      })
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Server running on http://localhost:${PORT}`)
