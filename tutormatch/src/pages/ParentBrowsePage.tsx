import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'wouter'
import { Search, SlidersHorizontal, BookOpen, MapPin, Wifi, Plus, Loader2, X, Phone, Mail, Send, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/session'
import { useLang } from '../lib/lang-context'
import { SUBJECTS_EN, SUBJECTS_HE } from '../lib/subjects'
import type { Tutor } from '../types'
import type { Session } from '../lib/session'
import type { TranslationKey } from '../lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

export default function ParentBrowsePage() {
  const [, navigate] = useLocation()
  const { t, lang } = useLang()
  const isHe = lang === 'he'
  const [session, setSession] = useState<Session | null>(null)
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [maxRate, setMaxRate] = useState(200)
  const [lessonType, setLessonType] = useState('all')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'rate_asc' | 'rate_desc' | 'newest'>('rate_asc')
  const [showFilters, setShowFilters] = useState(false)
  const [contactTutor, setContactTutor] = useState<Tutor | null>(null)
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)
  const [contactSent, setContactSent] = useState(false)

  const subjects = isHe ? [...SUBJECTS_HE] : [...SUBJECTS_EN]
  const toggleSubject = (s: string) => setSelectedSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const load = useCallback(async () => {
    const s = getSession()
    setSession(s)
    setLoading(true)
    const { data } = await supabase.from('tutors').select('*').order('created_at', { ascending: false })
    if (data) setTutors(data as Tutor[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let list = tutors.filter(tutor => {
      if (tutor.hourly_rate > maxRate) return false
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

  const handleContactClick = (tutor: Tutor) => {
    if (!session) { navigate('/login?role=parent'); return }
    setContactTutor(tutor)
    setContactMessage('')
    setContactSent(false)
  }

  const handleSendMessage = async () => {
    if (!session || !contactTutor || !contactMessage.trim()) return
    setContactSending(true)
    try {
      await supabase.from('contact_messages').insert({
        parent_id: session.id,
        tutor_id: contactTutor.id,
        tutor_name: contactTutor.full_name,
        message: contactMessage.trim(),
      })
      setContactSent(true)
    } catch {
      /* fail silently — contact details still visible */
    } finally {
      setContactSending(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1">
                {T(t, 'parent.browse.title')}
              </h1>
              <p className="text-sm text-[#9c9a93]">
                {loading ? T(t, 'parent.browse.loading') : `${filtered.length} ${T(t, 'parent.browse.sub')}`}
              </p>
            </div>
            <button
              onClick={() => navigate('/parent/post')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#e5a82e] text-[#111110] text-sm font-medium rounded-xl hover:bg-[#f3c856] flex-shrink-0"
            >
              <Plus size={15} />
              {isHe ? 'פרסם בקשה' : 'Post Request'}
            </button>
          </div>

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
              <option value="rate_asc">{isHe ? 'מחיר: נמוך לגבוה' : 'Price: Low to High'}</option>
              <option value="rate_desc">{isHe ? 'מחיר: גבוה לנמוך' : 'Price: High to Low'}</option>
              <option value="newest">{T(t, 'filter.sort.newest')}</option>
            </select>
          </div>

          {showFilters && (
            <div className="bg-white border border-[#e8e4db] rounded-2xl p-5 mb-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-sm font-medium text-[#3d3d3a]">{isHe ? 'תעריף מקסימלי לשעה' : 'Max Hourly Rate'}</label>
                  <span className="text-sm font-semibold text-[#111110] tabular-nums">
                    {maxRate >= 200 ? '₪200+' : `₪${maxRate}`}
                  </span>
                </div>
                <input type="range" min={20} max={200} step={5} value={maxRate} onChange={e => setMaxRate(Number(e.target.value))} className="w-full" />
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
              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-2">{isHe ? 'מקצועות' : 'Subjects'}</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => {
                    const sel = selectedSubjects.includes(s)
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSubject(s)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${sel ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}
                      >
                        {sel ? <X size={10} /> : <Plus size={10} />} {s}
                      </button>
                    )
                  })}
                </div>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-[#9c9a93] hover:text-[#111110]">
                  <X size={13} /> {isHe ? 'נקה פילטרים' : 'Clear filters'}
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32 gap-2 text-[#9c9a93] text-sm">
              <Loader2 size={18} className="animate-spin" />
              {T(t, 'parent.browse.loading')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-[#9c9a93] text-sm mb-3">{T(t, 'parent.browse.empty')}</p>
              <button onClick={clearFilters} className="text-sm text-[#e5a82e] underline">{isHe ? 'נקה פילטרים' : 'Clear filters'}</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(tutor => (
                <div key={tutor.id} className="bg-white border border-[#e8e4db] rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#f0ece4] rounded-full flex items-center justify-center text-[#6f6d66] font-semibold text-sm flex-shrink-0">
                        {tutor.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#111110] text-[15px] leading-tight">{tutor.full_name}</h3>
                        {tutor.location && (
                          <p className="text-xs text-[#9c9a93] flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{tutor.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#111110] flex-shrink-0">
                      ₪{tutor.hourly_rate}<span className="text-xs font-normal text-[#9c9a93]">{T(t, 'card.rate')}</span>
                    </span>
                  </div>

                  <p className="text-sm text-[#6f6d66] leading-relaxed mb-3 line-clamp-2">{tutor.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3 flex-1">
                    {tutor.subjects.slice(0, 3).map(s => (
                      <span key={s} className="inline-flex items-center gap-1 px-2 py-1 bg-[#fafaf9] border border-[#e8e4db] rounded-full text-xs text-[#6f6d66]">
                        <BookOpen size={9} /> {s}
                      </span>
                    ))}
                    {tutor.subjects.length > 3 && (
                      <span className="px-2 py-1 bg-[#fafaf9] border border-[#e8e4db] rounded-full text-xs text-[#9c9a93]">
                        +{tutor.subjects.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#9c9a93] mb-4 pt-3 border-t border-[#f4f2ef]">
                    <span className="flex items-center gap-1"><Wifi size={10} />{formatLabel(tutor.teaching_format)}</span>
                  </div>

                  <button
                    onClick={() => handleContactClick(tutor)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#111110] text-white hover:bg-[#e5a82e] hover:text-[#111110]"
                  >
                    <Phone size={12} /> {T(t, 'card.contact')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {contactTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setContactTutor(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            <div className="flex items-start justify-between p-6 border-b border-[#e8e4db]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#f0ece4] rounded-full flex items-center justify-center text-[#6f6d66] font-semibold">
                  {contactTutor.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-[#111110]">{contactTutor.full_name}</h2>
                  <p className="text-xs text-[#9c9a93] mt-0.5">₪{contactTutor.hourly_rate}/hr · {contactTutor.location}</p>
                </div>
              </div>
              <button onClick={() => setContactTutor(null)} className="p-1.5 hover:bg-[#f4f4f3] rounded-lg">
                <X size={16} className="text-[#9c9a93]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact details */}
              <div>
                <p className="text-[10px] font-semibold text-[#9c9a93] uppercase tracking-wider mb-3">
                  {isHe ? 'פרטי יצירת קשר' : 'Contact Details'}
                </p>
                <div className="space-y-2">
                  {contactTutor.phone && (
                    <a href={`tel:${contactTutor.phone}`}
                      className="flex items-center gap-3 p-3.5 bg-[#fafaf9] border border-[#e8e4db] rounded-xl hover:border-[#e5a82e] hover:bg-[#faefd9] group"
                    >
                      <div className="w-8 h-8 bg-[#111110] rounded-lg flex items-center justify-center group-hover:bg-[#e5a82e] flex-shrink-0">
                        <Phone size={14} className="text-white group-hover:text-[#111110]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#9c9a93]">{isHe ? 'טלפון' : 'Phone'}</p>
                        <p className="text-sm font-medium text-[#111110]">{contactTutor.phone}</p>
                      </div>
                    </a>
                  )}
                  {contactTutor.email && (
                    <a href={`mailto:${contactTutor.email}`}
                      className="flex items-center gap-3 p-3.5 bg-[#fafaf9] border border-[#e8e4db] rounded-xl hover:border-[#e5a82e] hover:bg-[#faefd9] group"
                    >
                      <div className="w-8 h-8 bg-[#111110] rounded-lg flex items-center justify-center group-hover:bg-[#e5a82e] flex-shrink-0">
                        <Mail size={14} className="text-white group-hover:text-[#111110]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#9c9a93]">{isHe ? 'אימייל' : 'Email'}</p>
                        <p className="text-sm font-medium text-[#111110]">{contactTutor.email}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Send message */}
              <div className="border-t border-[#f4f2ef] pt-4">
                <p className="text-[10px] font-semibold text-[#9c9a93] uppercase tracking-wider mb-2">
                  {isHe ? 'שלח הודעה' : 'Send a Message'}
                </p>
                {contactSent ? (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">
                      {isHe ? 'ההודעה נשלחה!' : 'Message sent!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      rows={3}
                      placeholder={isHe ? 'כתוב הודעה למורה...' : 'Write a message to the tutor...'}
                      className="w-full px-4 py-3 bg-white border border-[#e0dbd0] rounded-xl text-sm text-[#111110] placeholder-[#b0ad9e] focus:outline-none focus:border-[#e5a82e] focus:ring-2 focus:ring-[#e5a82e]/15 resize-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={contactSending || !contactMessage.trim()}
                      className="w-full py-2.5 bg-[#111110] text-white text-xs font-semibold rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {contactSending
                        ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isHe ? 'שולח...' : 'Sending...'}</>
                        : <><Send size={12} />{isHe ? 'שלח הודעה' : 'Send Message'}</>}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setContactTutor(null)}
                className="w-full py-2.5 bg-[#f0ece4] text-[#6f6d66] text-sm font-medium rounded-xl hover:bg-[#e8e4db]"
              >
                {isHe ? 'סגור' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
