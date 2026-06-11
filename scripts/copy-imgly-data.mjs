// 将 @imgly/background-removal 所需的 wasm/onnx 模型资源下载到 public/imgly，
// 使 AI 抠图完全离线自托管（运行时从本站 /imgly/ 加载，不访问任何外部 CDN）。
//
// 数据与库版本一一对应：库默认从
//   https://staticimgly.com/@imgly/background-removal-data/<libVersion>/dist/
// 加载 resources.json 及各分块文件（按 chunk.name 命名）。
// 本脚本下载“我们实际用到的模型 + onnxruntime-web 全部 wasm”，并缓存，
// 已存在则跳过（首次需联网，之后离线可用）。
import { mkdir, access, writeFile, readFile, stat } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const DEST = join(root, "public", "imgly")

// 读取库版本，拼出与之匹配的数据 CDN 基址
const libPkgPath = join(root, "node_modules", "@imgly", "background-removal", "package.json")
const libVersion = JSON.parse(await readFile(libPkgPath, "utf8")).version
const BASE = `https://staticimgly.com/@imgly/background-removal-data/${libVersion}/dist/`

// 仅下载用到的模型（best=isnet，fast/balanced=isnet_fp16）+ 全部 onnxruntime wasm
const WANTED_PREFIXES = ["/onnxruntime-web/"]
const WANTED_KEYS = ["/models/isnet", "/models/isnet_fp16"]

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function getResourceMap() {
  const local = join(DEST, "resources.json")
  // 已缓存则直接用（支持离线）
  if (await exists(local)) {
    return JSON.parse(await readFile(local, "utf8"))
  }
  const res = await fetch(BASE + "resources.json")
  if (!res.ok) throw new Error(`下载 resources.json 失败: ${res.status}`)
  const text = await res.text()
  await mkdir(DEST, { recursive: true })
  await writeFile(local, text)
  return JSON.parse(text)
}

// 简单并发池
async function pool(items, size, worker) {
  const queue = [...items]
  const runners = Array.from({ length: size }, async () => {
    while (queue.length) {
      const item = queue.shift()
      await worker(item)
    }
  })
  await Promise.all(runners)
}

async function downloadChunk(name, expectedSize) {
  const dest = join(DEST, name)
  // 已存在且大小匹配则跳过
  if (await exists(dest)) {
    if (!expectedSize) return false
    const s = await stat(dest)
    if (s.size === expectedSize) return false
  }
  const res = await fetch(BASE + name)
  if (!res.ok) throw new Error(`下载 ${name} 失败: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  return true
}

async function main() {
  await mkdir(DEST, { recursive: true })
  let map
  try {
    map = await getResourceMap()
  } catch (err) {
    console.warn(
      `[imgly] 获取资源清单失败（离线且无缓存？）：${err.message}\n` +
        "        AI 抠图离线资源未就绪，联网后重新运行 npm run copy:imgly。"
    )
    return
  }

  // 收集需要的分块（按 chunk.name 下载，chunk 含 offsets 可推算大小）
  const tasks = []
  for (const [key, entry] of Object.entries(map)) {
    const wanted = WANTED_KEYS.includes(key) || WANTED_PREFIXES.some((p) => key.startsWith(p))
    if (!wanted || !entry?.chunks) continue
    for (const chunk of entry.chunks) {
      const size = chunk.offsets ? chunk.offsets[1] - chunk.offsets[0] : 0
      tasks.push({ name: chunk.name, size })
    }
  }

  let downloaded = 0
  try {
    await pool(tasks, 6, async ({ name, size }) => {
      const did = await downloadChunk(name, size)
      if (did) downloaded++
    })
  } catch (err) {
    console.warn(`[imgly] 资源下载未完成：${err.message}`)
    return
  }

  console.log(`[imgly] 离线资源就绪：共 ${tasks.length} 个分块，本次新下载 ${downloaded} 个（public/imgly）`)
}

main().catch((err) => {
  console.warn("[imgly] 资源准备失败:", err.message)
})
