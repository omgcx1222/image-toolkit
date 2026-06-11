import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AiQuality } from "@/lib/backgroundRemoval"
import type { ImageFormat } from "@/lib/image"
import type { BgConfig, CutoutMode } from "./types"

interface SettingsPanelProps {
  config: BgConfig
  onChange: (patch: Partial<BgConfig>) => void
}

// 抠图设置面板：模式选择 + 各模式专属参数 + 导出设置
export function SettingsPanel({ config, onChange }: SettingsPanelProps) {
  const { t } = useTranslation()

  const modes: { value: CutoutMode; title: string; desc: string }[] = [
    { value: "ai", title: t("bg.modeAi"), desc: t("bg.modeAiDesc") },
    { value: "color", title: t("bg.modeColor"), desc: t("bg.modeColorDesc") }
  ]

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {/* 抠图模式选择 */}
        <div className="space-y-2">
          <Label>{t("bg.mode")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange({ mode: m.value })}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  config.mode === m.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent"
                )}
              >
                <div className="text-sm font-medium">{m.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI 模式参数 */}
        {config.mode === "ai" && (
          <div className="space-y-2">
            <Label>{t("bg.quality")}</Label>
            <Select value={config.quality} onValueChange={(v) => onChange({ quality: v as AiQuality })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">{t("bg.qualityFast")}</SelectItem>
                <SelectItem value="balanced">{t("bg.qualityBalanced")}</SelectItem>
                <SelectItem value="best">{t("bg.qualityBest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 色键模式参数 */}
        {config.mode === "color" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("bg.pickColor")}</Label>
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
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t("bg.tolerance")}</Label>
                <span className="text-xs text-muted-foreground">{config.tolerance}</span>
              </div>
              <Slider
                min={0}
                max={255}
                step={1}
                value={[config.tolerance]}
                onValueChange={([v]) => onChange({ tolerance: v })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t("bg.feather")}</Label>
                <span className="text-xs text-muted-foreground">{config.feather}</span>
              </div>
              <Slider
                min={0}
                max={150}
                step={1}
                value={[config.feather]}
                onValueChange={([v]) => onChange({ feather: v })}
              />
            </div>
          </div>
        )}

        {/* 导出格式 */}
        <div className="space-y-2">
          <Label>{t("bg.outputFormat")}</Label>
          <Select value={config.outputFormat} onValueChange={(v) => onChange({ outputFormat: v as ImageFormat })}>
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

        {/* 预览背景色 */}
        <div className="space-y-2">
          <Label>{t("bg.previewBg")}</Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ previewBg: "transparent" })}
              className={cn(
                "bg-checkerboard h-9 flex-1 rounded border text-xs",
                config.previewBg === "transparent" ? "border-primary" : "border-input"
              )}
            >
              {t("bg.previewBgNone")}
            </button>
            <input
              type="color"
              value={config.previewBg === "transparent" ? "#ffffff" : config.previewBg}
              onChange={(e) => onChange({ previewBg: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
