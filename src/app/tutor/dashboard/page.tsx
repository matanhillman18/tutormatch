'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Navbar from '../../_components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { useLang } from '@/lib/lang-context'
import type { Application, TutoringRequest } from '@/types'
import type { TranslationKey } from '@/lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

interface AppWithRequest extends Application {
  request: TutoringRequest
}

export default function TutorDashboard() {
  const router = useRouter()
  const { t, lang } = useLang()
  const [apps, setApps] = useState<AppWithRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const session = getSession()
    if (!session || session.role !== 'tutor') { router.push('/login?role=tutor'); return }
    setLoading(true)
    const { data } = await supabase
      .from('applications')
      .select('*, request:tutoring_requests(*)')
      .eq('tutor_id', session.id)
      .order('created_at', { ascending: false })
    if (data) setApps(data as AppWithRequest[])
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const statusIcon = (s: string) => s === 'accepted' ? <CheckCircle size={14} className="text-green-500" /> : s === 'rejected' ? <XCircle size={14} className="text-red-400" /> : <Clock size={14} className="text-[#9c9a93]" />
  const statusLabel = (s: string) => s === 'accepted' ? T(t, 'dash.status.accepted') : s === 'rejected' ? T(t, 'dash.status.rejected') : T(t, 'dash.status.pending')
  const statusColor = (s: string) => s === 'accepted' ? 'bg-green-50 text-green-700 border-green-100' : s === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[#fafaf9] text-[#6f6d66] border-[#e8e4db]'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1">🎓 {lang === 'he' ? 'דשבורד מורה' : 'Tutor Dashboard'} — {T(t, 'dash.tutor.title')}</h1>
            <p className="text-sm text-[#9c9a93]">{T(t, 'dash.tutor.sub')}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 gap-2 text-[#9c9a93] text-sm"><Loader2 size={18} className="animate-spin" /></div>
          ) : apps.length === 0 ? (
            <div className="text-center py-24">
              <BookOpen size={32} className="text-[#e8e4db] mx-auto mb-4" />
              <p className="text-[#9c9a93] text-sm mb-4">{T(t, 'dash.tutor.empty')}</p>
              <button onClick={() => router.push('/tutor/browse')} className="px-5 py-2.5 bg-[#111110] text-white text-sm font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] transition-all">{T(t, 'dash.tutor.browse')}</button>
            </div>
          ) : (
            <div className="space-y-4">
              {apps.map(app => (
                <div key={app.id} className="bg-white border border-[#e8e4db] rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[#111110]">{app.request?.subject} — {lang === 'he' ? 'כיתה' : 'Grade'} {app.request?.grade}</h3>
                      <p className="text-xs text-[#9c9a93] mt-0.5">{app.request?.location} · {'₪'}{app.request?.budget}/hr</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusColor(app.status)}`}>
                      {statusIcon(app.status)}{statusLabel(app.status)}
                    </span>
                  </div>
                  <div className="bg-[#fafaf9] rounded-xl p-4 mt-3">
                    <p className="text-xs font-medium text-[#9c9a93] uppercase tracking-wider mb-1">{lang === 'he' ? 'ההודעה שלי' : 'My Message'}</p>
                    <p className="text-sm text-[#3d3d3a] leading-relaxed">{app.message}</p>
                    <p className="text-xs text-[#9c9a93] mt-2">{lang === 'he' ? 'זמינות:' : 'Availability:'} {app.availability}</p>
                  </div>
                  <p className="text-xs text-[#b0ad9e] mt-3">{new Date(app.created_at).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
