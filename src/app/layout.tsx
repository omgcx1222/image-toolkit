import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Image Toolkit",
  description: "纯前端图片处理平台 · 所有处理均在本地完成"
}

// 在 hydration 之前同步设置主题 class，避免暗黑模式闪烁与水合不一致
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('app-theme') || 'system';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

// 根布局（服务端组件）：输出 SSR 外壳，交互逻辑下沉到客户端 Providers
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
