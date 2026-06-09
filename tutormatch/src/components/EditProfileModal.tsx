import { useState, useEffect } from 'react'
import { X, Save, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setSession } from '../lib/session'
import { useLang } from '../lib/lang-context'
import { SUBJECTS_EN, SUBJECTS_HE } from '../lib/subjects'
import type { Session } from '../lib/session'
import type { TranslationKey } from '../lib/translations'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

interface Props {
  session: Session
  onClose: () => void
  onSaved: (newName: string) => void
}

export default function EditProfileModal({ session, onClose, onSaved }: Props) {
  const { t, lang } = useLang()
  const isHe = lang === 'he'
  const isTutor = session.role === 'tutor'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [rate, setRate] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [format, setFormat] = useState<'online' | 'in_person' | 'both'>('both')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const table = isTutor ? 'tutors' : 'parents'
      const { data } = await supabase.from(table).select('*').eq('id', session.id).maybeSingle()
      if (data) {
        setName(data.full_name ?? '')
        setPhone(data.phone ?? '')
        setLocation(data.location ?? '')
        if (isTutor) {
          setBio(data.bio ?? '')
          setRate(String(data.hourly_rate ?? ''))
          setSubjects(data.subjects ?? [])
          setFormat(data.teaching_format ?? 'both')
        }
      }
      setLoading(false)
    }
    fetchProfile()
  }, [session.id, isTutor])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const toggleSubject = (s: string) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const handleSave = async () => {
    if (!name.trim()) { setError(T(t, 'err.required')); return }
    if (isTutor && (subjects.length === 0 || !rate || isNaN(Number(rate)))) {
      setError(T(t, 'err.required')); return
    }
    setSaving(true); setError('')
    try {
      const table = isTutor ? 'tutors' : 'parents'
      const updates = isTutor
        ? { full_name: name.trim(), phone: phone.trim(), location: location.trim(), bio: bio.trim(), hourly_rate: Number(rate), subjects, teaching_format: format }
        : { full_name: name.trim(), phone: phone.trim(), location: location.trim() }
      const { error: dbErr } = await supabase.from(table).update(updates).eq('id', session.id)
      if (dbErr) throw new Error(dbErr.message)
      setSession({ ...session, name: name.trim() })
      setSuccess(true)
      setTimeout(() => { onSaved(name.trim()); onClose() }, 1800)
    } catch { setError(T(t, 'err.server')) }
    finally { setSaving(false) }
  }

  const inputCls = "w-full px-4 py-3 bg-white border border-[#e0dbd0] rounded-xl text-[#111110] placeholder-[#b0ad9e] focus:outline-none focus:border-[#e5a82e] focus:ring-2 focus:ring-[#e5a82e]/15 text-sm"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e4db] flex-shrink-0">
          <h2 className="font-semibold text-[#111110] text-[15px]">{T(t, 'edit.profile.title')}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f4f4f3] rounded-lg">
            <X size={16} className="text-[#9c9a93]" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mb-5">
              <CheckCircle size={26} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-[#111110] text-lg mb-1">{T(t, 'edit.saved')}</h3>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-5 h-5 border-2 border-[#e8e4db] border-t-[#e5a82e] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.name')}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.phone')}</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder={T(t, 'login.phone.ph')} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.location')}</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={T(t, 'login.location.ph')} className={inputCls} />
            </div>

            {isTutor && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.bio')}</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={T(t, 'login.bio.ph')} className={`${inputCls} resize-none`} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.rate')}</label>
                  <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="80" className={inputCls} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3d3d3a] mb-2">{T(t, 'login.subjects')}</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS_EN.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSubject(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${subjects.includes(s) ? 'bg-[#111110] text-white border-[#111110]' : 'bg-[#fafaf9] text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}
                      >
                        {isHe ? SUBJECTS_HE[i] : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3d3d3a] mb-2">{T(t, 'login.format')}</label>
                  <div className="flex gap-2">
                    {[['online', T(t, 'login.format.online')], ['in_person', T(t, 'login.format.inperson')], ['both', T(t, 'login.format.both')]].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setFormat(val as typeof format)}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl border ${format === val ? 'bg-[#111110] text-white border-[#111110]' : 'bg-[#fafaf9] text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">{error}</div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{T(t, 'edit.saving')}</>
                : <><Save size={14} />{T(t, 'edit.save')}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
