import { removeBackground, type Config } from "@imgly/background-removal"

// AI 模型质量档位映射到 imgly 的模型与输出设置
export type AiQuality = "fast" | "balanced" | "best"

const QUALITY_MODEL: Record<AiQuality, Config["model"]> = {
  // isnet_fp16 体积小速度快；isnet 质量更高
  fast: "isnet_fp16",
  balanced: "isnet_fp16",
  best: "isnet"
}

export interface AiRemoveOptions {
  quality: AiQuality
  // 进度回调（0-1），用于显示模型下载/处理进度
  onProgress?: (progress: number) => void
}

/**
 * 使用 @imgly/background-removal 进行 AI 抠图。
 * 模型在浏览器内通过 ONNX 运行，首次使用会下载模型文件。
 */
export async function aiRemoveBackground(source: Blob, options: AiRemoveOptions): Promise<Blob> {
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
