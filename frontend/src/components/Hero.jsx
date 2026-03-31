import './Hero.css'

/**
 * Full-width hero banner for page headers.
 *
 * Props:
 *   title       {string}  — main heading (required)
 *   subtitle    {string}  — supporting copy (optional)
 *   eyebrow     {string}  — small label above title (optional)
 *   imageUrl    {string}  — background image URL (optional; falls back to solid colour)
 */
export default function Hero({ title, subtitle, eyebrow, imageUrl }) {
  const style = imageUrl
    ? { '--hero-bg-image': `url(${imageUrl})` }
    : undefined

  return (
    <section className="hero" style={style} aria-label={title}>
      <div className="hero__content">
        {eyebrow && <span className="hero__eyebrow">{eyebrow}</span>}
        <h1 className="hero__title">{title}</h1>
        {subtitle && <p className="hero__subtitle">{subtitle}</p>}
      </div>
    </section>
  )
}
