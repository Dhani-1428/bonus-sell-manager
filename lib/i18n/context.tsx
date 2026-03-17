"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslations, getLanguageFromCode, languages } from './translations'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslations>
  availableLanguages: typeof languages
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('admin_language')
      if (savedLang) {
        const lang = getLanguageFromCode(savedLang)
        setLanguageState(lang)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_language', lang)
    }
  }

  const t = getTranslations(language)

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, availableLanguages: languages }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
