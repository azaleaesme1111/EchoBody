import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { supabase, withTimeout, withRetry } from '@/utils/supabase'
import AuthModal from '@/components/AuthModal'

export interface User {
  id: string
  name: string
  role: 'teacher' | 'student' | 'admin'
}

export interface FAQItem {
  id: string
  question: string
  ages: ('child' | 'teen' | 'adult')[]
  content: string
  tips: string
  activity?: string
}

export interface Scenario {
  id: string
  title: string
  tag: string
  description: string
  choices: { text: string; feedback: string; correct: boolean }[]
}

interface AuthCtx {
  user: User | null
  loading: boolean
  authModalOpen: boolean
  login: (email: string, password: string, role: 'teacher' | 'student') => Promise<{ error: string | null }>
  register: (email: string, password: string, name: string, role: 'teacher' | 'student') => Promise<{ error: string | null }>
  logout: () => void
  openAuthModal: () => void
  closeAuthModal: () => void
  /** Returns true if logged in; otherwise opens the auth modal and returns false */
  requireAuth: () => boolean
}

const C = createContext<AuthCtx>({
  user: null,
  loading: false,
  authModalOpen: false,
  login: async () => ({ error: null }),
  logout: () => {},
  register: async () => ({ error: null }),
  openAuthModal: () => {},
  closeAuthModal: () => {},
  requireAuth: () => false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const openAuthModal = useCallback(() => setAuthModalOpen(true), [])
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), [])

  const requireAuth = useCallback((): boolean => {
    if (user) return true
    setAuthModalOpen(true)
    return false
  }, [user])

  useEffect(() => {
    let unsub: (() => void) | undefined

    console.log('[Auth] Initializing — checking existing session...')

    // Check existing session
    withTimeout(supabase.auth.getSession(), 10000, 'getSession')
      .then(({ data, error }) => {
      if (error) {
        console.error('[Auth] getSession error:', error.message)
        setLoading(false)
        return
      }
      const session = data?.session
      console.log('[Auth] Session found:', !!session, session?.user?.email ? `(${session.user.email})` : '')
      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          console.log('[Auth] Profile loaded:', profile ? `${profile.name} (${profile.role})` : 'NULL — profile missing')
          setUser(profile)
        })
      }
      setLoading(false)
    }).catch((err) => {
      console.error('[Auth] getSession exception:', err)
      setLoading(false)
    })

    // Listen for auth changes
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('[Auth] State change:', _event, session?.user?.email || 'no user')
        if (session?.user) {
          fetchProfile(session.user.id).then(profile => {
            console.log('[Auth] Profile on state change:', profile ? `${profile.name}` : 'NULL')
            setUser(profile)
          })
        } else {
          setUser(null)
        }
      })
      unsub = data?.subscription?.unsubscribe?.bind(data.subscription)
    } catch (err) {
      console.warn('[Auth] Could not set up auth listener:', err)
    }

    return () => unsub?.()
  }, [])

  async function fetchProfile(userId: string): Promise<User | null> {
    try {
      console.log('[Auth] Fetching profile for userId:', userId)
      // const { data, error } = await withTimeout(
      //   supabase.from('profiles').select('id, name, role').eq('id', userId).single(),
      //   8000,
      //   'fetchProfile'
      // )
      const { data, error } = await withTimeout<any>(
        // 👈 使用 ( ... as any ) 解决 TS 类型报错，同时保留原有的正确请求逻辑
        supabase.from('profiles').select('id, name, role').eq('id', userId).single() as any,
        5000,
        'fetchProfile'
      );

      if (error) {
        console.error('[Auth] Profile query error:', error.message, error.code)
        return null
      }
      if (!data) {
        console.warn('[Auth] No profile found for userId:', userId)
        return null
      }
      console.log('[Auth] Profile fetched:', data.name, data.role)
      return { id: data.id, name: data.name, role: data.role as 'teacher' | 'student' | 'admin' }
    } catch (err: any) {
      console.error('[Auth] fetchProfile exception:', err.message || err)
      return null
    }
  }

  const login = async (email: string, password: string, _role: 'teacher' | 'student') => {
    try {
      console.log('[Auth] Login attempt:', email, 'role:', _role)
      const { data, error } = await withRetry(
        () => withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          10000,
          'signInWithPassword'
        ),
        1,
        3000
      )

      if (error) {
        console.error('[Auth] Login failed — Supabase error:', JSON.stringify({ message: error.message, code: error.code, status: error.status }))
        // Map raw Supabase errors to user-friendly messages
        const msg = error.message.toLowerCase()
        if (msg.includes('invalid login credentials') || msg.includes('user not found'))
          return { error: 'Invalid email or password. Please check and try again.' }
        if (msg.includes('email not confirmed'))
          return { error: 'Email not yet verified. Please check your inbox for the confirmation link.' }
        if (msg.includes('too many'))
          return { error: 'Too many failed attempts. Please wait a moment and try again.' }
        return { error: error.message }
      }

      if (!data.user) {
        console.error('[Auth] Login succeeded but no user returned')
        return { error: 'Login succeeded but no user data returned.' }
      }

      console.log('[Auth] Login success! User ID:', data.user.id, 'Email:', data.user.email)
      console.log('[Auth] Session token present:', !!data.session?.access_token)

      const profile = await fetchProfile(data.user.id)
      if (!profile) {
        console.warn('[Auth] Profile is null after login — user will see as logged out')
        return { error: 'Login succeeded, but no profile was found. Please contact support or re-register.' }
      }
      setUser(profile)
      console.log('[Auth] User state set:', profile.name, profile.role)
      return { error: null }
    } catch (e: any) {
      console.error('[Auth] Login exception:', JSON.stringify({ message: e.message, name: e.name, stack: e.stack?.split('\n').slice(0, 3).join(' | ') }))
      const msg = e.message || ''
      if (msg.includes('timed out'))
        return { error: 'Connection timed out. The server may be waking up — please try again in a few seconds.' }
      if (msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION') || msg.includes('NetworkError'))
        return { error: 'Network connection failed. Please check your internet and try again.' }
      return { error: msg || 'An unexpected error occurred. Please try again.' }
    }
  }

  const register = async (email: string, password: string, name: string, role: 'teacher' | 'student') => {
    try {
      console.log('[Auth] Register attempt:', email, 'name:', name, 'role:', role)
      const { data, error } = await withRetry(
        () => withTimeout(
          supabase.auth.signUp({ email, password, options: { data: { name, role }, emailRedirectTo: undefined } }),
          10000,
          'signUp'
        ),
        1,
        3000
      )

      if (error) {
        console.error('[Auth] Register failed:', JSON.stringify({ message: error.message, code: error.code, status: error.status }))
        const msg = error.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('already exists'))
          return { error: 'This email is already registered. Please log in instead.' }
        if (msg.includes('password'))
          return { error: 'Password must be at least 6 characters.' }
        return { error: error.message }
      }

      if (!data.user) {
        console.error('[Auth] Register succeeded but no user returned')
        return { error: 'Registration completed but no user data returned.' }
      }

      console.log('[Auth] Register success! User ID:', data.user.id)

      // If email confirmation is required, profile won't exist yet
      const profile = await fetchProfile(data.user.id)
      if (profile) {
        setUser(profile)
        console.log('[Auth] Profile auto-created:', profile.name)
      } else {
        console.warn('[Auth] Profile not found after register — email confirmation may be required')
        // Still create a local user from metadata so the UI doesn't break
        setUser({ id: data.user.id, name, role })
      }
      return { error: null }
    } catch (e: any) {
      console.error('[Auth] Register exception:', JSON.stringify({ message: e.message, name: e.name, stack: e.stack?.split('\n').slice(0, 3).join(' | ') }))
      const msg = e.message || ''
      if (msg.includes('timed out'))
        return { error: 'Connection timed out. The server may be waking up — please try again in a few seconds.' }
      if (msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION') || msg.includes('NetworkError'))
        return { error: 'Network connection failed. Please check your internet and try again.' }
      return { error: msg || 'An unexpected error occurred.' }
    }
  }

  const logout = async () => {
    console.log('[Auth] Logging out...')
    try {
      await supabase.auth.signOut()
      setUser(null)
      console.log('[Auth] Logout complete')
    } catch (err: any) {
      console.error('[Auth] Logout error:', err.message || err)
      setUser(null) // still clear local state
    }
  }

  return (
    <C.Provider value={{ user, loading, authModalOpen, login, register, logout, openAuthModal, closeAuthModal, requireAuth }}>
      {children}
      <AuthModal />
    </C.Provider>
  )
}

export const useAuth = () => useContext(C)
