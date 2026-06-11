/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 跳过构建时的 ESLint（项目未单独配置 next lint 规则）
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // @imgly/background-removal 依赖 onnxruntime-web，仅在浏览器运行
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false
    }

    // onnxruntime-web 通过 new URL('ort.node.min.mjs', import.meta.url) 引用
    // 仅在 Node 环境使用的文件，会被 webpack 当作资源静态产出并送入压缩器，
    // 导致 “import/export 不能用于非模块代码” 的解析错误。
    // 关闭 JS 的 new URL 资源解析即可避免该文件被产出（浏览器端不会执行该分支）。
    config.module.parser = {
      ...config.module.parser,
      javascript: {
        ...(config.module.parser && config.module.parser.javascript),
        url: false
      }
    }

    // 兼容 .mjs 的未完全限定路径解析
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: { fullySpecified: false }
    })

    return config
  }
}

export default nextConfig
