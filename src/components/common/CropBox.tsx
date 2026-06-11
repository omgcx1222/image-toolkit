import { useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import type { CropRect } from "@/lib/crop"

interface CropBoxProps {
  src: string
  // 归一化裁剪矩形（受控）
  rect: CropRect
  onChange: (rect: CropRect) => void
  // 比例锁定（宽/高 像素比），null 为自由
  aspect: number | null
  className?: string
}

// 拖动模式：move 移动；四角 nw/ne/sw/se 双向缩放；四边 n/s/e/w 单轴缩放
type DragMode = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null

const MIN = 0.02
const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))

// 交互式裁剪框：在图上拖动调整归一化裁剪区域；自由比例时四边手柄仅单轴拖动
export function CropBox({ src, rect, onChange, aspect, className }: CropBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; startRect: CropRect; w: number; h: number }>(
    {
      mode: null,
      startX: 0,
      startY: 0,
      startRect: rect,
      w: 1,
      h: 1
    }
  )

  const onPointerDown = useCallback(
    (mode: DragMode) => (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const box = containerRef.current?.getBoundingClientRect()
      if (!box) return
      dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startRect: rect, w: box.width, h: box.height }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [rect]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current
      if (!d.mode) return
      const dx = (e.clientX - d.startX) / d.w
      const dy = (e.clientY - d.startY) / d.h
      const s = d.startRect

      if (d.mode === "move") {
        onChange({
          x: clamp(s.x + dx, 0, 1 - s.width),
          y: clamp(s.y + dy, 0, 1 - s.height),
          width: s.width,
          height: s.height
        })
        return
      }

      const m = d.mode
      let left = s.x
      let top = s.y
      let right = s.x + s.width
      let bottom = s.y + s.height
      if (m === "nw" || m === "w" || m === "sw") left = clamp(s.x + dx, 0, right - MIN)
      if (m === "ne" || m === "e" || m === "se") right = clamp(s.x + s.width + dx, left + MIN, 1)
      if (m === "nw" || m === "n" || m === "ne") top = clamp(s.y + dy, 0, bottom - MIN)
      if (m === "sw" || m === "s" || m === "se") bottom = clamp(s.y + s.height + dy, top + MIN, 1)

      const next: CropRect = { x: left, y: top, width: right - left, height: bottom - top }

      // 比例锁定：根据拖动类型重算另一维并保持对应中心/对边
      if (aspect) {
        if (m === "n" || m === "s") {
          // 改高 → 重算宽，保持水平中心
          const newW = (next.height * d.h * aspect) / d.w
          const cx = s.x + s.width / 2
          next.x = clamp(cx - newW / 2, 0, 1 - MIN)
          next.width = Math.min(newW, 1 - next.x)
        } else if (m === "e" || m === "w") {
          // 改宽 → 重算高，保持垂直中心
          const newH = (next.width * d.w) / (aspect * d.h)
          const cy = s.y + s.height / 2
          next.y = clamp(cy - newH / 2, 0, 1 - MIN)
          next.height = Math.min(newH, 1 - next.y)
        } else {
          // 四角：以宽算高，锚定拖动对应的上/下沿
          const newH = (next.width * d.w) / (aspect * d.h)
          if (m === "nw" || m === "ne") {
            next.y = clamp(bottom - newH, 0, 1)
            next.height = bottom - next.y
          } else {
            next.height = clamp(newH, MIN, 1 - next.y)
          }
        }
      }
      onChange(next)
    },
    [aspect, onChange]
  )

  const endDrag = useCallback((e: React.PointerEvent) => {
    dragRef.current.mode = null
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }, [])

  const pct = (v: number) => `${v * 100}%`
  const cornerCls = "absolute size-3 rounded-sm border-2 border-primary bg-background"
  const edgeCls = "absolute border-2 border-primary bg-background"

  // 手柄统一绑定的指针事件
  const handleProps = (mode: DragMode) => ({
    onPointerDown: onPointerDown(mode),
    onPointerMove,
    onPointerUp: endDrag
  })

  return (
    <div ref={containerRef} className={cn("relative select-none overflow-hidden", className)}>
      <img src={src} alt="crop source" className="block w-full" draggable={false} />

      {/* 四周遮罩：突出裁剪区域 */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.width), height: pct(rect.height) }}
        />
      </div>

      {/* 可拖动裁剪框 */}
      <div
        className="absolute cursor-move"
        style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.width), height: pct(rect.height) }}
        {...handleProps("move")}
      >
        {/* 四角手柄（双向缩放） */}
        <div className={cn(cornerCls, "-left-1.5 -top-1.5 cursor-nwse-resize")} {...handleProps("nw")} />
        <div className={cn(cornerCls, "-right-1.5 -top-1.5 cursor-nesw-resize")} {...handleProps("ne")} />
        <div className={cn(cornerCls, "-bottom-1.5 -left-1.5 cursor-nesw-resize")} {...handleProps("sw")} />
        <div className={cn(cornerCls, "-bottom-1.5 -right-1.5 cursor-nwse-resize")} {...handleProps("se")} />

        {/* 四边手柄（单轴缩放：上/下仅垂直，左/右仅水平） */}
        <div
          className={cn(edgeCls, "-top-1.5 left-1/2 h-3 w-6 -translate-x-1/2 cursor-ns-resize")}
          {...handleProps("n")}
        />
        <div
          className={cn(edgeCls, "-bottom-1.5 left-1/2 h-3 w-6 -translate-x-1/2 cursor-ns-resize")}
          {...handleProps("s")}
        />
        <div
          className={cn(edgeCls, "-left-1.5 top-1/2 h-6 w-3 -translate-y-1/2 cursor-ew-resize")}
          {...handleProps("w")}
        />
        <div
          className={cn(edgeCls, "-right-1.5 top-1/2 h-6 w-3 -translate-y-1/2 cursor-ew-resize")}
          {...handleProps("e")}
        />
      </div>
    </div>
  )
}
