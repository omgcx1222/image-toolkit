// 图片水印：在画布上叠加文字 / 图片(Logo) 水印
import { loadImage, canvasToBlob, type ImageFormat } from "./image"

// 九宫格定位
export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export type WatermarkType = "text" | "image" | "both"

// 文字+图片 的相对布局
export type BothLayout = "top" | "bottom" | "left" | "right"

export interface WatermarkOptions {
  type: WatermarkType
  // 文字水印
  text: string
  fontFamily: string
  // 字号占图片宽度的比例（%），自适应不同尺寸
  fontScale: number
  color: string
  // 图片水印
  logo?: HTMLImageElement | null
  // logo 宽度占图片宽度的比例（%）
  logoScale: number
  // 文字+图片布局
  bothLayout: BothLayout
  // 通用样式
  opacity: number // 0-1
  position: WatermarkPosition
  rotation: number // 角度 0-360
  // 平铺
  tile: boolean
  tileGap: number // 平铺间距占图片宽度的比例（%）
  // 文字描边增强可读性
  stroke: boolean
}

// 可选字体族
export const FONT_FAMILIES = [
  { label: "无衬线", value: "sans-serif" },
  { label: "衬线", value: "serif" },
  { label: "等宽", value: "monospace" },
  { label: "楷体", value: "KaiTi, STKaiti, serif" },
  { label: "黑体", value: "SimHei, sans-serif" }
]

// 根据九宫格位置计算锚点坐标
function anchorPoint(pos: WatermarkPosition, w: number, h: number, pad: number) {
  const left = pad
  const cx = w / 2
  const right = w - pad
  const top = pad
  const cy = h / 2
  const bottom = h - pad
  const map: Record<WatermarkPosition, [number, number, CanvasTextAlign, CanvasTextBaseline]> = {
    "top-left": [left, top, "left", "top"],
    "top-center": [cx, top, "center", "top"],
    "top-right": [right, top, "right", "top"],
    "middle-left": [left, cy, "left", "middle"],
    center: [cx, cy, "center", "middle"],
    "middle-right": [right, cy, "right", "middle"],
    "bottom-left": [left, bottom, "left", "bottom"],
    "bottom-center": [cx, bottom, "center", "bottom"],
    "bottom-right": [right, bottom, "right", "bottom"]
  }
  return map[pos]
}

// 在 2D 上下文上绘制水印（文字 + 图片）。绘制到已包含原图的 canvas 上。
export function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, opts: WatermarkOptions) {
  const pad = Math.round(w * 0.03)
  ctx.save()
  ctx.globalAlpha = opts.opacity

  const fontSize = Math.max(8, Math.round((w * opts.fontScale) / 100))
  const logoWidth = Math.max(1, Math.round((w * opts.logoScale) / 100))
  const drawsText = (opts.type === "text" || opts.type === "both") && opts.text.trim() !== ""
  const drawsImage = (opts.type === "image" || opts.type === "both") && !!opts.logo

  const gap = Math.round(fontSize * 0.35)

  // 计算单元尺寸（文字 + 图片按布局组合）
  ctx.font = `${fontSize}px ${opts.fontFamily}`
  const textW = drawsText ? ctx.measureText(opts.text).width : 0
  const textH = drawsText ? fontSize * 1.2 : 0
  let logoW = 0
  let logoH = 0
  if (drawsImage && opts.logo) {
    logoW = logoWidth
    logoH = logoWidth * (opts.logo.naturalHeight / opts.logo.naturalWidth)
  }
  const horizontal = opts.bothLayout === "left" || opts.bothLayout === "right"
  let blockW: number
  let blockH: number
  if (drawsText && drawsImage) {
    if (horizontal) {
      blockW = logoW + gap + textW
      blockH = Math.max(logoH, textH)
    } else {
      blockW = Math.max(logoW, textW)
      blockH = logoH + gap + textH
    }
  } else if (drawsImage) {
    blockW = logoW
    blockH = logoH
  } else {
    blockW = textW
    blockH = textH
  }

  // 绘制单个水印单元到锚点 (cx,cy)，align/baseline 决定单元相对锚点的对齐
  const drawUnit = (cx: number, cy: number, align: CanvasTextAlign, baseline: CanvasTextBaseline) => {
    let bx = cx
    if (align === "center") bx = cx - blockW / 2
    else if (align === "right") bx = cx - blockW
    let by = cy
    if (baseline === "middle") by = cy - blockH / 2
    else if (baseline === "bottom") by = cy - blockH

    // 文字格与 logo 格的矩形
    let logoRect: { x: number; y: number; w: number; h: number } | null = null
    let textRect: { x: number; y: number; w: number; h: number } | null = null
    if (drawsText && drawsImage) {
      if (opts.bothLayout === "top") {
        logoRect = { x: bx + (blockW - logoW) / 2, y: by, w: logoW, h: logoH }
        textRect = { x: bx, y: by + logoH + gap, w: blockW, h: textH }
      } else if (opts.bothLayout === "bottom") {
        textRect = { x: bx, y: by, w: blockW, h: textH }
        logoRect = { x: bx + (blockW - logoW) / 2, y: by + textH + gap, w: logoW, h: logoH }
      } else if (opts.bothLayout === "left") {
        logoRect = { x: bx, y: by + (blockH - logoH) / 2, w: logoW, h: logoH }
        textRect = { x: bx + logoW + gap, y: by, w: textW, h: blockH }
      } else {
        textRect = { x: bx, y: by, w: textW, h: blockH }
        logoRect = { x: bx + textW + gap, y: by + (blockH - logoH) / 2, w: logoW, h: logoH }
      }
    } else if (drawsImage) {
      logoRect = { x: bx, y: by, w: logoW, h: logoH }
    } else if (drawsText) {
      textRect = { x: bx, y: by, w: blockW, h: blockH }
    }

    if (logoRect && opts.logo) ctx.drawImage(opts.logo, logoRect.x, logoRect.y, logoRect.w, logoRect.h)
    if (textRect) {
      ctx.font = `${fontSize}px ${opts.fontFamily}`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const tx = textRect.x + textRect.w / 2
      const ty = textRect.y + textRect.h / 2
      if (opts.stroke) {
        ctx.lineWidth = Math.max(1, fontSize / 12)
        ctx.strokeStyle = "rgba(0,0,0,0.5)"
        ctx.strokeText(opts.text, tx, ty)
      }
      ctx.fillStyle = opts.color
      ctx.fillText(opts.text, tx, ty)
    }
  }

  if (opts.tile) {
    // 平铺模式：以中心旋转后铺满网格
    ctx.translate(w / 2, h / 2)
    ctx.rotate((opts.rotation * Math.PI) / 180)
    const gapTile = Math.max(fontSize, Math.round((w * opts.tileGap) / 100))
    const stepX = blockW + gapTile
    const stepY = blockH + gapTile
    const diag = Math.sqrt(w * w + h * h)
    for (let y = -diag / 2; y < diag / 2; y += stepY) {
      for (let x = -diag / 2; x < diag / 2; x += stepX) {
        drawUnit(x, y, "center", "middle")
      }
    }
  } else {
    const [ax, ay, align, baseline] = anchorPoint(opts.position, w, h, pad)
    // 围绕锚点旋转
    ctx.translate(ax, ay)
    ctx.rotate((opts.rotation * Math.PI) / 180)
    drawUnit(0, 0, align, baseline)
  }

  ctx.restore()
}

// 对图片应用水印并导出
export async function applyWatermark(
  source: Blob | string,
  opts: WatermarkOptions,
  format: ImageFormat,
  quality: number,
  background = "#ffffff"
): Promise<Blob> {
  const img = await loadImage(source)
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")!
  if (format === "jpeg") {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0)
  drawWatermark(ctx, canvas.width, canvas.height, opts)
  return canvasToBlob(canvas, format, format === "png" ? undefined : quality)
}
