export interface Preschool {
  id: string
  name: string
  address?: string
  phone?: string
  email: string
  logo_url?: string
  subscription_plan: "trial" | "basic" | "premium"
  subscription_status: "pending" | "active" | "inactive" | "cancelled"
  max_students: number
  max_teachers: number
  onboarding_status: "requested" | "approved" | "setup" | "completed"
  created_at: Date
}

export interface AgeGroup {
  id: string
  name: string
  min_age: number
  max_age: number
  description: string
}

export interface Student {
  id: string
  preschool_id: string
  class_id?: string
  first_name: string
  last_name: string
  date_of_birth: Date
  age_group_id: string
  parent_id?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  allergies?: string
  special_needs?: string
  enrollment_date: Date
  is_active: boolean
}

export interface LessonCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export interface Lesson {
  id: string
  title: string
  description: string
  content: string
  category_id: string
  age_group_id: string
  duration_minutes: number
  difficulty_level: number
  materials_needed: string[] // Will be parsed from comma-separated string
  learning_objectives: string[] // Will be parsed from comma-separated string
  is_public: boolean
  preschool_id?: string
  thumbnail_url?: string
  video_url?: string
  category?: LessonCategory
  age_group?: AgeGroup
}

export interface OnboardingRequest {
  id: string
  preschool_name: string
  admin_name: string
  admin_email: string
  phone?: string
  address?: string
  number_of_students: number
  number_of_teachers: number
  message?: string
  status: "pending" | "approved" | "rejected"
  created_at: Date
}
