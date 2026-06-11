import { Monitor, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme, type Theme } from "./ThemeProvider"

// 主题切换：明亮 / 暗黑 / 跟随系统
export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t("common.themeLight"), icon: <Sun /> },
    { value: "dark", label: t("common.themeDark"), icon: <Moon /> },
    { value: "system", label: t("common.themeSystem"), icon: <Monitor /> }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("common.theme")}>
          {theme === "dark" ? <Moon /> : theme === "light" ? <Sun /> : <Monitor />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((opt) => (
          <DropdownMenuItem key={opt.value} onClick={() => setTheme(opt.value)}>
            {opt.icon}
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
