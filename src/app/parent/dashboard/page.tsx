'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import Navbar from '../../_components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { useLang } from '@/lib/lang-context'
import type { TutoringRequest, Application, Tutor } from '@/types'
import type { TranslationKey } from '@/lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

interface RequestWithApps extends TutoringRequest {
  applications: (Application & { tutor: Tutor })[]
}

export default function ParentDashboard() {
  const router = useRouter()
  const { t, lang } = useLang()
  const [requests, setRequests] = useState<RequestWithApps[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    const session = getSession()
    if (!session || session.role !== 'parent') { router.push('/login?role=parent'); return }
    setLoading(true)

    const { data: reqs } = await supabase
      .from('tutoring_requests')
      .select('*')
      .eq('parent_id', session.id)
      .order('created_at', { ascending: false })

    if (!reqs) { setLoading(false); return }

    const reqsWithApps: RequestWithApps[] = await Promise.all(
      reqs.map(async (req) => {
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
  }, [router])

  useEffect(() => { load() }, [load])

  const formatLabel = (f: string) => f === 'online' ? T(t, 'card.online') : f === 'in_person' ? T(t, 'card.inperson') : T(t, 'card.both')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1">👨‍👩‍👧 {lang === 'he' ? 'דשבורד הורה' : 'Parent Dashboard'} — {T(t, 'dash.parent.title')}</h1>
              <p className="text-sm text-[#9c9a93]">{T(t, 'dash.parent.sub')}</p>
            </div>
            <button onClick={() => router.push('/parent/post')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#e5a82e] text-[#111110] text-sm font-medium rounded-xl hover:bg-[#f3d99b] transition-colors">
              <Plus size={15} />{T(t, 'dash.parent.post')}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 size={18} className="animate-spin text-[#9c9a93]" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-24">
              <Users size={32} className="text-[#e8e4db] mx-auto mb-4" />
              <p className="text-[#9c9a93] text-sm mb-4">{T(t, 'dash.parent.empty')}</p>
              <button onClick={() => router.push('/parent/post')} className="px-5 py-2.5 bg-[#111110] text-white text-sm font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] transition-all">{T(t, 'dash.parent.post')}</button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-white border border-[#e8e4db] rounded-2xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-[#111110]">{req.subject} — {lang === 'he' ? 'כיתה' : 'Grade'} {req.grade}</h3>
                        <p className="text-xs text-[#9c9a93] mt-0.5">{req.location} · {'₪'}{req.budget}/hr · {formatLabel(req.lesson_type)}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#faefd9] border border-[#f3d99b] rounded-full text-xs font-medium text-[#a06e12]">
                        <Users size={11} />
                        {req.applications.length} {req.applications.length === 1 ? T(t, 'dash.parent.applicants') : T(t, 'dash.parent.applicants.plural')}
                      </span>
                    </div>
                    <p className="text-sm text-[#6f6d66] leading-relaxed line-clamp-2">{req.description}</p>

                    {req.applications.length > 0 && (
                      <button onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                        className="mt-3 flex items-center gap-1.5 text-xs text-[#6f6d66] hover:text-[#111110] transition-colors">
                        {expanded === req.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {expanded === req.id ? (lang === 'he' ? 'הסתר מועמדים' : 'Hide applicants') : (lang === 'he' ? 'הצג מועמדים' : 'Show applicants')}
                      </button>
                    )}
                  </div>

                  {expanded === req.id && req.applications.length > 0 && (
                    <div className="border-t border-[#e8e4db] bg-[#fafaf9] divide-y divide-[#e8e4db]">
                      {req.applications.map(app => (
                        <div key={app.id} className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#f0ece4] rounded-full flex items-center justify-center text-xs font-semibold text-[#6f6d66]">
                                {app.tutor?.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#111110]">{app.tutor?.full_name}</p>
                                <p className="text-xs text-[#9c9a93]">{'₪'}{app.tutor?.hourly_rate}/hr · {app.tutor?.location}</p>
                              </div>
                            </div>
                            <a href={`tel:${app.tutor?.phone}`} className="px-3 py-1.5 bg-[#111110] text-white text-xs font-medium rounded-lg hover:bg-[#e5a82e] hover:text-[#111110] transition-all">
                              {lang === 'he' ? 'צור קשר' : 'Contact'}
                            </a>
                          </div>
                          <p className="text-sm text-[#3d3d3a] leading-relaxed">{app.message}</p>
                          <p className="text-xs text-[#9c9a93] mt-1">{lang === 'he' ? 'זמינות:' : 'Availability:'} {app.availability}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
