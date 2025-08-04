export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          address_type: string | null
          city: string
          country: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          postal_code: string | null
          province: string
          street_address: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_type?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          postal_code?: string | null
          province: string
          street_address: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_type?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          postal_code?: string | null
          province?: string
          street_address?: string
          updated_at?: string | null
          user_id?: string
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
      age_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_age: number
          max_age_months: number | null
          min_age: number
          min_age_months: number | null
          name: string
          preschool_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_age?: number
          max_age_months?: number | null
          min_age?: number
          min_age_months?: number | null
          name: string
          preschool_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_age?: number
          max_age_months?: number | null
          min_age?: number
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
          academic_year: string | null
          assigned_at: string | null
          assigned_by: string
          class_id: string
          created_at: string | null
          id: string
          status: string | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          assigned_at?: string | null
          assigned_by: string
          class_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          assigned_at?: string | null
          assigned_by?: string
          class_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          max_capacity?: number | null
          name?: string
          preschool_id?: string
          room_number?: string | null
          teacher_id?: string | null
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
      emergency_contacts: {
        Row: {
          contact_address: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string | null
          id: string
          is_authorized_pickup: boolean | null
          priority_order: number | null
          relationship: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          contact_address?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string | null
          id?: string
          is_authorized_pickup?: boolean | null
          priority_order?: number | null
          relationship?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string | null
          id?: string
          is_authorized_pickup?: boolean | null
          priority_order?: number | null
          relationship?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_complete_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_uses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          child_name: string | null
          id: string
          invitation_code_id: string
          parent_email: string | null
          status: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          child_name?: string | null
          id?: string
          invitation_code_id: string
          parent_email?: string | null
          status?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          child_name?: string | null
          id?: string
          invitation_code_id?: string
          parent_email?: string | null
          status?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_uses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_uses_invitation_code_id_fkey"
            columns: ["invitation_code_id"]
            isOneToOne: false
            referencedRelation: "school_invitation_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      parent_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          max_usage: number | null
          parent_email: string
          preschool_id: string | null
          status: string | null
          student_name: string
          updated_at: string | null
          usage_count: number | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          max_usage?: number | null
          parent_email: string
          preschool_id?: string | null
          status?: string | null
          student_name: string
          updated_at?: string | null
          usage_count?: number | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          max_usage?: number | null
          parent_email?: string
          preschool_id?: string | null
          status?: string | null
          student_name?: string
          updated_at?: string | null
          usage_count?: number | null
          used_at?: string | null
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
        ]
      }
      parent_details: {
        Row: {
          created_at: string | null
          id: string
          primary_parent_email: string | null
          primary_parent_job_title: string | null
          primary_parent_name: string | null
          primary_parent_phone: string | null
          primary_parent_workplace: string | null
          secondary_parent_email: string | null
          secondary_parent_name: string | null
          secondary_parent_phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          primary_parent_email?: string | null
          primary_parent_job_title?: string | null
          primary_parent_name?: string | null
          primary_parent_phone?: string | null
          primary_parent_workplace?: string | null
          secondary_parent_email?: string | null
          secondary_parent_name?: string | null
          secondary_parent_phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          primary_parent_email?: string | null
          primary_parent_job_title?: string | null
          primary_parent_name?: string | null
          primary_parent_phone?: string | null
          primary_parent_workplace?: string | null
          secondary_parent_email?: string | null
          secondary_parent_name?: string | null
          secondary_parent_phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_features: {
        Row: {
          created_at: string | null
          description: string | null
          feature_type: string
          id: string
          is_active: boolean | null
          name: string
          tier_required: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_type: string
          id?: string
          is_active?: boolean | null
          name: string
          tier_required: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          tier_required?: string
        }
        Relationships: []
      }
      preschool_onboarding_requests: {
        Row: {
          address: string | null
          admin_email: string
          admin_name: string
          city: string | null
          contact_person_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          expected_students: number | null
          expected_teachers: number | null
          id: string
          message: string | null
          notes: string | null
          number_of_students: number | null
          number_of_teachers: number | null
          phone: string | null
          postal_code: string | null
          preferred_slug: string | null
          preschool_name: string
          province: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_type: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          admin_email: string
          admin_name: string
          city?: string | null
          contact_person_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          expected_students?: number | null
          expected_teachers?: number | null
          id?: string
          message?: string | null
          notes?: string | null
          number_of_students?: number | null
          number_of_teachers?: number | null
          phone?: string | null
          postal_code?: string | null
          preferred_slug?: string | null
          preschool_name: string
          province?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_type?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          admin_email?: string
          admin_name?: string
          city?: string | null
          contact_person_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          expected_students?: number | null
          expected_teachers?: number | null
          id?: string
          message?: string | null
          notes?: string | null
          number_of_students?: number | null
          number_of_teachers?: number | null
          phone?: string | null
          postal_code?: string | null
          preferred_slug?: string | null
          preschool_name?: string
          province?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_type?: string | null
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
          current_invitation_code: string | null
          domain: string | null
          email: string
          id: string
          invitation_code_expires_at: string | null
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
          current_invitation_code?: string | null
          domain?: string | null
          email: string
          id?: string
          invitation_code_expires_at?: string | null
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
          current_invitation_code?: string | null
          domain?: string | null
          email?: string
          id?: string
          invitation_code_expires_at?: string | null
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
          created_by: string
          description: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          preschool_id: string
          status: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          description?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          preschool_id: string
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          preschool_id?: string
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "school_invitation_codes_created_by_fkey"
            columns: ["created_by"]
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
        ]
      }
      student_medical_info: {
        Row: {
          allergies: string | null
          created_at: string | null
          current_medications: string | null
          dietary_restrictions: string | null
          doctor_address: string | null
          doctor_name: string | null
          doctor_phone: string | null
          id: string
          medical_conditions: string | null
          medical_notes: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          allergies?: string | null
          created_at?: string | null
          current_medications?: string | null
          dietary_restrictions?: string | null
          doctor_address?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          id?: string
          medical_conditions?: string | null
          medical_notes?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          allergies?: string | null
          created_at?: string | null
          current_medications?: string | null
          dietary_restrictions?: string | null
          doctor_address?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          id?: string
          medical_conditions?: string | null
          medical_notes?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_medical_info_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_complete_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_medical_info_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_registrations: {
        Row: {
          created_at: string | null
          id: string
          preschool_id: string
          registered_by: string
          school_invitation_code_id: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          preschool_id: string
          registered_by: string
          school_invitation_code_id?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preschool_id?: string
          registered_by?: string
          school_invitation_code_id?: string | null
          student_id?: string
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
          {
            foreignKeyName: "student_registrations_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_school_invitation_code_id_fkey"
            columns: ["school_invitation_code_id"]
            isOneToOne: false
            referencedRelation: "school_invitation_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_complete_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      teacher_class_schedules: {
        Row: {
          class_assignment_id: string
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          lesson_id: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          class_assignment_id: string
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lesson_id: string
          notes?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          class_assignment_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lesson_id?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_class_schedules_class_assignment_id_fkey"
            columns: ["class_assignment_id"]
            isOneToOne: false
            referencedRelation: "class_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_class_schedules_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          preschool_id: string
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          invited_by: string
          preschool_id: string
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          preschool_id?: string
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_onboarding_steps: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          data: Json | null
          id: string
          preschool_id: string
          status: string | null
          step_name: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          preschool_id: string
          status?: string | null
          step_name: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          preschool_id?: string
          status?: string | null
          step_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_onboarding_steps_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_onboarding_steps_preschool_id_fkey"
            columns: ["preschool_id"]
            isOneToOne: false
            referencedRelation: "preschools"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string | null
          id: string
          preschool_id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          preschool_id: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preschool_id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_preschool_id_fkey"
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
          email_digest: string | null
          id: string
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_digest?: string | null
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_digest?: string | null
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
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
      student_complete_info: {
        Row: {
          additional_notes: string | null
          age_group_id: string | null
          allergies: string | null
          city: string | null
          class_id: string | null
          created_at: string | null
          current_medications: string | null
          date_of_birth: string | null
          doctor_name: string | null
          doctor_phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          enrollment_date: string | null
          first_name: string | null
          gender: string | null
          id: string | null
          is_active: boolean | null
          last_name: string | null
          medical_allergies: string | null
          medical_conditions: string | null
          parent_id: string | null
          postal_code: string | null
          preschool_id: string | null
          previous_school_experience: string | null
          primary_emergency_contact: string | null
          primary_emergency_phone: string | null
          primary_emergency_relation: string | null
          primary_parent_email: string | null
          primary_parent_name: string | null
          primary_parent_phone: string | null
          province: string | null
          secondary_parent_name: string | null
          special_needs: string | null
          street_address: string | null
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
    }
    Functions: {
      assign_teacher_to_class: {
        Args: {
          p_academic_year?: string
          p_assigned_by: string
          p_class_id: string
          p_teacher_id: string
        }
        Returns: {
          message: string
          assignment_id: string
          success: boolean
        }[]
      }
      can_view_user: {
        Args: { checked_user_id: string }
        Returns: boolean
      }
      create_school_invitation_code: {
        Args: {
          p_created_by: string
          p_description?: string
          p_expires_days?: number
          p_max_uses?: number
          p_preschool_id: string
        }
        Returns: {
          id: string
          code: string
          expires_at: string
          success: boolean
          message: string
        }[]
      }
      create_tenant_with_admin: {
        Args: {
          p_admin_name: string
          p_email: string
          p_name: string
          p_subscription_plan?: string
          p_tenant_slug: string
        }
        Returns: string
      }
      decrement_class_enrollment: {
        Args: { class_id_param: string }
        Returns: undefined
      }
      drop_policy_if_exists: {
        Args: { policy_name: string; table_name: string }
        Returns: undefined
      }
      execute_sql: {
        Args: { sql_query: string }
        Returns: Record<string, unknown>[]
      }
      generate_school_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_school_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_teacher_classes: {
        Args: { p_teacher_id: string }
        Returns: {
          assignment_status: string
          student_count: number
          age_group_name: string
          room_number: string
          class_name: string
          academic_year: string
          class_id: string
        }[]
      }
      get_teacher_daily_schedule: {
        Args: { p_date?: string; p_teacher_id: string }
        Returns: {
          duration_minutes: number
          schedule_id: string
          class_name: string
          lesson_title: string
          scheduled_time: string
          status: string
          lesson_category: string
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
          p_age_group_id: string
          p_allergies?: string
          p_code: string
          p_date_of_birth: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_parent_id: string
          p_special_needs?: string
          p_student_first_name: string
          p_student_last_name: string
        }
        Returns: {
          student_id: string
          message: string
          success: boolean
          registration_id: string
        }[]
      }
      use_school_invitation_code: {
        Args: { p_child_name: string; p_code: string; p_parent_email: string }
        Returns: {
          preschool_id: string
          success: boolean
          message: string
        }[]
      }
      validate_school_invitation_code: {
        Args: { p_code: string }
        Returns: {
          tenant_slug: string
          is_valid: boolean
          expires_at: string
          id: string
          preschool_id: string
          preschool_name: string
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

