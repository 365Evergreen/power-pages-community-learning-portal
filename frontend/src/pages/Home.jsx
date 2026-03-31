import React, { useEffect, useState } from 'react'
import CardGrid from '../components/CardGrid'

export default function Home() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/workshops')
        const text = await res.text()
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`)

        let json
        try {
          json = JSON.parse(text)
        } catch (parseErr) {
          throw new Error('Invalid JSON from /api/workshops — response starts: ' + text.slice(0, 200))
        }

        const items = Array.isArray(json) ? json : json.value || []
        if (mounted) setWorkshops(items)
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [])

  return (
    <main style={{ padding: 20 }}>
      <h1>Welcome to the Power Pages SPA</h1>
      <p>This is the starter Home page for the community learning portal SPA.</p>

      {loading && <p>Loading workshops…</p>}
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}

      {!loading && !error && <CardGrid records={workshops} />}
    </main>
  )
}
