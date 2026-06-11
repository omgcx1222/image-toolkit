import { useCompress } from "@/stores/CompressStore"
import { ImageProcessorView } from "@/components/common/ImageProcessorView"
import { SettingsPanel } from "./SettingsPanel"

export function Compress() {
  const {
    items,
    config,
    running,
    doneCount,
    selectedCount,
    patchConfig,
    addFiles,
    removeItem,
    clear,
    toggleSelect,
    toggleSelectAll,
    process,
    downloadOne,
    downloadSelected
  } = useCompress()

  return (
    <ImageProcessorView
      settings={<SettingsPanel config={config} onChange={patchConfig} />}
      items={items}
      running={running}
      doneCount={doneCount}
      selectedCount={selectedCount}
      onAddFiles={addFiles}
      onRemove={removeItem}
      onClear={clear}
      onToggleSelect={toggleSelect}
      onToggleSelectAll={toggleSelectAll}
      onProcess={process}
      onDownloadOne={downloadOne}
      onDownloadSelected={downloadSelected}
    />
  )
}
