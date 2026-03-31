import React, { useEffect, useState } from 'react'
import CardGrid from '../components/CardGrid'
import Hero from '../components/Hero'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80'

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
    <>
      <Hero
        eyebrow="Community Learning Hub"
        title="Grow your skills with people who care"
        subtitle="Discover hands-on workshops, connect with expert trainers, and join a community that learns together."
        imageUrl={HERO_IMAGE}
      />
      <main>
        <h2>Upcoming Workshops</h2>

        {loading && <p>Loading workshops…</p>}
        {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}

        {!loading && !error && <CardGrid records={workshops} />}
      </main>
    </>
  )
}
