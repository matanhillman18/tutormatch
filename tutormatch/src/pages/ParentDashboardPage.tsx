import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'wouter'
import { Plus, Inbox, Loader2, ChevronDown, ChevronUp, ArrowRight, Phone, MessageSquare, Settings } from 'lucide-react'
import Navbar from '../components/Navbar'
import EditProfileModal from '../components/EditProfileModal'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/session'
import { useLang } from '../lib/lang-context'
import type { TutoringRequest, Application, Tutor } from '../types'
import type { Session } from '../lib/session'
import type { TranslationKey } from '../lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

interface RequestWithApps extends TutoringRequest {
  applications: (Application & { tutor: Tutor })[]
}

interface ContactMessage {
  id: string
  parent_id: string
  tutor_id: string
  tutor_name: string
  message: string
  created_at: string
}

export default function ParentDashboard() {
  const [, navigate] = useLocation()
  const { t, lang } = useLang()
  const isHe = lang === 'he'
  const [session, setSessionState] = useState<Session | null>(null)
  const [requests, setRequests] = useState<RequestWithApps[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [showEditProfile, setShowEditProfile] = useState(false)

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || s.role !== 'parent') { navigate('/login?role=parent'); return }
    setSessionState(s)
    setName(s.name)
    setLoading(true)

    const [reqsRes, msgsRes] = await Promise.all([
      supabase.from('tutoring_requests').select('*').eq('parent_id', s.id).order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').eq('parent_id', s.id).order('created_at', { ascending: false }),
    ])

    if (msgsRes.data) setMessages(msgsRes.data as ContactMessage[])

    if (!reqsRes.data) { setLoading(false); return }

    const reqsWithApps: RequestWithApps[] = await Promise.all(
      reqsRes.data.map(async (req) => {
        const { data: apps } = await supabase
          .from('applications')
          .select('*, tutor:tutors(*)')
          .eq('request_id', req.id)
          .order('created_at', { ascending: false })
        return { ...req, applications: (apps ?? []) as (Application & { tutor: Tutor })[] }
      })
    )
    setRequests(reqsWithApps)
    setLoading(false)
  }, [navigate])

  useEffect(() => { load() }, [load])

  const formatLabel = (f: string) => f === 'online' ? T(t, 'card.online') : f === 'in_person' ? T(t, 'card.inperson') : T(t, 'card.both')
  const totalApplicants = requests.reduce((acc, r) => acc + r.applications.length, 0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-start justify-between mb-10">
            <div>
              <p className="text-sm text-[#9c9a93] mb-1">{isHe ? 'שלום,' : 'Hello,'} {name}</p>
              <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1">
                {T(t, 'dash.parent.title')}
              </h1>
              <p className="text-sm text-[#9c9a93]">{T(t, 'dash.parent.sub')}</p>

              {requests.length > 0 && (
                <div className="flex items-center gap-4 mt-5">
                  <div className="px-4 py-2.5 bg-white border border-[#e8e4db] rounded-xl text-sm">
                    <span className="font-semibold text-[#111110]">{requests.length}</span>
                    <span className="text-[#9c9a93] ml-1.5">{isHe ? 'בקשות' : 'requests'}</span>
                  </div>
                  {totalApplicants > 0 && (
                    <div className="px-4 py-2.5 bg-[#faefd9] border border-[#f0d48a] rounded-xl text-sm">
                      <span className="font-semibold text-[#a06e12]">{totalApplicants}</span>
                      <span className="text-[#a06e12] ml-1.5">{isHe ? 'מועמדים' : 'applicants'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowEditProfile(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e8e4db] text-[#6f6d66] text-sm font-medium rounded-xl hover:border-[#111110] hover:text-[#111110]"
              >
                <Settings size={14} />
                {T(t, 'edit.profile')}
              </button>
              <button
                onClick={() => navigate('/parent/post')}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#e5a82e] text-[#111110] text-sm font-medium rounded-xl hover:bg-[#f3c856]"
              >
                <Plus size={15} />{T(t, 'dash.parent.post')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={20} className="animate-spin text-[#9c9a93]" />
            </div>
          ) : (
            <div className="space-y-10">
              {/* Requests section */}
              <div>
                {requests.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="w-14 h-14 bg-[#f0ece4] rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Inbox size={24} className="text-[#b0ad9e]" />
                    </div>
                    <p className="text-[#6f6d66] text-sm mb-1 font-medium">{isHe ? 'עדיין אין בקשות' : 'No requests yet'}</p>
                    <p className="text-[#9c9a93] text-xs mb-6">{T(t, 'dash.parent.empty')}</p>
                    <button
                      onClick={() => navigate('/parent/post')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111110] text-white text-sm font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110]"
                    >
                      {T(t, 'dash.parent.post')} <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="bg-white border border-[#e8e4db] rounded-2xl overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 mr-4">
                              <h3 className="font-semibold text-[#111110]">
                                {req.subject}
                                <span className="font-normal text-[#9c9a93]"> — {isHe ? 'כיתה' : 'Grade'} {req.grade}</span>
                              </h3>
                              <p className="text-xs text-[#9c9a93] mt-0.5">
                                {req.location && `${req.location} · `}₪{req.budget}/hr · {formatLabel(req.lesson_type)}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${req.applications.length > 0 ? 'bg-[#faefd9] border border-[#f0d48a] text-[#a06e12]' : 'bg-[#fafaf9] border border-[#e8e4db] text-[#9c9a93]'}`}>
                              {req.applications.length} {req.applications.length === 1 ? T(t, 'dash.parent.applicants') : T(t, 'dash.parent.applicants.plural')}
                            </span>
                          </div>
                          <p className="text-sm text-[#6f6d66] leading-relaxed line-clamp-2 mt-2">{req.description}</p>

                          {req.applications.length > 0 && (
                            <button
                              onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                              className="mt-3.5 flex items-center gap-1.5 text-xs font-medium text-[#6f6d66] hover:text-[#111110]"
                            >
                              {expanded === req.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              {expanded === req.id
                                ? (isHe ? 'הסתר מועמדים' : 'Hide applicants')
                                : (isHe ? `הצג ${req.applications.length} מועמדים` : `View ${req.applications.length} applicant${req.applications.length > 1 ? 's' : ''}`)}
                            </button>
                          )}
                        </div>

                        {expanded === req.id && req.applications.length > 0 && (
                          <div className="border-t border-[#e8e4db] divide-y divide-[#f4f2ef]">
                            {req.applications.map(app => (
                              <div key={app.id} className="p-5 bg-[#fafaf9]">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-[#f0ece4] rounded-full flex items-center justify-center text-xs font-semibold text-[#6f6d66] flex-shrink-0">
                                      {app.tutor?.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-[#111110]">{app.tutor?.full_name}</p>
                                      <p className="text-xs text-[#9c9a93]">₪{app.tutor?.hourly_rate}/hr · {app.tutor?.location}</p>
                                    </div>
                                  </div>
                                  {app.tutor?.phone && (
                                    <a
                                      href={`tel:${app.tutor.phone}`}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111110] text-white text-xs font-medium rounded-lg hover:bg-[#e5a82e] hover:text-[#111110]"
                                    >
                                      <Phone size={11} />
                                      {isHe ? 'התקשר' : 'Call'}
                                    </a>
                                  )}
                                </div>
                                <p className="text-sm text-[#3d3d3a] leading-relaxed">{app.message}</p>
                                <p className="text-xs text-[#9c9a93] mt-2">
                                  {isHe ? 'זמינות: ' : 'Availability: '}{app.availability}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages Sent section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-[#9c9a93]" />
                  <h2 className="font-semibold text-[#111110] text-lg">{T(t, 'dash.messages.title')}</h2>
                  {messages.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#f0ece4] text-[#6f6d66] text-xs font-semibold rounded-full">{messages.length}</span>
                  )}
                </div>

                {messages.length === 0 ? (
                  <div className="bg-white border border-[#e8e4db] rounded-2xl px-6 py-10 text-center">
                    <p className="text-[#9c9a93] text-sm">{T(t, 'dash.messages.empty')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className="bg-white border border-[#e8e4db] rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-[10px] font-semibold text-[#9c9a93] uppercase tracking-wider">
                              {T(t, 'dash.messages.to')}
                            </p>
                            <p className="text-sm font-semibold text-[#111110] mt-0.5">{msg.tutor_name}</p>
                          </div>
                          <p className="text-xs text-[#b0ad9e]">
                            {new Date(msg.created_at).toLocaleDateString(isHe ? 'he-IL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <p className="text-sm text-[#3d3d3a] leading-relaxed bg-[#fafaf9] border border-[#f0ece4] rounded-xl px-4 py-3 mt-2">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {session && showEditProfile && (
        <EditProfileModal
          session={session}
          onClose={() => setShowEditProfile(false)}
          onSaved={(newName) => setName(newName)}
        />
      )}
    </>
  )
}
