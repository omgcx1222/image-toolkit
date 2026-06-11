import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface LightboxProps {
  src: string
  // 是否棋盘格背景（用于透明结果图）
  checker?: boolean
  onClose: () => void
}

// 图片放大预览：点击遮罩或 Esc 关闭
export function Lightbox({ src, checker, onClose }: LightboxProps) {
  // 监听 Esc 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-background/80 p-2 text-foreground shadow"
        onClick={onClose}
        aria-label="close"
      >
        <X className="size-5" />
      </button>
      <div
        className={cn("max-h-full max-w-full overflow-hidden rounded-lg", checker && "bg-checkerboard")}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt="preview" className="max-h-[85vh] max-w-[85vw] object-contain" />
      </div>
    </div>
  )
}
