// 图片裁剪：按归一化矩形区域裁出像素，并按目标格式导出
import { loadImage, canvasToBlob, type ImageFormat } from "./image"

// 归一化裁剪矩形（取值 0-1，相对于原图宽高）
export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

// 常用裁剪比例预设（宽/高），null 表示自由比例
export interface AspectPreset {
  label: string
  ratio: number | null
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { label: "自由", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "3:4", ratio: 3 / 4 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "2:3", ratio: 2 / 3 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "5:7", ratio: 5 / 7 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "9:16", ratio: 9 / 16 }
]

// 按目标比例计算居中裁剪框（归一化）。aspect 为 宽/高 像素比，null 表示自由。
export function centeredRectForAspect(naturalW: number, naturalH: number, aspect: number | null): CropRect {
  if (!aspect) return { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
  const imageAspect = naturalW / naturalH
  let cropW: number
  let cropH: number
  if (aspect > imageAspect) {
    // 目标比图片更宽：以宽度为约束
    cropW = naturalW * 0.9
    cropH = cropW / aspect
  } else {
    cropH = naturalH * 0.9
    cropW = cropH * aspect
  }
  const nw = cropW / naturalW
  const nh = cropH / naturalH
  return { x: (1 - nw) / 2, y: (1 - nh) / 2, width: nw, height: nh }
}

export interface CropOptions {
  rect: CropRect
  format: ImageFormat
  quality: number
  background: string
}

// 按归一化矩形裁剪原图，输出目标格式
export async function cropImage(source: Blob | string, opts: CropOptions): Promise<Blob> {
  const img = await loadImage(source)
  const sw = img.naturalWidth
  const sh = img.naturalHeight

  const sx = Math.round(opts.rect.x * sw)
  const sy = Math.round(opts.rect.y * sh)
  const cw = Math.max(1, Math.round(opts.rect.width * sw))
  const ch = Math.max(1, Math.round(opts.rect.height * sh))

  const canvas = document.createElement("canvas")
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext("2d")!
  if (opts.format === "jpeg") {
    ctx.fillStyle = opts.background || "#ffffff"
    ctx.fillRect(0, 0, cw, ch)
  }
  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch)
  return canvasToBlob(canvas, opts.format, opts.format === "png" ? undefined : opts.quality)
}
