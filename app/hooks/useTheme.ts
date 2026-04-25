import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'indicadores-theme'

const isClient = typeof window !== 'undefined'

function getSystemTheme(): 'light' | 'dark' {
  if (!isClient) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  if (!isClient) return
  const root = document.documentElement
  const resolved = theme === 'system' ? getSystemTheme() : theme

  root.classList.remove('light', 'dark')

  if (resolved === 'light') {
    root.classList.add('light')
  } else {
    root.classList.add('dark')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (!isClient) return 'system'
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    return stored ?? 'system'
  })

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    if (isClient) localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)
  }, [])

  // Apply on mount
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system theme changes when mode is 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme

  return { theme, setTheme, resolvedTheme }
}
