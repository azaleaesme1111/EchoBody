import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
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

    // Check existing session
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session
      if (session?.user) {
        fetchProfile(session.user.id).then(setUser)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Listen for auth changes
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id).then(setUser)
        } else {
          setUser(null)
        }
      })
      unsub = data?.subscription?.unsubscribe?.bind(data.subscription)
    } catch {
      // Supabase not configured — skip listener
    }

    return () => unsub?.()
  }, [])

  async function fetchProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('id', userId)
        .single()

      if (error || !data) return null
      return { id: data.id, name: data.name, role: data.role as 'teacher' | 'student' | 'admin' }
    } catch {
      return null
    }
  }

  const login = async (email: string, password: string, _role: 'teacher' | 'student') => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      if (data.user) {
        const profile = await fetchProfile(data.user.id)
        setUser(profile)
      }
      return { error: null }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const register = async (email: string, password: string, name: string, role: 'teacher' | 'student') => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } })
      if (error) return { error: error.message }
      if (data.user) {
        const profile = await fetchProfile(data.user.id)
        setUser(profile)
      }
      return { error: null }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <C.Provider value={{ user, loading, authModalOpen, login, register, logout, openAuthModal, closeAuthModal, requireAuth }}>
      {children}
      <AuthModal />
    </C.Provider>
  )
}

export const useAuth = () => useContext(C)
