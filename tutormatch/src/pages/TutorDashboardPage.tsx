import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'wouter'
import { FileText, Clock, CheckCircle, XCircle, Loader2, ArrowRight, Settings } from 'lucide-react'
import Navbar from '../components/Navbar'
import EditProfileModal from '../components/EditProfileModal'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/session'
import { useLang } from '../lib/lang-context'
import type { Application, TutoringRequest } from '../types'
import type { Session } from '../lib/session'
import type { TranslationKey } from '../lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

interface AppWithRequest extends Application {
  request: TutoringRequest
}

export default function TutorDashboard() {
  const [, navigate] = useLocation()
  const { t, lang } = useLang()
  const isHe = lang === 'he'
  const [session, setSessionState] = useState<Session | null>(null)
  const [apps, setApps] = useState<AppWithRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [showEditProfile, setShowEditProfile] = useState(false)

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || s.role !== 'tutor') { navigate('/login?role=tutor'); return }
    setSessionState(s)
    setName(s.name)
    setLoading(true)
    const { data } = await supabase
      .from('applications')
      .select('*, request:tutoring_requests(*)')
      .eq('tutor_id', s.id)
      .order('created_at', { ascending: false })
    if (data) setApps(data as AppWithRequest[])
    setLoading(false)
  }, [navigate])

  useEffect(() => { load() }, [load])

  const statusIcon = (s: string) =>
    s === 'accepted' ? <CheckCircle size={14} className="text-green-500" /> :
    s === 'rejected' ? <XCircle size={14} className="text-red-400" /> :
    <Clock size={14} className="text-[#9c9a93]" />

  const statusLabel = (s: string) =>
    s === 'accepted' ? T(t, 'dash.status.accepted') :
    s === 'rejected' ? T(t, 'dash.status.rejected') :
    T(t, 'dash.status.pending')

  const statusColor = (s: string) =>
    s === 'accepted' ? 'bg-green-50 text-green-700 border-green-100' :
    s === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
    'bg-[#fafaf9] text-[#6f6d66] border-[#e8e4db]'

  const pending = apps.filter(a => a.status === 'pending').length
  const accepted = apps.filter(a => a.status === 'accepted').length

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="mb-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#9c9a93] mb-1">{isHe ? 'שלום,' : 'Hello,'} {name}</p>
                <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1">
                  {T(t, 'dash.tutor.title')}
                </h1>
                <p className="text-sm text-[#9c9a93]">{T(t, 'dash.tutor.sub')}</p>
              </div>
              <button
                onClick={() => setShowEditProfile(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e8e4db] text-[#6f6d66] text-sm font-medium rounded-xl hover:border-[#111110] hover:text-[#111110] flex-shrink-0"
              >
                <Settings size={14} />
                {T(t, 'edit.profile')}
              </button>
            </div>

            {apps.length > 0 && (
              <div className="flex items-center gap-4 mt-5">
                <div className="px-4 py-2.5 bg-white border border-[#e8e4db] rounded-xl text-sm">
                  <span className="font-semibold text-[#111110]">{apps.length}</span>
                  <span className="text-[#9c9a93] ml-1.5">{isHe ? 'סה״כ' : 'total'}</span>
                </div>
                {pending > 0 && (
                  <div className="px-4 py-2.5 bg-[#fafaf9] border border-[#e8e4db] rounded-xl text-sm">
                    <span className="font-semibold text-[#111110]">{pending}</span>
                    <span className="text-[#9c9a93] ml-1.5">{T(t, 'dash.status.pending').toLowerCase()}</span>
                  </div>
                )}
                {accepted > 0 && (
                  <div className="px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl text-sm">
                    <span className="font-semibold text-green-700">{accepted}</span>
                    <span className="text-green-600 ml-1.5">{T(t, 'dash.status.accepted').toLowerCase()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={20} className="animate-spin text-[#9c9a93]" />
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-32">
              <div className="w-14 h-14 bg-[#f0ece4] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FileText size={24} className="text-[#b0ad9e]" />
              </div>
              <p className="text-[#6f6d66] text-sm mb-1 font-medium">{isHe ? 'עדיין לא הגשת מועמדויות' : "No applications yet"}</p>
              <p className="text-[#9c9a93] text-xs mb-6">{T(t, 'dash.tutor.empty')}</p>
              <button
                onClick={() => navigate('/tutor/browse')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111110] text-white text-sm font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110]"
              >
                {T(t, 'dash.tutor.browse')} <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map(app => (
                <div key={app.id} className="bg-white border border-[#e8e4db] rounded-2xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#111110]">
                          {app.request?.subject}
                          <span className="font-normal text-[#9c9a93]"> — {isHe ? 'כיתה' : 'Grade'} {app.request?.grade}</span>
                        </h3>
                        <p className="text-xs text-[#9c9a93] mt-0.5">
                          {app.request?.location && `${app.request.location} · `}₪{app.request?.budget}/hr
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusColor(app.status)}`}>
                        {statusIcon(app.status)}{statusLabel(app.status)}
                      </span>
                    </div>
                    <div className="bg-[#fafaf9] border border-[#f0ece4] rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-[#9c9a93] uppercase tracking-wider mb-1.5">
                        {isHe ? 'ההודעה שלי' : 'My Message'}
                      </p>
                      <p className="text-sm text-[#3d3d3a] leading-relaxed">{app.message}</p>
                      <p className="text-xs text-[#b0ad9e] mt-2">
                        {isHe ? 'זמינות: ' : 'Availability: '}{app.availability}
                      </p>
                    </div>
                    <p className="text-xs text-[#b0ad9e] mt-3">
                      {new Date(app.created_at).toLocaleDateString(isHe ? 'he-IL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
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
