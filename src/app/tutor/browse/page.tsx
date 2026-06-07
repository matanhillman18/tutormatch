'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, MapPin, GraduationCap, DollarSign, Wifi, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react'
import Navbar from '../../_components/layout/Navbar'
import ApplyModal from '../../_components/ui/ApplyModal'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { useLang } from '@/lib/lang-context'
import type { TutoringRequest, Tutor } from '@/types'
import type { Session } from '@/lib/session'
import type { TranslationKey } from '@/lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'bg-blue-50 text-blue-700 border-blue-100',
  Physics: 'bg-purple-50 text-purple-700 border-purple-100',
  Chemistry: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Biology: 'bg-green-50 text-green-700 border-green-100',
  English: 'bg-amber-50 text-amber-700 border-amber-100',
  History: 'bg-orange-50 text-orange-700 border-orange-100',
  Literature: 'bg-rose-50 text-rose-700 border-rose-100',
  'Computer Science': 'bg-cyan-50 text-cyan-700 border-cyan-100',
}

export default function TutorBrowsePage() {
  const router = useRouter()
  const { t, lang } = useLang()
  const [session, setSession] = useState<Session | null>(null)
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [requests, setRequests] = useState<TutoringRequest[]>([])
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TutoringRequest | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [maxBudget, setMaxBudget] = useState(200)
  const [lessonType, setLessonType] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'budget_asc' | 'budget_desc'>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const s = getSession()
    setSession(s)

    try {
      const [reqRes, appsRes, tutorRes] = await Promise.all([
        supabase.from('tutoring_requests').select('*').order('created_at', { ascending: false }),
        s ? supabase.from('applications').select('request_id').eq('tutor_id', s.id) : Promise.resolve({ data: null }),
        s ? supabase.from('tutors').select('*').eq('id', s.id).maybeSingle() : Promise.resolve({ data: null }),
      ])
      if (reqRes.data) setRequests(reqRes.data)
      if (appsRes.data) setAppliedIds(new Set(appsRes.data.map((a: { request_id: string }) => a.request_id)))
      if (tutorRes.data) setTutor(tutorRes.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const subjectMap: Record<string, string> = {
    'מתמטיקה': 'Mathematics', 'פיזיקה': 'Physics', 'כימיה': 'Chemistry',
    'ביולוגיה': 'Biology', 'אנגלית': 'English', 'היסטוריה': 'History',
    'ספרות': 'Literature', 'מדעי מחשב': 'Computer Science',
    'כלכלה': 'Economics', 'גיאוגרפיה': 'Geography',
  }

  // Smart filtering — show only subjects matching tutor's profile
  const filtered = useMemo(() => {
    let list = requests.filter(r => {
      // Subject filter: if tutor has subjects, only show matching ones
      if (tutor && tutor.subjects.length > 0) {
        const reqSubjectEn = subjectMap[r.subject] ?? r.subject
        if (!tutor.subjects.includes(reqSubjectEn) && !tutor.subjects.includes(r.subject)) return false
      }
      // Lesson type filter
      if (lessonType !== 'all') {
        if (lessonType === 'online' && r.lesson_type === 'in_person') return false
        if (lessonType === 'in_person' && r.lesson_type === 'online') return false
      }
      // Search
      if (search) {
        const q = search.toLowerCase()
        if (!r.subject.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !r.grade.toLowerCase().includes(q) && !(r.location ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })

    // Sort
    if (sortBy === 'budget_asc') list = [...list].sort((a, b) => a.budget - b.budget)
    else if (sortBy === 'budget_desc') list = [...list].sort((a, b) => b.budget - a.budget)
    // newest is default (already sorted from DB)

    return list
  }, [requests, tutor, maxBudget, lessonType, search, sortBy])

  const handleApply = (req: TutoringRequest) => {
    if (!session) { setShowLoginPrompt(true); return }
    setSelected(req)
  }

  const handleSuccess = (id: string) => setAppliedIds(prev => new Set([...prev, id]))

  const clearFilters = () => { setSearch(''); setMaxBudget(200); setLessonType('all'); setSortBy('newest') }
  const hasActiveFilters = search || maxBudget < 200 || lessonType !== 'all' || sortBy !== 'newest'

  const lessonLabel = (type: string) => type === 'online' ? T(t, 'card.online') : type === 'in_person' ? T(t, 'card.inperson') : T(t, 'card.both')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1">{T(t, 'tutor.browse.title')}</h1>
              <p className="text-sm text-[#9c9a93]">
                {loading ? T(t, 'tutor.browse.loading') : `${filtered.length} ${T(t, 'tutor.browse.sub')}`}
              </p>
              {tutor && (
                <p className="text-xs text-[#9c9a93] mt-1 italic">{T(t, 'tutor.browse.sorted')}</p>
              )}
            </div>

            {session && appliedIds.size > 0 && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#faefd9] border border-[#f3d99b] rounded-xl text-sm text-[#a06e12]">
                <span className="w-1.5 h-1.5 bg-[#e5a82e] rounded-full" />
                {T(t, 'tutor.browse.applied')} {appliedIds.size} {appliedIds.size > 1 ? T(t, 'tutor.browse.requests.plural') : T(t, 'tutor.browse.requests')}
              </div>
            )}
          </div>

          {/* Login prompt */}
          {showLoginPrompt && (
            <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-sm">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <button onClick={() => router.push('/login?role=tutor')} className="underline text-amber-700 font-medium hover:text-amber-900">
                  {lang === 'he' ? 'צור פרופיל מורה' : 'Create your tutor profile'}
                </button>
                {' '}{lang === 'he' ? '— לוקח 2 דקות.' : '— takes 2 minutes.'}
              </div>
            </div>
          )}

          {/* Search + Filter bar */}
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
              <option value="newest">{T(t, 'filter.sort.newest')}</option>
              <option value="budget_asc">{T(t, 'filter.sort.budget_asc')}</option>
              <option value="budget_desc">{T(t, 'filter.sort.budget_desc')}</option>
            </select>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="bg-white border border-[#e8e4db] rounded-2xl p-5 mb-6 space-y-5">
              {/* Budget slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#3d3d3a]">{T(t, 'filter.budget')}</label>
                  <span className="text-sm font-semibold text-[#111110]">₪{maxBudget}</span>
                </div>
                <input type="range" min={20} max={200} step={5} value={maxBudget} onChange={e => setMaxBudget(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-[#9c9a93] mt-1">
                  <span>₪20</span>
                  <span>₪200+</span>
                </div>
              </div>

              {/* Lesson type */}
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

              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-[#9c9a93] hover:text-[#111110] transition-colors">
                  <X size={13} /> {T(t, 'tutor.browse.clear')}
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-2 text-[#9c9a93] text-sm"><Loader2 size={18} className="animate-spin" />{T(t, 'tutor.browse.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-[#9c9a93] text-sm mb-3">{T(t, 'tutor.browse.empty')}</p>
              <button onClick={clearFilters} className="text-sm text-[#e5a82e] underline">{T(t, 'tutor.browse.clear')}</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(req => {
                const hasApplied = appliedIds.has(req.id)
                const colorClass = SUBJECT_COLORS[req.subject] ?? 'bg-gray-50 text-gray-600 border-gray-100'
                return (
                  <div key={req.id} onClick={() => !hasApplied && handleApply(req)}
                    className={`bg-white border border-[#e8e4db] rounded-2xl p-5 transition-all duration-200 ${hasApplied ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>{req.subject}</span>
                      {hasApplied && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">{T(t, 'card.applied')}</span>}
                    </div>
                    <h3 className="font-semibold text-[#111110] text-[15px] mb-1.5">{req.subject} — {T(t, 'card.grade')} {req.grade}</h3>
                    <p className="text-sm text-[#6f6d66] leading-relaxed mb-4 line-clamp-2">{req.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#9c9a93] mb-4">
                      <span className="flex items-center gap-1"><DollarSign size={12} />₪{req.budget}{T(t, 'card.budget')}</span>
                      <span className="flex items-center gap-1"><GraduationCap size={12} />{T(t, 'card.grade')} {req.grade}</span>
                      {req.location && <span className="flex items-center gap-1"><MapPin size={12} />{req.location}</span>}
                      <span className="flex items-center gap-1"><Wifi size={12} />{lessonLabel(req.lesson_type)}</span>
                    </div>
                    <button disabled={hasApplied} onClick={e => { e.stopPropagation(); if (!hasApplied) handleApply(req) }}
                      className={`w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${hasApplied ? 'bg-green-50 text-green-600 cursor-not-allowed' : 'bg-[#111110] text-white hover:bg-[#e5a82e] hover:text-[#111110]'}`}>
                      {hasApplied ? T(t, 'card.applied') : <>{T(t, 'card.apply')} <ChevronRight size={13} /></>}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <ApplyModal request={selected} session={session} onClose={() => setSelected(null)} onSuccess={handleSuccess} />
    </>
  )
}
