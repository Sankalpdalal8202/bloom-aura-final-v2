// ---------------------------------------------------------------------------
// AUTH CONTEXT
// ---------------------------------------------------------------------------
// Single source of truth for "is anyone logged in right now". Wraps the
// existing Supabase client (src/lib/supabase.js) — no second client, no
// extra Supabase project config.
//
// Exposes: { session, user, loading, signIn, signOut }
// ---------------------------------------------------------------------------

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // 1. Check for an existing session on first load (e.g. after a refresh).
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setLoading(false)
    })

    // 2. Keep session state in sync with login/logout events afterwards.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return
      setSession(newSession)
      setLoading(false)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setSession(data.session)
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
