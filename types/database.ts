export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string | null
          age_appropriate_max: number | null
          age_appropriate_min: number | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          estimated_duration: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          lesson_id: string | null
          materials_needed: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          activity_type?: string | null
          age_appropriate_max?: number | null
          age_appropriate_min?: number | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          lesson_id?: string | null
          materials_needed?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          activity_type?: string | null
          age_appropriate_max?: number | null
          age_appropriate_min?: number | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          lesson_id?: string | null
          materials_needed?: string | null
          title?: string
          updated_at?: string | null
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
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      activity_progress: {
        Row: {
          activity_id: string
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          score: number | null
          student_id: string
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          activity_id: string
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          student_id: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          score?: number | null
          student_id?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_progress_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          address_type: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          postal_code: string | null
          state: string | null
          street_address: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          last_login_at: string | null
          permissions: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_login_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_login_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      age_groups: {
        Row: {
          age_max: number | null
          age_min: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_age_months: number | null
          min_age_months: number | null
          name: string
          preschool_id: string | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_age_months?: number | null
          min_age_months?: number | null
          name: string
          preschool_id?: string | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_age_months?: number | null
          min_age_months?: number | null
          name?: string
          preschool_id?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          feature: string
          id: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          feature: string
          id?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          feature?: string
          id?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_published: boolean | null
          preschool_id: string | null
          priority: string | null
          published_at: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          preschool_id?: string | null
          priority?: string | null
          published_at?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          preschool_id?: string | null
          priority?: string | null
          published_at?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_rubrics: {
        Row: {
          age_group_id: string | null
          created_at: string | null
          created_by: string
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          preschool_id: string
          scoring_scale: Json
          subject_area: string | null
          updated_at: string | null
        }
        Insert: {
          age_group_id?: string | null
          created_at?: string | null
          created_by: string
          criteria: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          preschool_id: string
          scoring_scale: Json
          subject_area?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group_id?: string | null
          created_at?: string | null
          created_by?: string
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          preschool_id?: string
          scoring_scale?: Json
          subject_area?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_rubrics_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_rubrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_rubrics_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_type: string | null
          class_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean | null
          teacher_id: string | null
          title: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_type?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          teacher_id?: string | null
          title: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_type?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          teacher_id?: string | null
          title?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachment_urls: string[] | null
          created_at: string | null
          feedback: string | null
          file_urls: string[] | null
          grade: string | null
          graded_at: string | null
          homework_assignment_id: string
          id: string
          status: string | null
          student_id: string
          submission_text: string | null
          submitted_at: string | null
          teacher_feedback: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string
          attachment_urls?: string[] | null
          created_at?: string | null
          feedback?: string | null
          file_urls?: string[] | null
          grade?: string | null
          graded_at?: string | null
          homework_assignment_id: string
          id?: string
          status?: string | null
          student_id: string
          submission_text?: string | null
          submitted_at?: string | null
          teacher_feedback?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          attachment_urls?: string[] | null
          created_at?: string | null
          feedback?: string | null
          file_urls?: string[] | null
          grade?: string | null
          graded_at?: string | null
          homework_assignment_id?: string
          id?: string
          status?: string | null
          student_id?: string
          submission_text?: string | null
          submitted_at?: string | null
          teacher_feedback?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_homework_assignment_id_fkey"
            columns: ["homework_assignment_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          arrival_time: string | null
          attendance_date: string
          attendance_rate: number | null
          class_id: string
          created_at: string | null
          departure_time: string | null
          id: string
          notes: string | null
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          attendance_date?: string
          attendance_rate?: number | null
          class_id: string
          created_at?: string | null
          departure_time?: string | null
          id?: string
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          attendance_date?: string
          attendance_rate?: number | null
          class_id?: string
          created_at?: string | null
          departure_time?: string | null
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_cycles: {
        Row: {
          amount: number
          auto_renew: boolean | null
          billing_period: string
          created_at: string | null
          cycle_end: string
          cycle_start: string
          id: string
          next_billing_date: string | null
          preschool_id: string
          status: string
          subscription_plan_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          auto_renew?: boolean | null
          billing_period: string
          created_at?: string | null
          cycle_end: string
          cycle_start: string
          id?: string
          next_billing_date?: string | null
          preschool_id: string
          status?: string
          subscription_plan_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          auto_renew?: boolean | null
          billing_period?: string
          created_at?: string | null
          cycle_end?: string
          cycle_start?: string
          id?: string
          next_billing_date?: string | null
          preschool_id?: string
          status?: string
          subscription_plan_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycles_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cycles_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          due_date: string
          id: string
          invoice_data: Json | null
          invoice_number: string
          paid_at: string | null
          school_id: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          due_date: string
          id?: string
          invoice_data?: Json | null
          invoice_number: string
          paid_at?: string | null
          school_id?: string | null
          status: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          due_date?: string
          id?: string
          invoice_data?: Json | null
          invoice_number?: string
          paid_at?: string | null
          school_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_assignments: {
        Row: {
          assigned_date: string | null
          class_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_date?: string | null
          class_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_date?: string | null
          class_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_group: string | null
          age_group_id: string | null
          age_max: number | null
          age_min: number | null
          capacity: number | null
          created_at: string | null
          current_enrollment: number
          id: string
          is_active: boolean | null
          max_capacity: number
          name: string
          preschool_id: string
          room_number: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          age_group_id?: string | null
          age_max?: number | null
          age_min?: number | null
          capacity?: number | null
          created_at?: string | null
          current_enrollment?: number
          id?: string
          is_active?: boolean | null
          max_capacity?: number
          name: string
          preschool_id: string
          room_number?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          age_group_id?: string | null
          age_max?: number | null
          age_min?: number | null
          capacity?: number | null
          created_at?: string | null
          current_enrollment?: number
          id?: string
          is_active?: boolean | null
          max_capacity?: number
          name?: string
          preschool_id?: string
          room_number?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
      classroom_reports: {
        Row: {
          achievement_badges: string[] | null
          activities_summary: Json | null
          areas_for_improvement: string | null
          bathroom_visits: number | null
          behavior_notes: string | null
          class_id: string | null
          created_at: string | null
          diaper_changes: number | null
          follow_up_needed: boolean | null
          health_observations: string | null
          id: string
          incidents: string | null
          is_sent_to_parents: boolean | null
          learning_highlights: string | null
          meals_eaten: string[] | null
          media_highlights: string[] | null
          medications_given: string[] | null
          mood_rating: number | null
          nap_time_end: string | null
          nap_time_start: string | null
          next_steps: string | null
          parent_acknowledgment: string | null
          parent_message: string | null
          parent_viewed_at: string | null
          participation_level: string | null
          photo_count: number | null
          preschool_id: string
          report_date: string
          report_type: string
          sent_at: string | null
          skills_developed: string[] | null
          social_interactions: string | null
          student_id: string
          teacher_id: string
          temperature_checks: Json | null
          total_activities: number | null
          updated_at: string | null
        }
        Insert: {
          achievement_badges?: string[] | null
          activities_summary?: Json | null
          areas_for_improvement?: string | null
          bathroom_visits?: number | null
          behavior_notes?: string | null
          class_id?: string | null
          created_at?: string | null
          diaper_changes?: number | null
          follow_up_needed?: boolean | null
          health_observations?: string | null
          id?: string
          incidents?: string | null
          is_sent_to_parents?: boolean | null
          learning_highlights?: string | null
          meals_eaten?: string[] | null
          media_highlights?: string[] | null
          medications_given?: string[] | null
          mood_rating?: number | null
          nap_time_end?: string | null
          nap_time_start?: string | null
          next_steps?: string | null
          parent_acknowledgment?: string | null
          parent_message?: string | null
          parent_viewed_at?: string | null
          participation_level?: string | null
          photo_count?: number | null
          preschool_id: string
          report_date: string
          report_type: string
          sent_at?: string | null
          skills_developed?: string[] | null
          social_interactions?: string | null
          student_id: string
          teacher_id: string
          temperature_checks?: Json | null
          total_activities?: number | null
          updated_at?: string | null
        }
        Update: {
          achievement_badges?: string[] | null
          activities_summary?: Json | null
          areas_for_improvement?: string | null
          bathroom_visits?: number | null
          behavior_notes?: string | null
          class_id?: string | null
          created_at?: string | null
          diaper_changes?: number | null
          follow_up_needed?: boolean | null
          health_observations?: string | null
          id?: string
          incidents?: string | null
          is_sent_to_parents?: boolean | null
          learning_highlights?: string | null
          meals_eaten?: string[] | null
          media_highlights?: string[] | null
          medications_given?: string[] | null
          mood_rating?: number | null
          nap_time_end?: string | null
          nap_time_start?: string | null
          next_steps?: string | null
          parent_acknowledgment?: string | null
          parent_message?: string | null
          parent_viewed_at?: string | null
          participation_level?: string | null
          photo_count?: number | null
          preschool_id?: string
          report_date?: string
          report_type?: string
          sent_at?: string | null
          skills_developed?: string[] | null
          social_interactions?: string | null
          student_id?: string
          teacher_id?: string
          temperature_checks?: Json | null
          total_activities?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_reports_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_reports_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          address: string | null
          can_pickup: boolean | null
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string
          relationship: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          can_pickup?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone: string
          relationship: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          can_pickup?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string
          relationship?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          is_published: boolean | null
          location: string | null
          preschool_id: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_published?: boolean | null
          location?: string | null
          preschool_id?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_published?: boolean | null
          location?: string | null
          preschool_id?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_assignments: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean | null
          points_possible: number | null
          teacher_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          points_possible?: number | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean | null
          points_possible?: number | null
          teacher_id?: string | null
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
          assignment_id: string | null
          created_at: string | null
          feedback: string | null
          file_urls: string[] | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          status: string | null
          student_id: string | null
          submission_text: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          file_urls?: string[] | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          file_urls?: string[] | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_graded_by_fkey"
            columns: ["graded_by"]
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
      independent_children: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          first_name: string
          grade_level: string | null
          id: string
          is_active: boolean | null
          last_name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          first_name: string
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "independent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      independent_content_library: {
        Row: {
          age_group: string | null
          content_type: string | null
          content_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          preview_url: string | null
          price_cents: number | null
          subject: string | null
          title: string
        }
        Insert: {
          age_group?: string | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          preview_url?: string | null
          price_cents?: number | null
          subject?: string | null
          title: string
        }
        Update: {
          age_group?: string | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          preview_url?: string | null
          price_cents?: number | null
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string
          invited_by: string | null
          is_active: boolean | null
          preschool_id: string | null
          role: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          preschool_id?: string | null
          role: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          preschool_id?: string | null
          role?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_codes_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_codes_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_activities: {
        Row: {
          activity_type: string | null
          age_group_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          instructions: string | null
          materials: string | null
          subject: string | null
          title: string
        }
        Insert: {
          activity_type?: string | null
          age_group_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          materials?: string | null
          subject?: string | null
          title: string
        }
        Update: {
          activity_type?: string | null
          age_group_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          materials?: string | null
          subject?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_activities_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_categories: {
        Row: {
          color_code: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          age_group_max: number | null
          age_group_min: number | null
          category_id: string | null
          content: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          is_ai_generated: boolean | null
          is_public: boolean | null
          materials_needed: string | null
          objectives: string[] | null
          preschool_id: string | null
          teacher_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          age_group_max?: number | null
          age_group_min?: number | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          materials_needed?: string | null
          objectives?: string[] | null
          preschool_id?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          age_group_max?: number | null
          age_group_min?: number | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          materials_needed?: string | null
          objectives?: string[] | null
          preschool_id?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lesson_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_uploads: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          is_public: boolean | null
          metadata: Json | null
          original_filename: string | null
          preschool_id: string | null
          storage_path: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          original_filename?: string | null
          preschool_id?: string | null
          storage_path?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          original_filename?: string | null
          preschool_id?: string | null
          storage_path?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_uploads_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_drafts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          recipient_ids: string[] | null
          sender_id: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          recipient_ids?: string[] | null
          sender_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          recipient_ids?: string[] | null
          sender_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_drafts_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          archived_at: string | null
          created_at: string | null
          id: string
          message_id: string | null
          read_at: string | null
          recipient_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          read_at?: string | null
          recipient_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          read_at?: string | null
          recipient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_recipients_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          preschool_id: string | null
          preview: string | null
          priority: string | null
          sender_id: string | null
          sent_at: string | null
          subject: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          preschool_id?: string | null
          preview?: string | null
          priority?: string | null
          sender_id?: string | null
          sent_at?: string | null
          subject: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          preschool_id?: string | null
          preview?: string | null
          priority?: string | null
          sender_id?: string | null
          sent_at?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_requests: {
        Row: {
          created_at: string | null
          id: string
          principal_email: string
          principal_name: string
          principal_phone: string | null
          school_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          principal_email: string
          principal_name: string
          principal_phone?: string | null
          school_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          principal_email?: string
          principal_name?: string
          principal_phone?: string | null
          school_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      parent_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          preschool_id: string | null
          student_id: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          preschool_id?: string | null
          student_id?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          preschool_id?: string | null
          student_id?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_access_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_access_codes_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_access_codes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_access_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payfast_payment_id: string | null
          payfast_token: string | null
          payment_method: string | null
          school_id: string | null
          status: string
          subscription_plan_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id: string
          metadata?: Json | null
          payfast_payment_id?: string | null
          payfast_token?: string | null
          payment_method?: string | null
          school_id?: string | null
          status: string
          subscription_plan_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payfast_payment_id?: string | null
          payfast_token?: string | null
          payment_method?: string | null
          school_id?: string | null
          status?: string
          subscription_plan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_provider: string | null
          preschool_id: string | null
          provider_payment_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_provider?: string | null
          preschool_id?: string | null
          provider_payment_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_provider?: string | null
          preschool_id?: string | null
          provider_payment_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_analytics: {
        Row: {
          dimensions: Json | null
          id: string
          metric_name: string
          metric_value: number | null
          recorded_at: string | null
        }
        Insert: {
          dimensions?: Json | null
          id?: string
          metric_name: string
          metric_value?: number | null
          recorded_at?: string | null
        }
        Update: {
          dimensions?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number | null
          recorded_at?: string | null
        }
        Relationships: []
      }
      preschool_onboarding_requests: {
        Row: {
          address: string | null
          admin_email: string | null
          admin_name: string | null
          created_at: string | null
          id: string
          message: string | null
          notes: string | null
          number_of_students: number | null
          number_of_teachers: number | null
          phone: string | null
          preschool_name: string | null
          principal_email: string | null
          principal_name: string | null
          principal_phone: string | null
          registration_number: string | null
          school_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_email?: string | null
          admin_name?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          number_of_students?: number | null
          number_of_teachers?: number | null
          phone?: string | null
          preschool_name?: string | null
          principal_email?: string | null
          principal_name?: string | null
          principal_phone?: string | null
          registration_number?: string | null
          school_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_email?: string | null
          admin_name?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          number_of_students?: number | null
          number_of_teachers?: number | null
          phone?: string | null
          preschool_name?: string | null
          principal_email?: string | null
          principal_name?: string | null
          principal_phone?: string | null
          registration_number?: string | null
          school_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      preschools: {
        Row: {
          address: string | null
          billing_email: string | null
          created_at: string | null
          domain: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_students: number | null
          max_teachers: number | null
          name: string
          onboarding_status: string | null
          payfast_token: string | null
          phone: string | null
          registration_number: string | null
          setup_completed: boolean | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_plan_id: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tenant_slug: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          onboarding_status?: string | null
          payfast_token?: string | null
          phone?: string | null
          registration_number?: string | null
          setup_completed?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tenant_slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          onboarding_status?: string | null
          payfast_token?: string | null
          phone?: string | null
          registration_number?: string | null
          setup_completed?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tenant_slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preschools_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      school_invitation_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          expires_at: string | null
          id: string
          invitation_type: string
          invited_by: string | null
          invited_email: string | null
          invited_name: string | null
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
          preschool_id: string
          school_id: string | null
          updated_at: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          invitation_type: string
          invited_by?: string | null
          invited_email?: string | null
          invited_name?: string | null
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          preschool_id: string
          school_id?: string | null
          updated_at?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          invitation_type?: string
          invited_by?: string | null
          invited_email?: string | null
          invited_name?: string | null
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          preschool_id?: string
          school_id?: string | null
          updated_at?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_invitation_codes_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_invitation_codes_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_invitation_codes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_invitation_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_enrollments: {
        Row: {
          class_id: string
          created_at: string | null
          enrollment_date: string
          id: string
          is_active: boolean | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          enrollment_date?: string
          id?: string
          is_active?: boolean | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          enrollment_date?: string
          id?: string
          is_active?: boolean | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_registrations: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          preschool_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          first_name: string
          id?: string
          last_name: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          preschool_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          preschool_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_registrations_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age_group_id: string | null
          allergies: string | null
          avatar_url: string | null
          class_id: string | null
          created_at: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          enrollment_date: string | null
          first_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          last_name: string
          medical_conditions: string | null
          parent_id: string | null
          preschool_id: string
          updated_at: string | null
        }
        Insert: {
          age_group_id?: string | null
          allergies?: string | null
          avatar_url?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_date?: string | null
          first_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          medical_conditions?: string | null
          parent_id?: string | null
          preschool_id: string
          updated_at?: string | null
        }
        Update: {
          age_group_id?: string | null
          allergies?: string | null
          avatar_url?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_date?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          medical_conditions?: string | null
          parent_id?: string | null
          preschool_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
      subscription_plans: {
        Row: {
          ai_quota_monthly: number | null
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_students: number | null
          max_teachers: number | null
          name: string
          price_annual: number | null
          price_monthly: number | null
        }
        Insert: {
          ai_quota_monthly?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          price_annual?: number | null
          price_monthly?: number | null
        }
        Update: {
          ai_quota_monthly?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_frequency: string
          cancelled_at: string | null
          created_at: string | null
          end_date: string
          id: string
          metadata: Json | null
          next_billing_date: string | null
          payfast_payment_id: string | null
          payfast_token: string | null
          plan_id: string
          school_id: string | null
          start_date: string
          status: string
          trial_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          billing_frequency: string
          cancelled_at?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          payfast_payment_id?: string | null
          payfast_token?: string | null
          plan_id: string
          school_id?: string | null
          start_date: string
          status: string
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_frequency?: string
          cancelled_at?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          payfast_payment_id?: string | null
          payfast_token?: string | null
          plan_id?: string
          school_id?: string | null
          start_date?: string
          status?: string
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          id: string
          preschool_id: string | null
          priority: string | null
          resolution_notes: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          id?: string
          preschool_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          id?: string
          preschool_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      teacher_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_code: string | null
          invited_by: string | null
          name: string | null
          preschool_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_code?: string | null
          invited_by?: string | null
          name?: string | null
          preschool_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_code?: string | null
          invited_by?: string | null
          name?: string | null
          preschool_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_invitations_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          notifications_email: boolean | null
          notifications_push: boolean | null
          notifications_sms: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          notifications_sms?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          notifications_sms?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age_groups_taught: string[] | null
          auth_user_id: string | null
          availability: Json | null
          biography: string | null
          certifications: string[] | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          documents: Json | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_id: string | null
          employment_start_date: string | null
          employment_status: string | null
          gender: string | null
          highest_qualification: string | null
          id: string
          id_number: string | null
          institution_name: string | null
          is_active: boolean | null
          languages_spoken: string[] | null
          name: string
          nationality: string | null
          notes: string | null
          password_reset_required: boolean | null
          phone: string | null
          position_title: string | null
          postal_code: string | null
          preschool_id: string | null
          profile_completion_status: string | null
          profile_picture_url: string | null
          qualification_year: number | null
          role: string
          salary_amount: number | null
          salary_currency: string | null
          state_province: string | null
          street_address: string | null
          subjects_taught: string[] | null
          subscription_plan_id: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          teaching_experience_years: number | null
          updated_at: string | null
        }
        Insert: {
          age_groups_taught?: string[] | null
          auth_user_id?: string | null
          availability?: Json | null
          biography?: string | null
          certifications?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          documents?: Json | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string | null
          employment_start_date?: string | null
          employment_status?: string | null
          gender?: string | null
          highest_qualification?: string | null
          id?: string
          id_number?: string | null
          institution_name?: string | null
          is_active?: boolean | null
          languages_spoken?: string[] | null
          name: string
          nationality?: string | null
          notes?: string | null
          password_reset_required?: boolean | null
          phone?: string | null
          position_title?: string | null
          postal_code?: string | null
          preschool_id?: string | null
          profile_completion_status?: string | null
          profile_picture_url?: string | null
          qualification_year?: number | null
          role: string
          salary_amount?: number | null
          salary_currency?: string | null
          state_province?: string | null
          street_address?: string | null
          subjects_taught?: string[] | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          teaching_experience_years?: number | null
          updated_at?: string | null
        }
        Update: {
          age_groups_taught?: string[] | null
          auth_user_id?: string | null
          availability?: Json | null
          biography?: string | null
          certifications?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          documents?: Json | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string | null
          employment_start_date?: string | null
          employment_status?: string | null
          gender?: string | null
          highest_qualification?: string | null
          id?: string
          id_number?: string | null
          institution_name?: string | null
          is_active?: boolean | null
          languages_spoken?: string[] | null
          name?: string
          nationality?: string | null
          notes?: string | null
          password_reset_required?: boolean | null
          phone?: string | null
          position_title?: string | null
          postal_code?: string | null
          preschool_id?: string | null
          profile_completion_status?: string | null
          profile_picture_url?: string | null
          qualification_year?: number | null
          role?: string
          salary_amount?: number | null
          salary_currency?: string | null
          state_province?: string | null
          street_address?: string | null
          subjects_taught?: string[] | null
          subscription_plan_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          teaching_experience_years?: number | null
          updated_at?: string | null
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
      video_call_participants: {
        Row: {
          call_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          invitation_sent: boolean | null
          invitation_sent_at: string | null
          joined_at: string | null
          left_at: string | null
          status: string | null
          student_id: string | null
          user_id: string
        }
        Insert: {
          call_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          invitation_sent?: boolean | null
          invitation_sent_at?: string | null
          joined_at?: string | null
          left_at?: string | null
          status?: string | null
          student_id?: string | null
          user_id: string
        }
        Update: {
          call_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          invitation_sent?: boolean | null
          invitation_sent_at?: string | null
          joined_at?: string | null
          left_at?: string | null
          status?: string | null
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_call_participants_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "video_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_call_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_call_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_calls: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          class_id: string | null
          created_at: string | null
          description: string | null
          id: string
          max_participants: number | null
          meeting_id: string | null
          meeting_password: string | null
          meeting_url: string | null
          preschool_id: string
          recording_enabled: boolean | null
          recording_url: string | null
          require_password: boolean | null
          scheduled_end: string
          scheduled_start: string
          status: string | null
          teacher_id: string
          title: string
          updated_at: string | null
          waiting_room_enabled: boolean | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          max_participants?: number | null
          meeting_id?: string | null
          meeting_password?: string | null
          meeting_url?: string | null
          preschool_id: string
          recording_enabled?: boolean | null
          recording_url?: string | null
          require_password?: boolean | null
          scheduled_end: string
          scheduled_start: string
          status?: string | null
          teacher_id: string
          title: string
          updated_at?: string | null
          waiting_room_enabled?: boolean | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          max_participants?: number | null
          meeting_id?: string | null
          meeting_password?: string | null
          meeting_url?: string | null
          preschool_id?: string
          recording_enabled?: boolean | null
          recording_url?: string | null
          require_password?: boolean | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string | null
          waiting_room_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "video_calls_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_calls_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_calls_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          source: string
          status: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_subscription_status: {
        Args: { school_uuid: string }
        Returns: {
          days_remaining: number
          is_active: boolean
          needs_payment: boolean
          plan_id: string
          status: string
        }[]
      }
      create_school_with_admin: {
        Args: {
          p_admin_email: string
          p_admin_name: string
          p_school_name: string
          p_subscription_plan?: string
        }
        Returns: Json
      }
      create_specific_superadmin: {
        Args: { p_email: string; p_name?: string }
        Returns: Json
      }
      create_superadmin_for_current_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_teacher_for_preschool: {
        Args: {
          target_preschool_id: string
          teacher_email: string
          teacher_name: string
          teacher_phone?: string
        }
        Returns: string
      }
      create_test_superadmin: {
        Args: { p_auth_user_id: string; p_email: string; p_name: string }
        Returns: string
      }
      generate_invitation_code: {
        Args: { p_email: string; p_preschool_id: string; p_role: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_connections: {
        Args: Record<PropertyKey, never>
        Returns: {
          connection_id: string
          connection_type: string
          created_at: string
          preschool_id: string
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      get_subscription_analytics: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          active_subscriptions: number
          annual_revenue: number
          avg_revenue_per_school: number
          cancelled_subscriptions: number
          churn_rate: number
          expired_subscriptions: number
          monthly_revenue: number
          total_revenue: number
          total_subscriptions: number
          trial_subscriptions: number
        }[]
      }
      get_user_profile_by_auth_id: {
        Args: { p_auth_user_id: string }
        Returns: {
          auth_user_id: string
          avatar_url: string
          created_at: string
          email: string
          emergency_contact_1_name: string
          emergency_contact_1_phone: string
          emergency_contact_1_relationship: string
          emergency_contact_2_name: string
          emergency_contact_2_phone: string
          emergency_contact_2_relationship: string
          home_address: string
          home_city: string
          home_postal_code: string
          id: string
          is_active: boolean
          name: string
          phone: string
          pickup_authorized: string
          preschool_id: string
          profile_completed_at: string
          profile_completion_status: string
          relationship_to_child: string
          role: string
          updated_at: string
          work_address: string
          work_company: string
          work_phone: string
          work_position: string
        }[]
      }
      superadmin_approve_onboarding: {
        Args: { request_id: string }
        Returns: Json
      }
      test_onboarding_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          can_insert: boolean
          can_select: boolean
          jwt_role: string
          user_id: string
          user_role: string
        }[]
      }
      use_invitation_code: {
        Args: {
          p_auth_user_id: string
          p_code: string
          p_name: string
          p_phone?: string
        }
        Returns: string
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
  public: {
    Enums: {},
  },
} as const
