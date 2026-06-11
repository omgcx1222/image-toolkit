import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Download, Info, Loader2, Printer, Scissors, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dropzone } from "@/components/common/Dropzone"
import { CropBox } from "@/components/common/CropBox"
import { Lightbox } from "@/components/common/Lightbox"
import { useIdPhoto } from "@/stores/IdPhotoStore"
import { ID_PHOTO_SPECS, ID_BG_COLORS, PAPER_SPECS } from "@/lib/idPhoto"
import { cn } from "@/lib/utils"
import type { CutoutMode } from "@/stores/IdPhotoStore"

export function IdPhoto() {
  const { t } = useTranslation()
  const {
    file,
    originalUrl,
    workUrl,
    status,
    progress,
    error,
    config,
    rect,
    spec,
    printUrl,
    setImage,
    setCutoutMode,
    runCutout,
    runColorKey,
    setSpec,
    patchConfig,
    setRect,
    downloadPhoto,
    generatePrint,
    downloadPrint,
    clear
  } = useIdPhoto()

  const [preview, setPreview] = useState<string | null>(null)
  const specAspect = spec.px[0] / spec.px[1]
  const ready = status === "ready" && workUrl

  // 色键参数变化后实时重做（保留裁剪框）
  useEffect(() => {
    if (config.cutoutMode === "color" && file) {
      runColorKey()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.keyColor, config.tolerance, config.feather])

  const modes: { value: CutoutMode; title: string; desc: string }[] = [
    { value: "ai", title: t("idphoto.modeAi"), desc: t("idphoto.modeAiDesc") },
    { value: "color", title: t("idphoto.modeColor"), desc: t("idphoto.modeColorDesc") },
    { value: "none", title: t("idphoto.modeNone"), desc: t("idphoto.modeNoneDesc") }
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* 左侧设置（无论是否已上传都固定显示） */}
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-5 pt-6">
            {/* 抠图方式 */}
            <div className="space-y-2">
              <Label>{t("idphoto.cutoutMode")}</Label>
              <div className="space-y-1.5">
                {modes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setCutoutMode(m.value)}
                    className={cn(
                      "w-full rounded-lg border p-2 text-left transition-colors",
                      config.cutoutMode === m.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent"
                    )}
                  >
                    <div className="text-sm font-medium">{m.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 色键模式参数 */}
            {config.cutoutMode === "color" && (
              <div className="space-y-4 rounded-lg border p-3">
                <div className="space-y-2">
                  <Label>{t("idphoto.keyColor")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.keyColor}
                      onChange={(e) => patchConfig({ keyColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                    />
                    <Input
                      value={config.keyColor}
                      onChange={(e) => patchConfig({ keyColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{t("idphoto.tolerance")}</Label>
                    <span className="text-xs text-muted-foreground">{config.tolerance}</span>
                  </div>
                  <Slider
                    min={0}
                    max={255}
                    step={1}
                    value={[config.tolerance]}
                    onValueChange={([v]) => patchConfig({ tolerance: v })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{t("idphoto.feather")}</Label>
                    <span className="text-xs text-muted-foreground">{config.feather}</span>
                  </div>
                  <Slider
                    min={0}
                    max={150}
                    step={1}
                    value={[config.feather]}
                    onValueChange={([v]) => patchConfig({ feather: v })}
                  />
                </div>
              </div>
            )}

            {/* 规格 */}
            <div className="space-y-2">
              <Label>{t("idphoto.spec")}</Label>
              <Select value={config.specId} onValueChange={setSpec}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ID_PHOTO_SPECS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}（{s.mm[0]}×{s.mm[1]}mm · {s.px[0]}×{s.px[1]}px）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{spec.use}</p>
            </div>

            {/* 背景色（目标底色） */}
            <div className="space-y-2">
              <Label>{t("idphoto.bgColor")}</Label>
              <div className="flex items-center gap-2">
                {ID_BG_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => patchConfig({ bgColor: c.value })}
                    className={cn(
                      "size-9 rounded-full border-2 transition-transform",
                      config.bgColor === c.value ? "border-primary" : "border-input"
                    )}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.label}
                  />
                ))}
                <input
                  type="color"
                  value={config.bgColor}
                  onChange={(e) => patchConfig({ bgColor: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                />
              </div>
            </div>

            {/* 排版打印设置 */}
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">{t("idphoto.print")}</p>
              <div className="space-y-2">
                <Label>{t("idphoto.paper")}</Label>
                <Select value={config.paperId} onValueChange={(v) => patchConfig({ paperId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_SPECS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("idphoto.gap")}</Label>
                  <span className="text-xs text-muted-foreground">{config.gapMm}mm</span>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={[config.gapMm]}
                  onValueChange={([v]) => patchConfig({ gapMm: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t("idphoto.cutLines")}</Label>
                <Switch checked={config.cutLines} onCheckedChange={(v) => patchConfig({ cutLines: v })} />
              </div>
              <Button variant="outline" className="w-full" onClick={generatePrint} disabled={!ready}>
                <Printer />
                {t("idphoto.generatePrint")}
              </Button>
            </div>

            <Button variant="destructive" className="w-full" onClick={clear} disabled={!originalUrl}>
              <Trash2 />
              {t("common.clear")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 右侧工作区 */}
      <div className="space-y-4">
        {/* 未上传：上传区 */}
        {!originalUrl && (
          <>
            {config.cutoutMode === "ai" && (
              <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>{t("idphoto.aiHint")}</span>
              </div>
            )}
            <Dropzone
              accept="image/png,image/jpeg,image/webp"
              title={t("upload.dropImages")}
              hint={t("upload.supportImage")}
              onFiles={(files) => files[0] && setImage(files[0])}
            />
          </>
        )}

        {/* AI 模式且未就绪：抠图步骤 */}
        {originalUrl && !ready && config.cutoutMode === "ai" && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("idphoto.step2")}</span>
              <Button onClick={runCutout} disabled={status === "cutting"}>
                {status === "cutting" ? <Loader2 className="animate-spin" /> : <Scissors />}
                {status === "cutting"
                  ? `${Math.round(progress * 100)}%`
                  : status === "error"
                    ? t("idphoto.recutout")
                    : t("idphoto.cutout")}
              </Button>
            </div>
            <img src={originalUrl} alt={file?.name} className="mx-auto max-h-[50vh] rounded-lg object-contain" />
            {status === "error" && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>{t("idphoto.aiHint")}</span>
            </div>
          </div>
        )}

        {/* 就绪：裁剪定位（裁剪框锁定规格比例，预览铺目标背景色） */}
        {originalUrl && ready && (
          <>
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("idphoto.cropHint")}</p>
              <div className="mx-auto max-w-md overflow-hidden rounded-lg" style={{ backgroundColor: config.bgColor }}>
                <CropBox src={workUrl} rect={rect} onChange={setRect} aspect={specAspect} />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={downloadPhoto}>
                  <Download />
                  {t("idphoto.download")}
                </Button>
                {config.cutoutMode === "ai" && (
                  <Button variant="outline" onClick={runCutout}>
                    <Scissors />
                    {t("idphoto.recutout")}
                  </Button>
                )}
              </div>
            </div>

            {/* 排版打印结果 */}
            {printUrl && (
              <div className="space-y-2 rounded-xl border bg-card p-4">
                <p className="text-sm font-medium">{t("idphoto.print")}</p>
                <img
                  src={printUrl}
                  alt="print sheet"
                  onClick={() => setPreview(printUrl)}
                  className="mx-auto max-h-[50vh] cursor-zoom-in rounded-lg border object-contain"
                />
                <Button variant="secondary" onClick={downloadPrint}>
                  <Download />
                  {t("idphoto.downloadPrint")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {preview && <Lightbox src={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
