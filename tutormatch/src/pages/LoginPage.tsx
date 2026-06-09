import { useState, Suspense } from 'react'
import { useLocation, useSearch } from 'wouter'
import { GraduationCap, Users, Plus, X, Eye, EyeOff, ArrowRight, BookOpen } from 'lucide-react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { setSession } from '../lib/session'
import { useLang } from '../lib/lang-context'
import { SUBJECTS_EN, SUBJECTS_HE } from '../lib/subjects'
import type { UserRole } from '../types'
import type { TranslationKey } from '../lib/translations'

type Format = 'online' | 'in_person' | 'both'
type Step = 'credentials' | 'role' | 'details'

function T(t: (k: TranslationKey) => string, k: string) { return t(k as TranslationKey) }

function LoginForm() {
  const [, navigate] = useLocation()
  const search = useSearch()
  const params = new URLSearchParams(search)
  const { t, lang } = useLang()
  const isHe = lang === 'he'

  const [step, setStep] = useState<Step>('credentials')
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [role, setRole] = useState<UserRole>((params.get('role') as UserRole) || 'tutor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const subjects = isHe ? [...SUBJECTS_HE] : [...SUBJECTS_EN]

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', location: '',
    bio: '', hourly_rate: '', teaching_format: 'both' as Format, password: '',
  })

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggleSubject = (s: string) => setSelectedSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const inputCls = "w-full px-4 py-3 bg-white border border-[#e0dbd0] rounded-xl text-[#111110] placeholder-[#b0ad9e] focus:outline-none focus:border-[#e5a82e] focus:ring-2 focus:ring-[#e5a82e]/15 text-sm"

  const handleCredentials = async () => {
    setError('')
    if (!form.email.trim() || !form.password.trim()) {
      setError(isHe ? 'אנא מלא אימייל וסיסמה' : 'Please enter email and password'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(T(t, 'login.err.email')); return
    }
    setLoading(true)
    const email = form.email.trim().toLowerCase()

    for (const table of ['tutors', 'parents']) {
      const { data } = await supabase.from(table).select('id, full_name, email')
        .eq('email', email).eq('password', form.password.trim()).maybeSingle()
      if (data) {
        setSession({
          id: (data as { id: string; full_name: string; email: string }).id,
          role: table === 'tutors' ? 'tutor' : 'parent',
          name: (data as { id: string; full_name: string; email: string }).full_name,
          email: (data as { id: string; full_name: string; email: string }).email,
        })
        navigate(table === 'tutors' ? '/tutor/browse' : '/parent/browse')
        return
      }
    }
    setLoading(false)
    if (mode === 'login') {
      for (const table of ['tutors', 'parents']) {
        const { data } = await supabase.from(table).select('id').eq('email', email).maybeSingle()
        if (data) { setError(isHe ? 'סיסמה שגויה' : 'Wrong password'); return }
      }
      setError(isHe ? 'אימייל לא קיים במערכת' : 'Email not found')
    } else {
      setStep('role')
    }
  }

  const handleRoleSelect = (r: UserRole) => { setRole(r); setStep('details') }

  const subjectToEn: Record<string, string> = {
    'מתמטיקה': 'Mathematics', 'פיזיקה': 'Physics', 'כימיה': 'Chemistry',
    'ביולוגיה': 'Biology', 'אנגלית': 'English', 'היסטוריה': 'History',
    'ספרות': 'Literature', 'מדעי מחשב': 'Computer Science',
    'כלכלה': 'Economics', 'גיאוגרפיה': 'Geography', 'מוזיקה': 'Music', 'אמנות': 'Art',
  }

  const handleSignup = async () => {
    setError('')
    if (!form.full_name.trim() || !form.phone.trim() || !form.location.trim()) {
      setError(T(t, 'login.err.required')); return
    }
    if (role === 'tutor') {
      if (selectedSubjects.length === 0) { setError(T(t, 'login.err.subjects')); return }
      if (!form.hourly_rate || isNaN(Number(form.hourly_rate)) || Number(form.hourly_rate) <= 0) {
        setError(T(t, 'login.err.rate')); return
      }
    }
    setLoading(true)
    try {
      const email = form.email.trim().toLowerCase()
      const table = role === 'tutor' ? 'tutors' : 'parents'
      const insertData: Record<string, unknown> = {
        full_name: form.full_name.trim(), email,
        phone: form.phone.trim(), location: form.location.trim(),
        password: form.password.trim(),
      }
      if (role === 'tutor') {
        insertData.subjects = selectedSubjects.map(s => subjectToEn[s] ?? s)
        insertData.hourly_rate = Number(form.hourly_rate)
        insertData.bio = form.bio.trim() || '-'
        insertData.teaching_format = form.teaching_format
      }
      const { data, error: dbErr } = await supabase.from(table).insert(insertData).select('id, full_name').single()
      if (dbErr || !data) throw new Error(dbErr?.message)
      setSession({
        id: (data as { id: string; full_name: string }).id,
        role,
        name: (data as { id: string; full_name: string }).full_name,
        email,
      })
      navigate(role === 'tutor' ? '/tutor/browse' : '/parent/browse')
    } catch {
      setError(isHe ? 'אימייל כבר קיים במערכת' : 'Email already exists. Try logging in.')
    } finally { setLoading(false) }
  }

  const stepIndex = ['credentials', 'role', 'details'].indexOf(step)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9] pt-24 pb-16 px-6">
        <div className="max-w-lg mx-auto">

          {/* Brand mark */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#111110] rounded-lg flex items-center justify-center">
              <BookOpen size={15} className="text-white" />
            </div>
            <span className="font-semibold text-[#111110] text-[15px]">TutorMatch</span>
          </div>

          <div className="mb-8">
            <h1 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110] mb-1.5">
              {step === 'credentials'
                ? (mode === 'login' ? (isHe ? 'ברוך הבא בחזרה' : 'Welcome back') : (isHe ? 'הצטרף ל-TutorMatch' : 'Join TutorMatch'))
                : step === 'role'
                ? (isHe ? 'בחר את תפקידך' : 'Choose your role')
                : (isHe ? 'פרטים אחרונים' : 'Almost there')}
            </h1>
            <p className="text-sm text-[#9c9a93]">
              {step === 'credentials'
                ? (mode === 'login' ? (isHe ? 'הכנס את הפרטים שלך להתחברות' : 'Enter your details to sign in') : (isHe ? 'צור חשבון חדש' : 'Create your free account'))
                : step === 'role'
                ? (isHe ? 'איך תשתמש ב-TutorMatch?' : 'How will you use TutorMatch?')
                : (isHe ? 'מלא את הפרופיל שלך' : 'Complete your profile')}
            </p>
          </div>

          {/* Step indicators (signup only) */}
          {mode === 'signup' && (
            <div className="flex items-center gap-2 mb-7">
              {['credentials', 'role', 'details'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    step === s ? 'bg-[#111110] text-white' :
                    stepIndex > i ? 'bg-[#e5a82e] text-[#111110]' :
                    'bg-[#e8e4db] text-[#9c9a93]'
                  }`}>{i + 1}</div>
                  {i < 2 && <div className={`h-px w-8 transition-all ${stepIndex > i ? 'bg-[#e5a82e]' : 'bg-[#e8e4db]'}`} />}
                </div>
              ))}
            </div>
          )}

          {/* Step: credentials */}
          {step === 'credentials' && (
            <>
              <div className="flex gap-1.5 mb-6 p-1 bg-[#f0ece4] rounded-xl">
                {(['signup', 'login'] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setError('') }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? 'bg-white text-[#111110] shadow-sm' : 'text-[#6f6d66] hover:text-[#111110]'}`}>
                    {m === 'signup' ? (isHe ? 'הרשמה' : 'Sign Up') : (isHe ? 'התחברות' : 'Log In')}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.email')}</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCredentials()}
                    placeholder={T(t, 'login.email.ph')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{isHe ? 'סיסמה' : 'Password'}</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCredentials()}
                      placeholder="••••••••" className={`${inputCls} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0ad9e] hover:text-[#6f6d66]">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}
                <button onClick={handleCredentials} disabled={loading}
                  className="w-full py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>{mode === 'login' ? (isHe ? 'התחבר' : 'Log In') : (isHe ? 'המשך' : 'Continue')} <ArrowRight size={15} /></>}
                </button>
              </div>
            </>
          )}

          {/* Step: role */}
          {step === 'role' && (
            <div className="space-y-3">
              <button onClick={() => handleRoleSelect('tutor')}
                className="w-full flex items-center gap-4 p-5 bg-white border-2 border-[#e0dbd0] rounded-2xl hover:border-[#111110] transition-all group">
                <div className="w-12 h-12 bg-[#111110] rounded-xl flex items-center justify-center group-hover:bg-[#e5a82e] flex-shrink-0">
                  <GraduationCap size={22} className="text-white group-hover:text-[#111110]" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-[#111110]">{T(t, 'login.as.tutor')}</div>
                  <div className="text-xs text-[#9c9a93] mt-0.5">{isHe ? 'עיין בבקשות והגש מועמדות' : 'Browse requests and apply'}</div>
                </div>
              </button>
              <button onClick={() => handleRoleSelect('parent')}
                className="w-full flex items-center gap-4 p-5 bg-white border-2 border-[#e0dbd0] rounded-2xl hover:border-[#e5a82e] transition-all group">
                <div className="w-12 h-12 bg-[#e5a82e] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users size={22} className="text-[#111110]" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-[#111110]">{T(t, 'login.as.parent')}</div>
                  <div className="text-xs text-[#9c9a93] mt-0.5">{isHe ? 'פרסם בקשה ומצא מורה' : 'Post a request and find a tutor'}</div>
                </div>
              </button>
              <button onClick={() => setStep('credentials')} className="text-sm text-[#9c9a93] hover:text-[#111110] mt-1">
                ← {isHe ? 'חזרה' : 'Back'}
              </button>
            </div>
          )}

          {/* Step: details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2 p-3 bg-white border border-[#e8e4db] rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role === 'tutor' ? 'bg-[#111110]' : 'bg-[#e5a82e]'}`}>
                  {role === 'tutor' ? <GraduationCap size={15} className="text-white" /> : <Users size={15} className="text-[#111110]" />}
                </div>
                <span className="text-sm font-medium text-[#111110]">
                  {role === 'tutor' ? T(t, 'login.as.tutor') : T(t, 'login.as.parent')}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.name')}</label>
                <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder={T(t, 'login.name.ph')} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.phone')}</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder={T(t, 'login.phone.ph')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.location')}</label>
                  <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder={T(t, 'login.location.ph')} className={inputCls} />
                </div>
              </div>

              {role === 'tutor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#3d3d3a] mb-2">{T(t, 'login.subjects')}</label>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(s => {
                        const sel = selectedSubjects.includes(s)
                        return (
                          <button key={s} type="button" onClick={() => toggleSubject(s)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${sel ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}>
                            {sel ? <X size={10} /> : <Plus size={10} />} {s}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.rate')}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b0ad9e] text-sm">₪</span>
                        <input type="number" min="1" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="80" className={`${inputCls} pl-8`} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">{T(t, 'login.format')}</label>
                      <div className="flex gap-1">
                        {(['online', 'in_person', 'both'] as Format[]).map(f => (
                          <button key={f} type="button" onClick={() => set('teaching_format', f)}
                            className={`flex-1 py-3 text-[10px] font-medium rounded-xl border transition-all ${form.teaching_format === f ? 'bg-[#111110] text-white border-[#111110]' : 'bg-white text-[#6f6d66] border-[#e0dbd0] hover:border-[#111110]'}`}>
                            {f === 'online' ? T(t, 'login.format.online') : f === 'in_person' ? T(t, 'login.format.inperson') : T(t, 'login.format.both')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3d3d3a] mb-1.5">
                      {T(t, 'login.bio')} <span className="text-[#9c9a93] font-normal text-xs">{isHe ? '(אופציונלי)' : '(optional)'}</span>
                    </label>
                    <textarea value={form.bio} onChange={e => set('bio', e.target.value)} placeholder={T(t, 'login.bio.ph')} rows={2} className={`${inputCls} resize-none`} />
                  </div>
                </>
              )}

              {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}

              <button onClick={handleSignup} disabled={loading}
                className="w-full py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>{isHe ? 'צור חשבון' : 'Create Account'} <ArrowRight size={15} /></>}
              </button>
              <button onClick={() => setStep('role')} className="text-sm text-[#9c9a93] hover:text-[#111110]">
                ← {isHe ? 'חזרה' : 'Back'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafaf9]" />}>
      <LoginForm />
    </Suspense>
  )
}
