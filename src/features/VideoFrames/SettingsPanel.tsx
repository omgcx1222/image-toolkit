import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ImageFormat } from "@/lib/image"
import type { FrameMethod, VideoConfig } from "./types"

interface SettingsPanelProps {
  config: VideoConfig
  onChange: (patch: Partial<VideoConfig>) => void
  duration: number
}

// 视频截帧设置面板
export function SettingsPanel({ config, onChange, duration }: SettingsPanelProps) {
  const { t } = useTranslation()

  const methods: { value: FrameMethod; title: string; desc: string }[] = [
    { value: "interval", title: t("video.methodInterval"), desc: t("video.methodIntervalDesc") },
    { value: "fps", title: t("video.methodFps"), desc: t("video.methodFpsDesc") },
    { value: "count", title: t("video.methodCount"), desc: t("video.methodCountDesc") },
    { value: "manual", title: t("video.methodManual"), desc: t("video.methodManualDesc") }
  ]

  // 是否启用导出质量调节（仅 jpg/webp 有意义）
  const qualityEnabled = config.outputFormat !== "png"

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {/* 取帧方式 */}
        <div className="space-y-2">
          <Label>{t("video.method")}</Label>
          <div className="grid gap-2">
            {methods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange({ method: m.value })}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  config.method === m.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent"
                )}
              >
                <div className="text-sm font-medium">{m.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* interval 参数 */}
        {config.method === "interval" && (
          <div className="space-y-2">
            <Label>{t("video.interval")}</Label>
            <Input
              type="number"
              min={0.001}
              step={0.01}
              value={config.interval}
              onChange={(e) => onChange({ interval: Number(e.target.value) })}
            />
          </div>
        )}

        {/* fps 参数：按帧率取帧 */}
        {config.method === "fps" && (
          <div className="space-y-2">
            <Label>{t("video.fps")}</Label>
            <Input
              type="number"
              min={1}
              max={120}
              step={1}
              value={config.fps}
              onChange={(e) => onChange({ fps: Number(e.target.value) })}
            />
          </div>
        )}

        {/* count 参数 */}
        {config.method === "count" && (
          <div className="space-y-2">
            <Label>{t("video.count")}</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={config.count}
              onChange={(e) => onChange({ count: Number(e.target.value) })}
            />
          </div>
        )}

        {/* 时间区间（interval / count 模式可用） */}
        {config.method !== "manual" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("video.useRange")}</Label>
              <Switch
                checked={config.useRange}
                onCheckedChange={(v) =>
                  onChange({
                    useRange: v,
                    rangeEnd: config.rangeEnd || Number(duration.toFixed(2))
                  })
                }
              />
            </div>
            {config.useRange && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("video.rangeStart")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={config.rangeStart}
                    onChange={(e) => onChange({ rangeStart: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("video.rangeEnd")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={config.rangeEnd}
                    onChange={(e) => onChange({ rangeEnd: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 导出格式 */}
        <div className="space-y-2">
          <Label>{t("video.outputFormat")}</Label>
          <Select value={config.outputFormat} onValueChange={(v) => onChange({ outputFormat: v as ImageFormat })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPG</SelectItem>
              <SelectItem value="webp">WEBP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 缩放比例 */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t("video.scale")}</Label>
            <span className="text-xs text-muted-foreground">{Math.round(config.scale * 100)}%</span>
          </div>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={[config.scale]}
            onValueChange={([v]) => onChange({ scale: v })}
          />
        </div>

        {/* 质量（仅 jpg/webp） */}
        {qualityEnabled && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{t("video.quality")}</Label>
              <span className="text-xs text-muted-foreground">{Math.round(config.quality * 100)}</span>
            </div>
            <Slider
              min={0.1}
              max={1}
              step={0.01}
              value={[config.quality]}
              onValueChange={([v]) => onChange({ quality: v })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
