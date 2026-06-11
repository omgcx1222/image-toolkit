import type { Config } from "@imgly/background-removal"

// AI 模型质量档位映射到 imgly 的模型
export type AiQuality = "fast" | "balanced" | "best"

const QUALITY_MODEL: Record<AiQuality, NonNullable<Config["model"]>> = {
  // isnet_fp16 体积小速度快；isnet 质量更高
  fast: "isnet_fp16",
  balanced: "isnet_fp16",
  best: "isnet"
}

// 本地自托管：直接依赖 npm 包，使用动态 import 形成独立 chunk，
// 仅在客户端调用时按需加载（不进首屏，也避免服务端求值）。
let modulePromise: Promise<typeof import("@imgly/background-removal")> | null = null

function loadImgly() {
  if (!modulePromise) {
    modulePromise = import("@imgly/background-removal")
  }
  return modulePromise
}

export interface AiRemoveOptions {
  quality: AiQuality
  // 进度回调（0-1），用于显示模型下载/处理进度
  onProgress?: (progress: number) => void
}

/**
 * 使用 @imgly/background-removal 进行 AI 抠图。
 * 模型与 wasm 全部从本站 /imgly/ 加载，完全离线、不访问任何外部 CDN。
 */
export async function aiRemoveBackground(source: Blob, options: AiRemoveOptions): Promise<Blob> {
  const { removeBackground } = await loadImgly()
  // publicPath 需为绝对 URL；指向本站自托管的 /imgly/ 资源目录
  const publicPath = typeof window !== "undefined" ? `${window.location.origin}/imgly/` : undefined
  const config: Config = {
    model: QUALITY_MODEL[options.quality],
    publicPath,
    output: { format: "image/png", quality: 1 },
    progress: (_key, current, total) => {
      if (options.onProgress && total > 0) {
        options.onProgress(current / total)
      }
    }
  }
  return removeBackground(source, config)
}
