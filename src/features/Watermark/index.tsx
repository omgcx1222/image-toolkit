import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckSquare, Download, Loader2, Package, Play, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dropzone } from "@/components/common/Dropzone"
import { Lightbox } from "@/components/common/Lightbox"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useWatermark } from "@/stores/WatermarkStore"
import { cn } from "@/lib/utils"
import { SettingsPanel } from "./SettingsPanel"
import { WatermarkPreview } from "./WatermarkPreview"

export function Watermark() {
  const { t } = useTranslation()
  const {
    items,
    config,
    logoUrl,
    running,
    doneCount,
    selectedCount,
    patchConfig,
    setLogo,
    clearLogo,
    addFiles,
    removeItem,
    clear,
    toggleSelect,
    toggleSelectAll,
    process,
    downloadOne,
    downloadSelected
  } = useWatermark()

  const [preview, setPreview] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  // 实时预览使用第一张图
  const previewItem = items[0]

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <SettingsPanel
          config={config}
          logoUrl={logoUrl}
          onChange={patchConfig}
          onSetLogo={setLogo}
          onClearLogo={clearLogo}
        />
      </div>

      <div className="space-y-4">
        <Dropzone
          accept="image/png,image/jpeg,image/webp"
          multiple
          title={t("upload.dropImages")}
          hint={t("upload.supportImage")}
          onFiles={addFiles}
        />

        {items.length > 0 && (
          <>
            {/* 实时预览 */}
            <div className="space-y-2 rounded-xl border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("watermark.livePreview")}</p>
              <WatermarkPreview src={previewItem.originalUrl} logoUrl={logoUrl} config={config} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => process()} disabled={running}>
                {running ? <Loader2 className="animate-spin" /> : <Play />}
                {running ? t("common.processing") : t("common.process")}
              </Button>
              {doneCount > 0 && (
                <Button variant="outline" onClick={toggleSelectAll} disabled={running}>
                  <CheckSquare />
                  {t("bg.selectAll")}
                </Button>
              )}
              <Button variant="outline" onClick={downloadSelected} disabled={selectedCount === 0}>
                <Package />
                {t("bg.downloadSelected")} ({selectedCount})
              </Button>
              <Button variant="destructive" onClick={() => setConfirmClear(true)} disabled={running || doneCount === 0}>
                <Trash2 />
                {t("common.clearResults")}
              </Button>
            </div>

            {/* 结果网格 */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-xl border bg-card">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1 text-muted-foreground shadow hover:text-destructive"
                    aria-label={t("common.remove")}
                  >
                    <X className="size-4" />
                  </button>
                  {item.status === "done" && (
                    <label className="absolute left-2 top-2 z-10 flex cursor-pointer items-center rounded-md bg-background/80 px-1.5 py-1 shadow">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleSelect(item.id)}
                        className="size-4 cursor-pointer accent-primary"
                      />
                    </label>
                  )}
                  <div className="flex aspect-square items-center justify-center bg-checkerboard p-2">
                    {item.status === "processing" ? (
                      <Loader2 className="size-6 animate-spin text-primary" />
                    ) : item.status === "error" ? (
                      <span className="px-2 text-center text-xs text-destructive">{item.error}</span>
                    ) : (
                      <img
                        src={item.resultUrl || item.originalUrl}
                        alt={item.file.name}
                        onClick={() => setPreview(item.resultUrl || item.originalUrl)}
                        className={cn(
                          "max-h-full max-w-full cursor-zoom-in object-contain",
                          item.status !== "done" && "opacity-70"
                        )}
                      />
                    )}
                  </div>
                  {item.status === "done" && (
                    <div className="border-t p-2">
                      <Button variant="secondary" size="sm" className="w-full" onClick={() => downloadOne(item)}>
                        <Download />
                        {t("common.download")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {preview && <Lightbox src={preview} checker onClose={() => setPreview(null)} />}

      <ConfirmDialog
        open={confirmClear}
        title={t("common.clearResults")}
        description={t("watermark.clearResultsConfirm")}
        confirmText={t("common.clearResults")}
        onConfirm={() => {
          clear()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
