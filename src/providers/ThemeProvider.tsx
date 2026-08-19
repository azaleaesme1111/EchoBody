import { createContext, useContext, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const C = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  return <C.Provider value={{ theme, toggle }}>{children}</C.Provider>
}

export const useTheme = () => useContext(C)
