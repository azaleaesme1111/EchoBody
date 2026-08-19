import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export interface User {
  id: string
  name: string
  role: 'teacher' | 'student' | 'admin'
}

// 预设管理员账号
export const ADMIN_ACCOUNTS: Record<string, string> = {
  admin: 'admin123',
  admin01: 'admin123',
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

export interface AnonymousQuestion {
  id: string
  content: string
  createdAt: number
  answered: boolean
  isPublic: boolean
  reply?: string
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

export interface CourseTemplate {
  id: string
  title: string
  grade: string
  duration: string
  objectives: string[]
  steps: string[]
}

interface AuthCtx {
  user: User | null
  login: (name: string, role: 'teacher' | 'student' | 'admin') => void
  logout: () => void
  users: { email: string; password: string; name: string; role: 'teacher' | 'student' }[]
  register: (email: string, password: string, name: string, role: 'teacher' | 'student') => void
}

const C = createContext<AuthCtx>({
  user: null, login: () => {}, logout: () => {}, users: [], register: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<AuthCtx['users']>([])

  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('echo_users')
      if (savedUsers) setUsers(JSON.parse(savedUsers))
      const savedUser = localStorage.getItem('echo_user')
      if (savedUser) setUser(JSON.parse(savedUser))
    } catch {}
  }, [])

  const login = (name: string, role: 'teacher' | 'student' | 'admin') => {
    const u: User = { id: Date.now().toString(), name, role }
    setUser(u)
    localStorage.setItem('echo_user', JSON.stringify(u))
  }
  const logout = () => {
    setUser(null)
    localStorage.removeItem('echo_user')
  }
  const register = (email: string, password: string, name: string, role: 'teacher' | 'student') => {
    const newUser = { email, password, name, role }
    setUsers(prev => {
      const next = [...prev, newUser]
      localStorage.setItem('echo_users', JSON.stringify(next))
      return next
    })
  }
  return <C.Provider value={{ user, login, logout, users, register }}>{children}</C.Provider>
}

export const useAuth = () => useContext(C)
