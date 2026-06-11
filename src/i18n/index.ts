import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import zh from "./locales/zh"
import en from "./locales/en"

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" }
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"]

export const LANGUAGE_STORAGE_KEY = "app-language"

// 初始化 i18next。
// 注意：SSR 与客户端首次渲染都固定使用默认语言 zh，避免水合不一致；
// 真正的语言偏好在客户端挂载后由 applyStoredLanguage 应用。
i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en }
  },
  lng: "zh",
  fallbackLng: "zh",
  supportedLngs: ["zh", "en"],
  interpolation: { escapeValue: false }
})

// 读取用户语言偏好：优先 localStorage，其次浏览器语言，默认 zh
export function getPreferredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "zh"
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null
  if (saved === "zh" || saved === "en") return saved
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "zh"
}

// 切换并持久化语言
export function changeLanguage(code: LanguageCode) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
  }
  return i18n.changeLanguage(code)
}

// 客户端挂载后应用已保存的语言偏好
export function applyStoredLanguage() {
  const lng = getPreferredLanguage()
  if (lng !== i18n.resolvedLanguage) i18n.changeLanguage(lng)
}

export default i18n
