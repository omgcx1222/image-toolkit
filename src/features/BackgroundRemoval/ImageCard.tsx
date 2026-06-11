import { useTranslation } from "react-i18next"
import { Download, Loader2, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BgConfig, ImageItem } from "./types"

interface ImageCardProps {
  item: ImageItem
  previewBg: BgConfig["previewBg"]
  running: boolean
  onRemove: (id: string) => void
  onDownload: (item: ImageItem) => void
  onReprocess: (id: string) => void
  onToggleSelect: (id: string) => void
  // 打开放大预览：checker 表示结果图用棋盘格背景
  onPreview: (src: string, checker: boolean) => void
}

// 单张图片卡片：原图/结果对比、放大预览、勾选、重复抠图与下载
export function ImageCard({
  item,
  previewBg,
  running,
  onRemove,
  onDownload,
  onReprocess,
  onToggleSelect,
  onPreview
}: ImageCardProps) {
  const { t } = useTranslation()

  const resultStyle = previewBg === "transparent" ? undefined : { backgroundColor: previewBg }
  const isDone = item.status === "done"

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1 text-muted-foreground shadow hover:text-destructive"
        aria-label={t("common.remove")}
      >
        <X className="size-4" />
      </button>

      {/* 勾选框：仅完成的结果可勾选 */}
      {isDone && (
        <label className="absolute left-2 top-2 z-10 flex cursor-pointer items-center gap-1 rounded-md bg-background/80 px-1.5 py-1 shadow">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => onToggleSelect(item.id)}
            className="size-4 cursor-pointer accent-primary"
          />
        </label>
      )}

      <div className="grid grid-cols-2">
        {/* 原图 */}
        <div className="flex flex-col">
          <div className="flex aspect-square items-center justify-center bg-muted/40 p-2">
            <img
              src={item.originalUrl}
              alt="original"
              onClick={() => onPreview(item.originalUrl, false)}
              className="max-h-full max-w-full cursor-zoom-in object-contain"
            />
          </div>
          <span className="border-t py-1 text-center text-xs text-muted-foreground">{t("common.original")}</span>
        </div>

        {/* 结果 */}
        <div className="flex flex-col border-l">
          <div
            className={cn(
              "relative flex aspect-square items-center justify-center p-2",
              previewBg === "transparent" && "bg-checkerboard"
            )}
            style={resultStyle}
          >
            {item.status === "processing" && (
              // 处理中：用对比明显的浮层展示，避免与预览背景色融为一体
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
                <Loader2 className="size-7 animate-spin text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {item.progress > 0 ? `${Math.round(item.progress * 100)}%` : t("bg.status.processing")}
                </span>
                {/* 进度条：主色填充，清晰可见 */}
                <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200"
                    style={{ width: `${Math.max(item.progress * 100, 8)}%` }}
                  />
                </div>
              </div>
            )}
            {item.status === "error" && (
              <span className="px-2 text-center text-xs text-destructive">{item.error || t("bg.status.error")}</span>
            )}
            {isDone && item.resultUrl && (
              <img
                src={item.resultUrl}
                alt="result"
                onClick={() => onPreview(item.resultUrl!, previewBg === "transparent")}
                className="max-h-full max-w-full cursor-zoom-in object-contain"
              />
            )}
            {item.status === "pending" && (
              <span className="text-xs text-muted-foreground">{t("bg.status.pending")}</span>
            )}
          </div>
          <span className="border-t py-1 text-center text-xs text-muted-foreground">{t("common.result")}</span>
        </div>
      </div>

      {/* 操作区：下载 + 重复抠图 */}
      {isDone && (
        <div className="flex gap-2 border-t p-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onDownload(item)}>
            <Download />
            {t("common.download")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={running}
            onClick={() => onReprocess(item.id)}
            title={t("bg.reprocess")}
          >
            <RefreshCw />
            {t("bg.reprocess")}
          </Button>
        </div>
      )}
    </div>
  )
}
