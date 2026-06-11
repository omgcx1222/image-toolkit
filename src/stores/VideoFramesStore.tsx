import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { downloadBlob, downloadZip } from "@/lib/download"
import type { ExtractedFrame } from "@/lib/video"
import { DEFAULT_VIDEO_CONFIG, type VideoConfig } from "@/features/VideoFrames/types"

interface VideoFramesContextValue {
  videoUrl: string
  duration: number
  config: VideoConfig
  frames: ExtractedFrame[]
  running: boolean
  setVideo: (file: File) => void
  setDuration: (d: number) => void
  patchConfig: (patch: Partial<VideoConfig>) => void
  addFrames: (frames: ExtractedFrame[]) => void
  replaceFrames: (frames: ExtractedFrame[]) => void
  removeFrame: (index: number) => void
  clearFrames: () => void
  setRunning: (v: boolean) => void
  downloadFrame: (frame: ExtractedFrame, index: number, ext: string) => void
  downloadAll: (ext: string) => Promise<void>
}

const VideoFramesContext = createContext<VideoFramesContextValue | undefined>(undefined)

// 视频截帧全局状态：提升到 App 层，切换路由后视频与已截取帧不丢失
export function VideoFramesProvider({ children }: { children: React.ReactNode }) {
  const [videoUrl, setVideoUrl] = useState("")
  const [duration, setDurationState] = useState(0)
  const [config, setConfig] = useState<VideoConfig>(DEFAULT_VIDEO_CONFIG)
  const [frames, setFrames] = useState<ExtractedFrame[]>([])
  const [running, setRunning] = useState(false)

  const setVideo = useCallback((file: File) => {
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    // 切换视频时清空旧帧
    setFrames((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url))
      return []
    })
  }, [])

  const setDuration = useCallback((d: number) => setDurationState(d), [])

  const patchConfig = useCallback((patch: Partial<VideoConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const addFrames = useCallback((newFrames: ExtractedFrame[]) => {
    setFrames((prev) => [...prev, ...newFrames])
  }, [])

  // 用新结果替换全部旧帧（提取前清空上一次结果）
  const replaceFrames = useCallback((newFrames: ExtractedFrame[]) => {
    setFrames((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url))
      return newFrames
    })
  }, [])

  const removeFrame = useCallback((index: number) => {
    setFrames((prev) => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const clearFrames = useCallback(() => {
    setFrames((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url))
      return []
    })
  }, [])

  const downloadFrame = useCallback((frame: ExtractedFrame, index: number, ext: string) => {
    downloadBlob(frame.blob, `frame-${index + 1}-${frame.time.toFixed(2)}s.${ext}`)
  }, [])

  const downloadAll = useCallback(
    async (ext: string) => {
      if (frames.length === 0) return
      await downloadZip(
        frames.map((f, i) => ({
          filename: `frame-${i + 1}-${f.time.toFixed(2)}s.${ext}`,
          blob: f.blob
        })),
        "video-frames.zip"
      )
    },
    [frames]
  )

  const value = useMemo<VideoFramesContextValue>(
    () => ({
      videoUrl,
      duration,
      config,
      frames,
      running,
      setVideo,
      setDuration,
      patchConfig,
      addFrames,
      replaceFrames,
      removeFrame,
      clearFrames,
      setRunning,
      downloadFrame,
      downloadAll
    }),
    [
      videoUrl,
      duration,
      config,
      frames,
      running,
      setVideo,
      setDuration,
      patchConfig,
      addFrames,
      replaceFrames,
      removeFrame,
      clearFrames,
      downloadFrame,
      downloadAll
    ]
  )

  return <VideoFramesContext.Provider value={value}>{children}</VideoFramesContext.Provider>
}

// 读取视频截帧状态的 hook
export function useVideoFrames() {
  const ctx = useContext(VideoFramesContext)
  if (!ctx) throw new Error("useVideoFrames must be used within VideoFramesProvider")
  return ctx
}
