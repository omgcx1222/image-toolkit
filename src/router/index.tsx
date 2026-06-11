import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { AppLayout } from "@/components/common/AppLayout"

// 路由懒加载：除布局外的页面动态加载，减小首屏体积
const BackgroundRemovalPage = lazy(
  () => import(/* webpackChunkName: "backgroundRemoval" */ "@/pages/BackgroundRemovalPage")
)
const VideoFramesPage = lazy(() => import(/* webpackChunkName: "videoFrames" */ "@/pages/VideoFramesPage"))

// 懒加载页面的加载占位
function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
    </div>
  )
}

const lazyPage = (node: React.ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/backgroundRemoval" replace /> },
      {
        path: "backgroundRemoval",
        handle: { name: "backgroundRemoval" },
        element: lazyPage(<BackgroundRemovalPage />)
      },
      {
        path: "videoFrames",
        handle: { name: "videoFrames" },
        element: lazyPage(<VideoFramesPage />)
      }
    ]
  }
])
