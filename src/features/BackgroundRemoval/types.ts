import type { AiQuality } from "@/lib/backgroundRemoval"
import type { ImageFormat } from "@/lib/image"

export type CutoutMode = "ai" | "color"

export type ItemStatus = "pending" | "processing" | "done" | "error"

// 单张待处理图片的状态
export interface ImageItem {
  id: string
  file: File
  originalUrl: string
  resultBlob?: Blob
  resultUrl?: string
  status: ItemStatus
  progress: number
  error?: string
  // 是否被勾选（用于批量下载）
  selected: boolean
}

// 抠图配置（全部由用户在 UI 上可调）
export interface BgConfig {
  mode: CutoutMode
  // AI 模式
  quality: AiQuality
  // 色键模式
  color: string
  tolerance: number
  feather: number
  // 导出
  outputFormat: ImageFormat
  // 预览背景色，'transparent' 表示棋盘格
  previewBg: string
}

export const DEFAULT_BG_CONFIG: BgConfig = {
  mode: "ai",
  quality: "balanced",
  color: "#00ff00",
  tolerance: 60,
  feather: 30,
  outputFormat: "png",
  previewBg: "transparent"
}
