import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { aiRemoveBackground } from "@/lib/backgroundRemoval"
import { loadImage, chromaKey } from "@/lib/image"
import { centeredRectForAspect, type CropRect } from "@/lib/crop"
import {
  composeIdPhoto,
  composePrintSheet,
  ID_PHOTO_SPECS,
  ID_BG_COLORS,
  PAPER_SPECS,
  type IdPhotoSpec
} from "@/lib/idPhoto"
import { downloadBlob } from "@/lib/download"

// idle: 等待抠图(AI 模式)；cutting: 处理中；ready: 可裁剪导出；error: 失败
export type WorkStatus = "idle" | "cutting" | "ready" | "error"

// 抠图方式：ai = AI 智能抠图；color = 指定颜色替换背景（色键）；none = 不抠图直接用原图
export type CutoutMode = "ai" | "color" | "none"

export interface IdPhotoConfig {
  cutoutMode: CutoutMode
  // color 模式：要去除的原背景色 + 容差 + 羽化
  keyColor: string
  tolerance: number
  feather: number
  specId: string
  // 目标背景色（替换成的颜色）
  bgColor: string
  paperId: string
  gapMm: number
  cutLines: boolean
}

const DEFAULT_CONFIG: IdPhotoConfig = {
  cutoutMode: "ai",
  keyColor: "#ffffff",
  tolerance: 60,
  feather: 15,
  specId: ID_PHOTO_SPECS[0].id,
  bgColor: ID_BG_COLORS[0].value,
  paperId: PAPER_SPECS[0].id,
  gapMm: 3,
  cutLines: true
}

const getSpec = (id: string): IdPhotoSpec => ID_PHOTO_SPECS.find((s) => s.id === id) ?? ID_PHOTO_SPECS[0]

interface IdPhotoContextValue {
  file: File | null
  originalUrl: string
  workUrl: string
  workW: number
  workH: number
  status: WorkStatus
  progress: number
  error?: string
  config: IdPhotoConfig
  rect: CropRect
  spec: IdPhotoSpec
  printUrl: string
  setImage: (file: File) => void
  setCutoutMode: (mode: CutoutMode) => void
  runCutout: () => Promise<void>
  runColorKey: () => Promise<void>
  setSpec: (specId: string) => void
  patchConfig: (patch: Partial<IdPhotoConfig>) => void
  setRect: (rect: CropRect) => void
  downloadPhoto: () => Promise<void>
  generatePrint: () => Promise<void>
  downloadPrint: () => void
  clear: () => void
}

const IdPhotoContext = createContext<IdPhotoContextValue | undefined>(undefined)

// 证件照制作全局状态：切换路由后保留
export function IdPhotoProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState("")
  const [workUrl, setWorkUrl] = useState("")
  const [workBlob, setWorkBlob] = useState<Blob | null>(null)
  const [workW, setWorkW] = useState(0)
  const [workH, setWorkH] = useState(0)
  const [status, setStatus] = useState<WorkStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>()
  const [config, setConfig] = useState<IdPhotoConfig>(DEFAULT_CONFIG)
  const [rect, setRect] = useState<CropRect>({ x: 0.1, y: 0.05, width: 0.8, height: 0.9 })
  const [printBlob, setPrintBlob] = useState<Blob | null>(null)
  const [printUrl, setPrintUrl] = useState("")

  const spec = getSpec(config.specId)
  const specAspect = spec.px[0] / spec.px[1]

  const resetPrint = useCallback(() => {
    setPrintUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ""
    })
    setPrintBlob(null)
  }, [])

  // 设定工作图（抠图结果或原图），加载尺寸；resetRect 时按规格重置裁剪框
  const applyWork = useCallback(async (blob: Blob, aspect: number, resetRect: boolean) => {
    const img = await loadImage(blob)
    setWorkBlob(blob)
    setWorkUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(blob)
    })
    setWorkW(img.naturalWidth)
    setWorkH(img.naturalHeight)
    if (resetRect) setRect(centeredRectForAspect(img.naturalWidth, img.naturalHeight, aspect))
    setStatus("ready")
    setProgress(1)
  }, [])

  const clearWork = useCallback(() => {
    setWorkUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ""
    })
    setWorkBlob(null)
    setWorkW(0)
    setWorkH(0)
  }, [])

  // 色键替换：按 keyColor 去背景得到透明图（背景色在合成时铺上）
  const colorKey = useCallback(
    async (src: File, resetRect: boolean) => {
      setError(undefined)
      const blob = await chromaKey(src, {
        color: config.keyColor,
        tolerance: config.tolerance,
        feather: config.feather
      })
      await applyWork(blob, specAspect, resetRect)
    },
    [config.keyColor, config.tolerance, config.feather, specAspect, applyWork]
  )

  const setImage = useCallback(
    (f: File) => {
      setOriginalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(f)
      })
      setFile(f)
      clearWork()
      resetPrint()
      setError(undefined)
      setProgress(0)
      if (config.cutoutMode === "none") {
        applyWork(f, specAspect, true)
      } else if (config.cutoutMode === "color") {
        colorKey(f, true)
      } else {
        setStatus("idle")
      }
    },
    [config.cutoutMode, specAspect, applyWork, colorKey, clearWork, resetPrint]
  )

  const setCutoutMode = useCallback(
    (mode: CutoutMode) => {
      setConfig((prev) => ({ ...prev, cutoutMode: mode }))
      resetPrint()
      setError(undefined)
      if (mode === "none") {
        if (file) applyWork(file, specAspect, true)
      } else if (mode === "color") {
        if (file) colorKey(file, true)
      } else {
        clearWork()
        setStatus("idle")
      }
    },
    [file, specAspect, applyWork, colorKey, clearWork, resetPrint]
  )

  const runCutout = useCallback(async () => {
    if (!file) return
    setStatus("cutting")
    setProgress(0)
    setError(undefined)
    try {
      const blob = await aiRemoveBackground(file, { quality: "best", onProgress: (p) => setProgress(p) })
      await applyWork(blob, specAspect, true)
    } catch (err) {
      console.error("证件照抠图失败:", err)
      setStatus("error")
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [file, specAspect, applyWork])

  // 色键参数变化后重新处理（保留当前裁剪框）
  const runColorKey = useCallback(async () => {
    if (!file || config.cutoutMode !== "color") return
    resetPrint()
    try {
      await colorKey(file, false)
    } catch (err) {
      console.error("色键替换失败:", err)
      setStatus("error")
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [file, config.cutoutMode, colorKey, resetPrint])

  const setSpec = useCallback(
    (specId: string) => {
      const next = getSpec(specId)
      setConfig((prev) => ({ ...prev, specId }))
      resetPrint()
      if (workW && workH) setRect(centeredRectForAspect(workW, workH, next.px[0] / next.px[1]))
    },
    [workW, workH, resetPrint]
  )

  const patchConfig = useCallback(
    (patch: Partial<IdPhotoConfig>) => {
      setConfig((prev) => ({ ...prev, ...patch }))
      resetPrint()
    },
    [resetPrint]
  )

  const downloadPhoto = useCallback(async () => {
    if (!workBlob) return
    const blob = await composeIdPhoto(workBlob, spec, config.bgColor, rect)
    downloadBlob(blob, `id-photo-${spec.id}.jpg`)
  }, [workBlob, spec, config.bgColor, rect])

  const generatePrint = useCallback(async () => {
    if (!workBlob) return
    const photo = await composeIdPhoto(workBlob, spec, config.bgColor, rect)
    const paper = PAPER_SPECS.find((p) => p.id === config.paperId) ?? PAPER_SPECS[0]
    const sheet = await composePrintSheet(photo, spec, paper, {
      gapMm: config.gapMm,
      cutLines: config.cutLines,
      format: "jpeg"
    })
    setPrintBlob(sheet)
    setPrintUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(sheet)
    })
  }, [workBlob, spec, config, rect])

  const downloadPrint = useCallback(() => {
    if (!printBlob) return
    downloadBlob(printBlob, `id-photo-${spec.id}-print.jpg`)
  }, [printBlob, spec.id])

  const clear = useCallback(() => {
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ""
    })
    clearWork()
    resetPrint()
    setFile(null)
    setStatus("idle")
    setProgress(0)
    setError(undefined)
  }, [clearWork, resetPrint])

  const value = useMemo<IdPhotoContextValue>(
    () => ({
      file,
      originalUrl,
      workUrl,
      workW,
      workH,
      status,
      progress,
      error,
      config,
      rect,
      spec,
      printUrl,
      setImage,
      setCutoutMode,
      runCutout,
      runColorKey,
      setSpec,
      patchConfig,
      setRect,
      downloadPhoto,
      generatePrint,
      downloadPrint,
      clear
    }),
    [
      file,
      originalUrl,
      workUrl,
      workW,
      workH,
      status,
      progress,
      error,
      config,
      rect,
      spec,
      printUrl,
      setImage,
      setCutoutMode,
      runCutout,
      runColorKey,
      setSpec,
      patchConfig,
      setRect,
      downloadPhoto,
      generatePrint,
      downloadPrint,
      clear
    ]
  )

  return <IdPhotoContext.Provider value={value}>{children}</IdPhotoContext.Provider>
}

export function useIdPhoto() {
  const ctx = useContext(IdPhotoContext)
  if (!ctx) throw new Error("useIdPhoto must be used within IdPhotoProvider")
  return ctx
}
