import { RouterProvider } from "react-router-dom"
import { ThemeProvider } from "@/components/common/ThemeProvider"
import { BackgroundRemovalProvider } from "@/stores/BackgroundRemovalStore"
import { VideoFramesProvider } from "@/stores/VideoFramesStore"
import { router } from "@/router"

function App() {
  return (
    <ThemeProvider>
      {/* 功能状态提升到全局，切换路由时数据得以缓存保留 */}
      <BackgroundRemovalProvider>
        <VideoFramesProvider>
          <RouterProvider router={router} />
        </VideoFramesProvider>
      </BackgroundRemovalProvider>
    </ThemeProvider>
  )
}

export default App
