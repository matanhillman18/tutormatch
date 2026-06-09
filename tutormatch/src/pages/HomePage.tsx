import { Link } from 'wouter'
import { BookOpen, GraduationCap, Users, CheckCircle, Star, ArrowRight, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useLang } from '../lib/lang-context'

export default function HomePage() {
  const { lang } = useLang()
  const isHe = lang === 'he'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#fafaf9]">

        {/* Hero */}
        <section className="pt-32 pb-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#faefd9] border border-[#f0d48a] rounded-full text-xs text-[#a06e12] font-medium mb-8 tracking-wide uppercase">
              <Sparkles size={11} />
              {isHe ? 'פלטפורמת החיבור המובילה' : 'The leading tutor marketplace'}
            </div>

            <h1 className="font-['Instrument_Serif'] text-5xl sm:text-6xl md:text-7xl text-[#111110] leading-[1.05] mb-6 tracking-tight">
              {isHe ? 'מצא את המורה' : 'Find the perfect'}
              <br />
              <span className="text-[#e5a82e] italic">
                {isHe ? 'המושלם עבורך.' : 'tutor for you.'}
              </span>
            </h1>

            <p className="text-lg text-[#6f6d66] max-w-lg mx-auto leading-relaxed mb-12">
              {isHe
                ? 'TutorMatch מחברת בין מורים מוסמכים לתלמידים שצריכים עזרה. הרשם תוך שתי דקות.'
                : 'TutorMatch connects qualified tutors with students who need help. Get started in under two minutes.'}
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Link
                href="/login?role=tutor"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#111110] text-white font-medium rounded-xl hover:bg-[#222220] text-[15px] w-full sm:w-auto justify-center"
              >
                <GraduationCap size={17} />
                {isHe ? 'הצטרף כמורה' : 'Join as a Tutor'}
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/login?role=parent"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white border border-[#e0dbd0] text-[#111110] font-medium rounded-xl hover:border-[#e5a82e] hover:bg-[#faefd9] text-[15px] w-full sm:w-auto justify-center"
              >
                <Users size={17} />
                {isHe ? 'מצא מורה לילדך' : 'Find a Tutor'}
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 sm:gap-12 pt-8 border-t border-[#e8e4db]">
              {[
                { v: '500+', l: isHe ? 'בקשות פעילות' : 'Active Requests' },
                { v: '1,200+', l: isHe ? 'מורים מוסמכים' : 'Qualified Tutors' },
                { v: '4.9', l: isHe ? 'דירוג ממוצע' : 'Average Rating' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <div className="font-['Instrument_Serif'] text-2xl sm:text-3xl text-[#111110] font-semibold">{s.v}</div>
                  <div className="text-xs text-[#9c9a93] mt-1 font-medium">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6 bg-white border-y border-[#e8e4db]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9c9a93] mb-3">
                {isHe ? 'איך זה עובד' : 'How it works'}
              </p>
              <h2 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110]">
                {isHe ? 'פשוט, מהיר, אפקטיבי' : 'Simple, fast, effective'}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[#fafaf9] border border-[#e8e4db] rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#111110] rounded-xl flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111110]">{isHe ? 'למורים' : 'For Tutors'}</h3>
                    <p className="text-xs text-[#9c9a93] mt-0.5">{isHe ? 'מצא תלמידים חדשים' : 'Find new students'}</p>
                  </div>
                </div>
                <ol className="space-y-4">
                  {(isHe
                    ? ['צור פרופיל מורה עם המקצועות שלך', 'עיין בבקשות של הורים רלוונטיים', 'הגש מועמדות ותתחיל ללמד']
                    : ['Create your tutor profile with your subjects', 'Browse requests from relevant families', 'Apply and start teaching']
                  ).map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#111110] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-sm text-[#3d3d3a] leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
                <Link href="/login?role=tutor" className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-[#111110] hover:text-[#e5a82e]">
                  {isHe ? 'הרשם כמורה' : 'Sign up as a tutor'} <ArrowRight size={13} />
                </Link>
              </div>

              <div className="bg-[#fafaf9] border border-[#e8e4db] rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#e5a82e] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-[#111110]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111110]">{isHe ? 'להורים' : 'For Parents'}</h3>
                    <p className="text-xs text-[#9c9a93] mt-0.5">{isHe ? 'מצא מורה לילדך' : 'Find the right tutor'}</p>
                  </div>
                </div>
                <ol className="space-y-4">
                  {(isHe
                    ? ['הרשם ופרסם בקשת שיעורים', 'קבל פניות ממורים מוסמכים', 'בחר את המורה המתאים ביותר']
                    : ['Sign up and post a tutoring request', 'Receive applications from qualified tutors', 'Choose the best tutor for your child']
                  ).map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#e5a82e] text-[#111110] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-sm text-[#3d3d3a] leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
                <Link href="/login?role=parent" className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-[#e5a82e] hover:text-[#c4901f]">
                  {isHe ? 'פרסם בקשה עכשיו' : 'Post a request now'} <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9c9a93] mb-3">
                {isHe ? 'מה אומרים עלינו' : 'Testimonials'}
              </p>
              <h2 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-[#111110]">
                {isHe ? 'מהניסיון שלהם' : 'From our community'}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  name: isHe ? 'נועה לוי' : 'Noa Levi',
                  role: isHe ? 'מורה למתמטיקה' : 'Math Tutor',
                  text: isHe ? 'מצאתי 3 תלמידים חדשים בשבוע הראשון. הפלטפורמה פשוטה להפליא.' : 'Found 3 new students in my first week. The platform is incredibly easy to use.',
                },
                {
                  name: isHe ? 'דניאל כהן' : 'Daniel Cohen',
                  role: isHe ? 'מורה לאנגלית' : 'English Tutor',
                  text: isHe ? 'סוף סוף פלטפורמה שמכבדת מורים. נקייה, מקצועית, ועובדת.' : 'Finally a platform that respects tutors. Clean, professional, and it works.',
                },
                {
                  name: isHe ? 'מאיה שפירו' : 'Maya Shapiro',
                  role: isHe ? 'הורה' : 'Parent',
                  text: isHe ? 'מצאנו מורה מצוין לבן שלנו תוך יומיים. ממליצה בחום!' : 'We found an excellent tutor for our son within two days. Highly recommended!',
                },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-[#e8e4db] rounded-2xl p-7">
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={13} className="fill-[#e5a82e] text-[#e5a82e]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#3d3d3a] leading-relaxed mb-6 italic">"{item.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#f0ece4]">
                    <div className="w-8 h-8 bg-[#f0ece4] rounded-full flex items-center justify-center text-xs font-semibold text-[#6f6d66]">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#111110]">{item.name}</div>
                      <div className="text-xs text-[#9c9a93]">{item.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-6 pb-24">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#111110] rounded-3xl px-10 py-14 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6f6d66] mb-4">
                {isHe ? 'מוכן להתחיל?' : 'Get started today'}
              </p>
              <h2 className="font-['Instrument_Serif'] text-3xl sm:text-4xl text-white mb-3 leading-snug">
                {isHe ? 'הצטרף לקהילה שלנו' : 'Join the TutorMatch community'}
              </h2>
              <p className="text-[#9c9a93] mb-10 text-sm">
                {isHe ? 'הרשמה לוקחת פחות מ-2 דקות.' : 'Sign up takes less than 2 minutes.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login?role=tutor"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#111110] font-medium rounded-xl hover:bg-[#fafaf9] text-sm w-full sm:w-auto justify-center"
                >
                  <GraduationCap size={15} />
                  {isHe ? 'הצטרף כמורה' : 'Join as a Tutor'}
                </Link>
                <Link
                  href="/login?role=parent"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#e5a82e] text-[#111110] font-medium rounded-xl hover:bg-[#f3c856] text-sm w-full sm:w-auto justify-center"
                >
                  <Users size={15} />
                  {isHe ? 'מצא מורה' : 'Find a Tutor'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-[#e8e4db]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#111110] rounded-md flex items-center justify-center">
                <BookOpen size={11} className="text-white" />
              </div>
              <span className="font-semibold text-sm text-[#111110]">TutorMatch</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-xs text-[#9c9a93] hover:text-[#111110]">
                {isHe ? 'התחבר' : 'Sign In'}
              </Link>
              <Link href="/login?role=tutor" className="text-xs text-[#9c9a93] hover:text-[#111110]">
                {isHe ? 'הצטרף כמורה' : 'Become a Tutor'}
              </Link>
              <Link href="/login?role=parent" className="text-xs text-[#9c9a93] hover:text-[#111110]">
                {isHe ? 'מצא מורה' : 'Find a Tutor'}
              </Link>
            </div>
            <p className="text-xs text-[#b0ad9e]">
              {isHe ? '© 2026 TutorMatch. כל הזכויות שמורות.' : '© 2026 TutorMatch. All rights reserved.'}
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
