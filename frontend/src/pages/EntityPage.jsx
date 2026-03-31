import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CardGrid from '../components/CardGrid'

export default function EntityPage() {
  const { folder } = useParams()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/entities/${folder}`)
        const text = await res.text()
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`)
        let json
        try {
          json = JSON.parse(text)
        } catch (parseErr) {
          throw new Error('Invalid JSON from backend — response starts: ' + text.slice(0, 200))
        }
        const items = Array.isArray(json) ? json : json.value || []
        if (mounted) setRecords(items)
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [folder])

  return (
    <main style={{ padding: 20 }}>
      <h1>{folder}</h1>
      {loading && <p>Loading {folder}…</p>}
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {!loading && !error && <CardGrid records={records} />}
    </main>
  )
}
