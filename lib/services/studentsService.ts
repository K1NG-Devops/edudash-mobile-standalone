import { supabase } from '@/lib/supabase';

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  parent_id: string;
  preschool_id: string;
  class_id?: string;
  age_group_id: string;
  gender?: string;
  medical_conditions?: string;
  allergies?: string;
  emergency_contact_1_name?: string;
  emergency_contact_1_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

export class StudentsService {
  // Get students by teacher
  static async getStudentsByTeacher(teacherId: string, preschoolId: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('preschool_id', preschoolId)
        .eq('is_active', true);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching students by teacher:', error);
      return { data: null, error };
    }
  }

  // Get student by ID
  static async getStudentById(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching student by ID:', error);
      return { data: null, error };
    }
  }

  // Get students by parent
  static async getStudentsByParent(parentId: string, preschoolId: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', parentId)
        .eq('preschool_id', preschoolId)
        .eq('is_active', true);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching students by parent:', error);
      return { data: null, error };
    }
  }

  // Get all students in preschool
  static async getStudentsByPreschool(preschoolId: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          parent:users!students_parent_id_fkey(name, email, phone),
          class:classes!students_class_id_fkey(name)
        `)
        .eq('preschool_id', preschoolId)
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching students by preschool:', error);
      return { data: null, error };
    }
  }

  // Create new student
  static async createStudent(studentData: Partial<Student>) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating student:', error);
      return { data: null, error };
    }
  }

  // Update student
  static async updateStudent(studentId: string, updates: Partial<Student>) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating student:', error);
      return { data: null, error };
    }
  }

  // Delete student (soft delete)
  static async deleteStudent(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting student:', error);
      return { data: null, error };
    }
  }

  // Get student statistics
  static async getStudentStats(preschoolId: string) {
    try {
      const [totalStudents, activeStudents, byAgeGroup] = await Promise.all([
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('preschool_id', preschoolId),
        
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('preschool_id', preschoolId)
          .eq('is_active', true),
        
        supabase
          .from('students')
          .select(`
            age_group_id,
            age_groups!students_age_group_id_fkey(name)
          `)
          .eq('preschool_id', preschoolId)
          .eq('is_active', true)
      ]);

      return {
        data: {
          total: totalStudents.count || 0,
          active: activeStudents.count || 0,
          byAgeGroup: byAgeGroup.data || []
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching student stats:', error);
      return { data: null, error };
    }
  }
}
