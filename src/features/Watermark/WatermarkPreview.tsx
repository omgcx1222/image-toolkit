import { useEffect, useRef } from "react"
import { loadImage } from "@/lib/image"
import { drawWatermark, type WatermarkOptions } from "@/lib/watermark"
import type { WatermarkConfig } from "./types"

interface WatermarkPreviewProps {
  src: string
  logoUrl: string
  config: WatermarkConfig
}

// 水印实时预览：在 canvas 上叠加原图与当前水印配置
export function WatermarkPreview({ src, logoUrl, config }: WatermarkPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const img = await loadImage(src)
      let logo: HTMLImageElement | null = null
      if (logoUrl && (config.type === "image" || config.type === "both")) {
        try {
          logo = await loadImage(logoUrl)
        } catch {
          logo = null
        }
      }
      if (cancelled) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const opts: WatermarkOptions = { ...config, logo }
      drawWatermark(ctx, canvas.width, canvas.height, opts)
    }
    render()
    return () => {
      cancelled = true
    }
  }, [src, logoUrl, config])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block h-auto max-h-[60vh] w-auto max-w-full rounded-lg bg-checkerboard"
    />
  )
}
