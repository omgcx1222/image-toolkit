"use client"

import { useTranslation } from "react-i18next"
import { VideoFrames } from "@/features/VideoFrames"

// 视频截帧路由页
export default function Page() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("video.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("video.subtitle")}</p>
      </div>
      <VideoFrames />
    </div>
  )
}
