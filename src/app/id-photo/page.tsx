"use client"

import { useTranslation } from "react-i18next"
import { IdPhoto } from "@/features/IdPhoto"

// 证件照制作路由页
export default function Page() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("idphoto.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("idphoto.subtitle")}</p>
      </div>
      <IdPhoto />
    </div>
  )
}
