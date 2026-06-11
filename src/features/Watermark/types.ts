import type { ImageFormat } from "@/lib/image"
import type { WatermarkType, WatermarkPosition, BothLayout } from "@/lib/watermark"

export type ItemStatus = "pending" | "processing" | "done" | "error"

export interface WatermarkItem {
  id: string
  file: File
  originalUrl: string
  resultBlob?: Blob
  resultUrl?: string
  status: ItemStatus
  error?: string
  selected: boolean
}

// 水印配置（不含 logo 图片本身，logo 由 store 单独管理）
export interface WatermarkConfig {
  type: WatermarkType
  text: string
  fontFamily: string
  fontScale: number
  color: string
  logoScale: number
  bothLayout: BothLayout
  opacity: number
  position: WatermarkPosition
  rotation: number
  tile: boolean
  tileGap: number
  stroke: boolean
  format: ImageFormat
  quality: number
  background: string
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  type: "text",
  text: "Image Toolkit",
  fontFamily: "sans-serif",
  fontScale: 6,
  color: "#ffffff",
  logoScale: 20,
  bothLayout: "top",
  opacity: 0.6,
  position: "bottom-right",
  rotation: 0,
  tile: false,
  tileGap: 8,
  stroke: true,
  format: "png",
  quality: 0.92,
  background: "#ffffff"
}
