"use client"

import { useEffect } from "react"
import "@/i18n"
import { applyStoredLanguage } from "@/i18n"
import { ThemeProvider } from "@/components/common/ThemeProvider"
import { BackgroundRemovalProvider } from "@/stores/BackgroundRemovalStore"
import { VideoFramesProvider } from "@/stores/VideoFramesStore"
import { AppLayout } from "@/components/common/AppLayout"

// 客户端 Providers：主题、i18n、各功能全局状态，以及统一布局
// 在此作为客户端边界，使下层交互组件与浏览器 API 仅在客户端运行
export function Providers({ children }: { children: React.ReactNode }) {
  // 挂载后应用用户保存的语言偏好（SSR 阶段统一为默认语言以避免水合不一致）
  useEffect(() => {
    applyStoredLanguage()
  }, [])

  return (
    <ThemeProvider>
      <BackgroundRemovalProvider>
        <VideoFramesProvider>
          <AppLayout>{children}</AppLayout>
        </VideoFramesProvider>
      </BackgroundRemovalProvider>
    </ThemeProvider>
  )
}
