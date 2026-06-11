import type { ProcessorItem } from "@/components/common/ImageProcessorView"
import type { ResizeMode } from "@/lib/convert"

export type CompressItem = ProcessorItem

// 压缩配置
export interface CompressConfig {
  // 是否转为体积最小的格式（高质量、视觉无损）
  smallestFormat: boolean
  // 质量 0-1（保持原格式压缩时生效）
  quality: number
  // 是否缩放尺寸
  enableResize: boolean
  resizeMode: ResizeMode
  scale: number
  maxWidth: number
  maxHeight: number
  background: string
}

export const DEFAULT_COMPRESS_CONFIG: CompressConfig = {
  smallestFormat: true,
  quality: 0.85,
  enableResize: false,
  resizeMode: "percent",
  scale: 1,
  maxWidth: 1920,
  maxHeight: 1080,
  background: "#ffffff"
}
