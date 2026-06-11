import type { Config } from "@imgly/background-removal"

// AI 模型质量档位映射到 imgly 的模型
export type AiQuality = "fast" | "balanced" | "best"

const QUALITY_MODEL: Record<AiQuality, NonNullable<Config["model"]>> = {
  // isnet_fp16 体积小速度快；isnet 质量更高
  fast: "isnet_fp16",
  balanced: "isnet_fp16",
  best: "isnet"
}

// 库代码作为 npm 依赖打包，使用动态 import 形成独立 chunk，
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
 * 模型与 wasm 走库默认的线上 CDN（首次使用按需下载并由浏览器缓存）。
 * 处理本身仍在浏览器本地完成，不上传图片。
 */
export async function aiRemoveBackground(source: Blob, options: AiRemoveOptions): Promise<Blob> {
  const { removeBackground } = await loadImgly()
  const config: Config = {
    model: QUALITY_MODEL[options.quality],
    output: { format: "image/png", quality: 1 },
    progress: (_key, current, total) => {
      if (options.onProgress && total > 0) {
        options.onProgress(current / total)
      }
    }
  }
  return removeBackground(source, config)
}
