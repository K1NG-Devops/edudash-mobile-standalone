export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'superadmin' | 'admin' | 'principal' | 'teacher' | 'parent'
          phone: string | null
          address: string | null
          home_address: string | null
          is_active: boolean
          auth_user_id: string
          preschool_id: string | null
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role: 'superadmin' | 'admin' | 'principal' | 'teacher' | 'parent'
          phone?: string | null
          address?: string | null
          home_address?: string | null
          is_active?: boolean
          auth_user_id: string
          preschool_id?: string | null
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'superadmin' | 'admin' | 'principal' | 'teacher' | 'parent'
          phone?: string | null
          address?: string | null
          home_address?: string | null
          is_active?: boolean
          auth_user_id?: string
          preschool_id?: string | null
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      students: {
        Row: {
          id: string
          first_name: string
          last_name: string
          date_of_birth: string
          age: number | null
          gender: string | null
          parent_id: string
          preschool_id: string
          class_id: string | null
          enrollment_date: string
          is_active: boolean
          medical_info: string | null
          emergency_contact: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          date_of_birth: string
          age?: number | null
          gender?: string | null
          parent_id: string
          preschool_id: string
          class_id?: string | null
          enrollment_date?: string
          is_active?: boolean
          medical_info?: string | null
          emergency_contact?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          age?: number | null
          gender?: string | null
          parent_id?: string
          preschool_id?: string
          class_id?: string | null
          enrollment_date?: string
          is_active?: boolean
          medical_info?: string | null
          emergency_contact?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          age_group_id: string | null
          teacher_id: string | null
          max_capacity: number
          current_enrollment: number
          room_number: string | null
          icon_url: string | null
          preschool_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          age_group_id?: string | null
          teacher_id?: string | null
          max_capacity: number
          current_enrollment?: number
          room_number?: string | null
          icon_url?: string | null
          preschool_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          age_group_id?: string | null
          teacher_id?: string | null
          max_capacity?: number
          current_enrollment?: number
          room_number?: string | null
          icon_url?: string | null
          preschool_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      preschools: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          description: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      homework_assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date_offset_days: number
          lesson_id: string | null
          class_id: string | null
          teacher_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date_offset_days: number
          lesson_id?: string | null
          class_id?: string | null
          teacher_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date_offset_days?: number
          lesson_id?: string | null
          class_id?: string | null
          teacher_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          title: string
          description: string | null
          activity_date: string
          start_time: string | null
          end_time: string | null
          location: string | null
          preschool_id: string
          class_id: string | null
          created_by: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          activity_date: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          preschool_id: string
          class_id?: string | null
          created_by: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          activity_date?: string
          start_time?: string | null
          end_time?: string | null
          location?: string | null
          preschool_id?: string
          class_id?: string | null
          created_by?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
