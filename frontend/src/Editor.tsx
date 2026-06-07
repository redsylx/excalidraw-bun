import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Excalidraw, restore } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { getDrawing, saveDrawing, renameDrawing } from './api'

export default function Editor() {
  const { name } = useParams<{ name: string }>()
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(name || '')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const nameRef = useRef(name)
  const unsubRef = useRef<(() => void) | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    nameRef.current = name
    setEditValue(name || '')
  }, [name])

  const handleStartEdit = () => {
    setEditValue(name || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === name) {
      setIsEditing(false)
      return
    }
    try {
      await renameDrawing(name!, trimmed)
      navigate(`/editor/${encodeURIComponent(trimmed)}`, { replace: true })
      setIsEditing(false)
    } catch {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditValue(name || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') { e.preventDefault(); handleCancel() }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setLoadState('loading')
    setReady(false)
    getDrawing(name!).then((raw: any) => {
      if (raw) {
        if (raw.appState?.collaborators) {
          delete raw.appState.collaborators
        }
        const restored = restore(raw, null, null)
        setData(restored)
      } else {
        setData(null)
      }
      setLoadState('ready')
      setTimeout(() => setReady(true), 0)
    }).catch(() => {
      setLoadState('error')
      setReady(true)
    })
  }, [name])

  const handleReady = useCallback((api: any) => {
    if (unsubRef.current) unsubRef.current()
    unsubRef.current = api.onChange(
      (elements: readonly any[], appState: any, files: any) => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(async () => {
          const currentName = nameRef.current
          if (!currentName) return
          try {
            const filesObj: Record<string, unknown> = {}
            if (files) {
              if (files instanceof Map) {
                files.forEach((v: any, k: string) => { filesObj[k] = v })
              } else {
                Object.assign(filesObj, files)
              }
            }
            const { collaborators, ...cleanAppState } = appState
            await saveDrawing(currentName, {
              type: 'excalidraw',
              version: 2,
              source: 'https://excalidraw.com',
              elements: Array.from(elements),
              appState: cleanAppState,
              files: filesObj,
            })
          } catch {}
        }, 2000)
      },
    )
  }, [])

  if (!ready) {
    return (
      <div className="editor-container">
        <div className="editor-header">
          <Link to="/" className="back-link">←</Link>
          {isEditing ? (
            <input
              ref={inputRef}
              className="project-name-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <span className="project-name" onClick={handleStartEdit}>{name}</span>
          )}
        </div>
        <div className="status-center">
          {loadState === 'loading' ? 'Loading...' : loadState === 'error' ? 'Failed to load' : ''}
        </div>
      </div>
    )
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <Link to="/" className="back-link">←</Link>
        {isEditing ? (
          <input
            ref={inputRef}
            className="project-name-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className="project-name" onClick={handleStartEdit}>{name}</span>
        )}
      </div>
      <div className="excalidraw-wrapper">
        <Excalidraw
          key={name}
          initialData={data}
          excalidrawAPI={handleReady}
        />
      </div>
    </div>
  )
}
