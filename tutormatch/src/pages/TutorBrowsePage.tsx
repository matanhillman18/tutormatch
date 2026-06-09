import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'wouter'
import { Search, SlidersHorizontal, MapPin, Clock, DollarSign, Wifi, ChevronRight, Loader2, AlertCircle, X, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'
import ApplyModal from '../components/ApplyModal'
import { supabase } from '../lib/supabase'
import { enToHe } from '../lib/subjects'
import { getSession } from '../lib/session'
import { useLang } from '../lib/lang-context'
import type { TutoringRequest, Tutor } from '../types'
import type { Session } from '../lib/session'
import type { TranslationKey } from '../lib/translations'

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
  Economics: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  Geography: 'bg-teal-50 text-teal-700 border-teal-100',
}

function timeAgo(dateStr: string, isHe: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return isHe ? 'לפני פחות משעה' : 'Just now'
  if (hours < 24) return isHe ? `לפני ${hours} שעות` : `${hours}h ago`
  if (days === 1) return isHe ? 'אתמול' : 'Yesterday'
  if (days < 7) return isHe ? `לפני ${days} ימים` : `${days}d ago`
  return new Date(dateStr).toLocaleDateString(isHe ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })
}

const subjectMap: Record<string, string> = {
  'מתמטיקה': 'Mathematics', 'פיזיקה': 'Physics', 'כימיה': 'Chemistry',
  'ביולוגיה': 'Biology', 'אנגלית': 'English', 'היסטוריה': 'History',
  'ספרות': 'Literature', 'מדעי מחשב': 'Computer Science', 'כלכלה': 'Economics', 'גיאוגרפיה': 'Geography',
}

export default function TutorBrowsePage() {
  const [, navigate] = useLocation()
  const { t, lang } = useLang()
  const isHe = lang === 'he'
  const [session, setSession] = useState<Session | null>(null)
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [requests, setRequests] = useState<TutoringRequest[]>([])
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TutoringRequest | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
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
      if (reqRes.data) setRequests(reqRes.data as TutoringRequest[])
      if (appsRes.data) setAppliedIds(new Set((appsRes.data as Array<{ request_id: string }>).map(a => a.request_id)))
      if (tutorRes.data) setTutor(tutorRes.data as Tutor)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const { exactMatches, otherRequests } = useMemo(() => {
    const hasTutorSubjects = tutor && tutor.subjects.length > 0

    const passesFilters = (r: TutoringRequest, checkSubject: boolean) => {
      if (checkSubject && hasTutorSubjects) {
        const reqSubjectEn = subjectMap[r.subject] ?? r.subject
        if (!tutor!.subjects.includes(reqSubjectEn) && !tutor!.subjects.includes(r.subject)) return false
      }
      if (r.budget > maxBudget) return false
      if (lessonType !== 'all') {
        if (lessonType === 'online' && r.lesson_type === 'in_person') return false
        if (lessonType === 'in_person' && r.lesson_type === 'online') return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!r.subject.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !r.grade.toLowerCase().includes(q) && !(r.location ?? '').toLowerCase().includes(q)) return false
      }
      return true
    }

    const sort = (list: TutoringRequest[]) => {
      if (sortBy === 'budget_asc') return [...list].sort((a, b) => a.budget - b.budget)
      if (sortBy === 'budget_desc') return [...list].sort((a, b) => b.budget - a.budget)
      return list
    }

    const exact = sort(requests.filter(r => passesFilters(r, true)))

    let other: TutoringRequest[] = []
    if (hasTutorSubjects && exact.length === 0) {
      other = sort(requests.filter(r => passesFilters(r, false)))
    }

    return { exactMatches: exact, otherRequests: other }
  }, [requests, tutor, maxBudget, lessonType, search, sortBy])

  const totalVisible = exactMatches.length + otherRequests.length
  const isEmpty = !loading && exactMatches.length === 0 && otherRequests.length === 0

  const handleApply = (req: TutoringRequest) => {
    if (!session) { setShowLoginPrompt(true); return }
    setSelected(req)
  }
  const handleSuccess = (id: string) => setAppliedIds(prev => new Set([...prev, id]))
  const clearFilters = () => { setSearch(''); setMaxBudget(200); setLessonType('all'); setSortBy('newest') }
  const hasActiveFilters = search || maxBudget < 200 || lessonType !== 'all' || sortBy !== 'newest'
  const lessonLabel = (type: string) => type === 'online' ? T(t, 'card.online') : type === 'in_person' ? T(t, 'card.inperson') : T(t, 'card.both')

  const RequestCard = ({ req }: { req: TutoringRequest }) => {
    const hasApplied = appliedIds.has(req.id)
    const colorClass = SUBJECT_COLORS[req.subject] ?? 'bg-gray-50 text-gray-600 border-gray-100'
    return (
      <div
        onClick={() => !hasApplied && handleApply(req)}
        className={`bg-white border border-[#e8e4db] rounded-2xl p-5 flex flex-col ${hasApplied ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'}`}
      >
        <div className="flex items-start justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
            {enToHe[req.subject] ?? req.subject}
          </span>
          {hasApplied && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
              {T(t, 'card.applied')}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-[#111110] text-[15px] mb-2">
          {enToHe[req.subject] ?? req.subject}
          <span className="font-normal text-[#9c9a93]"> — {T(t, 'card.grade')} {req.grade}</span>
        </h3>
        <p className="text-sm text-[#6f6d66] leading-relaxed mb-4 line-clamp-2 flex-1">{req.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#9c9a93] mb-4 pt-3 border-t border-[#f4f2ef]">
          <span className="flex items-center gap-1 font-medium text-[#a06e12]"><DollarSign size={11} />₪{req.budget}{T(t, 'card.budget')}</span>
          {req.location && <span className="flex items-center gap-1"><MapPin size={11} />{req.location}</span>}
          <span className="flex items-center gap-1"><Wifi size={11} />{lessonLabel(req.lesson_type)}</span>
          <span className="flex items-center gap-1 ml-auto"><Clock size={11} />{timeAgo(req.created_at, isHe)}</span>
        </div>
        <button
          disabled={hasApplied}
          onClick={e => { e.stopPropagation(); if (!hasApplied) handleApply(req) }}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${hasApplied ? 'bg-green-50 text-green-600 cursor-not-allowed' : 'bg-[#111110] text-white hover:bg-[#e5a82e] hover:text-[#111110]'}`}
        >
          {hasApplied ? T(t, 'card.applied') : <>{T(t, 'card.apply')} <ChevronRight size={13} /></>}
        </button>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1">
                {T(t, 'tutor.browse.title')}
              </h1>
              <p className="text-sm text-[#9c9a93]">
                {loading ? T(t, 'tutor.browse.loading') : `${totalVisible} ${T(t, 'tutor.browse.sub')}`}
              </p>
              {tutor && (
                <p className="text-xs text-[#b0ad9e] mt-1">{T(t, 'tutor.browse.sorted')}</p>
              )}
            </div>
            {session && appliedIds.size > 0 && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#faefd9] border border-[#f0d48a] rounded-xl text-sm text-[#a06e12] font-medium">
                <span className="w-1.5 h-1.5 bg-[#e5a82e] rounded-full" />
                {T(t, 'tutor.browse.applied')} {appliedIds.size} {appliedIds.size > 1 ? T(t, 'tutor.browse.requests.plural') : T(t, 'tutor.browse.requests')}
              </div>
            )}
          </div>

          {showLoginPrompt && (
            <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-sm">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <button onClick={() => navigate('/login?role=tutor')} className="underline text-amber-700 font-medium hover:text-amber-900">
                  {isHe ? 'צור פרופיל מורה' : 'Create your tutor profile'}
                </button>
                {' '}{isHe ? '— לוקח 2 דקות.' : '— takes 2 minutes.'}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0ad9e]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={T(t, 'filter.search')}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0dbd0] rounded-xl text-sm text-[#111110] placeholder-[#b0ad9e] focus:outline-none focus:border-[#e5a82e] focus:ring-2 focus:ring-[#e5a82e]/15"
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${showFilters || hasActiveFilters ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}
            >
              <SlidersHorizontal size={14} />
              {isHe ? 'פילטרים' : 'Filters'}
              {hasActiveFilters && <span className="w-1.5 h-1.5 bg-[#e5a82e] rounded-full" />}
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2.5 bg-white border border-[#e0dbd0] rounded-xl text-sm text-[#111110] focus:outline-none focus:border-[#e5a82e] cursor-pointer appearance-none"
            >
              <option value="newest">{T(t, 'filter.sort.newest')}</option>
              <option value="budget_asc">{T(t, 'filter.sort.budget_asc')}</option>
              <option value="budget_desc">{T(t, 'filter.sort.budget_desc')}</option>
            </select>
          </div>

          {showFilters && (
            <div className="bg-white border border-[#e8e4db] rounded-2xl p-5 mb-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-sm font-medium text-[#3d3d3a]">{T(t, 'filter.budget')}</label>
                  <span className="text-sm font-semibold text-[#111110] tabular-nums">
                    {maxBudget >= 200 ? `₪200+` : `₪${maxBudget}`}
                  </span>
                </div>
                <input type="range" min={20} max={200} step={5} value={maxBudget} onChange={e => setMaxBudget(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-[#9c9a93] mt-1.5"><span>₪20</span><span>₪200+</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-2">{T(t, 'filter.type')}</label>
                <div className="flex gap-2">
                  {[['all', T(t, 'filter.type.all')], ['online', T(t, 'filter.type.online')], ['in_person', T(t, 'filter.type.inperson')]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setLessonType(val)}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border ${lessonType === val ? 'bg-[#111110] text-white border-[#111110]' : 'bg-[#fafaf9] text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-[#9c9a93] hover:text-[#111110]">
                  <X size={13} /> {T(t, 'tutor.browse.clear')}
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32 gap-2 text-[#9c9a93] text-sm">
              <Loader2 size={18} className="animate-spin" />
              {T(t, 'tutor.browse.loading')}
            </div>
          ) : isEmpty ? (
            <div className="text-center py-32">
              <p className="text-[#9c9a93] text-sm mb-3">{T(t, 'tutor.browse.empty')}</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-sm text-[#e5a82e] underline">{T(t, 'tutor.browse.clear')}</button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {exactMatches.length > 0 && (
                <div>
                  {otherRequests.length > 0 && (
                    <p className="text-xs font-semibold text-[#9c9a93] uppercase tracking-wider mb-3">
                      {isHe ? 'התאמות מדויקות' : 'Exact Matches'}
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exactMatches.map(req => <RequestCard key={req.id} req={req} />)}
                  </div>
                </div>
              )}

              {otherRequests.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={13} className="text-[#e5a82e]" />
                    <p className="text-xs font-semibold text-[#9c9a93] uppercase tracking-wider">
                      {isHe ? 'בקשות פתוחות נוספות שיכולות לעניין אותך' : 'Other Open Requests You Might Be Interested In'}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherRequests.map(req => <RequestCard key={req.id} req={req} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <ApplyModal request={selected} session={session} onClose={() => setSelected(null)} onSuccess={handleSuccess} />
    </>
  )
}
