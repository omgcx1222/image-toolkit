import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Camera, Loader2, Package, Scissors, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dropzone } from "@/components/common/Dropzone"
import { Lightbox } from "@/components/common/Lightbox"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { captureFrame, computeTimes, extractFramesByTimes, type ExtractedFrame } from "@/lib/video"
import { useVideoFrames } from "@/stores/VideoFramesStore"
import { SettingsPanel } from "./SettingsPanel"
import { FrameGrid } from "./FrameGrid"
import { FramePlayer } from "./FramePlayer"

export function VideoFrames() {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  // 状态来自全局 store，切换路由后保留
  const {
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
  } = useVideoFrames()

  const [preview, setPreview] = useState<string | null>(null)
  // 批量提取进度
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  // 清空二次确认
  const [confirmClear, setConfirmClear] = useState(false)

  // 文件名后缀
  const ext = config.outputFormat === "jpeg" ? "jpg" : config.outputFormat

  // 上传视频
  const handleFiles = useCallback(
    (files: File[]) => {
      if (files[0]) setVideo(files[0])
    },
    [setVideo]
  )

  // 读取视频时长
  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
    if (!config.rangeEnd) patchConfig({ rangeEnd: Number(v.duration.toFixed(2)) })
  }, [setDuration, patchConfig, config.rangeEnd])

  // 预估输出张数（仅 interval / count / fps 模式有意义）
  const estimatedCount = useMemo(() => {
    if (config.method === "manual" || duration <= 0) return 0
    return computeTimes({
      method: config.method,
      duration,
      start: config.useRange ? config.rangeStart : 0,
      end: config.useRange ? config.rangeEnd : duration,
      interval: config.interval,
      count: config.count,
      fps: config.fps
    }).length
  }, [config, duration])

  // 批量提取（interval / count / fps）：提取前清空上一次结果
  const handleExtract = useCallback(async () => {
    const video = videoRef.current
    if (!video || config.method === "manual") return
    setRunning(true)
    try {
      const times = computeTimes({
        method: config.method,
        duration,
        start: config.useRange ? config.rangeStart : 0,
        end: config.useRange ? config.rangeEnd : duration,
        interval: config.interval,
        count: config.count,
        fps: config.fps
      })
      // 先清空旧帧，避免与本次结果混在一起
      replaceFrames([])
      setProgress({ current: 0, total: times.length })
      const newFrames = await extractFramesByTimes(video, {
        times,
        format: config.outputFormat,
        scale: config.scale,
        quality: config.quality,
        onFrame: (_f, index, total) => setProgress({ current: index + 1, total })
      })
      replaceFrames(newFrames)
    } catch (err) {
      console.error("视频截帧失败:", err)
    } finally {
      setRunning(false)
      setProgress(null)
    }
  }, [config, duration, replaceFrames, setRunning])

  // 手动截取当前帧
  const handleCaptureCurrent = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    const blob = await captureFrame(video, {
      format: config.outputFormat,
      scale: config.scale,
      quality: config.quality
    })
    const frame: ExtractedFrame = {
      time: video.currentTime,
      blob,
      url: URL.createObjectURL(blob)
    }
    addFrames([frame])
  }, [config, addFrames])

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* 左侧设置 */}
      <SettingsPanel config={config} onChange={patchConfig} duration={duration} />

      {/* 右侧内容 */}
      <div className="space-y-4">
        {!videoUrl ? (
          <Dropzone
            accept="video/*"
            title={t("upload.dropVideo")}
            hint={t("upload.supportVideo")}
            onFiles={handleFiles}
          />
        ) : (
          <Card>
            <CardContent className="space-y-3 pt-6">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                onLoadedMetadata={handleLoadedMetadata}
                className="max-h-[360px] w-full rounded-lg bg-black"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {t("video.duration")}: {duration.toFixed(2)}s
                </span>
                {/* 预估输出张数 */}
                {config.method !== "manual" && estimatedCount > 0 && (
                  <span className="font-medium text-foreground">
                    {t("video.estimated")}: {estimatedCount} {t("video.frames")}
                  </span>
                )}
                <Dropzone
                  accept="video/*"
                  title={t("upload.addMore")}
                  onFiles={handleFiles}
                  compact
                  className="border-0 p-0"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {config.method === "manual" ? (
                  <Button onClick={handleCaptureCurrent} disabled={running}>
                    <Camera />
                    {t("video.captureCurrent")}
                  </Button>
                ) : (
                  <Button onClick={handleExtract} disabled={running}>
                    {running ? <Loader2 className="animate-spin" /> : <Scissors />}
                    {running
                      ? progress
                        ? `${t("video.extracting")} ${progress.current}/${progress.total}`
                        : t("video.extracting")
                      : t("video.extract")}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => downloadAll(ext)} disabled={frames.length === 0}>
                  <Package />
                  {t("common.downloadAll")}
                </Button>
                <Button variant="outline" onClick={() => setConfirmClear(true)} disabled={frames.length === 0}>
                  <Trash2 />
                  {t("common.clear")}
                </Button>
              </div>

              {/* 大批量提取耗时提醒 */}
              {config.method !== "manual" && estimatedCount > 300 && (
                <p className="text-xs text-amber-600 dark:text-amber-500">{t("video.largeHint")}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 帧动画预览 */}
        {frames.length > 0 && <FramePlayer frames={frames} />}

        {frames.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("video.extractedFrames")} ({frames.length})
            </p>
            <FrameGrid
              frames={frames}
              onRemove={removeFrame}
              onDownload={(frame, index) => downloadFrame(frame, index, ext)}
              onPreview={(src) => setPreview(src)}
            />
          </div>
        )}
      </div>

      {/* 放大预览 */}
      {preview && <Lightbox src={preview} onClose={() => setPreview(null)} />}

      {/* 清空二次确认 */}
      <ConfirmDialog
        open={confirmClear}
        title={t("common.clearConfirmTitle")}
        description={t("common.clearConfirmDesc")}
        confirmText={t("common.clear")}
        onConfirm={() => {
          clearFrames()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
