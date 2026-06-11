import { Loader2 } from "lucide-react"

// 路由切换加载占位：当目标页面资源较大、加载较慢时，在内容区展示加载动画，
// 避免页面长时间无变化让用户以为卡住（导航栏与外壳保持可见）。
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <span className="text-sm">Loading…</span>
    </div>
  )
}
