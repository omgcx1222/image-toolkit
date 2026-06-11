import { useTranslation } from "react-i18next"
import { Download, X } from "lucide-react"
import type { ExtractedFrame } from "@/lib/video"

interface FrameGridProps {
  frames: ExtractedFrame[]
  onRemove: (index: number) => void
  onDownload: (frame: ExtractedFrame, index: number) => void
  onPreview: (src: string) => void
}

// 截帧结果缩略图网格
export function FrameGrid({ frames, onRemove, onDownload, onPreview }: FrameGridProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {frames.map((frame, index) => (
        <div key={frame.url} className="group relative overflow-hidden rounded-lg border bg-card">
          <img
            src={frame.url}
            alt={`frame-${index}`}
            onClick={() => onPreview(frame.url)}
            className="aspect-video w-full cursor-zoom-in bg-muted/40 object-contain"
          />
          <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
            <span>{frame.time.toFixed(2)}s</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onDownload(frame, index)}
                className="rounded p-1 hover:text-foreground"
                aria-label={t("common.download")}
              >
                <Download className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded p-1 hover:text-destructive"
                aria-label={t("common.remove")}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
