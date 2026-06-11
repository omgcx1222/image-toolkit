import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { loadImage } from "@/lib/image"
import { applyWatermark, type WatermarkOptions } from "@/lib/watermark"
import { downloadBlob, downloadZip, stripExt } from "@/lib/download"
import { DEFAULT_WATERMARK_CONFIG, type WatermarkConfig, type WatermarkItem } from "@/features/Watermark/types"

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

interface WatermarkContextValue {
  items: WatermarkItem[]
  config: WatermarkConfig
  logoUrl: string
  running: boolean
  doneCount: number
  selectedCount: number
  patchConfig: (patch: Partial<WatermarkConfig>) => void
  setLogo: (file: File) => void
  clearLogo: () => void
  addFiles: (files: File[]) => void
  removeItem: (id: string) => void
  clear: () => void
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  process: () => Promise<void>
  downloadOne: (item: WatermarkItem) => void
  downloadSelected: () => Promise<void>
}

const WatermarkContext = createContext<WatermarkContextValue | undefined>(undefined)

// 添加水印全局状态：切换路由后保留
export function WatermarkProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatermarkItem[]>([])
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG)
  const [logoUrl, setLogoUrl] = useState("")
  const [running, setRunning] = useState(false)

  const patchConfig = useCallback((patch: Partial<WatermarkConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const setLogo = useCallback((file: File) => {
    setLogoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }, [])

  const clearLogo = useCallback(() => {
    setLogoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ""
    })
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const next = files.map<WatermarkItem>((file) => ({
      id: genId(),
      file,
      originalUrl: URL.createObjectURL(file),
      status: "pending",
      selected: true
    }))
    setItems((prev) => [...prev, ...next])
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<WatermarkItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id)
      if (target) {
        URL.revokeObjectURL(target.originalUrl)
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl)
      }
      return prev.filter((it) => it.id !== id)
    })
  }, [])

  // 清空：仅清空处理结果，保留已上传的图片
  const clear = useCallback(() => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.resultUrl) URL.revokeObjectURL(it.resultUrl)
        return { ...it, status: "pending", resultBlob: undefined, resultUrl: undefined, error: undefined }
      })
    )
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it)))
  }, [])

  const toggleSelectAll = useCallback(() => {
    setItems((prev) => {
      const done = prev.filter((it) => it.status === "done")
      const allSelected = done.length > 0 && done.every((it) => it.selected)
      return prev.map((it) => (it.status === "done" ? { ...it, selected: !allSelected } : it))
    })
  }, [])

  const process = useCallback(async () => {
    setRunning(true)
    // 预加载 logo（若有）
    let logo: HTMLImageElement | null = null
    if (logoUrl && (config.type === "image" || config.type === "both")) {
      try {
        logo = await loadImage(logoUrl)
      } catch {
        logo = null
      }
    }
    const wmOptions: WatermarkOptions = { ...config, logo }
    const snapshot = items
    for (const item of snapshot) {
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl)
      updateItem(item.id, { status: "processing", error: undefined, resultUrl: undefined, resultBlob: undefined })
      try {
        const blob = await applyWatermark(item.originalUrl, wmOptions, config.format, config.quality, config.background)
        updateItem(item.id, {
          status: "done",
          resultBlob: blob,
          resultUrl: URL.createObjectURL(blob),
          selected: true
        })
      } catch (err) {
        console.error("添加水印失败:", err)
        updateItem(item.id, { status: "error", error: err instanceof Error ? err.message : String(err) })
      }
    }
    setRunning(false)
  }, [items, config, logoUrl, updateItem])

  const downloadOne = useCallback(
    (item: WatermarkItem) => {
      if (!item.resultBlob) return
      const ext = config.format === "jpeg" ? "jpg" : config.format
      downloadBlob(item.resultBlob, `${stripExt(item.file.name)}-watermarked.${ext}`)
    },
    [config.format]
  )

  const downloadSelected = useCallback(async () => {
    const picked = items.filter((it) => it.status === "done" && it.selected && it.resultBlob)
    if (picked.length === 0) return
    if (picked.length === 1) {
      downloadOne(picked[0])
      return
    }
    const ext = config.format === "jpeg" ? "jpg" : config.format
    await downloadZip(
      picked.map((it) => ({ filename: `${stripExt(it.file.name)}-watermarked.${ext}`, blob: it.resultBlob! })),
      "watermarked.zip"
    )
  }, [items, config.format, downloadOne])

  const doneCount = items.filter((it) => it.status === "done").length
  const selectedCount = items.filter((it) => it.status === "done" && it.selected).length

  const value = useMemo<WatermarkContextValue>(
    () => ({
      items,
      config,
      logoUrl,
      running,
      doneCount,
      selectedCount,
      patchConfig,
      setLogo,
      clearLogo,
      addFiles,
      removeItem,
      clear,
      toggleSelect,
      toggleSelectAll,
      process,
      downloadOne,
      downloadSelected
    }),
    [
      items,
      config,
      logoUrl,
      running,
      doneCount,
      selectedCount,
      patchConfig,
      setLogo,
      clearLogo,
      addFiles,
      removeItem,
      clear,
      toggleSelect,
      toggleSelectAll,
      process,
      downloadOne,
      downloadSelected
    ]
  )

  return <WatermarkContext.Provider value={value}>{children}</WatermarkContext.Provider>
}

export function useWatermark() {
  const ctx = useContext(WatermarkContext)
  if (!ctx) throw new Error("useWatermark must be used within WatermarkProvider")
  return ctx
}
