const BASE = '/api'

export async function listDrawings(): Promise<string[]> {
  const res = await fetch(`${BASE}/drawings`)
  if (!res.ok) throw new Error('Failed to list')
  return res.json()
}

export async function getDrawing(name: string): Promise<unknown> {
  const res = await fetch(`${BASE}/drawings/${encodeURIComponent(name)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load')
  return res.json()
}

export async function saveDrawing(name: string, data: unknown): Promise<void> {
  const res = await fetch(`${BASE}/drawings/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save')
}

export async function createDrawing(name: string): Promise<void> {
  const res = await fetch(`${BASE}/drawings/${encodeURIComponent(name)}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to create')
}

export async function deleteDrawing(name: string): Promise<void> {
  const res = await fetch(`${BASE}/drawings/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete')
}

export async function renameDrawing(oldName: string, newName: string): Promise<void> {
  const res = await fetch(`${BASE}/drawings/${encodeURIComponent(oldName)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newName }),
  })
  if (!res.ok) throw new Error('Failed to rename')
}
