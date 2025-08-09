/**
 * Teacher Data Service
 * Handles all teacher-related database operations for EduDash Pro
 * Includes class management, student tracking, homework assignments, and communication
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/utils/logger';
const log = createLogger('teacher');
import { Database } from '@/types/database';

type Tables = Database['public']['Tables'];
type Student = Tables['students']['Row'];
type Class = Tables['classes']['Row'];
type User = Tables['users']['Row'];
type HomeworkAssignment = Tables['homework_assignments']['Row'];

export interface TeacherClass extends Class {
  student_count: number;
  students: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    attendance_rate: number;
    recent_activities: number;
  }[];
  age_group_name: string;
  age_group_description: string;
}

export interface TeacherStudent {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  age: number;
  date_of_birth: string;
  class_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  attendance_rate: number;
  recent_homework_submissions: number;
  recent_activities_completed: number;
  recent_achievements: string[];
  special_notes: string[];
  allergies: string | null;
  medical_conditions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export interface TeacherDashboardData {
  classes: TeacherClass[];
  total_students: number;
  recent_activities: {
    id: string;
    type: 'homework_graded' | 'message_sent' | 'report_created' | 'activity_completed';
    title: string;
    description: string;
    timestamp: string;
    student_name?: string;
    class_name?: string;
  }[];
  pending_tasks: {
    id: string;
    type: 'homework_review' | 'parent_message' | 'report_due' | 'meeting_scheduled';
    title: string;
    description: string;
    due_date: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  daily_summary: {
    homework_reviewed: number;
    messages_sent: number;
    reports_created: number;
    video_calls_completed: number;
  };
}

export class TeacherDataService {

  /**
   * Get teacher's classes with detailed student information
   */
  static async getTeacherClasses(teacherUserId: string): Promise<TeacherClass[]> {
    try {
      console.log('👩‍🏫 [TeacherService] Fetching classes for teacher:', teacherUserId);

      // First get the teacher's profile
      const { data: teacherProfile, error: teacherError } = await supabase
        .from('users')
        .select('id, name, preschool_id')
        .eq('auth_user_id', teacherUserId)
        .single();

      if (teacherError || !teacherProfile) {
        console.error('❌ [TeacherService] Teacher not found:', teacherError);
        return [];
      }

      // Get classes assigned to this teacher
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          age_groups (
            id,
            name,
            description
          ),
          students (
            id,
            first_name,
            last_name,
            date_of_birth,
            is_active
          )
        `)
        .eq('teacher_id', teacherProfile.id)
        .eq('is_active', true);

      if (classesError) {
        console.error('❌ [TeacherService] Failed to fetch classes:', classesError);
        return [];
      }

      if (!classesData || classesData.length === 0) {
        console.log('ℹ️ [TeacherService] No active classes found for teacher');
        return [];
      }

      // Transform data to enhanced class format
      const teacherClasses: TeacherClass[] = await Promise.all(
        classesData.map(async (classData: any) => {
          const activeStudents = classData.students.filter((s: any) => s.is_active);
          
          // Get enhanced student data with metrics
          const studentsWithMetrics = await Promise.all(
            activeStudents.map(async (student: any) => {
              const age = this.calculateAge(student.date_of_birth);
              const attendanceRate = await this.calculateStudentAttendanceRate(student.id);
              const recentActivities = await this.getRecentActivitiesCount(student.id);

              return {
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                age: age,
                attendance_rate: attendanceRate,
                recent_activities: recentActivities
              };
            })
          );

          const enhancedClass: TeacherClass = {
            ...classData,
            student_count: activeStudents.length,
            students: studentsWithMetrics,
            age_group_name: classData.age_groups?.name || 'Unknown',
            age_group_description: classData.age_groups?.description || ''
          };

          return enhancedClass;
        })
      );

      console.log(`✅ [TeacherService] Successfully fetched ${teacherClasses.length} classes`);
      return teacherClasses;

    } catch (error) {
      console.error('❌ [TeacherService] Unexpected error:', error);
      return [];
    }
  }

  /**
   * Get detailed information about students in teacher's classes
   */
  static async getTeacherStudents(teacherUserId: string): Promise<TeacherStudent[]> {
    try {
      console.log('📚 [TeacherService] Fetching students for teacher:', teacherUserId);

      const classes = await this.getTeacherClasses(teacherUserId);
      const allStudents: TeacherStudent[] = [];

      for (const classData of classes) {
        for (const student of classData.students) {
          // Get detailed student information
          const { data: studentDetails, error: studentError } = await supabase
            .from('students')
            .select(`
              *,
              users!students_parent_id_fkey (
                name,
                email,
                phone
              )
            `)
            .eq('id', student.id)
            .single();

          if (studentError || !studentDetails) {
            console.warn('⚠️ Could not fetch details for student:', student.id);
            continue;
          }

          // Get homework statistics
      const homeworkStats = await this.getStudentHomeworkStats(student.id);
          
          // Get achievements
          const achievements = await this.getStudentAchievements(student.id);

          const enhancedStudent: TeacherStudent = {
            id: student.id,
            first_name: studentDetails.first_name,
            last_name: studentDetails.last_name,
            full_name: `${studentDetails.first_name} ${studentDetails.last_name}`,
            age: student.age,
            date_of_birth: studentDetails.date_of_birth,
            class_name: classData.name,
            parent_name: studentDetails.users?.name || 'Unknown Parent',
            parent_email: studentDetails.users?.email || '',
            parent_phone: studentDetails.users?.phone || '',
            attendance_rate: student.attendance_rate,
            recent_homework_submissions: homeworkStats.recent_submissions,
            recent_activities_completed: student.recent_activities,
            recent_achievements: achievements,
            special_notes: this.getSpecialNotes(studentDetails),
            allergies: studentDetails.allergies,
            medical_conditions: studentDetails.medical_conditions,
            emergency_contact_name: studentDetails.emergency_contact_name,
            emergency_contact_phone: studentDetails.emergency_contact_phone
          };

          allStudents.push(enhancedStudent);
        }
      }

      console.log(`✅ [TeacherService] Successfully fetched ${allStudents.length} students`);
      return allStudents;

    } catch (error) {
      console.error('❌ [TeacherService] Error fetching students:', error);
      return [];
    }
  }

  /**
   * Get comprehensive teacher dashboard data
   */
  static async getTeacherDashboardData(teacherUserId: string): Promise<TeacherDashboardData> {
    try {
      console.log('🏠 [TeacherService] Fetching teacher dashboard data');

      // Get classes
      const classes = await this.getTeacherClasses(teacherUserId);
      
      // Calculate total students
      const totalStudents = classes.reduce((sum, cls) => sum + cls.student_count, 0);

      // Get recent activities
      const recentActivities = await this.getTeacherRecentActivities(teacherUserId);
      
      // Get pending tasks
      const pendingTasks = await this.getTeacherPendingTasks(teacherUserId);
      
      // Get daily summary
      const dailySummary = await this.getTeacherDailySummary(teacherUserId);

      return {
        classes,
        total_students: totalStudents,
        recent_activities: recentActivities,
        pending_tasks: pendingTasks,
        daily_summary: dailySummary
      };
    } catch (error) {
      console.error('❌ [TeacherService] Error fetching dashboard data:', error);
      return {
        classes: [],
        total_students: 0,
        recent_activities: [],
        pending_tasks: [],
        daily_summary: {
          homework_reviewed: 0,
          messages_sent: 0,
          reports_created: 0,
          video_calls_completed: 0
        }
      };
    }
  }

  /**
   * Create a new homework assignment
   */
  static async createHomeworkAssignment(
    teacherUserId: string, 
    assignmentData: {
      title?: string;
      description: string;
      instructions: string;
      class_id?: string;
      due_date_offset_days: number;
      estimated_time_minutes?: number;
      materials_needed?: string;
      difficulty_level?: number;
    }
  ): Promise<{ success: boolean; assignment_id?: string; error?: string }> {
    try {
      // Get teacher profile
      const { data: teacherProfile, error: teacherError } = await supabase
        .from('users')
        .select('id, preschool_id')
        .eq('auth_user_id', teacherUserId)
        .single();

      if (teacherError || !teacherProfile) {
        return { success: false, error: 'Teacher not found' };
      }

      // Create homework assignment
      const { data, error } = await supabase
        .from('homework_assignments')
        .insert({
          // Some schemas may not require title; include only if provided
          ...(assignmentData.title ? { title: assignmentData.title } : {}),
          description: assignmentData.description,
          instructions: assignmentData.instructions,
          teacher_id: teacherProfile.id,
          preschool_id: teacherProfile.preschool_id,
          class_id: assignmentData.class_id ?? undefined as unknown as string,
          due_date_offset_days: assignmentData.due_date_offset_days,
          estimated_time_minutes: assignmentData.estimated_time_minutes,
          materials_needed: assignmentData.materials_needed,
          difficulty_level: assignmentData.difficulty_level,
          is_active: true
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error creating homework assignment:', error);
        return { success: false, error: error.message };
      }

      return { success: true, assignment_id: data.id };
    } catch (error) {
      console.error('❌ Unexpected error creating homework:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Helper methods
   */

  static calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  static async calculateStudentAttendanceRate(studentId: string): Promise<number> {
    // Placeholder - would integrate with actual attendance system
    return Math.floor(Math.random() * 30) + 70; // 70-100%
  }

  static async getRecentActivitiesCount(studentId: string): Promise<number> {
    // Placeholder - would query actual activity completion records
    return Math.floor(Math.random() * 10) + 2; // 2-12 activities
  }

  static async getStudentHomeworkStats(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('id, status, submitted_at')
        .eq('student_id', studentId);

      if (error || !data) {
        return { recent_submissions: 0, completion_rate: 0 };
      }

      // Count recent submissions (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentSubmissions = data.filter(sub => 
        sub.submitted_at && new Date(sub.submitted_at) > weekAgo
      ).length;

      return {
        recent_submissions: recentSubmissions,
        completion_rate: data.length > 0 ? 
          Math.round((data.filter(s => s.status === 'completed').length / data.length) * 100) : 0
      };
    } catch (error) {
      return { recent_submissions: 0, completion_rate: 0 };
    }
  }

  static async getStudentAchievements(studentId: string): Promise<string[]> {
    // Placeholder for achievements system
    const achievements = [
      'Completed math worksheet',
      'Helped a classmate',
      'Perfect attendance this week',
      'Great participation in story time'
    ];
    
    const count = Math.floor(Math.random() * 3);
    return achievements.slice(0, count);
  }

  static getSpecialNotes(studentDetails: any): string[] {
    const notes: string[] = [];
    
    if (studentDetails.allergies) {
      notes.push(`Allergies: ${studentDetails.allergies}`);
    }
    
    if (studentDetails.medical_conditions) {
      notes.push(`Medical: ${studentDetails.medical_conditions}`);
    }
    
    if (studentDetails.special_needs) {
      notes.push(`Special needs: ${studentDetails.special_needs}`);
    }

    if (studentDetails.dietary_restrictions) {
      notes.push(`Dietary: ${studentDetails.dietary_restrictions}`);
    }

    return notes;
  }

  static async getTeacherRecentActivities(teacherUserId: string) {
    // Placeholder for recent activities
    return [
      {
        id: '1',
        type: 'homework_graded' as const,
        title: 'Graded math worksheets',
        description: 'Reviewed and provided feedback for 15 students',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        class_name: 'Preschool A'
      },
      {
        id: '2',
        type: 'message_sent' as const,
        title: 'Parent communication',
        description: 'Sent update about Emma\'s great day',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        student_name: 'Emma Johnson'
      },
      {
        id: '3',
        type: 'report_created' as const,
        title: 'Weekly progress reports',
        description: 'Created development reports for all students',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        class_name: 'Preschool A'
      }
    ];
  }

  static async getTeacherPendingTasks(teacherUserId: string) {
    // Placeholder for pending tasks
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        id: '1',
        type: 'homework_review' as const,
        title: 'Review art projects',
        description: '5 art projects need grading and feedback',
        due_date: tomorrow.toISOString(),
        priority: 'medium' as const
      },
      {
        id: '2',
        type: 'parent_message' as const,
        title: 'Parent meeting follow-up',
        description: 'Send summary to parents after today\'s meetings',
        due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        priority: 'high' as const
      },
      {
        id: '3',
        type: 'report_due' as const,
        title: 'Monthly assessment reports',
        description: 'Complete developmental assessments for all students',
        due_date: new Date(Date.now() + 259200000).toISOString(), // 3 days
        priority: 'low' as const
      }
    ];
  }

  static async getTeacherDailySummary(teacherUserId: string) {
    // Placeholder for daily summary - would be calculated from actual data
    return {
      homework_reviewed: Math.floor(Math.random() * 10) + 2,
      messages_sent: Math.floor(Math.random() * 8) + 1,
      reports_created: Math.floor(Math.random() * 5),
      video_calls_completed: Math.floor(Math.random() * 3)
    };
  }
}
