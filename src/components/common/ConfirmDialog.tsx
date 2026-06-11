import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  // 是否显示
  open: boolean
  // 标题与描述
  title: string
  description?: string
  // 按钮文案（不传则使用默认的“确认/取消”）
  confirmText?: string
  cancelText?: string
  // 确认按钮是否使用危险样式（清空、删除等）
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// 通用二次确认弹窗：用于清空、删除等不可撤销操作，复用 Lightbox 的遮罩交互模式
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  destructive = true,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  // 监听 Esc 取消
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          {destructive && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
          )}
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelText ?? t("common.cancel")}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmText ?? t("common.confirm")}
          </Button>
        </div>
      </div>
    </div>
  )
}
