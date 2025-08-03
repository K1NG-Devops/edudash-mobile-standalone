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

export type SchoolInvitationCode = {
  id: string
  code: string
  preschool_id: string
  created_by: string
  expires_at: string
  status: "active" | "used" | "revoked" | "expired"
  created_at: string
  updated_at: string
  preschool?: Preschool // Joined data
  creator_name?: string // Joined from users table
}

export type StudentRegistration = {
  id: string
  preschool_id: string
  student_id: string
  registered_by: string
  school_invitation_code_id: string | null
  created_at: string
  updated_at: string
  student?: Student // Joined data
  parent?: User // Joined data
  invitation_code?: SchoolInvitationCode // Joined data
}

export type ParentAccessCode = {
  id: string
  code: string
  preschool_id: string
  student_name: string
  parent_email: string
  created_by: string
  expires_at: string
  status: "active" | "used" | "expired" | "revoked"
  usage_count: number
  max_usage: number
  used_at: string | null
  used_by: string | null
  created_at: string
  updated_at: string
}

export type HomeworkAssignment = {
  id: string
  lesson_id: string
  title: string
  description: string | null
  instructions: string | null
  materials_needed: string | null
  estimated_time_minutes: number
  due_date_offset_days: number
  difficulty_level: number
  is_required: boolean
  created_at: string
  updated_at: string
  lesson?: Lesson // Joined data
}

export type StudentHomeworkSubmission = {
  id: string
  homework_assignment_id: string
  student_id: string
  submitted_at: string | null
  submission_content: string | null
  attachment_urls: string[] | null
  status: "assigned" | "in_progress" | "submitted" | "reviewed" | "completed"
  teacher_feedback: string | null
  grade: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  homework_assignment?: HomeworkAssignment // Joined data
  student?: Student // Joined data
  reviewer?: User // Joined data
}

// Messaging System Types
export type MessageType = "direct" | "announcement" | "system" | "homework_discussion"

export type MessageRecipientType = "user" | "class" | "school" | "role"

export type Message = {
  id: string
  preschool_id: string
  sender_id: string
  subject: string
  content: string
  message_type: MessageType
  priority: "low" | "normal" | "high" | "urgent"
  attachment_urls: string[] | null
  is_read: boolean
  is_archived: boolean
  parent_message_id: string | null // For replies/threads
  homework_assignment_id: string | null // Link to homework if relevant
  student_id: string | null // Link to specific student if relevant
  scheduled_send_at: string | null // For scheduled messages
  expires_at: string | null // For time-sensitive announcements
  created_at: string
  updated_at: string
  
  // Joined data
  sender?: User
  preschool?: Preschool
  homework_assignment?: HomeworkAssignment
  student?: Student
  replies?: Message[] // For thread view
  reply_count?: number
}

export type MessageRecipient = {
  id: string
  message_id: string
  recipient_type: MessageRecipientType
  recipient_id: string // user_id, class_id, preschool_id, or role name
  is_read: boolean
  read_at: string | null
  is_archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
  
  // Joined data
  message?: Message
  recipient_user?: User // When recipient_type is "user"
  recipient_class?: Class // When recipient_type is "class"
}

export type MessageDraft = {
  id: string
  user_id: string
  preschool_id: string
  subject: string
  content: string
  message_type: MessageType
  recipient_data: any // JSON data for recipients
  attachment_urls: string[] | null
  scheduled_send_at: string | null
  created_at: string
  updated_at: string
}

export type MessageTemplate = {
  id: string
  preschool_id: string | null // null for system templates
  created_by: string
  name: string
  description: string | null
  subject_template: string
  content_template: string
  message_type: MessageType
  is_system_template: boolean
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
  
  // Joined data
  creator?: User
}

export type MessageThread = {
  id: string
  original_message_id: string
  participant_ids: string[]
  last_message_at: string
  message_count: number
  is_archived: boolean
  created_at: string
  updated_at: string
  
  // Joined data
  original_message?: Message
  participants?: User[]
  latest_message?: Message
}

// Notification Types for Messaging
export type MessageNotification = {
  id: string
  user_id: string
  message_id: string
  notification_type: "new_message" | "message_reply" | "announcement" | "urgent_message"
  is_read: boolean
  is_pushed: boolean // Has push notification been sent
  pushed_at: string | null
  created_at: string
  
  // Joined data
  message?: Message
  user?: User
}
