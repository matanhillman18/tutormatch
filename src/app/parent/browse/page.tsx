'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, MapPin, Star, DollarSign, Wifi, Loader2, X, Plus, BookOpen } from 'lucide-react'
import Navbar from '../../_components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { useLang } from '@/lib/lang-context'
import type { Tutor } from '@/types'
import type { Session } from '@/lib/session'
import type { TranslationKey } from '@/lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

const SUBJECTS_EN = ['Mathematics','Physics','Chemistry','Biology','English','History','Literature','Computer Science','Economics','Geography','Music','Art']
const SUBJECTS_HE = ['מתמטיקה','פיזיקה','כימיה','ביולוגיה','אנגלית','היסטוריה','ספרות','מדעי מחשב','כלכלה','גיאוגרפיה','מוזיקה','אמנות']

export default function ParentBrowsePage() {
  const router = useRouter()
  const { t, lang } = useLang()
  const [session, setSession] = useState<Session | null>(null)
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [maxRate, setMaxRate] = useState(200)
  const [lessonType, setLessonType] = useState('all')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'rate_asc' | 'rate_desc' | 'newest'>('rate_asc')

  const subjects = lang === 'he' ? SUBJECTS_HE : SUBJECTS_EN

  const loadData = useCallback(async () => {
    setLoading(true)
    const s = getSession()
    setSession(s)
    const { data } = await supabase.from('tutors').select('*').order('created_at', { ascending: false })
    if (data) setTutors(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const toggleSubject = (s: string) => setSelectedSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const filtered = useMemo(() => {
    let list = tutors.filter(tutor => {
      if (lessonType !== 'all') {
        if (lessonType === 'online' && tutor.teaching_format === 'in_person') return false
        if (lessonType === 'in_person' && tutor.teaching_format === 'online') return false
      }
      if (selectedSubjects.length > 0) {
        const hasSubject = selectedSubjects.some(s => tutor.subjects.includes(s))
        if (!hasSubject) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!tutor.full_name.toLowerCase().includes(q) && !tutor.bio.toLowerCase().includes(q) && !tutor.subjects.some(s => s.toLowerCase().includes(q)) && !tutor.location.toLowerCase().includes(q)) return false
      }
      return true
    })

    if (sortBy === 'rate_asc') list = [...list].sort((a, b) => a.hourly_rate - b.hourly_rate)
    else if (sortBy === 'rate_desc') list = [...list].sort((a, b) => b.hourly_rate - a.hourly_rate)

    return list
  }, [tutors, maxRate, lessonType, selectedSubjects, search, sortBy])

  const clearFilters = () => { setSearch(''); setMaxRate(200); setLessonType('all'); setSelectedSubjects([]); setSortBy('rate_asc') }
  const hasActiveFilters = search || maxRate < 200 || lessonType !== 'all' || selectedSubjects.length > 0

  const formatLabel = (f: string) => f === 'online' ? T(t, 'card.online') : f === 'in_person' ? T(t, 'card.inperson') : T(t, 'card.both')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1">{T(t, 'parent.browse.title')}</h1>
              <p className="text-sm text-[#9c9a93]">{loading ? T(t, 'parent.browse.loading') : `${filtered.length} ${T(t, 'parent.browse.sub')}`}</p>
              <p className="text-xs text-[#9c9a93] mt-1 italic">{T(t, 'parent.browse.sorted')}</p>
            </div>
            <button onClick={() => router.push('/parent/post')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#e5a82e] text-[#111110] text-sm font-medium rounded-xl hover:bg-[#f3d99b] transition-colors">
              <Plus size={15} />
              {lang === 'he' ? 'פרסם בקשה' : 'Post Request'}
            </button>
          </div>

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0ad9e]" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={T(t, 'filter.search')}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#e0dbd0] rounded-xl text-sm text-[#111110] placeholder-[#b0ad9e] focus:outline-none focus:border-[#e5a82e] focus:ring-2 focus:ring-[#e5a82e]/20 transition-all" />
            </div>
            <button onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${showFilters || hasActiveFilters ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}>
              <SlidersHorizontal size={15} />
              {lang === 'he' ? 'פילטרים' : 'Filters'}
              {hasActiveFilters && <span className="w-1.5 h-1.5 bg-[#e5a82e] rounded-full" />}
            </button>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none px-4 py-3 bg-white border border-[#e0dbd0] rounded-xl text-sm text-[#111110] focus:outline-none focus:border-[#e5a82e] cursor-pointer">
              <option value="rate_asc">{lang === 'he' ? 'מחיר: נמוך לגבוה' : 'Price: Low to High'}</option>
              <option value="rate_desc">{lang === 'he' ? 'מחיר: גבוה לנמוך' : 'Price: High to Low'}</option>
              <option value="newest">{T(t, 'filter.sort.newest')}</option>
            </select>
          </div>

          {showFilters && (
            <div className="bg-white border border-[#e8e4db] rounded-2xl p-5 mb-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#3d3d3a]">{lang === 'he' ? 'תעריף מקסימלי לשעה' : 'Max Hourly Rate'}</label>
                  <span className="text-sm font-semibold text-[#111110]">₪{maxRate}</span>
                </div>
                <input type="range" min={20} max={200} step={5} value={maxRate} onChange={e => setMaxRate(Number(e.target.value))} className="w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-2">{T(t, 'filter.type')}</label>
                <div className="flex gap-2">
                  {[['all', T(t, 'filter.type.all')], ['online', T(t, 'filter.type.online')], ['in_person', T(t, 'filter.type.inperson')]].map(([val, label]) => (
                    <button key={val} onClick={() => setLessonType(val)}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${lessonType === val ? 'bg-[#111110] text-white border-[#111110]' : 'bg-[#fafaf9] text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-2">{lang === 'he' ? 'מקצועות' : 'Subjects'}</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => {
                    const sel = selectedSubjects.includes(s)
                    return (
                      <button key={s} onClick={() => toggleSubject(s)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${sel ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}>
                        {sel ? <X size={10} /> : <Plus size={10} />} {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-[#9c9a93] hover:text-[#111110] transition-colors">
                  <X size={13} /> {lang === 'he' ? 'נקה פילטרים' : 'Clear filters'}
                </button>
              )}
            </div>
          )}

          {/* Tutor cards */}
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-2 text-[#9c9a93] text-sm"><Loader2 size={18} className="animate-spin" />{T(t, 'parent.browse.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-[#9c9a93] text-sm mb-3">{T(t, 'parent.browse.empty')}</p>
              <button onClick={clearFilters} className="text-sm text-[#e5a82e] underline">{lang === 'he' ? 'נקה פילטרים' : 'Clear filters'}</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(tutor => (
                <div key={tutor.id} className="bg-white border border-[#e8e4db] rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[#f0ece4] rounded-full flex items-center justify-center text-[#6f6d66] font-semibold text-sm">
                      {tutor.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-[#111110]">₪{tutor.hourly_rate}<span className="text-xs font-normal text-[#9c9a93]">{T(t, 'card.rate')}</span></span>
                  </div>

                  <h3 className="font-semibold text-[#111110] text-[15px] mb-1">{tutor.full_name}</h3>
                  <p className="text-sm text-[#6f6d66] leading-relaxed mb-3 line-clamp-2">{tutor.bio}</p>

                  {/* Subjects */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tutor.subjects.slice(0, 3).map(s => (
                      <span key={s} className="inline-flex items-center gap-1 px-2 py-1 bg-[#fafaf9] border border-[#e8e4db] rounded-full text-xs text-[#6f6d66]">
                        <BookOpen size={10} /> {s}
                      </span>
                    ))}
                    {tutor.subjects.length > 3 && (
                      <span className="px-2 py-1 bg-[#fafaf9] border border-[#e8e4db] rounded-full text-xs text-[#9c9a93]">+{tutor.subjects.length - 3}</span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#9c9a93] mb-4">
                    {tutor.location && <span className="flex items-center gap-1"><MapPin size={11} />{tutor.location}</span>}
                    <span className="flex items-center gap-1"><Wifi size={11} />{formatLabel(tutor.teaching_format)}</span>
                  </div>

                  {/* CTA */}
                  <a href={`tel:${tutor.phone}`} onClick={e => { if (!session) { e.preventDefault(); router.push('/login?role=parent') } }}
                    className="w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 bg-[#111110] text-white hover:bg-[#e5a82e] hover:text-[#111110] transition-all cursor-pointer">
                    {T(t, 'card.contact')}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
