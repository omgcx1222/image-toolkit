import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import zh from "./locales/zh"
import en from "./locales/en"

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" }
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"]

// 初始化 i18next：中文为默认/回退语言，自动检测并持久化到 localStorage
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en }
    },
    fallbackLng: "zh",
    supportedLngs: ["zh", "en"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "app-language"
    }
  })

export default i18n
