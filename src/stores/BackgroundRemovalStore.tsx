import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { aiRemoveBackground } from "@/lib/backgroundRemoval"
import { chromaKey, convertFormat } from "@/lib/image"
import { downloadBlob, downloadZip, stripExt } from "@/lib/download"
import { DEFAULT_BG_CONFIG, type BgConfig, type ImageItem } from "@/features/BackgroundRemoval/types"

// 生成唯一 id
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

interface BackgroundRemovalContextValue {
  items: ImageItem[]
  config: BgConfig
  running: boolean
  doneCount: number
  selectedCount: number
  patchConfig: (patch: Partial<BgConfig>) => void
  addFiles: (files: File[]) => void
  removeItem: (id: string) => void
  clear: () => void
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  process: (ids?: string[]) => Promise<void>
  reprocessOne: (id: string) => Promise<void>
  downloadOne: (item: ImageItem) => void
  downloadSelected: () => Promise<void>
}

const BackgroundRemovalContext = createContext<BackgroundRemovalContextValue | undefined>(undefined)

// 背景移除全局状态：提升到 App 层，保证切换路由后数据不丢失
export function BackgroundRemovalProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ImageItem[]>([])
  const [config, setConfig] = useState<BgConfig>(DEFAULT_BG_CONFIG)
  const [running, setRunning] = useState(false)

  const patchConfig = useCallback((patch: Partial<BgConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const next = files.map<ImageItem>((file) => ({
      id: genId(),
      file,
      originalUrl: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
      selected: true
    }))
    setItems((prev) => [...prev, ...next])
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<ImageItem>) => {
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

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => {
        URL.revokeObjectURL(it.originalUrl)
        if (it.resultUrl) URL.revokeObjectURL(it.resultUrl)
      })
      return []
    })
  }, [])

  // 勾选/取消单张
  const toggleSelect = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it)))
  }, [])

  // 全选/全不选（仅针对已完成的结果）
  const toggleSelectAll = useCallback(() => {
    setItems((prev) => {
      const doneItems = prev.filter((it) => it.status === "done")
      const allSelected = doneItems.length > 0 && doneItems.every((it) => it.selected)
      return prev.map((it) => (it.status === "done" ? { ...it, selected: !allSelected } : it))
    })
  }, [])

  // 处理单张图片：按当前配置选择 AI 或色键
  const processOne = useCallback(
    async (item: ImageItem, cfg: BgConfig): Promise<Blob> => {
      // 导出 JPG 时透明区域用预览背景色填充（透明则填白）
      const jpgBg = cfg.previewBg === "transparent" ? "#ffffff" : cfg.previewBg
      if (cfg.mode === "ai") {
        const result = await aiRemoveBackground(item.file, {
          quality: cfg.quality,
          onProgress: (p) => updateItem(item.id, { progress: p })
        })
        return convertFormat(result, cfg.outputFormat, 0.92, jpgBg)
      }
      // 色键模式：先做透明处理，再转目标格式
      const keyed = await chromaKey(item.file, {
        color: cfg.color,
        tolerance: cfg.tolerance,
        feather: cfg.feather
      })
      return convertFormat(keyed, cfg.outputFormat, 0.92, jpgBg)
    },
    [updateItem]
  )

  // 执行一组图片的抠图。传入 ids 则只处理这些，否则处理所有未完成的。
  const runItems = useCallback(
    async (targets: ImageItem[]) => {
      setRunning(true)
      for (const item of targets) {
        // 重复抠图时释放旧结果 URL
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl)
        updateItem(item.id, {
          status: "processing",
          progress: 0,
          error: undefined,
          resultUrl: undefined,
          resultBlob: undefined
        })
        try {
          const blob = await processOne(item, config)
          updateItem(item.id, {
            status: "done",
            resultBlob: blob,
            resultUrl: URL.createObjectURL(blob),
            progress: 1,
            selected: true
          })
        } catch (err) {
          console.error("背景移除失败:", err)
          updateItem(item.id, {
            status: "error",
            error: err instanceof Error ? err.message : String(err)
          })
        }
      }
      setRunning(false)
    },
    [config, processOne, updateItem]
  )

  // 批量处理：默认处理未完成的；传 ids 则强制重新处理指定项（支持重复抠图）
  const process = useCallback(
    async (ids?: string[]) => {
      const targets = ids ? items.filter((it) => ids.includes(it.id)) : items.filter((it) => it.status !== "done")
      await runItems(targets)
    },
    [items, runItems]
  )

  // 单张重复抠图
  const reprocessOne = useCallback(
    async (id: string) => {
      const target = items.find((it) => it.id === id)
      if (target) await runItems([target])
    },
    [items, runItems]
  )

  const downloadOne = useCallback(
    (item: ImageItem) => {
      if (!item.resultBlob) return
      // jpeg 扩展名统一用 jpg
      const ext = config.outputFormat === "jpeg" ? "jpg" : config.outputFormat
      downloadBlob(item.resultBlob, `${stripExt(item.file.name)}.${ext}`)
    },
    [config.outputFormat]
  )

  // 仅下载勾选且已完成的结果，打包为 zip
  const downloadSelected = useCallback(async () => {
    const picked = items.filter((it) => it.status === "done" && it.selected && it.resultBlob)
    if (picked.length === 0) return
    if (picked.length === 1) {
      downloadOne(picked[0])
      return
    }
    const ext = config.outputFormat === "jpeg" ? "jpg" : config.outputFormat
    await downloadZip(
      picked.map((it) => ({
        filename: `${stripExt(it.file.name)}.${ext}`,
        blob: it.resultBlob!
      })),
      "background-removed.zip"
    )
  }, [items, config.outputFormat, downloadOne])

  const doneCount = items.filter((it) => it.status === "done").length
  const selectedCount = items.filter((it) => it.status === "done" && it.selected).length

  const value = useMemo<BackgroundRemovalContextValue>(
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
      reprocessOne,
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
      reprocessOne,
      downloadOne,
      downloadSelected
    ]
  )

  return <BackgroundRemovalContext.Provider value={value}>{children}</BackgroundRemovalContext.Provider>
}

// 读取背景移除状态的 hook
export function useBackgroundRemoval() {
  const ctx = useContext(BackgroundRemovalContext)
  if (!ctx) throw new Error("useBackgroundRemoval must be used within BackgroundRemovalProvider")
  return ctx
}
