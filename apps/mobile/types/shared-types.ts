// Shared types between web and mobile versions
// Synced with /web/lib/types.ts

export type LessonCategory = {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
}

export type AgeGroup = {
  id: string
  name: string
  min_age: number
  max_age: number
  description: string | null
}

export type Lesson = {
  id: string
  title: string
  description: string | null
  content: string | null
  category_id: string
  age_group_id: string
  duration_minutes: number | null
  difficulty_level: number | null
  materials_needed: string | null
  learning_objectives: string | null
  is_public: boolean
  preschool_id: string | null
  created_by: string | null
  thumbnail_url: string | null
  video_url: string | null
  created_at: string
  updated_at: string
  category?: LessonCategory // Joined data
  age_group?: AgeGroup // Joined data
}

export type Preschool = {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string
  logo_url: string | null
  subscription_plan: "trial" | "basic" | "premium"
  subscription_status: "pending" | "active" | "inactive" | "cancelled"
  max_students: number
  max_teachers: number
  onboarding_status: "requested" | "approved" | "setup" | "completed"
  created_at: string
  updated_at: string
}

export type UserRole = "superadmin" | "preschool_admin" | "teacher" | "parent"

export type User = {
  id: string
  email: string
  password_hash: string | null // Should not be exposed client-side
  name: string
  role: UserRole
  preschool_id: string | null
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  
  // Address information
  home_address: string | null
  home_city: string | null
  home_postal_code: string | null
  
  // Work information
  work_company: string | null
  work_position: string | null
  work_address: string | null
  work_phone: string | null
  
  // Emergency contacts
  emergency_contact_1_name: string | null
  emergency_contact_1_phone: string | null
  emergency_contact_1_relationship: string | null
  emergency_contact_2_name: string | null
  emergency_contact_2_phone: string | null
  emergency_contact_2_relationship: string | null
  
  // Additional parent information
  relationship_to_child: string | null
  pickup_authorized: string | null
  
  // Profile completion tracking
  profile_completed_at: string | null
  profile_completion_status: 'incomplete' | 'in_progress' | 'complete'
  
  created_at: string
  updated_at: string
  preschool?: Preschool // Joined data
}

export type Student = {
  id: string
  preschool_id: string
  class_id: string | null
  first_name: string
  last_name: string
  date_of_birth: string // DATE type from DB
  age_group_id: string
  parent_id: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  allergies: string | null
  special_needs: string | null
  enrollment_date: string // DATE type from DB
  is_active: boolean
  created_at: string
  age_group?: AgeGroup // Joined data
  class_name?: string // Joined from classes table
  parent_name?: string // Joined from users table
}

export type Class = {
  id: string
  preschool_id: string
  name: string
  age_group_id: string
  teacher_id: string | null
  max_capacity: number
  current_enrollment: number
  room_number: string | null
  created_at: string
  age_group?: AgeGroup // Joined data
  teacher_name?: string // Joined from users table
}

export type PreschoolOnboardingRequest = {
  id: string
  preschool_name: string
  admin_name: string
  admin_email: string
  phone: string | null
  address: string | null
  number_of_students: number | null
  number_of_teachers: number | null
  message: string | null
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  reviewer_name?: string // Joined from users table
}
