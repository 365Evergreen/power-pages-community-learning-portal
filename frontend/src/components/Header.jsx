import React, { useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Header.css'

const NAV_LINKS = [
  { label: 'Home',       to: '/' },
  { label: 'About',      to: '/about' },
  { label: 'Workshops',  to: '/entities/ppdev_Communityworkshop' },
  { label: 'Learners',   to: '/entities/ppdev_Communitylearner' },
  { label: 'Trainers',   to: '/entities/ppdev_Communitytrainer' },
  { label: 'Enrolments', to: '/entities/ppdev_Communitytrainingenrolment' },
  { label: 'Feedback',   to: '/entities/ppdev_Communitymemberfeedback' },
  { label: 'SPA Routes', to: '/entities/ppdev_Sparoute' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, loading, signIn, signOut } = useAuth()

  const toggle = useCallback(() => setOpen(o => !o), [])
  const close  = useCallback(() => setOpen(false), [])

  return (
    <header className="header">
      <div className="header__inner">
        <NavLink to="/" className="header__brand" onClick={close}>
          <span className="header__brand-icon" aria-hidden="true">🎓</span>
          Community Learning
        </NavLink>

        {/* Desktop nav */}
        <nav aria-label="Main navigation">
          <ul className="header__nav">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => isActive ? 'active' : undefined}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Auth area */}
        {!loading && (
          isAuthenticated ? (
            <div className="header__user">
              <span className="header__avatar" aria-hidden="true">
                {user.name ? user.name[0].toUpperCase() : '?'}
              </span>
              <span className="header__user-name">{user.name}</span>
              <button className="header__auth-btn" onClick={signOut}>Sign Out</button>
            </div>
          ) : (
            <div className="header__auth-actions">
              <NavLink to="/signup" className="header__auth-btn">Sign Up</NavLink>
              <button className="header__auth-btn header__auth-btn--primary" onClick={signIn}>
                Sign In
              </button>
            </div>
          )
        )}

        {/* Mobile hamburger */}
        <button
          className="header__hamburger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          onClick={toggle}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile drawer */}
      <nav
        id="mobile-drawer"
        className={`header__drawer${open ? ' open' : ''}`}
        aria-label="Mobile navigation"
      >
        {NAV_LINKS.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => isActive ? 'active' : undefined}
            onClick={close}
          >
            {label}
          </NavLink>
        ))}
        {!loading && (
          <div className="header__drawer-auth">
            {isAuthenticated ? (
              <>
                <span className="header__drawer-username">{user.name}</span>
                <button className="header__drawer-auth-btn" onClick={signOut}>Sign Out</button>
              </>
            ) : (
              <>
                <NavLink to="/signup" className="header__drawer-auth-btn" onClick={close}>
                  Sign Up
                </NavLink>
                <button className="header__drawer-auth-btn header__drawer-auth-btn--primary" onClick={signIn}>
                  Sign In
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
