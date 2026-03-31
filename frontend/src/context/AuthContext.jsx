import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const PERMISSION_MAP = {
  100000000: 'read',
  100000001: 'edit',
  100000002: 'admin',
}

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
 *
 * After auth resolves, the permission level is fetched from ppdev_userpermissions
 * (production) or read from window.__MOCK_PERMISSION__ (dev).
 * Set window.__MOCK_PERMISSION__ = 'read' | 'edit' | 'admin' in the browser console
 * to simulate different permission levels during development.
 */
export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null)
  const [loading, setLoading]             = useState(true)
  const [permissionLevel, setPermission]  = useState(null)

  useEffect(() => {
    async function resolveAuth() {
      let resolvedUser = null

      // 1. Power Pages injects the current contact at window.__PORTAL_USER__
      const injected = window.__PORTAL_USER__
      if (injected?.id) {
        resolvedUser = injected
      } else {
        // 2. Fallback: ask the backend (supports dev mock via MOCK_USER env var)
        try {
          const r = await fetch('/api/me', { credentials: 'include' })
          if (r.ok) {
            const data = await r.json()
            if (data?.authenticated && data.user) resolvedUser = data.user
          }
        } catch {
          // network error — stay unauthenticated
        }
      }

      setUser(resolvedUser)

      if (resolvedUser) {
        const isPowerPages = !!window.__PORTAL_USER__

        if (isPowerPages) {
          // Fetch from Dataverse Web API
          try {
            const url =
              `/_api/ppdev_userpermissions?$filter=ppdev_contactref eq '${resolvedUser.id}'&$select=ppdev_permissionlevel&$top=1`
            const r = await fetch(url, { credentials: 'include' })
            if (r.ok) {
              const data = await r.json()
              const record = data?.value?.[0]
              if (record?.ppdev_permissionlevel != null) {
                setPermission(PERMISSION_MAP[record.ppdev_permissionlevel] ?? null)
              }
            }
          } catch {
            // permission stays null
          }
        } else {
          // Dev mode: honour window.__MOCK_PERMISSION__ if set
          const mock = window.__MOCK_PERMISSION__
          if (mock === 'read' || mock === 'edit' || mock === 'admin') {
            setPermission(mock)
          } else {
            setPermission('read')
          }
        }
      }

      setLoading(false)
    }

    resolveAuth()
  }, [])

  const signIn = useCallback(() => {
    window.location.href =
      `/_services/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
  }, [])

  const signOut = useCallback(() => {
    window.location.href = '/_services/auth/logout'
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      permissionLevel,
      canEdit: permissionLevel === 'edit' || permissionLevel === 'admin',
      isAdmin: permissionLevel === 'admin',
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
