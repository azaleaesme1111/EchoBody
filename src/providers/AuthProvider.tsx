import { createContext, useContext, useState, ReactNode } from 'react'

export interface User {
  id: string
  name: string
  role: 'teacher' | 'student' | 'admin'
  avatar?: string
}

// 预设管理员账号（仅供开发阶段使用）
export const ADMIN_ACCOUNTS: Record<string, string> = {
  admin: 'admin123',
  admin01: 'admin123',
}

interface AuthCtx {
  user: User | null
  login: (name: string, role: 'teacher' | 'student' | 'admin') => void
  logout: () => void
  // 开发阶段：预设用户列表（内存存储）
  users: { email: string; password: string; name: string; role: 'teacher' | 'student' }[]
  register: (email: string, password: string, name: string, role: 'teacher' | 'student') => void
}

const C = createContext<AuthCtx>({
  user: null,
  login: () => {},
  logout: () => {},
  users: [],
  register: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<AuthCtx['users']>([])

  const login = (name: string, role: 'teacher' | 'student' | 'admin') =>
    setUser({ id: Date.now().toString(), name, role })
  const logout = () => setUser(null)

  const register = (email: string, password: string, name: string, role: 'teacher' | 'student') => {
    setUsers(prev => [...prev, { email, password, name, role }])
  }

  return <C.Provider value={{ user, login, logout, users, register }}>{children}</C.Provider>
}

export const useAuth = () => useContext(C)
