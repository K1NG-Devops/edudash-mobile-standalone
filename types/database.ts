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
      addresses: {
        Row: {
          address_type: string
          city: string
          country: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          postal_code: string | null
          state: string | null
          street_address: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_type: string
          city: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          postal_code?: string | null
          state?: string | null
          street_address: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_type?: string
          city?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          postal_code?: string | null
          state?: string | null
          street_address?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      class_assignments: {
        Row: {
          assigned_date: string | null
          class_id: string
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_date?: string | null
          class_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_date?: string | null
          class_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          student_id?: string
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
          age_group_id: string
          created_at: string | null
          current_enrollment: number | null
          grade_level: string | null
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
          grade_level?: string | null
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
          grade_level?: string | null
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
        ]
      }
      classroom_reports: {
        Row: {
          achievement_badges: string[] | null
          activities_summary: Json
          areas_for_improvement: string | null
          bathroom_visits: number | null
          behavior_notes: string | null
          class_id: string | null
          created_at: string
          diaper_changes: number | null
          follow_up_needed: boolean | null
          health_observations: string | null
          id: string
          incidents: string | null
          is_sent_to_parents: boolean
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
          total_activities: number
          updated_at: string
        }
        Insert: {
          achievement_badges?: string[] | null
          activities_summary?: Json
          areas_for_improvement?: string | null
          bathroom_visits?: number | null
          behavior_notes?: string | null
          class_id?: string | null
          created_at?: string
          diaper_changes?: number | null
          follow_up_needed?: boolean | null
          health_observations?: string | null
          id?: string
          incidents?: string | null
          is_sent_to_parents?: boolean
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
          total_activities?: number
          updated_at?: string
        }
        Update: {
          achievement_badges?: string[] | null
          activities_summary?: Json
          areas_for_improvement?: string | null
          bathroom_visits?: number | null
          behavior_notes?: string | null
          class_id?: string | null
          created_at?: string
          diaper_changes?: number | null
          follow_up_needed?: boolean | null
          health_observations?: string | null
          id?: string
          incidents?: string | null
          is_sent_to_parents?: boolean
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
          total_activities?: number
          updated_at?: string
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
          student_id: string
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
          student_id: string
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
          student_id?: string
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
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          location: string | null
          preschool_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          location?: string | null
          preschool_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          location?: string | null
          preschool_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
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
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          preschool_id: string
          role: string
          updated_at: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          preschool_id: string
          role: string
          updated_at?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          preschool_id?: string
          role?: string
          updated_at?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
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
            foreignKeyName: "lessons_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      media_uploads: {
        Row: {
          alt_text: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          folder: string | null
          id: string
          is_public: boolean | null
          mime_type: string | null
          preschool_id: string
          uploaded_by: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          folder?: string | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          preschool_id: string
          uploaded_by: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          file_url?: string
          folder?: string | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          preschool_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_uploads_preschool_id_fkey"
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
          author_id: string | null
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
          author_id?: string | null
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
          author_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "fk_message_drafts_preschool"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      message_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message_id: string
          notification_type: string | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_id: string
          notification_type?: string | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_id?: string
          notification_type?: string | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          archived_at: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          message_id: string
          read_at: string | null
          recipient_id: string
          recipient_type: string | null
          status: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message_id: string
          read_at?: string | null
          recipient_id: string
          recipient_type?: string | null
          status?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message_id?: string
          read_at?: string | null
          recipient_id?: string
          recipient_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_draft: boolean | null
          message_type: string | null
          preschool_id: string
          priority: string | null
          sender_id: string
          sent_at: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_draft?: boolean | null
          message_type?: string | null
          preschool_id: string
          priority?: string | null
          sender_id: string
          sent_at?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_draft?: boolean | null
          message_type?: string | null
          preschool_id?: string
          priority?: string | null
          sender_id?: string
          sent_at?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_access_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          parent_email: string
          preschool_id: string
          student_id: string
          student_name: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          parent_email: string
          preschool_id: string
          student_id: string
          student_name: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          parent_email?: string
          preschool_id?: string
          student_id?: string
          student_name?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
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
        ]
      }
      payment_fees: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string
          due_date: string
          fee_type: string
          id: string
          preschool_id: string
          recurring_type: string | null
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description: string
          due_date: string
          fee_type: string
          id?: string
          preschool_id: string
          recurring_type?: string | null
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string
          due_date?: string
          fee_type?: string
          id?: string
          preschool_id?: string
          recurring_type?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_fees_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          cardholder_name: string | null
          created_at: string | null
          expiry_month: number | null
          expiry_year: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_four: string | null
          method_type: string
          provider: string
          provider_payment_method_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cardholder_name?: string | null
          created_at?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_four?: string | null
          method_type: string
          provider: string
          provider_payment_method_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cardholder_name?: string | null
          created_at?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_four?: string | null
          method_type?: string
          provider?: string
          provider_payment_method_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          issued_at: string | null
          payment_id: string
          receipt_number: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          issued_at?: string | null
          payment_id: string
          receipt_number: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          issued_at?: string | null
          payment_id?: string
          receipt_number?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          payer_id: string
          payment_date: string | null
          payment_fee_id: string
          payment_intent_id: string | null
          payment_method_id: string | null
          payment_status: string | null
          preschool_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          payer_id: string
          payment_date?: string | null
          payment_fee_id: string
          payment_intent_id?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          preschool_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          payer_id?: string
          payment_date?: string | null
          payment_fee_id?: string
          payment_intent_id?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          preschool_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_payment_fee_id_fkey"
            columns: ["payment_fee_id"]
            isOneToOne: false
            referencedRelation: "payment_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      preschool_onboarding_requests: {
        Row: {
          address: string | null
          admin_email: string
          admin_name: string
          created_at: string | null
          id: string
          message: string | null
          number_of_students: number | null
          number_of_teachers: number | null
          phone: string | null
          preschool_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          admin_email: string
          admin_name: string
          created_at?: string | null
          id?: string
          message?: string | null
          number_of_students?: number | null
          number_of_teachers?: number | null
          phone?: string | null
          preschool_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          admin_email?: string
          admin_name?: string
          created_at?: string | null
          id?: string
          message?: string | null
          number_of_students?: number | null
          number_of_teachers?: number | null
          phone?: string | null
          preschool_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preschool_onboarding_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      school_invitation_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          expires_at: string
          id: string
          invitation_type: string | null
          invited_by: string
          invited_email: string
          is_active: boolean | null
          max_uses: number | null
          preschool_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string
          id?: string
          invitation_type?: string | null
          invited_by: string
          invited_email: string
          is_active?: boolean | null
          max_uses?: number | null
          preschool_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string
          id?: string
          invitation_type?: string | null
          invited_by?: string
          invited_email?: string
          is_active?: boolean | null
          max_uses?: number | null
          preschool_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_invitation_codes_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_registrations: {
        Row: {
          age_group_id: string
          allergies: string | null
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string | null
          date_of_birth: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          parent_email: string
          parent_id: string | null
          parent_phone: string | null
          preschool_id: string
          registration_code: string | null
          special_needs: string | null
          status: string | null
          student_first_name: string
          student_last_name: string
        }
        Insert: {
          age_group_id: string
          allergies?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          date_of_birth: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          parent_email: string
          parent_id?: string | null
          parent_phone?: string | null
          preschool_id: string
          registration_code?: string | null
          special_needs?: string | null
          status?: string | null
          student_first_name: string
          student_last_name: string
        }
        Update: {
          age_group_id?: string
          allergies?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          date_of_birth?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          parent_email?: string
          parent_id?: string | null
          parent_phone?: string | null
          preschool_id?: string
          registration_code?: string | null
          special_needs?: string | null
          status?: string | null
          student_first_name?: string
          student_last_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_registrations_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
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
          additional_notes: string | null
          age: number | null
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
          full_name: string | null
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
          age?: number | null
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
          full_name?: string | null
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
          age?: number | null
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
          full_name?: string | null
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
            foreignKeyName: "students_preschool_id_fkey"
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
          preference_key: string
          preference_value: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preference_key: string
          preference_value?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preference_key?: string
          preference_value?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
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
          phone: string | null
          pickup_authorized: string | null
          preschool_id: string | null
          profile_completed_at: string | null
          profile_completion_status: string | null
          relationship_to_child: string | null
          role: string
          updated_at: string | null
          work_address: string | null
          work_company: string | null
          work_phone: string | null
          work_position: string | null
        }
        Insert: {
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
          phone?: string | null
          pickup_authorized?: string | null
          preschool_id?: string | null
          profile_completed_at?: string | null
          profile_completion_status?: string | null
          relationship_to_child?: string | null
          role: string
          updated_at?: string | null
          work_address?: string | null
          work_company?: string | null
          work_phone?: string | null
          work_position?: string | null
        }
        Update: {
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
          phone?: string | null
          pickup_authorized?: string | null
          preschool_id?: string | null
          profile_completed_at?: string | null
          profile_completion_status?: string | null
          relationship_to_child?: string | null
          role?: string
          updated_at?: string | null
          work_address?: string | null
          work_company?: string | null
          work_phone?: string | null
          work_position?: string | null
        }
        Relationships: []
      }
      video_call_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          joined_participants: Json
          preschool_id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          joined_participants?: Json
          preschool_id: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          joined_participants?: Json
          preschool_id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_call_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_call_sessions_preschool_id_fkey"
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
      can_access_preschool: {
        Args: { target_preschool_id: string }
        Returns: boolean
      }
      create_parent_invitation: {
        Args: {
          p_preschool_id: string
          p_student_id: string
          p_email: string
          p_student_name: string
        }
        Returns: Json
      }
      create_teacher_invitation: {
        Args: { p_preschool_id: string; p_email: string; p_invited_by: string }
        Returns: Json
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
      generate_invitation_code: {
        Args: { p_email: string; p_role: string; p_preschool_id: string }
        Returns: string
      }
      get_current_user_preschool_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_user_preschool_info: {
        Args: { user_auth_id: string }
        Returns: {
          preschool_id: string
          role: string
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
      is_preschool_admin: {
        Args: { user_auth_id: string; target_preschool_id: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      use_invitation_code: {
        Args: {
          p_code: string
          p_auth_user_id: string
          p_name: string
          p_phone?: string
        }
        Returns: string
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
      validate_invitation_code: {
        Args: { p_code: string; p_email: string }
        Returns: Json
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
  public: {
    Enums: {},
  },
} as const
