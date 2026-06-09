import { Link, useLocation } from 'wouter'
import { BookOpen, Globe, LogOut, Search, ChevronDown, PlusCircle, FileText, LayoutDashboard, Settings } from 'lucide-react'
import { useLang } from '../lib/lang-context'
import { getSession, clearSession, setSession } from '../lib/session'
import { useEffect, useState, useRef } from 'react'
import type { Session } from '../lib/session'
import type { TranslationKey } from '../lib/translations'
import EditProfileModal from './EditProfileModal'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

export default function Navbar() {
  const { t, toggle, lang } = useLang()
  const isHe = lang === 'he'
  const [, navigate] = useLocation()
  const [session, setLocalSession] = useState<Session | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalSession(getSession())
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleLogout = () => {
    clearSession(); setLocalSession(null); setMenuOpen(false); navigate('/login')
  }

  const go = (path: string) => { setMenuOpen(false); navigate(path) }

  const homeLink = session?.role === 'tutor' ? '/tutor/browse' : session?.role === 'parent' ? '/parent/browse' : '/'

  const tutorLinks = [
    { Icon: Search,        label: isHe ? 'עיין בבקשות'     : 'Browse Requests',  path: '/tutor/browse'     },
    { Icon: FileText,      label: isHe ? 'המועמדויות שלי'  : 'My Applications',  path: '/tutor/dashboard'  },
  ]
  const parentLinks = [
    { Icon: Search,        label: isHe ? 'מצא מורה'         : 'Browse Tutors',   path: '/parent/browse'    },
    { Icon: PlusCircle,    label: isHe ? 'פרסם בקשה'        : 'Post Request',    path: '/parent/post'      },
    { Icon: LayoutDashboard, label: isHe ? 'הבקשות שלי'    : 'My Requests',     path: '/parent/dashboard' },
  ]
  const links = session?.role === 'tutor' ? tutorLinks : parentLinks

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 bg-[#fafaf9]/95 backdrop-blur-md border-b transition-all duration-200 ${scrolled ? 'border-[#e0dbd0] shadow-sm' : 'border-[#e8e4db]'}`}>
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link href={homeLink} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#111110] rounded-lg flex items-center justify-center group-hover:bg-[#e5a82e] transition-colors duration-200">
              <BookOpen size={15} className="text-white group-hover:text-[#111110] transition-colors duration-200" />
            </div>
            <span className="font-semibold text-[#111110] text-[15px] tracking-tight">TutorMatch</span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#6f6d66] hover:text-[#111110] hover:bg-[#f0ece4] rounded-lg"
            >
              <Globe size={14} />
              {T(t, 'nav.lang')}
            </button>

            {session ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${menuOpen ? 'bg-[#111110] text-white' : 'text-[#6f6d66] hover:text-[#111110] hover:bg-[#f0ece4]'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${menuOpen ? 'bg-[#e5a82e] text-[#111110]' : 'bg-[#f0ece4] text-[#6f6d66]'}`}>
                    {session.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">{session.name}</span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e8e4db] rounded-2xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-[#f4f2ef]">
                      <p className="text-[10px] font-semibold text-[#9c9a93] uppercase tracking-wider">
                        {session.role === 'tutor' ? (isHe ? 'מורה' : 'Tutor') : (isHe ? 'הורה' : 'Parent')}
                      </p>
                      <p className="text-sm font-medium text-[#111110] mt-0.5 truncate">{session.name}</p>
                    </div>

                    <div className="py-1">
                      {links.map(({ Icon, label, path }) => (
                        <button
                          key={path}
                          onClick={() => go(path)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3d3d3a] hover:bg-[#fafaf9] hover:text-[#111110] text-left"
                        >
                          <Icon size={14} className="text-[#9c9a93] flex-shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-[#f4f2ef] py-1">
                      <button
                        onClick={() => { setMenuOpen(false); setShowEditProfile(true) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3d3d3a] hover:bg-[#fafaf9] hover:text-[#111110] text-left"
                      >
                        <Settings size={14} className="text-[#9c9a93] flex-shrink-0" />
                        {isHe ? 'עריכת פרופיל' : 'Edit Profile'}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left"
                      >
                        <LogOut size={14} className="flex-shrink-0" />
                        {T(t, 'nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm font-medium bg-[#111110] text-white rounded-lg hover:bg-[#e5a82e] hover:text-[#111110]"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>

      {session && showEditProfile && (
        <EditProfileModal
          session={session}
          onClose={() => setShowEditProfile(false)}
          onSaved={(newName) => {
            const updated = { ...session, name: newName }
            setSession(updated)
            setLocalSession(updated)
          }}
        />
      )}
    </>
  )
}
