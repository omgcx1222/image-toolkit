// 证件照：标准规格表、抠图换底合成、排版打印
import { loadImage, canvasToBlob, type ImageFormat } from "./image"
import type { CropRect } from "./crop"

// 证件照规格（毫米尺寸 + 300DPI 像素，像素以市面常见取值为准）
export interface IdPhotoSpec {
  id: string
  name: string
  mm: [number, number]
  px: [number, number]
  use: string
}

export const ID_PHOTO_SPECS: IdPhotoSpec[] = [
  { id: "1inch", name: "一寸", mm: [25, 35], px: [295, 413], use: "简历、报名" },
  { id: "2inch", name: "二寸", mm: [35, 49], px: [413, 579], use: "简历、文凭" },
  { id: "small1", name: "小一寸", mm: [22, 32], px: [260, 378], use: "驾驶证" },
  { id: "small2", name: "小二寸", mm: [35, 45], px: [413, 531], use: "护照、签证" },
  { id: "big1", name: "大一寸", mm: [33, 48], px: [390, 567], use: "护照、通行证" },
  { id: "big2", name: "大二寸", mm: [35, 53], px: [413, 626], use: "简历、毕业证" },
  { id: "idcard", name: "身份证", mm: [26, 32], px: [358, 441], use: "居民身份证" },
  { id: "passport", name: "护照", mm: [33, 48], px: [390, 567], use: "中国护照" },
  { id: "visa", name: "中国签证", mm: [33, 48], px: [354, 472], use: "签证(白底)" }
]

// 标准背景色
export const ID_BG_COLORS = [
  { id: "white", label: "白底", value: "#ffffff" },
  { id: "blue", label: "蓝底", value: "#438edb" },
  { id: "red", label: "红底", value: "#d9001b" }
]

// 相纸规格（毫米），用于排版打印
export interface PaperSpec {
  id: string
  name: string
  mm: [number, number]
}

export const PAPER_SPECS: PaperSpec[] = [
  { id: "6inch", name: "6 寸 (4R)", mm: [152, 102] },
  { id: "5inch", name: "5 寸 (3R)", mm: [127, 89] }
]

const DPI = 300
const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI)

/**
 * 合成单张证件照：将抠好的透明主体按裁剪矩形定位，铺上背景色，输出为规格像素尺寸。
 * @param cutout 已抠图的透明 PNG（主体）
 * @param spec 目标规格
 * @param bgColor 背景色
 * @param rect 在 cutout 上的归一化裁剪框（决定主体构图）
 */
export async function composeIdPhoto(cutout: Blob, spec: IdPhotoSpec, bgColor: string, rect: CropRect): Promise<Blob> {
  const img = await loadImage(cutout)
  const [outW, outH] = spec.px

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")!
  // 铺背景色
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, outW, outH)

  // 裁剪源区域（像素）
  const sx = Math.round(rect.x * img.naturalWidth)
  const sy = Math.round(rect.y * img.naturalHeight)
  const sw = Math.max(1, Math.round(rect.width * img.naturalWidth))
  const sh = Math.max(1, Math.round(rect.height * img.naturalHeight))
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)

  return canvasToBlob(canvas, "jpeg", 0.95)
}

/**
 * 排版打印：将单张证件照在相纸上最大化平铺，保留间距，可选裁切线。
 */
export async function composePrintSheet(
  photo: Blob,
  spec: IdPhotoSpec,
  paper: PaperSpec,
  options: { gapMm?: number; cutLines?: boolean; format?: ImageFormat } = {}
): Promise<Blob> {
  const gapMm = options.gapMm ?? 3
  const img = await loadImage(photo)

  const paperW = mmToPx(paper.mm[0])
  const paperH = mmToPx(paper.mm[1])
  const cellW = mmToPx(spec.mm[0])
  const cellH = mmToPx(spec.mm[1])
  const gap = mmToPx(gapMm)

  const cols = Math.max(1, Math.floor((paperW + gap) / (cellW + gap)))
  const rows = Math.max(1, Math.floor((paperH + gap) / (cellH + gap)))

  const canvas = document.createElement("canvas")
  canvas.width = paperW
  canvas.height = paperH
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, paperW, paperH)

  // 居中起始偏移
  const totalW = cols * cellW + (cols - 1) * gap
  const totalH = rows * cellH + (rows - 1) * gap
  const offsetX = Math.round((paperW - totalW) / 2)
  const offsetY = Math.round((paperH - totalH) / 2)

  ctx.imageSmoothingQuality = "high"
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * (cellW + gap)
      const y = offsetY + r * (cellH + gap)
      ctx.drawImage(img, x, y, cellW, cellH)
      if (options.cutLines) {
        ctx.strokeStyle = "#cccccc"
        ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y + 0.5, cellW, cellH)
      }
    }
  }

  return canvasToBlob(canvas, options.format ?? "jpeg", 0.95)
}
