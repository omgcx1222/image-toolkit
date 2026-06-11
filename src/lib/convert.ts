// 图片格式转换与压缩：解码 → 缩放 → 编码导出
import { loadImage, canvasToBlob, type ImageFormat } from "./image"

// 尺寸调整方式：按比例缩放 / 限制最大宽高
export type ResizeMode = "percent" | "maxDimensions"

// 目标格式：保持原格式 / 指定格式 / 自动选体积最小
export type TargetFormat = "original" | "png" | "webp" | "jpeg" | "smallest"

export interface ConvertOptions {
  targetFormat: TargetFormat
  // 原图格式（用于"保持原格式"与展示）
  originalFormat: ImageFormat
  // 是否缩放尺寸
  resize: boolean
  resizeMode: ResizeMode
  scale: number
  maxWidth: number
  maxHeight: number
  // 质量 0-1，仅对有损格式（jpeg/webp）生效
  quality: number
  // 透明转 JPG 时的背景填充色
  background: string
  // 若输出体积不小于原图则回退原图（避免"压缩后反而更大"）
  avoidEnlarge: boolean
}

export interface ConvertResult {
  blob: Blob
  // 实际输出格式（smallest 模式下为最终选中的格式）
  format: ImageFormat
}

// 从 MIME 推断图片格式，无法识别时回退 png
export function formatFromMime(mime: string): ImageFormat {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpeg"
  if (mime === "image/webp") return "webp"
  return "png"
}

// 格式的展示名
export const FORMAT_LABEL: Record<ImageFormat, string> = {
  png: "PNG",
  webp: "WEBP",
  jpeg: "JPG"
}

// 计算缩放后的目标尺寸（保持宽高比）
export function computeTargetSize(
  width: number,
  height: number,
  opts: Pick<ConvertOptions, "resizeMode" | "scale" | "maxWidth" | "maxHeight">
): { width: number; height: number } {
  if (opts.resizeMode === "percent") {
    const s = Math.max(0.01, Math.min(opts.scale, 1))
    return { width: Math.max(1, Math.round(width * s)), height: Math.max(1, Math.round(height * s)) }
  }
  // maxDimensions：等比缩小到不超过 maxWidth/maxHeight，不放大
  let ratio = 1
  if (opts.maxWidth > 0) ratio = Math.min(ratio, opts.maxWidth / width)
  if (opts.maxHeight > 0) ratio = Math.min(ratio, opts.maxHeight / height)
  ratio = Math.min(ratio, 1)
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) }
}

// 将图片按目标尺寸绘制到 canvas（高质量重采样，保证清晰度），再编码为指定格式
async function encodeAs(
  img: HTMLImageElement,
  width: number,
  height: number,
  format: ImageFormat,
  quality: number | undefined,
  background: string
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  // 高质量缩放，避免锯齿与模糊，保证清晰度
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  // JPEG 不支持透明，需先铺底色，避免透明区域变黑
  if (format === "jpeg") {
    ctx.fillStyle = background || "#ffffff"
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(img, 0, 0, width, height)
  return canvasToBlob(canvas, format, format === "png" ? undefined : quality)
}

// 转换并压缩单张图片，返回最终 blob 与实际格式
export async function convertAndCompress(source: Blob, opts: ConvertOptions): Promise<ConvertResult> {
  const img = await loadImage(source)
  const { width, height } = opts.resize
    ? computeTargetSize(img.naturalWidth, img.naturalHeight, opts)
    : { width: img.naturalWidth, height: img.naturalHeight }

  // 确定候选格式
  let candidates: ImageFormat[]
  if (opts.targetFormat === "smallest") {
    candidates = ["webp", "jpeg", "png"]
  } else if (opts.targetFormat === "original") {
    candidates = [opts.originalFormat]
  } else {
    candidates = [opts.targetFormat]
  }

  // 逐候选编码，选体积最小
  let best: ConvertResult | null = null
  for (const fmt of candidates) {
    const blob = await encodeAs(img, width, height, fmt, opts.quality, opts.background)
    if (!best || blob.size < best.blob.size) best = { blob, format: fmt }
  }

  // 不缩放且输出反而更大时，回退原图（避免"压缩后体积更大"）
  if (opts.avoidEnlarge && !opts.resize && best!.blob.size >= source.size) {
    return { blob: source, format: opts.originalFormat }
  }
  return best!
}

// 体积格式化，便于 UI 展示（KB / MB）
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 导出扩展名（jpeg → jpg）
export function formatExt(format: ImageFormat): string {
  return format === "jpeg" ? "jpg" : format
}
