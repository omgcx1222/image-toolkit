import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { loadImage, type ImageFormat } from "@/lib/image"
import { cropImage, centeredRectForAspect, type CropRect } from "@/lib/crop"
import { downloadBlob, stripExt } from "@/lib/download"

export interface CropConfig {
  // 比例预设索引（对应 ASPECT_PRESETS）
  aspectIndex: number
  aspect: number | null
  format: ImageFormat
  quality: number
  background: string
}

const DEFAULT_CROP_CONFIG: CropConfig = {
  aspectIndex: 0,
  aspect: null,
  format: "png",
  quality: 0.92,
  background: "#ffffff"
}

interface CropContextValue {
  file: File | null
  url: string
  naturalW: number
  naturalH: number
  rect: CropRect
  config: CropConfig
  setImage: (file: File) => Promise<void>
  setRect: (rect: CropRect) => void
  setAspect: (index: number, aspect: number | null) => void
  patchConfig: (patch: Partial<CropConfig>) => void
  clear: () => void
  download: () => Promise<void>
}

const CropContext = createContext<CropContextValue | undefined>(undefined)

// 图片裁剪全局状态：切换路由后保留当前图片与裁剪框
export function CropProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [rect, setRect] = useState<CropRect>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
  const [config, setConfig] = useState<CropConfig>(DEFAULT_CROP_CONFIG)

  const setImage = useCallback(
    async (f: File) => {
      const nextUrl = URL.createObjectURL(f)
      const img = await loadImage(nextUrl)
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return nextUrl
      })
      setFile(f)
      setNaturalW(img.naturalWidth)
      setNaturalH(img.naturalHeight)
      setRect(centeredRectForAspect(img.naturalWidth, img.naturalHeight, config.aspect))
    },
    [config.aspect]
  )

  const setAspect = useCallback(
    (index: number, aspect: number | null) => {
      setConfig((prev) => ({ ...prev, aspectIndex: index, aspect }))
      if (naturalW && naturalH) setRect(centeredRectForAspect(naturalW, naturalH, aspect))
    },
    [naturalW, naturalH]
  )

  const patchConfig = useCallback((patch: Partial<CropConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const clear = useCallback(() => {
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ""
    })
    setFile(null)
    setNaturalW(0)
    setNaturalH(0)
  }, [])

  const download = useCallback(async () => {
    if (!file || !url) return
    const blob = await cropImage(url, {
      rect,
      format: config.format,
      quality: config.quality,
      background: config.background
    })
    const ext = config.format === "jpeg" ? "jpg" : config.format
    downloadBlob(blob, `${stripExt(file.name)}-cropped.${ext}`)
  }, [file, url, rect, config])

  const value = useMemo<CropContextValue>(
    () => ({
      file,
      url,
      naturalW,
      naturalH,
      rect,
      config,
      setImage,
      setRect,
      setAspect,
      patchConfig,
      clear,
      download
    }),
    [file, url, naturalW, naturalH, rect, config, setImage, setRect, setAspect, patchConfig, clear, download]
  )

  return <CropContext.Provider value={value}>{children}</CropContext.Provider>
}

export function useCrop() {
  const ctx = useContext(CropContext)
  if (!ctx) throw new Error("useCrop must be used within CropProvider")
  return ctx
}
