"use client"

import { useTranslation } from "react-i18next"
import { Convert } from "@/features/Convert"

// 格式转换路由页
export default function Page() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("convert.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("convert.subtitle")}</p>
      </div>
      <Convert />
    </div>
  )
}
