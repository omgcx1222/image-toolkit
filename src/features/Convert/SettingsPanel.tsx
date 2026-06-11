import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { ImageFormat } from "@/lib/image"
import type { ConvertConfig } from "./types"

interface SettingsPanelProps {
  config: ConvertConfig
  onChange: (patch: Partial<ConvertConfig>) => void
}

// 格式转换设置：目标格式 + JPG 背景填充
export function SettingsPanel({ config, onChange }: SettingsPanelProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-2">
          <Label>{t("convert.outputFormat")}</Label>
          <Select value={config.convertFormat} onValueChange={(v) => onChange({ convertFormat: v as ImageFormat })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="webp">WEBP</SelectItem>
              <SelectItem value="jpeg">JPG</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("convert.convertHint")}</p>
        </div>

        {config.convertFormat === "jpeg" && (
          <div className="space-y-2">
            <Label>{t("convert.background")}</Label>
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
            <p className="text-xs text-muted-foreground">{t("convert.bgHint")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
