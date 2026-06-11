import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { convertAndCompress, formatFromMime, formatExt } from "@/lib/convert"
import { downloadBlob, downloadZip, stripExt } from "@/lib/download"
import type { ImageFormat } from "@/lib/image"
import { DEFAULT_CONVERT_CONFIG, type ConvertConfig, type ConvertItem } from "@/features/Convert/types"

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

interface ConvertContextValue {
  items: ConvertItem[]
  config: ConvertConfig
  running: boolean
  doneCount: number
  selectedCount: number
  patchConfig: (patch: Partial<ConvertConfig>) => void
  addFiles: (files: File[]) => void
  removeItem: (id: string) => void
  clear: () => void
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  process: () => Promise<void>
  downloadOne: (item: ConvertItem) => void
  downloadSelected: () => Promise<void>
}

const ConvertContext = createContext<ConvertContextValue | undefined>(undefined)

// 格式转换与压缩全局状态：切换路由后保留
export function ConvertProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ConvertItem[]>([])
  const [config, setConfig] = useState<ConvertConfig>(DEFAULT_CONVERT_CONFIG)
  const [running, setRunning] = useState(false)

  const patchConfig = useCallback((patch: Partial<ConvertConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const next = files.map<ConvertItem>((file) => ({
      id: genId(),
      file,
      originalUrl: URL.createObjectURL(file),
      originalSize: file.size,
      originalFormat: formatFromMime(file.type),
      status: "pending",
      selected: true
    }))
    setItems((prev) => [...prev, ...next])
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<ConvertItem>) => {
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
        return {
          ...it,
          status: "pending",
          resultBlob: undefined,
          resultUrl: undefined,
          resultSize: undefined,
          resultFormat: undefined,
          error: undefined
        }
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

  // 格式转换参数（高质量近无损，不缩放）
  const buildOptions = useCallback(
    (originalFormat: ImageFormat) => ({
      targetFormat: config.convertFormat,
      originalFormat,
      resize: false,
      resizeMode: "percent" as const,
      scale: 1,
      maxWidth: 0,
      maxHeight: 0,
      quality: 0.95,
      background: config.background,
      avoidEnlarge: false
    }),
    [config]
  )

  // 批量处理：处理所有项（按当前板块与配置）
  const process = useCallback(async () => {
    setRunning(true)
    const snapshot = items
    for (const item of snapshot) {
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl)
      updateItem(item.id, { status: "processing", error: undefined, resultUrl: undefined, resultBlob: undefined })
      try {
        const { blob, format } = await convertAndCompress(item.file, buildOptions(item.originalFormat))
        updateItem(item.id, {
          status: "done",
          resultBlob: blob,
          resultUrl: URL.createObjectURL(blob),
          resultSize: blob.size,
          resultFormat: format,
          selected: true
        })
      } catch (err) {
        console.error("格式转换失败:", err)
        updateItem(item.id, { status: "error", error: err instanceof Error ? err.message : String(err) })
      }
    }
    setRunning(false)
  }, [items, buildOptions, updateItem])

  const downloadOne = useCallback((item: ConvertItem) => {
    if (!item.resultBlob) return
    const fmt = item.resultFormat ?? item.originalFormat
    downloadBlob(item.resultBlob, `${stripExt(item.file.name)}.${formatExt(fmt)}`)
  }, [])

  const downloadSelected = useCallback(async () => {
    const picked = items.filter((it) => it.status === "done" && it.selected && it.resultBlob)
    if (picked.length === 0) return
    if (picked.length === 1) {
      downloadOne(picked[0])
      return
    }
    await downloadZip(
      picked.map((it) => ({
        filename: `${stripExt(it.file.name)}.${formatExt(it.resultFormat ?? it.originalFormat)}`,
        blob: it.resultBlob!
      })),
      "converted.zip"
    )
  }, [items, downloadOne])

  const doneCount = items.filter((it) => it.status === "done").length
  const selectedCount = items.filter((it) => it.status === "done" && it.selected).length

  const value = useMemo<ConvertContextValue>(
    () => ({
      items,
      config,
      running,
      doneCount,
      selectedCount,
      patchConfig,
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
      running,
      doneCount,
      selectedCount,
      patchConfig,
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

  return <ConvertContext.Provider value={value}>{children}</ConvertContext.Provider>
}

export function useConvert() {
  const ctx = useContext(ConvertContext)
  if (!ctx) throw new Error("useConvert must be used within ConvertProvider")
  return ctx
}
