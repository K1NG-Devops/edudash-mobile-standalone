/**
 * Student Data Service
 * Handles all student-related database operations for EduDash Pro
 * Includes attendance tracking, progress monitoring, and parent-child relationships
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/utils/logger';
import { Database } from '@/types/database';
const log = createLogger('student');

type Tables = Database['public']['Tables'];
type Student = Tables['students']['Row'];
type Class = Tables['classes']['Row'];
type User = Tables['users']['Row'];

// Enhanced student interface with calculated fields
export interface EnhancedStudent extends Student {
  // Basic info
  full_name: string;
  age: number;
  
  // Class and teacher info
  class_name: string | null;
  teacher_name: string | null;
  teacher_id: string | null;
  room_number: string | null;
  
  // Progress metrics
  attendance_percentage: number;
  completed_activities: number;
  pending_homework: number;
  recent_achievements: string[];
  
  // Parent/guardian info
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  
  // Age group info
  age_group_name: string | null;
  age_group_description: string | null;
}

export interface StudentProgressData {
  student_id: string;
  weekly_progress: number;
  monthly_progress: number;
  skills_gained: number;
  activities_completed: number;
  homework_completion_rate: number;
  attendance_rate: number;
  mood_ratings: {
    date: string;
    rating: number; // 1-5
  }[];
  recent_achievements: {
    title: string;
    description: string;
    date: string;
    category: string;
  }[];
}

export interface ParentDashboardData {
  children: EnhancedStudent[];
  recent_updates: {
    id: string;
    type: 'homework' | 'activity' | 'message' | 'announcement' | 'achievement';
    title: string;
    description: string;
    timestamp: string;
    student_id: string;
    icon: string;
  }[];
  upcoming_events: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'assignment' | 'activity' | 'meeting' | 'event';
    location?: string;
    student_id?: string;
  }[];
}

export class StudentDataService {
  
  /**
   * Get all students for a parent user
   */
  static async getStudentsForParent(parentUserId: string): Promise<EnhancedStudent[]> {
    try {

      // First get the parent's profile
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id, name, email, phone, preschool_id')
        .eq('auth_user_id', parentUserId)
        .single();

      if (parentError || !parentProfile) {
        log.error('❌ [StudentService] Parent not found:', parentError);
        return [];
      }

      // Get students with all related info
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          classes (
            id,
            name,
            room_number,
            teacher_id,
            users!classes_teacher_id_fkey (
              id,
              name,
              email
            )
          ),
          age_groups (
            id,
            name,
            description
          )
        `)
        .eq('parent_id', parentProfile.id)
        .eq('is_active', true);

      if (studentsError) {
        log.error('❌ [StudentService] Failed to fetch students:', studentsError);
        return [];
      }

      if (!studentsData || studentsData.length === 0) {

        return [];
      }

      // Transform data to enhanced student format
      const enhancedStudents: EnhancedStudent[] = await Promise.all(
        studentsData.map(async (student: any) => {
          const age = this.calculateAge(student.date_of_birth);
          const fullName = `${student.first_name} ${student.last_name}`.trim();
          
          // Get attendance data (simplified for now)
          const attendanceRate = await this.calculateAttendanceRate(student.id);
          
          // Get activity completion data
          const completedActivities = await this.getCompletedActivitiesCount(student.id);
          
          // Get pending homework count
          const pendingHomework = await this.getPendingHomeworkCount(student.id);
          
          // Get recent achievements (placeholder for now)
          const recentAchievements = await this.getRecentAchievements(student.id);

          const enhanced: EnhancedStudent = {
            ...student,
            full_name: fullName,
            age: age,
            class_name: student.classes?.name || null,
            teacher_name: student.classes?.users?.name || null,
            teacher_id: student.classes?.teacher_id || null,
            room_number: student.classes?.room_number || null,
            attendance_percentage: attendanceRate,
            completed_activities: completedActivities,
            pending_homework: pendingHomework,
            recent_achievements: recentAchievements,
            parent_name: parentProfile.name,
            parent_email: parentProfile.email,
            parent_phone: parentProfile.phone,
            age_group_name: student.age_groups?.name || null,
            age_group_description: student.age_groups?.description || null,
          };

          return enhanced;
        })
      );

      return enhancedStudents;

    } catch (error) {
      log.error('❌ [StudentService] Unexpected error:', error);
      return [];
    }
  }

  /**
   * Get comprehensive progress data for a student
   */
  static async getStudentProgress(studentId: string): Promise<StudentProgressData | null> {
    try {

      // Get basic progress metrics
      const [
        attendanceRate,
        completedActivities,
        homeworkStats,
        achievements
      ] = await Promise.all([
        this.calculateAttendanceRate(studentId),
        this.getCompletedActivitiesCount(studentId),
        this.getHomeworkCompletionStats(studentId),
        this.getDetailedAchievements(studentId)
      ]);

      // Calculate skills gained (simplified - could be more sophisticated)
      const skillsGained = Math.floor(completedActivities * 0.3); // Rough estimate
      
      // Mock mood data for now (would come from actual mood tracking)
      const moodRatings = this.generateMockMoodData();

      const progressData: StudentProgressData = {
        student_id: studentId,
        weekly_progress: this.calculateWeeklyProgress(completedActivities, homeworkStats.completion_rate),
        monthly_progress: this.calculateMonthlyProgress(attendanceRate, completedActivities),
        skills_gained: skillsGained,
        activities_completed: completedActivities,
        homework_completion_rate: homeworkStats.completion_rate,
        attendance_rate: attendanceRate,
        mood_ratings: moodRatings,
        recent_achievements: achievements
      };

      return progressData;
    } catch (error) {
      log.error('❌ [StudentService] Error fetching student progress:', error);
      return null;
    }
  }

  /**
   * Get comprehensive parent dashboard data
   */
  static async getParentDashboardData(parentUserId: string): Promise<ParentDashboardData> {
    try {

      // Get children
      const children = await this.getStudentsForParent(parentUserId);
      
      // Get recent updates for all children
      const recentUpdates = await this.getRecentUpdates(children.map(c => c.id));
      
      // Get upcoming events
      const upcomingEvents = await this.getUpcomingEvents(children.map(c => c.id));

      return {
        children,
        recent_updates: recentUpdates,
        upcoming_events: upcomingEvents
      };
    } catch (error) {
      log.error('❌ [StudentService] Error fetching dashboard data:', error);
      return {
        children: [],
        recent_updates: [],
        upcoming_events: []
      };
    }
  }

  /**
   * Calculate student's age from date of birth
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

  /**
   * Calculate attendance rate (placeholder - would integrate with actual attendance system)
   */
  static async calculateAttendanceRate(studentId: string): Promise<number> {
    // Until attendance tracking is implemented, return 0 (no mock values)
    return 0;
  }

  /**
   * Get completed activities count
   */
  static async getCompletedActivitiesCount(studentId: string): Promise<number> {
    // Until activity tracking is implemented, return 0 (no mock values)
    return 0;
  }

  /**
   * Get pending homework count
   */
  static async getPendingHomeworkCount(studentId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('id')
        .eq('student_id', studentId)
        .eq('status', 'pending');

      if (error) {
        log.error('Error fetching pending homework:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      log.error('Error in getPendingHomeworkCount:', error);
      return 0;
    }
  }

  /**
   * Get recent achievements for student
   */
  static async getRecentAchievements(studentId: string): Promise<string[]> {
    // No mock achievements
    return [];
  }

  /**
   * Get detailed achievements with metadata
   */
  static async getDetailedAchievements(studentId: string) {
    // No mock detailed achievements
    return [] as any[];
  }

  /**
   * Get homework completion statistics
   */
  static async getHomeworkCompletionStats(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('status')
        .eq('student_id', studentId);

      if (error || !data) {
        return { completion_rate: 0, total: 0, completed: 0 };
      }

      const total = data.length;
      const completed = data.filter(sub => sub.status === 'completed').length;
      const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completion_rate, total, completed };
    } catch (error) {
      log.error('Error in getHomeworkCompletionStats:', error);
      return { completion_rate: 0, total: 0, completed: 0 };
    }
  }

  /**
   * Calculate weekly progress percentage
   */
  static calculateWeeklyProgress(activitiesCompleted: number, homeworkRate: number): number {
    // Simple calculation - could be more sophisticated
    const activityScore = Math.min(activitiesCompleted * 10, 50); // Max 50 points
    const homeworkScore = Math.min(homeworkRate, 50); // Max 50 points
    return Math.min(activityScore + homeworkScore, 100);
  }

  /**
   * Calculate monthly progress percentage
   */
  static calculateMonthlyProgress(attendanceRate: number, activitiesCompleted: number): number {
    // Weight attendance higher for monthly view
    const attendanceScore = attendanceRate * 0.6;
    const activityScore = Math.min(activitiesCompleted * 2, 40); // Max 40 points
    return Math.min(attendanceScore + activityScore, 100);
  }

  /**
   * Generate mock mood data (would be real mood tracking in production)
   */
  static generateMockMoodData() {
    // Remove mock mood data
    return [] as { date: string; rating: number }[];
  }

  /**
   * Get recent updates for students
   */
  static async getRecentUpdates(studentIds: string[]) {
    // No mock updates until real aggregation is implemented
    return [] as any[];
  }

  /**
   * Get upcoming events for students
   */
  static async getUpcomingEvents(studentIds: string[]) {
    // No mock events until real events source is implemented
    return [] as any[];
  }
}
