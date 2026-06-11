"use client"

import Link, { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import { ImageOff, Film, Sparkles, IdCard, FileImage, Crop, Stamp, Shrink, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { LanguageToggle } from "./LanguageToggle"

// 侧边栏导航分组：分类 → 功能 两级结构
interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}
interface NavGroup {
  label: string
  items: NavItem[]
}

// 导航图标：路由切换加载中时显示加载动画，避免用户以为卡住
// （依赖 next/link 的 useLinkStatus，必须作为 Link 的子组件使用）
function NavIcon({ icon }: { icon: React.ReactNode }) {
  const { pending } = useLinkStatus()
  return pending ? <Loader2 className="size-4 animate-spin" /> : <>{icon}</>
}

// 顶部品牌栏 + 左侧分组侧边栏 + 内容区布局
export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const pathname = usePathname()

  const groups: NavGroup[] = [
    {
      label: t("navGroup.cutout"),
      items: [
        { to: "/background-removal", label: t("nav.backgroundRemoval"), icon: <ImageOff className="size-4" /> },
        { to: "/id-photo", label: t("nav.idPhoto"), icon: <IdCard className="size-4" /> }
      ]
    },
    {
      label: t("navGroup.convert"),
      items: [
        { to: "/convert", label: t("nav.convert"), icon: <FileImage className="size-4" /> },
        { to: "/compress", label: t("nav.compress"), icon: <Shrink className="size-4" /> }
      ]
    },
    {
      label: t("navGroup.edit"),
      items: [
        { to: "/crop", label: t("nav.crop"), icon: <Crop className="size-4" /> },
        { to: "/watermark", label: t("nav.watermark"), icon: <Stamp className="size-4" /> }
      ]
    },
    {
      label: t("navGroup.video"),
      items: [{ to: "/video-frames", label: t("nav.videoFrames"), icon: <Film className="size-4" /> }]
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶部品牌栏 */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-base font-bold tracking-tight text-primary">{t("common.appName")}</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 左侧分组侧边栏 */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r bg-background/40 p-3 md:block">
          <nav className="space-y-5">
            {groups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const isActive = pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <NavIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* 移动端：横向滚动的功能标签 */}
        <div className="flex w-full flex-col">
          <nav className="flex gap-1 overflow-x-auto border-b p-2 md:hidden">
            {groups
              .flatMap((g) => g.items)
              .map((item) => {
                const isActive = pathname === item.to
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <NavIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
          </nav>

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>

          <footer className="border-t py-4">
            <p className="px-4 text-center text-xs text-muted-foreground">{t("common.appDesc")}</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
