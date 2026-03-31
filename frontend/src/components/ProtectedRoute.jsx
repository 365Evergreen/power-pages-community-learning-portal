import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps any route that requires authentication.
 * Redirects unauthenticated visitors to the Power Pages login page
 * and returns them to the same URL afterwards.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, signIn } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      signIn()
    }
  }, [loading, isAuthenticated, signIn])

  if (loading) {
    return (
      <main style={{ padding: '48px 20px', textAlign: 'center', color: '#666' }}>
        Checking authentication…
      </main>
    )
  }

  if (!isAuthenticated) return null

  return children
}
