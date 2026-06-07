'use client'

import Link from 'next/link'
import { BookOpen, GraduationCap, Users, CheckCircle, Star, ArrowRight } from 'lucide-react'
import Navbar from './_components/layout/Navbar'
import { useLang } from '@/lib/lang-context'

export default function HomePage() {
  const { lang } = useLang()
  const isHe = lang === 'he'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9]">

        {/* HERO */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#faefd9] border border-[#f3d99b] rounded-full text-sm text-[#a06e12] font-medium mb-8">
              <BookOpen size={14} />
              {isHe ? 'פלטפורמה לחיבור מורים ותלמידים' : 'Connecting tutors with students'}
            </div>

            <h1 className="font-['Instrument_Serif'] text-5xl sm:text-6xl text-[#111110] leading-[1.1] mb-6">
              {isHe ? 'מצא את המורה' : 'Find the perfect'}
              <br />
              <span className="text-[#e5a82e] italic">
                {isHe ? 'המושלם עבורך.' : 'tutor for you.'}
              </span>
            </h1>

            <p className="text-lg text-[#6f6d66] max-w-xl mx-auto leading-relaxed mb-10">
              {isHe
                ? 'TutorMatch מחברת בין מורים מוסמכים לתלמידים שצריכים עזרה. הרשם עכשיו והתחל.'
                : 'TutorMatch connects qualified tutors with students who need help. Sign up now and get started.'}
            </p>

            <Link href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#e5a82e] hover:text-[#111110] transition-all duration-200 text-base">
              {isHe ? 'הרשם עכשיו' : 'Sign Up Now'} <ArrowRight size={16} />
            </Link>

            <p className="text-sm text-[#9c9a93] mt-4">
              {isHe ? 'כבר יש לך חשבון?' : 'Already have an account?'}{' '}
              <Link href="/login?mode=login" className="text-[#e5a82e] underline">
                {isHe ? 'התחבר כאן' : 'Log in here'}
              </Link>
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-10 mt-16 pt-10 border-t border-[#e8e4db]">
              {[
                { v: '500+', l: isHe ? 'בקשות פעילות' : 'Active Requests' },
                { v: '1,200+', l: isHe ? 'מורים מוסמכים' : 'Qualified Tutors' },
                { v: '4.9★', l: isHe ? 'דירוג ממוצע' : 'Avg. Rating' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <div className="font-['Instrument_Serif'] text-2xl text-[#111110] font-semibold">{s.v}</div>
                  <div className="text-xs text-[#9c9a93] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 px-6 bg-white border-y border-[#e8e4db]">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-['Instrument_Serif'] text-3xl text-[#111110] text-center mb-12">
              {isHe ? 'איך זה עובד?' : 'How does it work?'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tutor */}
              <div className="bg-[#fafaf9] border border-[#e8e4db] rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-[#111110] rounded-xl flex items-center justify-center">
                    <GraduationCap size={18} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-[#111110]">{isHe ? 'למורים' : 'For Tutors'}</h3>
                </div>
                {(isHe
                  ? ['הרשם ובחר את המקצועות שלך', 'עיין בבקשות של תלמידים רלוונטיים', 'הגש מועמדות והתחל ללמד']
                  : ['Sign up and choose your subjects', 'Browse relevant student requests', 'Apply and start teaching']
                ).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3">
                    <CheckCircle size={16} className="text-[#e5a82e] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#6f6d66]">{s}</span>
                  </div>
                ))}
              </div>

              {/* Parent */}
              <div className="bg-[#fafaf9] border border-[#e8e4db] rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-[#e5a82e] rounded-xl flex items-center justify-center">
                    <Users size={18} className="text-[#111110]" />
                  </div>
                  <h3 className="font-semibold text-[#111110]">{isHe ? 'להורים וסטודנטים' : 'For Parents & Students'}</h3>
                </div>
                {(isHe
                  ? ['הרשם ופרסם בקשת שיעורים', 'קבל פניות ממורים מוסמכים', 'בחר את המורה המתאים לך']
                  : ['Sign up and post a tutoring request', 'Receive applications from qualified tutors', 'Choose the best tutor for you']
                ).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3">
                    <CheckCircle size={16} className="text-[#e5a82e] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#6f6d66]">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-['Instrument_Serif'] text-3xl text-[#111110] text-center mb-12">
              {isHe ? 'מה אומרים עלינו' : 'What people say'}
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { name: isHe ? 'נועה לוי' : 'Noa Levi', role: isHe ? 'מורה למתמטיקה' : 'Math Tutor', text: isHe ? '"מצאתי 3 תלמידים חדשים בשבוע הראשון. הפלטפורמה פשוטה להפליא."' : '"Found 3 new students in my first week. The platform is incredibly easy."' },
                { name: isHe ? 'דניאל כהן' : 'Daniel Cohen', role: isHe ? 'מורה לאנגלית' : 'English Tutor', text: isHe ? '"סוף סוף פלטפורמה שמכבדת מורים. נקייה, מקצועית, ועובדת."' : '"Finally a platform that respects tutors. Clean and professional."' },
                { name: isHe ? 'מאיה שפירו' : 'Maya Shapiro', role: isHe ? 'הורה' : 'Parent', text: isHe ? '"מצאנו מורה מצוין לבן שלנו תוך יומיים. ממליצה בחום!"' : '"Found an excellent tutor for our son within two days. Highly recommended!"' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-[#e8e4db] rounded-2xl p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} size={12} className="fill-[#e5a82e] text-[#e5a82e]" />)}
                  </div>
                  <p className="text-sm text-[#3d3d3a] leading-relaxed mb-4 italic">{item.text}</p>
                  <div className="font-medium text-sm text-[#111110]">{item.name}</div>
                  <div className="text-xs text-[#9c9a93]">{item.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto bg-[#111110] rounded-3xl p-12 text-center">
            <h2 className="font-['Instrument_Serif'] text-3xl text-white mb-3">
              {isHe ? 'מוכן להתחיל?' : 'Ready to get started?'}
            </h2>
            <p className="text-[#9c9a93] mb-8 text-sm">
              {isHe ? 'הרשמה לוקחת פחות מ-2 דקות.' : 'Sign up takes less than 2 minutes.'}
            </p>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#e5a82e] text-[#111110] font-medium rounded-xl hover:bg-[#f3d99b] transition-colors text-base">
              {isHe ? 'הרשם עכשיו' : 'Sign Up Now'} <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-8 px-6 border-t border-[#e8e4db]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#111110] rounded-md flex items-center justify-center">
                <BookOpen size={11} className="text-white" />
              </div>
              <span className="font-semibold text-sm text-[#111110]">TutorMatch</span>
            </div>
            <p className="text-xs text-[#9c9a93]">
              {isHe ? '© 2026 TutorMatch. כל הזכויות שמורות.' : '© 2026 TutorMatch. All rights reserved.'}
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
