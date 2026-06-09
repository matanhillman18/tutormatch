export const SUBJECTS_EN = ['Mathematics','Physics','Chemistry','Biology','English','History','Literature','Computer Science','Economics','Geography','Music','Art'] as const
export const SUBJECTS_HE = ['מתמטיקה','פיזיקה','כימיה','ביולוגיה','אנגלית','היסטוריה','ספרות','מדעי מחשב','כלכלה','גיאוגרפיה','מוזיקה','אמנות'] as const
export type SubjectEn = typeof SUBJECTS_EN[number]

export const heToEn: Record<string, string> = {
  'מתמטיקה':'Mathematics','פיזיקה':'Physics','כימיה':'Chemistry',
  'ביולוגיה':'Biology','אנגלית':'English','היסטוריה':'History',
  'ספרות':'Literature','מדעי מחשב':'Computer Science',
  'כלכלה':'Economics','גיאוגרפיה':'Geography','מוזיקה':'Music','אמנות':'Art',
}
export const enToHe: Record<string, string> = Object.fromEntries(Object.entries(heToEn).map(([k,v])=>[v,k]))
