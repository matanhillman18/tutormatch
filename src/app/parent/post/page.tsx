'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Navbar from '../../_components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { useLang } from '@/lib/lang-context'
import { SUBJECTS_EN, enToHe, heToEn } from '@/lib/subjects'
import type { TranslationKey } from '@/lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }
type Format = 'online' | 'in_person' | 'both'




export default function PostRequestPage() {
  const router = useRouter()
  const { t, lang } = useLang()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    subject: '', grade: '', budget: '', description: '', location: '', lesson_type: 'both' as Format,
  })
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const subjects = SUBJECTS_EN

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.subject || !form.grade || !form.budget || !form.description || !form.location) {
      setError(T(t, 'err.required')); return
    }
    if (isNaN(Number(form.budget)) || Number(form.budget) <= 0) {
      setError(T(t, 'err.required')); return
    }

    const session = getSession()
    if (!session) { router.push('/login?role=parent'); return }

    setLoading(true)
    try {
      const { error: dbErr } = await supabase.from('tutoring_requests').insert({
        parent_id: session.id,
        subject: form.subject,
        grade: form.grade,
        budget: Number(form.budget),
        description: form.description.trim(),
        location: form.location.trim(),
        lesson_type: form.lesson_type,
      })
      if (dbErr) throw new Error(dbErr.message)
      setDone(true)
    } catch { setError(T(t, 'err.server')) }
    finally { setLoading(false) }
  }

  const inputCls = "w-full px-4 py-3 bg-white border border-[#e0dbd0] rounded-xl text-[#111110] placeholder-[#b0ad9e] focus:outline-none focus:border-[#e5a82e] focus:ring-2 focus:ring-[#e5a82e]/20 transition-all text-sm"

  if (done) return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6 pt-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircle size={32} className="text-green-500" /></div>
          <h1 className="font-['Instrument_Serif'] text-3xl text-[#111110] mb-2">{T(t, 'post.success')}</h1>
          <p className="text-sm text-[#6f6d66] mb-6">{T(t, 'post.success.sub')}</p>
          <div className="px-4 py-3 bg-[#faefd9] border border-[#f3d99b] rounded-xl text-xs text-[#a06e12] mb-6">{T(t, 'post.notify')}</div>
          <button onClick={() => router.push('/parent/dashboard')} className="px-7 py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] transition-all text-sm">
            {lang === 'he' ? 'הדשבורד שלי ←' : 'My Dashboard →'}
          </button>
        </div>
      </main>
    </>
  )

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-8">
            <h1 className="font-['Instrument_Serif'] text-4xl text-[#111110] mb-2">{T(t, 'post.title')}</h1>
            <p className="text-sm text-[#6f6d66]">{T(t, 'post.sub')}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'post.subject')}</label>
                <select value={form.subject} onChange={e => set('subject', e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                  <option value="">{lang === 'he' ? 'בחר מקצוע' : 'Select subject'}</option>
                  {SUBJECTS_EN.map(s => <option key={s} value={s}>{enToHe[s] ?? s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'post.grade')}</label>
                <input type="text" value={form.grade} onChange={e => set('grade', e.target.value)} placeholder={T(t, 'post.grade.ph')} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'post.budget')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9e] text-sm">₪</span>
                  <input type="number" min="1" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder={T(t, 'post.budget.ph')} className={`${inputCls} pl-8`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'post.location')}</label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder={T(t, 'post.location.ph')} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d3d3a] mb-2">{T(t, 'post.type')}</label>
              <div className="flex gap-2">
                {(['online', 'in_person', 'both'] as Format[]).map(f => (
                  <button key={f} type="button" onClick={() => set('lesson_type', f)}
                    className={`flex-1 py-2.5 text-xs font-medium rounded-xl border transition-all ${form.lesson_type === f ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}>
                    {f === 'online' ? T(t, 'login.format.online') : f === 'in_person' ? T(t, 'login.format.inperson') : T(t, 'login.format.both')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'post.desc')}</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder={T(t, 'post.desc.ph')} rows={4} className={`${inputCls} resize-none`} />
            </div>

            <div className="px-4 py-3 bg-[#faefd9] border border-[#f3d99b] rounded-xl text-xs text-[#a06e12]">{T(t, 'post.notify')}</div>

            {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{T(t, 'post.submitting')}</> : T(t, 'post.submit')}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
