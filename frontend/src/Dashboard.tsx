import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDrawings, createDrawing, deleteDrawing } from './api'

export default function Dashboard() {
  const [drawings, setDrawings] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const refresh = () => {
    setLoading(true)
    listDrawings().then(setDrawings).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  const handleCreate = async () => {
    const name = prompt('Project name:')
    if (!name || !name.trim()) return
    try {
      await createDrawing(name.trim())
      navigate(`/editor/${encodeURIComponent(name.trim())}`)
    } catch {
      alert('Project already exists')
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteDrawing(name)
      setDrawings((prev) => prev.filter((d) => d !== name))
    } catch {
      alert('Failed to delete')
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Excalidraw Projects</h1>
        <button onClick={handleCreate} className="btn-primary">+ New Project</button>
      </div>
      {loading ? (
        <div className="status-center">Loading...</div>
      ) : drawings.length === 0 ? (
        <div className="status-center">
          <p>No projects yet.</p>
        </div>
      ) : (
        <div className="project-list">
          {drawings.map((name) => (
            <div key={name} className="project-card">
              <span className="project-link" onClick={() => navigate(`/editor/${encodeURIComponent(name)}`)}>
                {name}
              </span>
              <button onClick={() => handleDelete(name)} className="btn-delete" title="Delete">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
