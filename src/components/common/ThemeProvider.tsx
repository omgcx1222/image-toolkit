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
  const root = window.document.documentElement
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  root.classList.toggle("dark", isDark)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => (localStorage.getItem(STORAGE_KEY) as Theme) || "system")

  // 主题变化时应用到 DOM 并持久化
  React.useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // 跟随系统模式下，监听系统主题变化
  React.useEffect(() => {
    if (theme !== "system") return
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
