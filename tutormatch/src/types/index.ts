export type Lang = 'en' | 'he'
export type UserRole = 'tutor' | 'parent'

export interface Tutor {
  id: string
  full_name: string
  email: string
  subjects: string[]
  hourly_rate: number
  bio: string
  teaching_format: 'online' | 'in_person' | 'both'
  location: string
  phone: string
  created_at: string
}

export interface TutoringRequest {
  id: string
  parent_id: string
  subject: string
  grade: string
  budget: number
  description: string
  location: string
  lesson_type: 'online' | 'in_person' | 'both'
  created_at: string
  parent?: Parent
}

export interface Parent {
  id: string
  full_name: string
  email: string
  phone: string
  location: string
  created_at: string
}

export interface Application {
  id: string
  tutor_id: string
  request_id: string
  message: string
  availability: string
  phone: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  tutor?: Tutor
  request?: TutoringRequest
}

export interface FilterState {
  search: string
  subject: string
  maxBudget: number
  lessonType: string
  sortBy: 'newest' | 'budget_asc' | 'budget_desc'
}
