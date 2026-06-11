"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import { ImageOff, Film, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { LanguageToggle } from "./LanguageToggle"

// 顶部导航 + 内容区布局
export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const pathname = usePathname()

  const navItems = [
    {
      to: "/background-removal",
      label: t("nav.backgroundRemoval"),
      icon: <ImageOff className="size-4" />
    },
    {
      to: "/video-frames",
      label: t("nav.videoFrames"),
      icon: <Film className="size-4" />
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* 品牌 Logo：纯色主色块 + 主色文字 */}
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-base font-bold tracking-tight text-primary">{t("common.appName")}</span>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.to
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container flex-1 py-6">{children}</main>

      <footer className="border-t py-4">
        <p className="container text-center text-xs text-muted-foreground">{t("common.appDesc")}</p>
      </footer>
    </div>
  )
}
