"use client"

import * as React from "react"

export type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = "app-theme"

// 根据主题设置 <html> 的 class，system 时跟随系统偏好
function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return
  const root = window.document.documentElement
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  root.classList.toggle("dark", isDark)
}

// 读取已保存主题；SSR 阶段无 localStorage，返回 system
function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system")

  // 挂载后读取本地存储的主题（避免 SSR 与客户端不一致）
  React.useEffect(() => {
    setThemeState(getStoredTheme())
  }, [])

  // 主题变化时应用到 DOM 并持久化
  React.useEffect(() => {
    applyTheme(theme)
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // 跟随系统模式下，监听系统主题变化
  React.useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [theme])

  const value = React.useMemo(() => ({ theme, setTheme: setThemeState }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// 读取主题上下文的 hook
export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
