import { redirect } from "next/navigation"

// 首页重定向到默认功能
export default function Home() {
  redirect("/background-removal")
}
