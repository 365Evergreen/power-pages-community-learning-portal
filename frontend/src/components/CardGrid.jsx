import React from 'react'

function Card({ record }) {
  const title = record.ppdev_name || record.name || record.subject || Object.values(record)[0] || 'Workshop'
  const secondary = record.description || record.ppdev_description || ''

  return (
    <article className="card">
      <h3 className="card-title">{title}</h3>
      {secondary ? <p className="card-desc">{secondary}</p> : null}
      <pre className="card-meta">{JSON.stringify(record, null, 2)}</pre>
    </article>
  )
}

export default function CardGrid({ records = [] }) {
  if (!records || records.length === 0) return <p>No workshops found.</p>

  return (
    <section className="card-grid">
      {records.map((r) => (
        <Card key={r.ppdev_communityworkshopid || r.id || r.activityid || Math.random()} record={r} />
      ))}
    </section>
  )
}
