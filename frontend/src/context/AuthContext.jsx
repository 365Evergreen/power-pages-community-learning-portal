import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

/**
 * Provides auth state to the whole app.
 *
 * Resolution order:
 *  1. window.__PORTAL_USER__  — injected by the Power Pages Liquid template in production:
 *       {% if user %}
 *       <script>
 *         window.__PORTAL_USER__ = {
 *           id:    "{{ user.id }}",
 *           name:  "{{ user.fullname | escape }}",
 *           email: "{{ user.emailaddress1 | escape }}"
 *         };
 *       </script>
 *       {% endif %}
 *
 *  2. GET /api/me — local-dev fallback; returns a mock user when
 *     MOCK_USER is set in the backend .env file.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Power Pages injects the current contact at window.__PORTAL_USER__
    const injected = window.__PORTAL_USER__
    if (injected?.id) {
      setUser(injected)
      setLoading(false)
      return
    }

    // 2. Fallback: ask the backend (supports dev mock via MOCK_USER env var)
    fetch('/api/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.authenticated && data.user) setUser(data.user)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(() => {
    window.location.href =
      `/_services/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
  }, [])

  const signOut = useCallback(() => {
    window.location.href = '/_services/auth/logout'
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
