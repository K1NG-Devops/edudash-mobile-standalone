import { supabase } from '@/lib/supabase';

export interface TeacherData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  preschool_id: string;
  role: 'teacher';
  is_active: boolean;
  auth_user_id?: string;
}

export interface CreateTeacherRequest {
  name: string;
  email: string;
  phone?: string;
  preschool_id: string;
}

export class TeacherService {
  /**
   * Get all teachers for a specific preschool
   */
  static async getTeachersByPreschool(preschoolId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          preschool_id,
          is_active,
          auth_user_id,
          created_at,
          classes:classes!teacher_id(
            id,
            name,
            room_number,
            current_enrollment,
            max_capacity
          )
        `)
        .eq('role', 'teacher')
        .eq('preschool_id', preschoolId)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error fetching teachers:', error);
      return { data: null, error };
    }
  }

    /**
   * Create a new teacher account
   */
  static async createTeacher(teacherData: CreateTeacherRequest) {
    try {
      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', teacherData.email)
        .maybeSingle();

      if (checkError) {
        log.warn('Error checking for existing user:', checkError);
        // Continue with creation attempt
      } else if (existingUsers) {
        return { data: null, error: 'A user with this email already exists' };
      }

      // Create teacher record - RLS policies will handle permissions
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: teacherData.email,
          name: teacherData.name,
          phone: teacherData.phone || null,
          role: 'teacher',
          preschool_id: teacherData.preschool_id,
          auth_user_id: null, // Will be set when they sign up
          is_active: false, // Pending until they complete signup
        })
        .select()
        .single();

      if (userError) {
        log.error('Error creating teacher:', userError);
        return { data: null, error: userError };
      }

      return { data: userData, error: null };
    } catch (error) {
      log.error('Error creating teacher:', error);
      return { data: null, error };
    }
  }

  /**
   * Invite teacher via email (alternative method)
   */
  static async inviteTeacher(teacherData: CreateTeacherRequest) {
    try {
      // Send invitation email using Supabase auth
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(
        teacherData.email,
        {
          redirectTo: `${window.location.origin}/auth/accept-invite`,
          data: {
            name: teacherData.name,
            role: 'teacher',
            preschool_id: teacherData.preschool_id,
            phone: teacherData.phone,
          }
        }
      );

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error inviting teacher:', error);
      return { data: null, error };
    }
  }

  /**
   * Update teacher information
   */
  static async updateTeacher(teacherId: string, updates: Partial<TeacherData>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', teacherId)
        .eq('role', 'teacher')
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error updating teacher:', error);
      return { data: null, error };
    }
  }

  /**
   * Deactivate teacher (soft delete)
   */
  static async deactivateTeacher(teacherId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', teacherId)
        .eq('role', 'teacher')
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error deactivating teacher:', error);
      return { data: null, error };
    }
  }

  /**
   * Assign teacher to a class
   */
  static async assignTeacherToClass(teacherId: string, classId: string) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({ teacher_id: teacherId })
        .eq('id', classId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error assigning teacher to class:', error);
      return { data: null, error };
    }
  }

  /**
   * Remove teacher from a class
   */
  static async removeTeacherFromClass(classId: string) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update({ teacher_id: null })
        .eq('id', classId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error removing teacher from class:', error);
      return { data: null, error };
    }
  }

  /**
   * Get teacher statistics for dashboard
   */
  static async getTeacherStats(preschoolId: string) {
    try {
      // Get total active teachers
      const { count: totalTeachers, error: teachersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher')
        .eq('preschool_id', preschoolId)
        .eq('is_active', true);

      if (teachersError) throw teachersError;

      // Get teachers with assigned classes
      const { data: teachersWithClasses, error: classesError } = await supabase
        .from('users')
        .select(`
          id,
          classes:classes!teacher_id(id)
        `)
        .eq('role', 'teacher')
        .eq('preschool_id', preschoolId)
        .eq('is_active', true);

      if (classesError) throw classesError;

      const teachersAssigned = teachersWithClasses?.filter(
        teacher => teacher.classes && teacher.classes.length > 0
      ).length || 0;

      const teachersUnassigned = (totalTeachers || 0) - teachersAssigned;

      return {
        data: {
          total: totalTeachers || 0,
          assigned: teachersAssigned,
          unassigned: teachersUnassigned,
        },
        error: null
      };
    } catch (error) {
      log.error('Error getting teacher stats:', error);
      return { data: null, error };
    }
  }
}
