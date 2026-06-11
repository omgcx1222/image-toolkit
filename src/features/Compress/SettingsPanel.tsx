import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ResizeMode } from "@/lib/convert"
import type { CompressConfig } from "./types"

interface SettingsPanelProps {
  config: CompressConfig
  onChange: (patch: Partial<CompressConfig>) => void
}

// 压缩设置：最小体积格式 / 质量 / 缩放 / 背景
export function SettingsPanel({ config, onChange }: SettingsPanelProps) {
  const { t } = useTranslation()

  const resizeModes: { value: ResizeMode; label: string }[] = [
    { value: "percent", label: t("compress.resizePercent") },
    { value: "maxDimensions", label: t("compress.resizeMax") }
  ]

  // 需要背景色：最小体积可能产生 JPG
  const needsBg = config.smallestFormat

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {/* 转为最小体积格式 */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="pr-2">
            <Label>{t("compress.smallestFormat")}</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("compress.smallestFormatHint")}</p>
          </div>
          <Switch checked={config.smallestFormat} onCheckedChange={(v) => onChange({ smallestFormat: v })} />
        </div>

        {/* 保持原格式时的质量滑块 */}
        {!config.smallestFormat && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{t("compress.quality")}</Label>
              <span className="text-xs text-muted-foreground">{Math.round(config.quality * 100)}</span>
            </div>
            <Slider
              min={1}
              max={100}
              step={1}
              value={[Math.round(config.quality * 100)]}
              onValueChange={([v]) => onChange({ quality: v / 100 })}
            />
            <p className="text-xs text-muted-foreground">{t("compress.keepFormatHint")}</p>
          </div>
        )}

        {/* 尺寸缩放（可选） */}
        <div className="flex items-center justify-between">
          <Label>{t("compress.enableResize")}</Label>
          <Switch checked={config.enableResize} onCheckedChange={(v) => onChange({ enableResize: v })} />
        </div>
        {config.enableResize && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {resizeModes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onChange({ resizeMode: m.value })}
                  className={cn(
                    "rounded-lg border p-2 text-center text-sm transition-colors",
                    config.resizeMode === m.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {config.resizeMode === "percent" ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("compress.scale")}</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(config.scale * 100)}%</span>
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={1}
                  value={[Math.round(config.scale * 100)]}
                  onValueChange={([v]) => onChange({ scale: v / 100 })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>{t("compress.maxWidth")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={config.maxWidth}
                    onChange={(e) => onChange({ maxWidth: Math.max(0, Number(e.target.value)) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("compress.maxHeight")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={config.maxHeight}
                    onChange={(e) => onChange({ maxHeight: Math.max(0, Number(e.target.value)) })}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {needsBg && (
          <div className="space-y-2">
            <Label>{t("compress.background")}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.background}
                onChange={(e) => onChange({ background: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
              />
              <Input
                value={config.background}
                onChange={(e) => onChange({ background: e.target.value })}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("compress.bgHint")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
