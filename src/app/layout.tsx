import type { Metadata } from 'next'
import './globals.css'
import { LangProvider } from '@/lib/lang-context'

export const metadata: Metadata = {
  title: 'TutorMatch — Connect Tutors with Families',
  description: 'Find the perfect tutor or student. Browse, apply, and connect.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  )
}
