import type { ImageFormat } from "@/lib/image"
import type { FrameMethod, ExtractedFrame } from "@/lib/video"

export type { FrameMethod, ExtractedFrame }

// 视频截帧配置（全部用户可调）
export interface VideoConfig {
  method: FrameMethod
  // interval 模式：间隔秒数
  interval: number
  // count 模式：总帧数
  count: number
  // fps 模式：目标帧率（每秒取多少帧）
  fps: number
  // 是否限定时间区间
  useRange: boolean
  rangeStart: number
  rangeEnd: number
  // 导出设置
  outputFormat: ImageFormat
  scale: number
  quality: number
}

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  method: "interval",
  interval: 1,
  count: 10,
  fps: 24,
  useRange: false,
  rangeStart: 0,
  rangeEnd: 0,
  outputFormat: "png",
  scale: 1,
  quality: 0.92
}
