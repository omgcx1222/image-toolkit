import JSZip from "jszip"
import { saveAs } from "file-saver"

// 下载单个 Blob
export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename)
}

export interface ZipEntry {
  filename: string
  blob: Blob
}

// 将多个 Blob 打包为 zip 并下载
export async function downloadZip(entries: ZipEntry[], zipName: string) {
  const zip = new JSZip()
  entries.forEach((entry) => {
    zip.file(entry.filename, entry.blob)
  })
  const content = await zip.generateAsync({ type: "blob" })
  saveAs(content, zipName)
}

// 去掉文件名后缀，便于拼接新后缀
export function stripExt(filename: string) {
  const idx = filename.lastIndexOf(".")
  return idx > 0 ? filename.slice(0, idx) : filename
}
