import { canvasToBlob, type ImageFormat } from "./image"

// 加载视频元数据，返回可用于截帧的 video 元素
export function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "auto"
    video.muted = true
    video.playsInline = true
    video.src = URL.createObjectURL(file)
    video.onloadedmetadata = () => resolve(video)
    video.onerror = () => reject(new Error("视频加载失败"))
  })
}

// 将视频 seek 到指定时间（秒），等待该帧就绪
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked)
      resolve()
    }
    video.addEventListener("seeked", onSeeked)
    video.onerror = () => reject(new Error("视频 seek 失败"))
    video.currentTime = Math.min(time, Math.max(video.duration - 0.01, 0))
  })
}

export interface CaptureOptions {
  format: ImageFormat
  // 缩放比例 0-1（1 为原始分辨率）
  scale: number
  // JPG/WEBP 质量 0-1
  quality: number
}

// 截取视频当前帧为 Blob
export async function captureFrame(video: HTMLVideoElement, options: CaptureOptions): Promise<Blob> {
  const scale = options.scale || 1
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvasToBlob(canvas, options.format, options.quality)
}

export interface ExtractedFrame {
  time: number
  blob: Blob
  url: string
}

export type FrameMethod = "interval" | "count" | "fps" | "manual"

export interface ExtractByTimesOptions extends CaptureOptions {
  // 需要截取的时间点列表（秒）
  times: number[]
  // 每截取一帧的回调，用于进度展示
  onFrame?: (frame: ExtractedFrame, index: number, total: number) => void
}

/**
 * 根据时间点列表批量截帧。
 * 上层根据"固定间隔/指定数量"等方式先计算出 times，再调用本函数。
 */
export async function extractFramesByTimes(
  video: HTMLVideoElement,
  options: ExtractByTimesOptions
): Promise<ExtractedFrame[]> {
  const frames: ExtractedFrame[] = []
  const total = options.times.length
  for (let i = 0; i < total; i++) {
    const time = options.times[i]
    await seekTo(video, time)
    const blob = await captureFrame(video, options)
    const frame: ExtractedFrame = {
      time,
      blob,
      url: URL.createObjectURL(blob)
    }
    frames.push(frame)
    options.onFrame?.(frame, i, total)
  }
  return frames
}

/**
 * 计算取帧时间点。
 * - interval：从 start 起每隔 interval 秒取一帧直到 end
 * - fps：按目标帧率取帧，等价于间隔 1/fps 秒（适合还原丝滑动画）
 * - count：在 [start, end] 区间内均匀取 count 帧
 */
export function computeTimes(params: {
  method: Exclude<FrameMethod, "manual">
  duration: number
  start: number
  end: number
  interval: number
  count: number
  fps: number
}): number[] {
  const start = Math.max(0, params.start)
  const end = Math.min(params.end || params.duration, params.duration)
  const times: number[] = []

  if (params.method === "interval" || params.method === "fps") {
    // fps 模式换算为间隔；最小间隔放宽到 0.001s 以支持高帧率视频
    const rawStep = params.method === "fps" ? 1 / Math.max(params.fps, 0.001) : params.interval
    const step = Math.max(rawStep, 0.001)
    for (let t = start; t < end; t += step) {
      times.push(Number(t.toFixed(4)))
    }
  } else {
    const count = Math.max(1, Math.floor(params.count))
    if (count === 1) {
      times.push(start)
    } else {
      const span = end - start
      for (let i = 0; i < count; i++) {
        times.push(Number((start + (span * i) / (count - 1)).toFixed(4)))
      }
    }
  }
  return times
}
