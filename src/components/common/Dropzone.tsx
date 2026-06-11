import * as React from "react"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropzoneProps {
  // 接受的文件类型，传给 input 的 accept 属性
  accept: string
  // 是否允许多选
  multiple?: boolean
  // 主提示文案
  title: string
  // 副提示文案（支持格式说明）
  hint?: string
  // 选中文件回调
  onFiles: (files: File[]) => void
  className?: string
  // 紧凑内联模式：用于"重新添加"等次级入口，不显示大号渐变图标
  compact?: boolean
}

// 通用上传拖拽区：支持点击选择与拖拽，复用于图片与视频上传
export function Dropzone({
  accept,
  multiple = false,
  title,
  hint,
  onFiles,
  className,
  compact = false
}: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  // 统一处理文件列表：按 accept 简单过滤后回调
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl text-center transition-colors",
        compact ? "flex-row gap-1.5" : "border-2 border-dashed p-10",
        dragging
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/25 hover:border-primary/60 hover:bg-accent/50",
        className
      )}
    >
      {compact ? (
        <UploadCloud className="size-4 text-primary" />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:-translate-y-0.5">
          <UploadCloud className="size-6" />
        </span>
      )}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          // 重置以便重复选择同一文件
          e.target.value = ""
        }}
      />
    </div>
  )
}
