import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Excalidraw, restore } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { getDrawing, saveDrawing } from './api'

export default function Editor() {
  const { name } = useParams<{ name: string }>()
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const nameRef = useRef(name)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    nameRef.current = name
  }, [name])

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
          <Link to="/" className="back-link">← Dashboard</Link>
          <span className="project-name">{name}</span>
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
        <Link to="/" className="back-link">← Dashboard</Link>
        <span className="project-name">{name}</span>
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
