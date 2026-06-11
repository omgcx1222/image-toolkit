import type { ImageFormat } from "@/lib/image"
import type { ProcessorItem } from "@/components/common/ImageProcessorView"

// 复用共享的图片项结构
export type ConvertItem = ProcessorItem

// 格式转换配置（仅做格式转换，高质量近无损）
export interface ConvertConfig {
  convertFormat: ImageFormat
  background: string
}

export const DEFAULT_CONVERT_CONFIG: ConvertConfig = {
  convertFormat: "webp",
  background: "#ffffff"
}
