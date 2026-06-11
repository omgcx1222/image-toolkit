// 图片处理相关工具：格式转换、加载、色键抠图

export type ImageFormat = "png" | "webp" | "jpeg"

// 各格式对应的 MIME 类型
export const MIME_MAP: Record<ImageFormat, string> = {
  png: "image/png",
  webp: "image/webp",
  jpeg: "image/jpeg"
}

// 从 File/Blob 加载为 HTMLImageElement
export function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = typeof src === "string" ? src : URL.createObjectURL(src)
    img.onload = () => {
      if (typeof src !== "string") URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      if (typeof src !== "string") URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

// canvas 转 Blob 的 Promise 封装
export function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas toBlob failed"))),
      MIME_MAP[format],
      quality
    )
  })
}

// 将 16 进制颜色转为 RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "")
  const bigint = parseInt(normalized, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  }
}

export interface ChromaKeyOptions {
  // 要去除的背景颜色（hex）
  color: string
  // 容差 0-255：颜色距离阈值
  tolerance: number
  // 边缘羽化 0-255：在容差之外的过渡范围，用于平滑边缘
  feather: number
}

/**
 * 色键抠图：将与指定颜色接近的像素变为透明。
 * 通过计算像素与目标色的欧氏距离，距离小于容差则全透明，
 * 处于 容差~容差+羽化 之间则按比例做半透明过渡，实现边缘平滑。
 */
export async function chromaKey(source: Blob, options: ChromaKeyOptions): Promise<Blob> {
  const img = await loadImage(source)
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const { r: tr, g: tg, b: tb } = hexToRgb(options.color)
  const tol = options.tolerance
  const feather = options.feather

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - tr
    const dg = data[i + 1] - tg
    const db = data[i + 2] - tb
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)

    if (dist <= tol) {
      // 完全匹配背景：透明
      data[i + 3] = 0
    } else if (dist <= tol + feather) {
      // 边缘过渡：按距离线性插值 alpha
      const ratio = (dist - tol) / Math.max(feather, 1)
      data[i + 3] = Math.round(data[i + 3] * ratio)
    }
  }

  ctx.putImageData(imageData, 0, 0)
  // 色键结果默认输出 PNG 以保留透明
  return canvasToBlob(canvas, "png")
}

// 将带透明通道的 Blob 转换为指定导出格式。
// JPG 无透明通道：导出时用 background 填充透明区域（默认白色）。
export async function convertFormat(
  source: Blob,
  format: ImageFormat,
  quality?: number,
  background?: string
): Promise<Blob> {
  // PNG 保留透明，且无需背景填充时直接返回原 Blob
  if (format === "png") return source
  const img = await loadImage(source)
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")!
  // JPEG 不支持透明，需先铺底色，否则透明区域会变黑
  const fill = format === "jpeg" ? background || "#ffffff" : background
  if (fill) {
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0)
  return canvasToBlob(canvas, format, quality)
}
