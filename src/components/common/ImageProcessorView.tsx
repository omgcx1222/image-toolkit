import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, CheckSquare, Download, Loader2, Package, Play, Trash2, TriangleAlert, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dropzone } from "@/components/common/Dropzone"
import { Lightbox } from "@/components/common/Lightbox"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { formatBytes, FORMAT_LABEL } from "@/lib/convert"
import { cn } from "@/lib/utils"
import type { ImageFormat } from "@/lib/image"

export type ProcessorStatus = "pending" | "processing" | "done" | "error"

// 转换/压缩共用的图片项结构
export interface ProcessorItem {
  id: string
  file: File
  originalUrl: string
  originalSize: number
  originalFormat: ImageFormat
  resultBlob?: Blob
  resultUrl?: string
  resultSize?: number
  resultFormat?: ImageFormat
  status: ProcessorStatus
  error?: string
  selected: boolean
}

interface ImageProcessorViewProps {
  // 左侧设置面板
  settings: React.ReactNode
  items: ProcessorItem[]
  running: boolean
  doneCount: number
  selectedCount: number
  onAddFiles: (files: File[]) => void
  onRemove: (id: string) => void
  onClear: () => void
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onProcess: () => void
  onDownloadOne: (item: ProcessorItem) => void
  onDownloadSelected: () => void
}

// 状态标签
function StatusBadge({ status }: { status: ProcessorStatus }) {
  const { t } = useTranslation()
  const map: Record<ProcessorStatus, { text: string; cls: string }> = {
    pending: { text: t("proc.statusPending"), cls: "bg-muted text-muted-foreground" },
    processing: { text: t("common.processing"), cls: "bg-primary/15 text-primary" },
    done: { text: t("proc.statusDone"), cls: "bg-emerald-500/15 text-emerald-600" },
    error: { text: t("bg.status.error"), cls: "bg-destructive/15 text-destructive" }
  }
  const s = map[status]
  return <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", s.cls)}>{s.text}</span>
}

// 转换/压缩共用的视图：左设置 + 右上传与结果列表（含体积/格式对比、状态、批量下载、二次确认清空）
export function ImageProcessorView({
  settings,
  items,
  running,
  doneCount,
  selectedCount,
  onAddFiles,
  onRemove,
  onClear,
  onToggleSelect,
  onToggleSelectAll,
  onProcess,
  onDownloadOne,
  onDownloadSelected
}: ImageProcessorViewProps) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">{settings}</div>

      <div className="space-y-4">
        <Dropzone
          accept="image/png,image/jpeg,image/webp"
          multiple
          title={t("upload.dropImages")}
          hint={t("upload.supportImage")}
          onFiles={onAddFiles}
        />

        {items.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onProcess} disabled={running}>
                {running ? <Loader2 className="animate-spin" /> : <Play />}
                {running ? t("common.processing") : t("common.process")}
              </Button>
              {doneCount > 0 && (
                <Button variant="outline" onClick={onToggleSelectAll} disabled={running}>
                  <CheckSquare />
                  {t("bg.selectAll")}
                </Button>
              )}
              <Button variant="outline" onClick={onDownloadSelected} disabled={selectedCount === 0}>
                <Package />
                {t("bg.downloadSelected")} ({selectedCount})
              </Button>
              <Button variant="destructive" onClick={() => setConfirmClear(true)} disabled={running || doneCount === 0}>
                <Trash2 />
                {t("proc.clearResults")}
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const larger = item.resultSize != null && item.resultSize > item.originalSize
                const ratio =
                  item.resultSize && item.originalSize
                    ? Math.round((1 - item.resultSize / item.originalSize) * 100)
                    : null
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border bg-card p-2">
                    <img
                      src={item.originalUrl}
                      alt={item.file.name}
                      onClick={() => setPreview(item.resultUrl || item.originalUrl)}
                      className="size-16 shrink-0 cursor-zoom-in rounded object-cover"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{item.file.name}</p>
                        <StatusBadge status={item.status} />
                      </div>

                      {/* 格式：原始 → 输出 */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                          {FORMAT_LABEL[item.originalFormat]}
                        </span>
                        {item.status === "done" && item.resultFormat && (
                          <>
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary">
                              {FORMAT_LABEL[item.resultFormat]}
                            </span>
                          </>
                        )}
                      </div>

                      {/* 体积：原始 → 输出（含压缩率 / 增大警告） */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                          {t("proc.sizeBefore")} {formatBytes(item.originalSize)}
                        </span>
                        {item.status === "done" && item.resultSize != null && (
                          <>
                            <ArrowRight className="size-3" />
                            <span className="font-medium text-foreground">
                              {t("proc.sizeAfter")} {formatBytes(item.resultSize)}
                            </span>
                            {ratio != null && !larger && (
                              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-medium text-emerald-600">
                                -{ratio}%
                              </span>
                            )}
                            {larger && (
                              <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-600">
                                <TriangleAlert className="size-3" />+{Math.abs(ratio ?? 0)}% {t("proc.larger")}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {item.status === "error" && <p className="text-xs text-destructive">{item.error}</p>}
                    </div>

                    {item.status === "done" && (
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => onToggleSelect(item.id)}
                        className="size-4 cursor-pointer accent-primary"
                      />
                    )}
                    {item.status === "done" && (
                      <Button variant="secondary" size="sm" onClick={() => onDownloadOne(item)}>
                        <Download />
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="rounded-full p-1 text-muted-foreground hover:text-destructive"
                      aria-label={t("common.remove")}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {preview && <Lightbox src={preview} onClose={() => setPreview(null)} />}

      <ConfirmDialog
        open={confirmClear}
        title={t("proc.clearResults")}
        description={t("proc.clearResultsConfirm")}
        confirmText={t("proc.clearResults")}
        onConfirm={() => {
          onClear()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
