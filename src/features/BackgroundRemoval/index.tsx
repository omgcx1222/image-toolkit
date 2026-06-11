import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CheckSquare, Info, Loader2, Package, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dropzone } from "@/components/common/Dropzone"
import { Lightbox } from "@/components/common/Lightbox"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useBackgroundRemoval } from "@/stores/BackgroundRemovalStore"
import { SettingsPanel } from "./SettingsPanel"
import { ImageCard } from "./ImageCard"

export function BackgroundRemoval() {
  const { t } = useTranslation()
  // 状态来自全局 store，切换路由后保留
  const {
    items,
    config,
    running,
    doneCount,
    selectedCount,
    patchConfig,
    addFiles,
    removeItem,
    clear,
    toggleSelect,
    toggleSelectAll,
    process,
    reprocessOne,
    downloadOne,
    downloadSelected
  } = useBackgroundRemoval()

  // 放大预览状态
  const [preview, setPreview] = useState<{ src: string; checker: boolean } | null>(null)
  // 清空二次确认
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* 左侧设置 */}
      <div className="space-y-4">
        <SettingsPanel config={config} onChange={patchConfig} />
        {config.mode === "ai" && (
          <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <Info className="size-4 shrink-0" />
            <span>{t("bg.aiLoadingModel")}</span>
          </div>
        )}
      </div>

      {/* 右侧内容 */}
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
              <Button variant="destructive" onClick={() => setConfirmClear(true)} disabled={running}>
                <Trash2 />
                {t("common.clear")}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  previewBg={config.previewBg}
                  running={running}
                  onRemove={removeItem}
                  onDownload={downloadOne}
                  onReprocess={reprocessOne}
                  onToggleSelect={toggleSelect}
                  onPreview={(src, checker) => setPreview({ src, checker })}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 放大预览 */}
      {preview && <Lightbox src={preview.src} checker={preview.checker} onClose={() => setPreview(null)} />}

      {/* 清空二次确认 */}
      <ConfirmDialog
        open={confirmClear}
        title={t("common.clearConfirmTitle")}
        description={t("common.clearConfirmDesc")}
        confirmText={t("common.clear")}
        onConfirm={() => {
          clear()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
