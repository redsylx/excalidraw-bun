import { rmSync, cpSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dir!, '..')
const FRONTEND = join(ROOT, 'frontend')
const BACKEND = join(import.meta.dir!)
const OUT = join(ROOT, 'out')
const target = process.env.TARGET || ''

rmSync(OUT, { recursive: true, force: true })
rmSync(join(BACKEND, 'public'), { recursive: true, force: true })
rmSync(join(BACKEND, 'files.embed.ts'), { force: true })

if (!existsSync(join(FRONTEND, 'dist'))) {
  Bun.spawnSync(['bun', 'install'], { cwd: FRONTEND })
  const front = Bun.spawnSync(['bun', 'run', 'build'], { cwd: FRONTEND })
  if (front.exitCode !== 0) { process.exit(1) }
}

cpSync(join(FRONTEND, 'dist'), join(BACKEND, 'public'), { recursive: true })

const embed = Bun.spawnSync(['bun', 'run', 'embed.ts'], { cwd: BACKEND })
if (embed.exitCode !== 0) { console.error(embed.stderr.toString()); process.exit(1) }

const args = ['build', '--compile', '--outfile', join(OUT, 'excalidraw-server')]
if (target) args.push('--target', target)
args.push(join(BACKEND, 'server.ts'))

const compile = Bun.spawnSync(['bun', ...args])
if (compile.exitCode !== 0) { console.error(compile.stderr.toString()); process.exit(1) }

console.log(`\n✅ ${join(OUT, 'excalidraw-server')} (${target || 'native'})`)
console.log('')
console.log('📋 This is a SINGLE BINARY. No dependencies needed.')
console.log('   Copy excalidraw-server to any machine and run it.')
console.log('   Drawings are saved in ./drawings/ relative to where you run it.')
