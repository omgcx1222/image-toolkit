import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Upload, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FONT_FAMILIES, type WatermarkType, type WatermarkPosition, type BothLayout } from "@/lib/watermark"
import type { ImageFormat } from "@/lib/image"
import type { WatermarkConfig } from "./types"

interface SettingsPanelProps {
  config: WatermarkConfig
  logoUrl: string
  onChange: (patch: Partial<WatermarkConfig>) => void
  onSetLogo: (file: File) => void
  onClearLogo: () => void
}

// 九宫格位置选择
const POSITIONS: WatermarkPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
]

export function SettingsPanel({ config, logoUrl, onChange, onSetLogo, onClearLogo }: SettingsPanelProps) {
  const { t } = useTranslation()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const types: { value: WatermarkType; label: string }[] = [
    { value: "text", label: t("watermark.typeText") },
    { value: "image", label: t("watermark.typeImage") },
    { value: "both", label: t("watermark.typeBoth") }
  ]
  const showText = config.type === "text" || config.type === "both"
  const showImage = config.type === "image" || config.type === "both"

  const layouts: { value: BothLayout; label: string }[] = [
    { value: "top", label: t("watermark.layoutTop") },
    { value: "bottom", label: t("watermark.layoutBottom") },
    { value: "left", label: t("watermark.layoutLeft") },
    { value: "right", label: t("watermark.layoutRight") }
  ]

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {/* 水印类型 */}
        <div className="space-y-2">
          <Label>{t("watermark.type")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {types.map((ty) => (
              <button
                key={ty.value}
                type="button"
                onClick={() => onChange({ type: ty.value })}
                className={cn(
                  "rounded-md border py-1.5 text-xs transition-colors",
                  config.type === ty.value ? "border-primary bg-primary/5 text-primary" : "border-input hover:bg-accent"
                )}
              >
                {ty.label}
              </button>
            ))}
          </div>
        </div>

        {/* 文字参数 */}
        {showText && (
          <>
            <div className="space-y-2">
              <Label>{t("watermark.text")}</Label>
              <Input
                value={config.text}
                placeholder={t("watermark.textPlaceholder")}
                onChange={(e) => onChange({ text: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("watermark.font")}</Label>
              <Select value={config.fontFamily} onValueChange={(v) => onChange({ fontFamily: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t("watermark.fontSize")}</Label>
                <span className="text-xs text-muted-foreground">{config.fontScale}%</span>
              </div>
              <Slider
                min={1}
                max={30}
                step={1}
                value={[config.fontScale]}
                onValueChange={([v]) => onChange({ fontScale: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("watermark.color")}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                />
                <Input value={config.color} onChange={(e) => onChange({ color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("watermark.stroke")}</Label>
              <Switch checked={config.stroke} onCheckedChange={(v) => onChange({ stroke: v })} />
            </div>
          </>
        )}

        {/* 图片(Logo)参数 */}
        {showImage && (
          <>
            <div className="space-y-2">
              <Label>{t("watermark.logo")}</Label>
              {logoUrl ? (
                <div className="flex items-center gap-2 rounded-md border p-2">
                  <img src={logoUrl} alt="logo" className="size-10 rounded object-contain" />
                  <Button variant="outline" size="sm" className="ml-auto" onClick={onClearLogo}>
                    <X />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => logoInputRef.current?.click()}>
                  <Upload />
                  {t("watermark.uploadLogo")}
                </Button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) onSetLogo(e.target.files[0])
                  e.target.value = ""
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t("watermark.logoScale")}</Label>
                <span className="text-xs text-muted-foreground">{config.logoScale}%</span>
              </div>
              <Slider
                min={2}
                max={80}
                step={1}
                value={[config.logoScale]}
                onValueChange={([v]) => onChange({ logoScale: v })}
              />
            </div>
          </>
        )}

        {/* 文字+图片 布局（仅 both 模式） */}
        {config.type === "both" && (
          <div className="space-y-2">
            <Label>{t("watermark.layout")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {layouts.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => onChange({ bothLayout: l.value })}
                  className={cn(
                    "rounded-md border py-1.5 text-xs transition-colors",
                    config.bothLayout === l.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:bg-accent"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 透明度 */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t("watermark.opacity")}</Label>
            <span className="text-xs text-muted-foreground">{Math.round(config.opacity * 100)}%</span>
          </div>
          <Slider
            min={5}
            max={100}
            step={1}
            value={[Math.round(config.opacity * 100)]}
            onValueChange={([v]) => onChange({ opacity: v / 100 })}
          />
        </div>

        {/* 旋转 */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t("watermark.rotation")}</Label>
            <span className="text-xs text-muted-foreground">{config.rotation}°</span>
          </div>
          <Slider
            min={0}
            max={360}
            step={1}
            value={[config.rotation]}
            onValueChange={([v]) => onChange({ rotation: v })}
          />
        </div>

        {/* 平铺 */}
        <div className="flex items-center justify-between">
          <Label>{t("watermark.tile")}</Label>
          <Switch checked={config.tile} onCheckedChange={(v) => onChange({ tile: v })} />
        </div>
        {config.tile ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{t("watermark.tileGap")}</Label>
              <span className="text-xs text-muted-foreground">{config.tileGap}%</span>
            </div>
            <Slider
              min={1}
              max={30}
              step={1}
              value={[config.tileGap]}
              onValueChange={([v]) => onChange({ tileGap: v })}
            />
          </div>
        ) : (
          // 平铺时位置无意义，仅非平铺显示九宫格
          <div className="space-y-2">
            <Label>{t("watermark.position")}</Label>
            <div className="grid grid-cols-3 gap-1">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => onChange({ position: pos })}
                  className={cn(
                    "aspect-square rounded border transition-colors",
                    config.position === pos ? "border-primary bg-primary/20" : "border-input hover:bg-accent"
                  )}
                  aria-label={pos}
                />
              ))}
            </div>
          </div>
        )}

        {/* 导出格式 */}
        <div className="space-y-2">
          <Label>{t("watermark.outputFormat")}</Label>
          <Select value={config.format} onValueChange={(v) => onChange({ format: v as ImageFormat })}>
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
      </CardContent>
    </Card>
  )
}
