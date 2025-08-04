import { supabase } from '@/lib/supabase';

export interface ClassroomReport {
  id: string;
  preschool_id: string;
  teacher_id: string;
  student_id: string;
  class_id?: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  report_date: string;
  
  // Activity Summary
  activities_summary: any;
  total_activities: number;
  
  // Behavioral Observations
  behavior_notes?: string;
  mood_rating?: number; // 1-5 scale
  participation_level?: 'low' | 'moderate' | 'high' | 'excellent';
  social_interactions?: string;
  
  // Learning Progress
  learning_highlights?: string;
  skills_developed?: string[];
  areas_for_improvement?: string;
  achievement_badges?: string[];
  
  // Daily Care
  meals_eaten?: string[];
  nap_time_start?: string;
  nap_time_end?: string;
  diaper_changes?: number;
  bathroom_visits?: number;
  
  // Health & Wellness
  health_observations?: string;
  incidents?: string;
  medications_given?: string[];
  temperature_checks?: any[];
  
  // Parent Communication
  parent_message?: string;
  follow_up_needed?: boolean;
  next_steps?: string;
  
  // Media & Photos
  media_highlights?: string[];
  photo_count?: number;
  
  // Status
  is_sent_to_parents: boolean;
  sent_at?: string;
  parent_viewed_at?: string;
  parent_acknowledgment?: string;
  
  created_at: string;
  updated_at: string;
  
  // Related data
  teacher?: {
    name: string;
    avatar_url?: string;
  };
  student?: {
    first_name: string;
    last_name: string;
  };
}

export class ReportsService {
  // Create a new daily/weekly report
  static async createReport(
    teacherId: string,
    preschoolId: string,
    studentId: string,
    reportType: 'daily' | 'weekly' | 'monthly',
    reportDate: string,
    reportData: Partial<ClassroomReport>
  ) {
    try {
      const { data: report, error } = await supabase
        .from('classroom_reports')
        .insert({
          preschool_id: preschoolId,
          teacher_id: teacherId,
          student_id: studentId,
          report_type: reportType,
          report_date: reportDate,
          ...reportData,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: report, error: null };
    } catch (error) {
      console.error('Error creating report:', error);
      return { data: null, error };
    }
  }

  // Get reports for a specific student
  static async getStudentReports(
    studentId: string,
    preschoolId: string,
    reportType?: 'daily' | 'weekly' | 'monthly',
    limit = 30
  ) {
    try {
      let query = supabase
        .from('classroom_reports')
        .select(`
          *,
          teacher:users!classroom_reports_teacher_id_fkey(name, avatar_url),
          student:students!classroom_reports_student_id_fkey(first_name, last_name)
        `)
        .eq('student_id', studentId)
        .eq('preschool_id', preschoolId)
        .order('report_date', { ascending: false })
        .limit(limit);

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching student reports:', error);
      return { data: null, error };
    }
  }

  // Get a specific report by ID
  static async getReportById(reportId: string) {
    try {
      const { data, error } = await supabase
        .from('classroom_reports')
        .select(`
          *,
          teacher:users!classroom_reports_teacher_id_fkey(name, avatar_url),
          student:students!classroom_reports_student_id_fkey(first_name, last_name)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      return { data: null, error };
    }
  }

  // Get all reports for parent's children
  static async getParentReports(
    parentId: string,
    preschoolId: string,
    reportType?: 'daily' | 'weekly' | 'monthly',
    limit = 50
  ) {
    try {
      let query = supabase
        .from('classroom_reports')
        .select(`
          *,
          teacher:users!classroom_reports_teacher_id_fkey(name, avatar_url),
          student:students!classroom_reports_student_id_fkey(first_name, last_name, parent_id)
        `)
        .eq('preschool_id', preschoolId)
        .eq('student.parent_id', parentId)
        .order('report_date', { ascending: false })
        .limit(limit);

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching parent reports:', error);
      return { data: null, error };
    }
  }

  // Mark report as viewed by parent
  static async markReportAsViewed(reportId: string, parentId: string) {
    try {
      const { error } = await supabase
        .from('classroom_reports')
        .update({
          parent_viewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error marking report as viewed:', error);
      return { error };
    }
  }

  // Add parent acknowledgment to report
  static async addParentAcknowledgment(reportId: string, acknowledgment: string) {
    try {
      const { error } = await supabase
        .from('classroom_reports')
        .update({
          parent_acknowledgment: acknowledgment,
        })
        .eq('id', reportId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error adding parent acknowledgment:', error);
      return { error };
    }
  }

  // Send report to parents
  static async sendReportToParents(reportId: string) {
    try {
      const { error } = await supabase
        .from('classroom_reports')
        .update({
          is_sent_to_parents: true,
          sent_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error sending report to parents:', error);
      return { error };
    }
  }

  // Get reports summary for teacher dashboard
  static async getTeacherReportsSummary(teacherId: string, preschoolId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get counts for different periods
      const [dailyReports, weeklyReports, pendingReports] = await Promise.all([
        supabase
          .from('classroom_reports')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', teacherId)
          .eq('preschool_id', preschoolId)
          .eq('report_type', 'daily')
          .eq('report_date', today),
        
        supabase
          .from('classroom_reports')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', teacherId)
          .eq('preschool_id', preschoolId)
          .eq('report_type', 'weekly')
          .gte('report_date', weekAgo),
        
        supabase
          .from('classroom_reports')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', teacherId)
          .eq('preschool_id', preschoolId)
          .eq('is_sent_to_parents', false)
      ]);

      return {
        data: {
          daily_reports_today: dailyReports.count || 0,
          weekly_reports_this_week: weeklyReports.count || 0,
          pending_reports: pendingReports.count || 0,
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching teacher reports summary:', error);
      return { data: null, error };
    }
  }

  // Get recent activity highlights for a student
  static async getStudentActivityHighlights(
    studentId: string,
    preschoolId: string,
    days = 7
  ) {
    try {
      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('classroom_reports')
        .select(`
          report_date,
          learning_highlights,
          skills_developed,
          achievement_badges,
          mood_rating,
          participation_level,
          media_highlights,
          teacher:users!classroom_reports_teacher_id_fkey(name)
        `)
        .eq('student_id', studentId)
        .eq('preschool_id', preschoolId)
        .gte('report_date', dateFrom)
        .order('report_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching student activity highlights:', error);
      return { data: null, error };
    }
  }

  // Create automated daily report template
  static async createDailyReportTemplate(
    teacherId: string,
    preschoolId: string,
    studentIds: string[],
    classId?: string
  ) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const reportTemplates = studentIds.map(studentId => ({
        preschool_id: preschoolId,
        teacher_id: teacherId,
        student_id: studentId,
        class_id: classId,
        report_type: 'daily' as const,
        report_date: today,
        activities_summary: {},
        total_activities: 0,
        mood_rating: 3,
        participation_level: 'moderate' as const,
        is_sent_to_parents: false,
      }));

      const { data, error } = await supabase
        .from('classroom_reports')
        .upsert(reportTemplates, {
          onConflict: 'student_id,report_date,report_type',
          ignoreDuplicates: true
        })
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating daily report templates:', error);
      return { data: null, error };
    }
  }

  // Update an existing report
  static async updateReport(reportId: string, updates: Partial<ClassroomReport>) {
    try {
      const { error } = await supabase
        .from('classroom_reports')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', reportId);

      return { error };
    } catch (error) {
      console.error('Error updating report:', error);
      return { error };
    }
  }

  // Get mock reports data for development/testing
  static getMockReports(): ClassroomReport[] {
    return [
      {
        id: 'mock-1',
        preschool_id: 'preschool-1',
        teacher_id: 'teacher-1',
        student_id: 'student-1',
        report_type: 'daily',
        report_date: '2025-08-03',
        activities_summary: [],
        total_activities: 3,
        behavior_notes: 'Very active and social',
        learning_highlights: 'Improved in math skills',
        skills_developed: ['math', 'reading'],
        is_sent_to_parents: true,
        sent_at: '2025-08-03',
        created_at: '2025-08-03',
        updated_at: '2025-08-03',
        teacher: {
          name: 'Mr. Smith',
          avatar_url: null,
        },
        student: {
          first_name: 'Alice',
          last_name: 'Johnson',
        },
      },
      {
        id: 'mock-2',
        preschool_id: 'preschool-1',
        teacher_id: 'teacher-1',
        student_id: 'student-2',
        report_type: 'weekly',
        report_date: '2025-07-30',
        activities_summary: [],
        total_activities: 5,
        behavior_notes: 'Quiet and observant',
        learning_highlights: 'Great progress in art',
        skills_developed: ['art', 'creativity'],
        is_sent_to_parents: false,
        created_at: '2025-07-30',
        updated_at: '2025-07-30',
        teacher: {
          name: 'Miss Green',
          avatar_url: null,
        },
        student: {
          first_name: 'Bob',
          last_name: 'Brown',
        },
      }
    ];
  }

  static getMockReportsSummary() {
    return {
      daily_reports_today: 1,
      weekly_reports_this_week: 1,
      pending_reports: 1,
    };
  }

}
