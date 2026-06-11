import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

// Vite 配置：设置 @ 路径别名指向 src，避免多级相对路径
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
})
