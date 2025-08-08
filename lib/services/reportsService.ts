import { claudeService } from '@/lib/ai/claudeService';
import { createLogger } from '@/lib/utils/logger';
import { supabase } from '../supabase';
const log = createLogger('reports');

export interface ClassroomReport {
  id: string;
  preschool_id: string;
  teacher_id: string;
  student_id: string;
  class_id?: string | null;
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

  // AI-powered report generation
  static async generateReportWithAI(studentId: string, teacherId: string, reportType: 'daily' | 'weekly' | 'monthly', observationNotes: string[], activities: any[]): Promise<{
    learning_highlights: string;
    behavior_notes: string;
    skills_developed: string[];
    areas_for_improvement: string;
    parent_message: string;
    next_steps: string;
    mood_rating: number;
    participation_level: 'low' | 'moderate' | 'high' | 'excellent';
  }> {
    try {
      if (process.env.EXPO_PUBLIC_AI_ENABLED !== 'true') {
        // Fallback report generation without AI
        return {
          learning_highlights: 'Student participated in learning activities today.',
          behavior_notes: 'Student showed good behavior and followed classroom routines.',
          skills_developed: ['Social skills', 'Following instructions'],
          areas_for_improvement: 'Continue encouraging participation in group activities.',
          parent_message: 'Your child had a good day at school today!',
          next_steps: 'Continue supporting learning at home.',
          mood_rating: 4,
          participation_level: 'moderate'
        };
      }

      // Get student information for context
      const { data: studentInfo } = await supabase
        .from('students')
        .select('full_name, age, grade_level')
        .eq('id', studentId)
        .single();

      const studentName = (studentInfo as any)?.full_name || 'Student';
      const studentAge = (studentInfo as any)?.age || 4;
      const gradeLevel = (studentInfo as any)?.grade_level || 'Pre-K';

      const prompt = `
        As an experienced early childhood educator, create a ${reportType} report for ${studentName} (age ${studentAge}, ${gradeLevel}):
        
        Observation Notes: ${observationNotes.join('. ')}
        Activities Completed: ${activities.map(a => a.title || a.name).join(', ')}
        
        Please provide:
        1. Learning highlights (2-3 sentences about educational progress)
        2. Behavior observations (positive and constructive)
        3. 2-4 skills that were developed or practiced
        4. Areas for improvement (constructive and encouraging)
        5. A warm message to parents about their child's day/week
        6. Specific next steps for continued development
        7. Mood rating (1-5 scale, where 5 is excellent)
        8. Participation level (low/moderate/high/excellent)
        
        Keep the tone positive, professional, and age-appropriate.
        
        Format as JSON: {
          "learning_highlights": "string",
          "behavior_notes": "string",
          "skills_developed": ["skill1", "skill2"],
          "areas_for_improvement": "string",
          "parent_message": "string",
          "next_steps": "string",
          "mood_rating": number,
          "participation_level": "low"|"moderate"|"high"|"excellent"
        }
      `;

      const response = await claudeService.generateContent({
        prompt,
        type: 'report_generation',
        context: { studentId, reportType, studentAge, gradeLevel },
      });

      if (response.success && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (parseError) {
          console.warn('Failed to parse AI report response:', parseError);
          return {
            learning_highlights: response.content.slice(0, 150),
            behavior_notes: 'Student showed positive engagement in classroom activities.',
            skills_developed: ['Participation', 'Social interaction'],
            areas_for_improvement: 'Continue encouraging active participation.',
            parent_message: `${studentName} had a wonderful day learning and playing!`,
            next_steps: 'Support continued learning through play at home.',
            mood_rating: 4,
            participation_level: 'moderate'
          };
        }
      }

      throw new Error('AI report generation service unavailable');
    } catch (error) {
      console.error('Error generating AI report:', error);
      return {
        learning_highlights: 'Student engaged in educational activities and showed progress.',
        behavior_notes: 'Student demonstrated positive behavior and social skills.',
        skills_developed: ['Social skills', 'Learning engagement'],
        areas_for_improvement: 'Continue supporting skill development.',
        parent_message: 'Your child had a great day at school!',
        next_steps: 'Keep encouraging learning through play at home.',
        mood_rating: 4,
        participation_level: 'moderate'
      };
    }
  }

  // Generate comprehensive progress summary with AI
  static async generateProgressSummaryWithAI(studentId: string, periodDays: number = 30): Promise<{
    overallProgress: string;
    strengthAreas: string[];
    developmentAreas: string[];
    parentRecommendations: string[];
    milestoneProgress: string;
    socialEmotionalGrowth: string;
  }> {
    try {
      // Get recent reports for analysis
      const { data: reports } = await supabase
        .from('classroom_reports')
        .select('*')
        .eq('student_id', studentId)
        .gte('report_date', new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString())
        .order('report_date', { ascending: false });

      if (!reports || reports.length === 0) {
        return {
          overallProgress: 'Insufficient data to generate progress summary.',
          strengthAreas: ['Regular attendance'],
          developmentAreas: ['Continue building foundational skills'],
          parentRecommendations: ['Maintain consistent daily routines'],
          milestoneProgress: 'Assessment in progress.',
          socialEmotionalGrowth: 'Developing social skills through group activities.'
        };
      }

      if (process.env.EXPO_PUBLIC_AI_ENABLED !== 'true') {
        return {
          overallProgress: 'Student is making steady progress across developmental areas.',
          strengthAreas: ['Active participation', 'Social interaction'],
          developmentAreas: ['Fine motor skills', 'Language development'],
          parentRecommendations: ['Continue reading together', 'Practice counting at home'],
          milestoneProgress: 'On track for age-appropriate milestones.',
          socialEmotionalGrowth: 'Showing growth in emotional regulation and peer relationships.'
        };
      }

      const reportSummary = reports.map(r => ({
        date: r.report_date,
        highlights: r.learning_highlights,
        behavior: r.behavior_notes,
        skills: r.skills_developed,
        mood: r.mood_rating,
        participation: r.participation_level
      }));

      const prompt = `
        As an early childhood development specialist, analyze this student's progress over the past ${periodDays} days:
        
        Recent Reports: ${JSON.stringify(reportSummary, null, 2)}
        
        Provide a comprehensive analysis including:
        1. Overall progress summary (3-4 sentences)
        2. 3-4 key strength areas observed
        3. 2-3 areas for continued development
        4. 3-4 specific recommendations for parents
        5. Milestone progress assessment
        6. Social-emotional growth observations
        
        Format as JSON: {
          "overallProgress": "string",
          "strengthAreas": ["area1", "area2", "area3"],
          "developmentAreas": ["area1", "area2"],
          "parentRecommendations": ["rec1", "rec2", "rec3"],
          "milestoneProgress": "string",
          "socialEmotionalGrowth": "string"
        }
      `;

      const response = await claudeService.generateContent({
        prompt,
        type: 'progress_summary',
        context: { studentId, periodDays },
      });

      if (response.success && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (parseError) {
          console.warn('Failed to parse progress summary response:', parseError);
          return {
            overallProgress: response.content.slice(0, 200),
            strengthAreas: ['Active engagement', 'Positive attitude'],
            developmentAreas: ['Continued skill building'],
            parentRecommendations: ['Support learning at home', 'Encourage practice'],
            milestoneProgress: 'Making good progress toward age-appropriate goals.',
            socialEmotionalGrowth: 'Developing positive relationships and self-confidence.'
          };
        }
      }

      throw new Error('AI progress summary service unavailable');
    } catch (error) {
      console.error('Error generating progress summary:', error);
      return {
        overallProgress: 'Student continues to grow and learn in our program.',
        strengthAreas: ['Regular participation', 'Positive interactions'],
        developmentAreas: ['Skill development', 'Confidence building'],
        parentRecommendations: ['Continue supportive routines at home', 'Practice new skills together'],
        milestoneProgress: 'Working toward age-appropriate developmental milestones.',
        socialEmotionalGrowth: 'Building social skills and emotional awareness.'
      };
    }
  }

  // Create automated daily report with AI assistance
  static async createAIDailyReport(teacherId: string, studentId: string, preschoolId: string, observationNotes: string[], activities: any[]): Promise<{ data: ClassroomReport | null; error: any }> {
    try {
      const reportDate = new Date().toISOString().split('T')[0];

      // Generate AI-powered report content
      const aiReport = await this.generateReportWithAI(studentId, teacherId, 'daily', observationNotes, activities);

      // Create the report with AI-generated content
      const reportData = {
        preschool_id: preschoolId,
        teacher_id: teacherId,
        student_id: studentId,
        report_type: 'daily' as const,
        report_date: reportDate,
        activities_summary: activities,
        total_activities: activities.length,
        behavior_notes: aiReport.behavior_notes,
        mood_rating: aiReport.mood_rating,
        participation_level: aiReport.participation_level,
        learning_highlights: aiReport.learning_highlights,
        skills_developed: aiReport.skills_developed,
        areas_for_improvement: aiReport.areas_for_improvement,
        parent_message: aiReport.parent_message,
        next_steps: aiReport.next_steps,
        is_sent_to_parents: false,
      };

      const { data: report, error } = await supabase
        .from('classroom_reports')
        .upsert(reportData, {
          onConflict: 'student_id,report_date,report_type'
        })
        .select()
        .single();

      if (error) throw error;
      return { data: report, error: null };
    } catch (error) {
      console.error('Error creating AI daily report:', error);
      return { data: null, error };
    }
  }

}
