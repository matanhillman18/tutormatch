import { useState, useEffect } from 'react'
import { X, Send, CheckCircle, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/lang-context'
import { enToHe } from '../lib/subjects'
import type { TutoringRequest } from '../types'
import type { Session } from '../lib/session'
import type { TranslationKey } from '../lib/translations'

interface Props {
  request: TutoringRequest | null
  session: Session | null
  onClose: () => void
  onSuccess: (requestId: string) => void
}

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

export default function ApplyModal({ request, session, onClose, onSuccess }: Props) {
  const { t } = useLang()
  const [message, setMessage] = useState('')
  const [availability, setAvailability] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (request) { setMessage(''); setAvailability(''); setSuccess(false); setError('') }
  }, [request])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!request) return null

  const handleSubmit = async () => {
    if (!session) return
    if (!message.trim() || !availability.trim()) { setError(T(t, 'err.required')); return }
    setLoading(true); setError('')
    try {
      const { error: dbErr } = await supabase.from('applications').insert({
        tutor_id: session.id,
        request_id: request.id,
        message: message.trim(),
        availability: availability.trim(),
        phone: '',
        status: 'pending',
      })
      if (dbErr) throw new Error(dbErr.message)
      setSuccess(true)
      setTimeout(() => { onSuccess(request.id); onClose() }, 2200)
    } catch { setError(T(t, 'err.server')) }
    finally { setLoading(false) }
  }

  const lessonLabel = request.lesson_type === 'online' ? T(t, 'card.online') : request.lesson_type === 'in_person' ? T(t, 'card.inperson') : T(t, 'card.both')
  const inputCls = "w-full px-4 py-3 bg-white border border-[#e0dbd0] rounded-xl text-[#111110] placeholder-[#b0ad9e] focus:outline-none focus:border-[#e5a82e] focus:ring-2 focus:ring-[#e5a82e]/15 text-sm"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#e8e4db]">
          <div>
            <h2 className="font-semibold text-[#111110] text-[15px]">{T(t, 'modal.apply.title')}</h2>
            <p className="text-xs text-[#9c9a93] mt-0.5">
              {enToHe[request.subject] ?? request.subject} · {T(t, 'card.grade')} {request.grade}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f4f4f3] rounded-lg">
            <X size={16} className="text-[#9c9a93]" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mb-5">
              <CheckCircle size={26} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-[#111110] text-lg mb-1">{T(t, 'modal.apply.success')}</h3>
            <p className="text-sm text-[#6f6d66]">{T(t, 'modal.apply.success.sub')}</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Request summary */}
            <div className="bg-[#fafaf9] border border-[#e8e4db] rounded-xl p-4">
              <p className="text-[10px] font-semibold text-[#9c9a93] uppercase tracking-wider mb-2">
                {T(t, 'modal.apply.summary')}
              </p>
              <p className="text-sm text-[#3d3d3a] leading-relaxed line-clamp-2">{request.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[#6f6d66] flex-wrap">
                <span className="font-semibold text-[#a06e12]">{T(t, 'modal.apply.budget')}: ₪{request.budget}/hr</span>
                <span className="text-[#d0cdc4]">·</span>
                <span>{lessonLabel}</span>
                {request.location && <><span className="text-[#d0cdc4]">·</span><span>{request.location}</span></>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'modal.apply.msg')}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={T(t, 'modal.apply.msg.ph')}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'modal.apply.avail')}</label>
              <input
                type="text"
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                placeholder={T(t, 'modal.apply.avail.ph')}
                className={inputCls}
              />
            </div>

            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[#faefd9] border border-[#f0d48a] rounded-xl text-xs text-[#a06e12]">
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              {T(t, 'modal.apply.notify')}
            </div>

            {error && (
              <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{T(t, 'modal.apply.sending')}</>
                : <><Send size={14} />{T(t, 'modal.apply.submit')}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
