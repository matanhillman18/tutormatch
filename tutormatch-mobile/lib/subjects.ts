export const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'History', 'Literature', 'Computer Science',
  'Economics', 'Geography', 'Music', 'Art',
] as const

export type Subject = typeof SUBJECTS[number]

export const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  Mathematics:        { bg: '#eff6ff', text: '#1d4ed8' },
  Physics:            { bg: '#faf5ff', text: '#7e22ce' },
  Chemistry:          { bg: '#ecfdf5', text: '#065f46' },
  Biology:            { bg: '#f0fdf4', text: '#15803d' },
  English:            { bg: '#fffbeb', text: '#b45309' },
  History:            { bg: '#fff7ed', text: '#c2410c' },
  Literature:         { bg: '#fff1f2', text: '#be123c' },
  'Computer Science': { bg: '#ecfeff', text: '#0e7490' },
  Economics:          { bg: '#f0f9ff', text: '#0369a1' },
  Geography:          { bg: '#fefce8', text: '#a16207' },
  Music:              { bg: '#fdf4ff', text: '#a21caf' },
  Art:                { bg: '#fff0f3', text: '#be123c' },
}
