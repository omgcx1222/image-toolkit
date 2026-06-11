"use client"

import { useTranslation } from "react-i18next"
import { Watermark } from "@/features/Watermark"

// 添加水印路由页
export default function Page() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("watermark.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("watermark.subtitle")}</p>
      </div>
      <Watermark />
    </div>
  )
}
