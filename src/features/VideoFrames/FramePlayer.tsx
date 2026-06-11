import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import type { ExtractedFrame } from "@/lib/video"

interface FramePlayerProps {
  frames: ExtractedFrame[]
}

// 帧动画预览：把已截取的帧按指定帧率播放一次（不循环），模拟动画效果
export function FramePlayer({ frames }: FramePlayerProps) {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(false)
  const [fps, setFps] = useState(24)
  const [index, setIndex] = useState(0)
  const timerRef = useRef<number | null>(null)

  // 根据 fps 定时推进当前帧索引；播放到最后一帧即停止（仅播放一次）
  useEffect(() => {
    if (!playing || frames.length === 0) return
    const interval = 1000 / Math.max(fps, 1)
    timerRef.current = window.setInterval(() => {
      setIndex((prev) => {
        if (prev >= frames.length - 1) {
          // 到达末帧：停止播放
          setPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, interval)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [playing, fps, frames.length])

  // 帧数量变化时，纠正越界索引
  useEffect(() => {
    if (index >= frames.length) setIndex(0)
  }, [frames.length, index])

  if (frames.length === 0) return null
  const current = frames[Math.min(index, frames.length - 1)]

  // 点击播放：若停在末帧则从头开始，否则从当前帧继续
  const handlePlayToggle = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (index >= frames.length - 1) setIndex(0)
    setPlaying(true)
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("video.previewTitle")}</p>
        <span className="text-xs text-muted-foreground">
          {index + 1} / {frames.length}
        </span>
      </div>

      <div className="flex items-center justify-center rounded-lg bg-black">
        <img src={current.url} alt="frame-preview" className="max-h-[320px] w-full object-contain" />
      </div>

      <div className="flex items-center gap-4">
        <Button size="sm" variant="secondary" onClick={handlePlayToggle}>
          {playing ? <Pause /> : <Play />}
          {playing ? t("video.stopPreview") : t("video.playPreview")}
        </Button>

        <div className="flex flex-1 items-center gap-2">
          <Label className="shrink-0 text-xs">{t("video.fps")}</Label>
          <Slider min={1} max={60} step={1} value={[fps]} onValueChange={([v]) => setFps(v)} />
          <span className="w-8 text-right text-xs text-muted-foreground">{fps}</span>
        </div>
      </div>
    </div>
  )
}
