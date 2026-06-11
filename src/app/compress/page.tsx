"use client"

import { useTranslation } from "react-i18next"
import { Compress } from "@/features/Compress"

// 图片压缩路由页
export default function Page() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("compress.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("compress.subtitle")}</p>
      </div>
      <Compress />
    </div>
  )
}
