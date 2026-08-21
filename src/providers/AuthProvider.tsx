import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { supabase } from '@/utils/supabase'

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
  login: (email: string, password: string, role: 'teacher' | 'student') => Promise<{ error: string | null }>
  register: (email: string, password: string, name: string, role: 'teacher' | 'student') => Promise<{ error: string | null }>
  logout: () => void
}

const C = createContext<AuthCtx>({
  user: null,
  loading: false,
  login: async () => ({ error: null }),
  logout: () => {},
  register: async () => ({ error: null }),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(setUser)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(setUser)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
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
    <C.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </C.Provider>
  )
}

export const useAuth = () => useContext(C)
