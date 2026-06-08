'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Globe, LogOut, LayoutDashboard, Search } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { getSession, clearSession } from '@/lib/session'
import { useEffect, useState } from 'react'
import type { Session } from '@/lib/session'
import type { TranslationKey } from '@/lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

export default function Navbar() {
  const { t, toggle } = useLang()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => { setSession(getSession()) }, [])

  const handleLogout = () => { clearSession(); router.push('/login') }

  const homeLink = session?.role === 'tutor' ? '/tutor/browse' : session?.role === 'parent' ? '/parent/browse' : '/'
  const dashLink = session?.role === 'tutor' ? '/tutor/dashboard' : '/parent/dashboard'
  const browseLink = session?.role === 'tutor' ? '/tutor/browse' : '/parent/browse'
  const isHe = false

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#fafaf9]/90 backdrop-blur-md border-b border-[#e8e4db]">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={homeLink} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#111110] rounded-lg flex items-center justify-center group-hover:bg-[#e5a82e] transition-colors duration-200">
            <BookOpen size={15} className="text-white group-hover:text-[#111110] transition-colors duration-200" />
          </div>
          <span className="font-semibold text-[#111110] text-[15px] tracking-tight">TutorMatch</span>
        </Link>

        <div className="flex items-center gap-2">
          <button onClick={toggle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#6f6d66] hover:text-[#111110] hover:bg-[#f0ece4] rounded-lg transition-all duration-150">
            <Globe size={14} />
            {T(t, 'nav.lang')}
          </button>

          {session ? (
            <>
              <Link href={browseLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#6f6d66] hover:text-[#111110] hover:bg-[#f0ece4] rounded-lg transition-all duration-150">
                <Search size={14} />
                {session.role === 'tutor' ? 'בקשות' : 'מורים'}
              </Link>
              <Link href={dashLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#6f6d66] hover:text-[#111110] hover:bg-[#f0ece4] rounded-lg transition-all duration-150">
                <LayoutDashboard size={14} />
                {T(t, 'nav.dashboard')}
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#6f6d66] hover:text-[#111110] hover:bg-[#f0ece4] rounded-lg transition-all duration-150">
                <LogOut size={14} />
                {T(t, 'nav.logout')}
              </button>
            </>
          ) : (
            <Link href="/login"
              className="px-4 py-1.5 text-sm font-medium bg-[#111110] text-white rounded-lg hover:bg-[#e5a82e] hover:text-[#111110] transition-all duration-150">
              {isHe ? 'כניסה' : 'Sign In'}
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
