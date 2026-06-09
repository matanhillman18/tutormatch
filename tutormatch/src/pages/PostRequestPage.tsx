import { useState } from 'react'
import { useLocation } from 'wouter'
import { CheckCircle, ArrowRight, Info } from 'lucide-react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/session'
import { useLang } from '../lib/lang-context'
import { SUBJECTS_EN, heToEn } from '../lib/subjects'
import type { TranslationKey } from '../lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }
type Format = 'online' | 'in_person' | 'both'

export default function PostRequestPage() {
  const [, navigate] = useLocation()
  const { t, lang } = useLang()
  const isHe = lang === 'he'
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    subject: '', grade: '', budget: '', description: '', location: '', lesson_type: 'both' as Format,
  })
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const inputCls = "w-full px-4 py-3 bg-white border border-[#e0dbd0] rounded-xl text-[#111110] placeholder-[#b0ad9e] focus:outline-none focus:border-[#e5a82e] focus:ring-2 focus:ring-[#e5a82e]/15 text-sm"

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
    if (!session) { navigate('/login?role=parent'); return }
    setLoading(true)
    try {
      const subjectEn = heToEn[form.subject] ?? form.subject
      const { error: dbErr } = await supabase.from('tutoring_requests').insert({
        parent_id: session.id,
        subject: subjectEn,
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

  if (done) return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6 pt-20">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h1 className="font-['Instrument_Serif'] text-3xl text-[#111110] mb-2">{T(t, 'post.success')}</h1>
          <p className="text-sm text-[#6f6d66] mb-6 leading-relaxed">{T(t, 'post.success.sub')}</p>
          <div className="flex items-start gap-2.5 px-4 py-3 bg-[#faefd9] border border-[#f0d48a] rounded-xl text-xs text-[#a06e12] mb-7 text-left">
            <Info size={13} className="flex-shrink-0 mt-0.5" />
            {T(t, 'post.notify')}
          </div>
          <button
            onClick={() => navigate('/parent/dashboard')}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] text-sm"
          >
            {isHe ? 'הדשבורד שלי' : 'My Dashboard'} <ArrowRight size={15} />
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
            <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-2">{T(t, 'post.title')}</h1>
            <p className="text-sm text-[#6f6d66]">{T(t, 'post.sub')}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'post.subject')}</label>
                <select value={form.subject} onChange={e => set('subject', e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                  <option value="">{isHe ? 'בחר מקצוע' : 'Select subject'}</option>
                  {SUBJECTS_EN.map(s => <option key={s} value={s}>{s}</option>)}
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
                    className={`flex-1 py-2.5 text-xs font-medium rounded-xl border ${form.lesson_type === f ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}>
                    {f === 'online' ? T(t, 'login.format.online') : f === 'in_person' ? T(t, 'login.format.inperson') : T(t, 'login.format.both')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'post.desc')}</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder={T(t, 'post.desc.ph')} rows={4} className={`${inputCls} resize-none`} />
            </div>

            <div className="flex items-start gap-2.5 px-4 py-3 bg-[#faefd9] border border-[#f0d48a] rounded-xl text-xs text-[#a06e12]">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              {T(t, 'post.notify')}
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{T(t, 'post.submitting')}</>
                : <>{T(t, 'post.submit')} <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
