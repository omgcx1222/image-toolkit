"use client"

import { useTranslation } from "react-i18next"
import { Crop } from "@/features/Crop"

// 图片裁剪路由页
export default function Page() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("crop.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("crop.subtitle")}</p>
      </div>
      <Crop />
    </div>
  )
}
