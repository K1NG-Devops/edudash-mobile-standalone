export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          description: string | null
          estimated_time: number | null
          id: string
          instructions: string | null
          lesson_id: string
          materials: string | null
          sequence_order: number | null
          title: string
        }
        Insert: {
          activity_type: string
          description?: string | null
          estimated_time?: number | null
          id?: string
          instructions?: string | null
          lesson_id: string
          materials?: string | null
          sequence_order?: number | null
          title: string
        }
        Update: {
          activity_type?: string
          description?: string | null
          estimated_time?: number | null
          id?: string
          instructions?: string | null
          lesson_id?: string
          materials?: string | null
          sequence_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      age_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_age: number | null
          max_age_months: number | null
          min_age: number | null
          min_age_months: number | null
          name: string
          preschool_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_age?: number | null
          max_age_months?: number | null
          min_age?: number | null
          min_age_months?: number | null
          name: string
          preschool_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_age?: number | null
          max_age_months?: number | null
          min_age?: number | null
          min_age_months?: number | null
          name?: string
          preschool_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "age_groups_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_group_id: string
          created_at: string | null
          current_enrollment: number | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          max_capacity: number | null
          name: string
          preschool_id: string
          room_number: string | null
          teacher_id: string | null
        }
        Insert: {
          age_group_id: string
          created_at?: string | null
          current_enrollment?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name: string
          preschool_id: string
          room_number?: string | null
          teacher_id?: string | null
        }
        Update: {
          age_group_id?: string
          created_at?: string | null
          current_enrollment?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name?: string
          preschool_id?: string
          room_number?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_assignments: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          due_date_offset_days: number
          estimated_time_minutes: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          is_required: boolean | null
          lesson_id: string | null
          materials_needed: string | null
          preschool_id: string
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          due_date_offset_days?: number
          estimated_time_minutes?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_required?: boolean | null
          lesson_id?: string | null
          materials_needed?: string | null
          preschool_id: string
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          due_date_offset_days?: number
          estimated_time_minutes?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_required?: boolean | null
          lesson_id?: string | null
          materials_needed?: string | null
          preschool_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          attachment_urls: string[] | null
          created_at: string | null
          grade: string | null
          graded_at: string | null
          homework_assignment_id: string
          id: string
          parent_id: string | null
          reviewed_by: string | null
          status: string | null
          student_id: string
          submission_text: string | null
          submitted_at: string | null
          teacher_feedback: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string | null
          grade?: string | null
          graded_at?: string | null
          homework_assignment_id: string
          id?: string
          parent_id?: string | null
          reviewed_by?: string | null
          status?: string | null
          student_id: string
          submission_text?: string | null
          submitted_at?: string | null
          teacher_feedback?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string | null
          grade?: string | null
          graded_at?: string | null
          homework_assignment_id?: string
          id?: string
          parent_id?: string | null
          reviewed_by?: string | null
          status?: string | null
          student_id?: string
          submission_text?: string | null
          submitted_at?: string | null
          teacher_feedback?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_assignment_id_fkey"
            columns: ["homework_assignment_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_categories: {
        Row: {
          color: string | null
          color_theme: string | null
          description: string | null
          icon: string | null
          icon_name: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          color_theme?: string | null
          description?: string | null
          icon?: string | null
          icon_name?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          color_theme?: string | null
          description?: string | null
          icon?: string | null
          icon_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          age_group_id: string
          category_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          duration_minutes: number | null
          has_interactive: boolean | null
          has_printables: boolean | null
          has_video: boolean | null
          home_extension: string[] | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          is_published: boolean | null
          learning_objectives: string | null
          materials_needed: string | null
          preschool_id: string | null
          stem_concepts: string[] | null
          thumbnail_url: string | null
          tier: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          age_group_id: string
          category_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          duration_minutes?: number | null
          has_interactive?: boolean | null
          has_printables?: boolean | null
          has_video?: boolean | null
          home_extension?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          is_published?: boolean | null
          learning_objectives?: string | null
          materials_needed?: string | null
          preschool_id?: string | null
          stem_concepts?: string[] | null
          thumbnail_url?: string | null
          tier?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          age_group_id?: string
          category_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          duration_minutes?: number | null
          has_interactive?: boolean | null
          has_printables?: boolean | null
          has_video?: boolean | null
          home_extension?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          is_published?: boolean | null
          learning_objectives?: string | null
          materials_needed?: string | null
          preschool_id?: string | null
          stem_concepts?: string[] | null
          thumbnail_url?: string | null
          tier?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lesson_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      message_drafts: {
        Row: {
          attachment_urls: string[] | null
          content: string
          created_at: string | null
          id: string
          message_type: string
          preschool_id: string
          recipient_data: Json | null
          scheduled_send_at: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          message_type: string
          preschool_id: string
          recipient_data?: Json | null
          scheduled_send_at?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string
          preschool_id?: string
          recipient_data?: Json | null
          scheduled_send_at?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      preschools: {
        Row: {
          address: string | null
          billing_email: string | null
          created_at: string | null
          domain: string | null
          email: string
          id: string
          logo_url: string | null
          max_students: number | null
          max_teachers: number | null
          name: string
          onboarding_status: string | null
          phone: string | null
          setup_completed: boolean | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          tenant_slug: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          created_at?: string | null
          domain?: string | null
          email: string
          id?: string
          logo_url?: string | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          onboarding_status?: string | null
          phone?: string | null
          setup_completed?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          tenant_slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          onboarding_status?: string | null
          phone?: string | null
          setup_completed?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          tenant_slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          additional_notes: string | null
          age_group_id: string
          allergies: string | null
          attendance_days: string[] | null
          class_id: string | null
          consent_field_trips: boolean | null
          consent_media: boolean | null
          consent_photography: boolean | null
          consent_policies: boolean | null
          created_at: string | null
          date_of_birth: string
          dietary_restrictions: string | null
          document_uploads: Json | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          enrollment_date: string | null
          first_name: string
          gender: string | null
          home_address: string | null
          home_language: string | null
          id: string
          is_active: boolean | null
          last_name: string
          medical_conditions: string | null
          medications: string | null
          nickname: string | null
          parent_id: string | null
          payment_method: string | null
          preschool_id: string
          previous_experience: string | null
          previous_preschool: string | null
          previous_school_experience: string | null
          registration_fee: string | null
          sex: string | null
          special_needs: string | null
          time_block: string | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          age_group_id: string
          allergies?: string | null
          attendance_days?: string[] | null
          class_id?: string | null
          consent_field_trips?: boolean | null
          consent_media?: boolean | null
          consent_photography?: boolean | null
          consent_policies?: boolean | null
          created_at?: string | null
          date_of_birth: string
          dietary_restrictions?: string | null
          document_uploads?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_date?: string | null
          first_name: string
          gender?: string | null
          home_address?: string | null
          home_language?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          medical_conditions?: string | null
          medications?: string | null
          nickname?: string | null
          parent_id?: string | null
          payment_method?: string | null
          preschool_id: string
          previous_experience?: string | null
          previous_preschool?: string | null
          previous_school_experience?: string | null
          registration_fee?: string | null
          sex?: string | null
          special_needs?: string | null
          time_block?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          age_group_id?: string
          allergies?: string | null
          attendance_days?: string[] | null
          class_id?: string | null
          consent_field_trips?: boolean | null
          consent_media?: boolean | null
          consent_photography?: boolean | null
          consent_policies?: boolean | null
          created_at?: string | null
          date_of_birth?: string
          dietary_restrictions?: string | null
          document_uploads?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_date?: string | null
          first_name?: string
          gender?: string | null
          home_address?: string | null
          home_language?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          medical_conditions?: string | null
          medications?: string | null
          nickname?: string | null
          parent_id?: string | null
          payment_method?: string | null
          preschool_id?: string
          previous_experience?: string | null
          previous_preschool?: string | null
          previous_school_experience?: string | null
          registration_fee?: string | null
          sex?: string | null
          special_needs?: string | null
          time_block?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          emergency_contact_1_name: string | null
          emergency_contact_1_phone: string | null
          emergency_contact_1_relationship: string | null
          emergency_contact_2_name: string | null
          emergency_contact_2_phone: string | null
          emergency_contact_2_relationship: string | null
          home_address: string | null
          home_city: string | null
          home_postal_code: string | null
          id: string
          is_active: boolean | null
          name: string
          password_hash: string | null
          phone: string | null
          pickup_authorized: string | null
          preschool_id: string | null
          profile_completed_at: string | null
          profile_completion_status: string | null
          relationship_to_child: string | null
          role: string
          subscription_expires_at: string | null
          subscription_features: Json | null
          subscription_tier: string | null
          updated_at: string | null
          work_address: string | null
          work_company: string | null
          work_phone: string | null
          work_position: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_1_relationship?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          emergency_contact_2_relationship?: string | null
          home_address?: string | null
          home_city?: string | null
          home_postal_code?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          password_hash?: string | null
          phone?: string | null
          pickup_authorized?: string | null
          preschool_id?: string | null
          profile_completed_at?: string | null
          profile_completion_status?: string | null
          relationship_to_child?: string | null
          role: string
          subscription_expires_at?: string | null
          subscription_features?: Json | null
          subscription_tier?: string | null
          updated_at?: string | null
          work_address?: string | null
          work_company?: string | null
          work_phone?: string | null
          work_position?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          emergency_contact_1_name?: string | null
          emergency_contact_1_phone?: string | null
          emergency_contact_1_relationship?: string | null
          emergency_contact_2_name?: string | null
          emergency_contact_2_phone?: string | null
          emergency_contact_2_relationship?: string | null
          home_address?: string | null
          home_city?: string | null
          home_postal_code?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string | null
          phone?: string | null
          pickup_authorized?: string | null
          preschool_id?: string | null
          profile_completed_at?: string | null
          profile_completion_status?: string | null
          relationship_to_child?: string | null
          role?: string
          subscription_expires_at?: string | null
          subscription_features?: Json | null
          subscription_tier?: string | null
          updated_at?: string | null
          work_address?: string | null
          work_company?: string | null
          work_phone?: string | null
          work_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_student_age: {
        Args: { birth_date: string }
        Returns: number
      }
      create_tenant_with_admin: {
        Args: {
          p_name: string
          p_email: string
          p_admin_name: string
          p_tenant_slug: string
          p_subscription_plan?: string
        }
        Returns: string
      }
      decrement_class_enrollment: {
        Args: { class_id_param: string }
        Returns: undefined
      }
      get_overdue_fees_count: {
        Args: { parent_uuid: string }
        Returns: number
      }
      get_student_class_info: {
        Args: { student_uuid: string }
        Returns: {
          class_name: string
          teacher_name: string
          room_number: string
          age_group_name: string
        }[]
      }
      get_unread_messages_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: {
          permission_name: string
          category: string
          description: string
        }[]
      }
      get_user_tenant_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      increment_class_enrollment: {
        Args: { class_id_param: string }
        Returns: undefined
      }
      recalculate_class_enrollment: {
        Args: { class_id_param: string }
        Returns: undefined
      }
      register_student_with_code: {
        Args: {
          p_code: string
          p_parent_id: string
          p_student_first_name: string
          p_student_last_name: string
          p_date_of_birth: string
          p_age_group_id: string
          p_allergies?: string
          p_special_needs?: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
        }
        Returns: {
          success: boolean
          message: string
          student_id: string
          registration_id: string
        }[]
      }
      use_school_invitation_code: {
        Args: {
          code_param: string
          parent_email_param: string
          child_name_param: string
        }
        Returns: {
          success: boolean
          message: string
          preschool_id: string
        }[]
      }
      user_has_permission: {
        Args: { user_id: string; permission_name: string }
        Returns: boolean
      }
      validate_parent_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          preschool_id: string
          student_name: string
          parent_email: string
          expires_at: string
          is_valid: boolean
        }[]
      }
      validate_school_invitation_code: {
        Args: { invitation_code: string }
        Returns: {
          is_valid: boolean
          preschool_id: string
          preschool_name: string
          tenant_slug: string
          expires_at: string
          id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
