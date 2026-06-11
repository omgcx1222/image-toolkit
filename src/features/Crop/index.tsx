import { useTranslation } from "react-i18next"
import { Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dropzone } from "@/components/common/Dropzone"
import { CropBox } from "@/components/common/CropBox"
import { useCrop } from "@/stores/CropStore"
import { ASPECT_PRESETS } from "@/lib/crop"
import { cn } from "@/lib/utils"
import type { ImageFormat } from "@/lib/image"

export function Crop() {
  const { t } = useTranslation()
  const { file, url, rect, config, naturalW, naturalH, setImage, setRect, setAspect, patchConfig, clear, download } =
    useCrop()

  // 当前裁剪区域的像素尺寸
  const cropW = Math.round(rect.width * naturalW)
  const cropH = Math.round(rect.height * naturalH)

  // 比例选项：自由 + 原图比例 + 常用预设
  const aspectOptions = [
    { label: t("crop.free"), ratio: null as number | null },
    { label: t("crop.original"), ratio: naturalW && naturalH ? naturalW / naturalH : null },
    ...ASPECT_PRESETS.slice(1)
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* 左侧裁剪菜单（始终固定显示） */}
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-5 pt-6">
            {/* 裁剪比例 */}
            <div className="space-y-2">
              <Label>{t("crop.aspect")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {aspectOptions.map((opt, i) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setAspect(i, opt.ratio)}
                    className={cn(
                      "rounded-md border py-1.5 text-xs transition-colors",
                      config.aspectIndex === i
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-input hover:bg-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 裁剪区域信息（有图时显示） */}
            {url && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {t("crop.cropInfo")}: {cropW} × {cropH} px
              </div>
            )}

            {/* 导出格式 */}
            <div className="space-y-2">
              <Label>{t("crop.outputFormat")}</Label>
              <Select value={config.format} onValueChange={(v) => patchConfig({ format: v as ImageFormat })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WEBP</SelectItem>
                  <SelectItem value="jpeg">JPG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* JPG 背景填充 */}
            {config.format === "jpeg" && (
              <div className="space-y-2">
                <Label>{t("crop.background")}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.background}
                    onChange={(e) => patchConfig({ background: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                  />
                  <Input
                    value={config.background}
                    onChange={(e) => patchConfig({ background: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={download} disabled={!url}>
                <Download />
                {t("crop.apply")}
              </Button>
              <Button variant="destructive" onClick={clear} disabled={!url}>
                <Trash2 />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧裁剪画布 / 上传区 */}
      <div className="space-y-3">
        {url ? (
          <>
            <p className="text-xs text-muted-foreground">{t("crop.hint")}</p>
            <div className="overflow-hidden rounded-xl border bg-card p-2">
              <CropBox src={url} rect={rect} onChange={setRect} aspect={config.aspect} className="mx-auto max-w-2xl" />
            </div>
            <Dropzone
              accept="image/png,image/jpeg,image/webp"
              compact
              title={t("upload.addMore")}
              onFiles={(files) => files[0] && setImage(files[0])}
            />
            <span className="sr-only">{file?.name}</span>
          </>
        ) : (
          <Dropzone
            accept="image/png,image/jpeg,image/webp"
            title={t("upload.dropImages")}
            hint={t("upload.supportImage")}
            onFiles={(files) => files[0] && setImage(files[0])}
          />
        )}
      </div>
    </div>
  )
}
