'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { translations, TranslationKey } from './translations'
import type { Lang } from '@/types'

interface LangCtx {
  lang: Lang
  toggle: () => void
  t: (key: TranslationKey) => string
  isRTL: boolean
}

const Ctx = createContext<LangCtx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const isRTL = lang === 'he'
  const toggle = () => setLang(l => l === 'en' ? 'he' : 'en')
  const t = (key: TranslationKey): string => translations[lang][key] ?? key

  return (
    <Ctx.Provider value={{ lang, toggle, t, isRTL }}>
      <div dir={isRTL ? 'rtl' : 'ltr'} lang={lang}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

export function useLang() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLang outside LangProvider')
  return c
}
