import { Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
import Editor from './Editor'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/editor/:name" element={<Editor />} />
    </Routes>
  )
}
