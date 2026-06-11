import { useTranslation } from "react-i18next"
import { BackgroundRemoval } from "@/features/BackgroundRemoval"

// 图片透明底页面
export default function BackgroundRemovalPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("bg.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("bg.subtitle")}</p>
      </div>
      <BackgroundRemoval />
    </div>
  )
}
