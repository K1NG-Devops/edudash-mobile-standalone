import { supabase } from '@/lib/supabase';

export interface Assessment {
  id: string;
  student_id: string;
  teacher_id: string;
  preschool_id: string;
  assessment_type: 'cognitive' | 'social' | 'physical' | 'emotional' | 'language';
  title: string;
  description?: string;
  score?: number;
  max_score?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F' | 'Pass' | 'Fail';
  notes?: string;
  assessment_date: string;
  skills_assessed: string[];
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  student?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  teacher?: {
    name: string;
    avatar_url?: string;
  };
}

export interface AssessmentTemplate {
  id: string;
  title: string;
  description?: string;
  assessment_type: Assessment['assessment_type'];
  skills: string[];
  max_score?: number;
  preschool_id: string;
  created_at: string;
}

export interface AssessmentSummary {
  total_assessments: number;
  completed_today: number;
  pending_assessments: number;
  average_score: number;
  assessments_by_type: {
    cognitive: number;
    social: number;
    physical: number;
    emotional: number;
    language: number;
  };
}

export class AssessmentsService {
  static async getTeacherAssessmentsSummary(
    teacherId: string,
    preschoolId: string
  ): Promise<{ data: AssessmentSummary | null; error: any }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all assessments for this teacher
      const { data: assessments, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('preschool_id', preschoolId);

      if (error) return { data: null, error };

      if (!assessments) {
        return {
          data: {
            total_assessments: 0,
            completed_today: 0,
            pending_assessments: 0,
            average_score: 0,
            assessments_by_type: {
              cognitive: 0,
              social: 0,
              physical: 0,
              emotional: 0,
              language: 0,
            },
          },
          error: null,
        };
      }

      const completedToday = assessments.filter(
        a => a.is_completed && a.assessment_date === today
      ).length;

      const pendingAssessments = assessments.filter(a => !a.is_completed).length;

      const completedAssessments = assessments.filter(a => a.is_completed && a.score !== null);
      const averageScore = completedAssessments.length > 0
        ? completedAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / completedAssessments.length
        : 0;

      const assessmentsByType = assessments.reduce((acc, assessment) => {
        acc[assessment.assessment_type] = (acc[assessment.assessment_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        data: {
          total_assessments: assessments.length,
          completed_today: completedToday,
          pending_assessments: pendingAssessments,
          average_score: Math.round(averageScore * 100) / 100,
          assessments_by_type: {
            cognitive: assessmentsByType.cognitive || 0,
            social: assessmentsByType.social || 0,
            physical: assessmentsByType.physical || 0,
            emotional: assessmentsByType.emotional || 0,
            language: assessmentsByType.language || 0,
          },
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async getRecentAssessments(
    teacherId: string,
    preschoolId: string,
    limit: number = 20
  ): Promise<{ data: Assessment[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          student:students!assessments_student_id_fkey(first_name, last_name, avatar_url),
          teacher:users!assessments_teacher_id_fkey(name, avatar_url)
        `)
        .eq('teacher_id', teacherId)
        .eq('preschool_id', preschoolId)
        .order('assessment_date', { ascending: false })
        .limit(limit);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async createAssessment(
    assessment: Omit<Assessment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: Assessment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .insert([assessment])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async updateAssessment(
    id: string,
    updates: Partial<Assessment>
  ): Promise<{ data: Assessment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async deleteAssessment(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async getAssessmentTemplates(
    preschoolId: string
  ): Promise<{ data: AssessmentTemplate[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('preschool_id', preschoolId)
        .order('title');

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async createAssessmentFromTemplate(
    templateId: string,
    studentIds: string[],
    teacherId: string,
    preschoolId: string,
    assessmentDate: string
  ): Promise<{ data: Assessment[] | null; error: any }> {
    try {
      // First get the template
      const { data: template, error: templateError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        return { data: null, error: templateError };
      }

      // Create assessments for each student
      const assessmentsToCreate = studentIds.map(studentId => ({
        student_id: studentId,
        teacher_id: teacherId,
        preschool_id: preschoolId,
        assessment_type: template.assessment_type,
        title: template.title,
        description: template.description,
        max_score: template.max_score,
        skills_assessed: template.skills,
        assessment_date: assessmentDate,
        is_completed: false,
      }));

      const { data, error } = await supabase
        .from('assessments')
        .insert(assessmentsToCreate)
        .select();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Mock data for development/testing
  static getMockAssessments(): Assessment[] {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return [
      {
        id: 'mock-1',
        student_id: 'student-1',
        teacher_id: 'teacher-1',
        preschool_id: 'preschool-1',
        assessment_type: 'cognitive',
        title: 'Number Recognition Assessment',
        description: 'Assessing ability to recognize numbers 1-10',
        score: 85,
        max_score: 100,
        grade: 'B',
        notes: 'Great progress with numbers 1-8, needs practice with 9-10',
        assessment_date: today,
        skills_assessed: ['Number Recognition', 'Counting', 'Basic Math'],
        is_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        student: {
          first_name: 'Emma',
          last_name: 'Johnson',
          avatar_url: null,
        },
        teacher: {
          name: 'Mrs. Smith',
          avatar_url: null,
        },
      },
      {
        id: 'mock-2',
        student_id: 'student-2',
        teacher_id: 'teacher-1',
        preschool_id: 'preschool-1',
        assessment_type: 'social',
        title: 'Social Skills Assessment',
        description: 'Evaluating peer interaction and sharing behaviors',
        score: 92,
        max_score: 100,
        grade: 'A',
        notes: 'Excellent sharing and cooperation during group activities',
        assessment_date: yesterday,
        skills_assessed: ['Sharing', 'Cooperation', 'Communication'],
        is_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        student: {
          first_name: 'Liam',
          last_name: 'Brown',
          avatar_url: null,
        },
        teacher: {
          name: 'Mrs. Smith',
          avatar_url: null,
        },
      },
      {
        id: 'mock-3',
        student_id: 'student-3',
        teacher_id: 'teacher-1',
        preschool_id: 'preschool-1',
        assessment_type: 'language',
        title: 'Vocabulary Assessment',
        description: 'Testing vocabulary comprehension and usage',
        score: null,
        max_score: 100,
        grade: null,
        notes: 'Assessment scheduled for completion',
        assessment_date: today,
        skills_assessed: ['Vocabulary', 'Comprehension', 'Expression'],
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        student: {
          first_name: 'Olivia',
          last_name: 'Davis',
          avatar_url: null,
        },
        teacher: {
          name: 'Mrs. Smith',
          avatar_url: null,
        },
      },
      {
        id: 'mock-4',
        student_id: 'student-4',
        teacher_id: 'teacher-1',
        preschool_id: 'preschool-1',
        assessment_type: 'physical',
        title: 'Fine Motor Skills Assessment',
        description: 'Evaluating pencil grip and drawing abilities',
        score: 78,
        max_score: 100,
        grade: 'C',
        notes: 'Good improvement in pencil grip, continue practicing cutting with scissors',
        assessment_date: yesterday,
        skills_assessed: ['Pencil Grip', 'Drawing', 'Cutting'],
        is_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        student: {
          first_name: 'Noah',
          last_name: 'Wilson',
          avatar_url: null,
        },
        teacher: {
          name: 'Mrs. Smith',
          avatar_url: null,
        },
      },
      {
        id: 'mock-5',
        student_id: 'student-5',
        teacher_id: 'teacher-1',
        preschool_id: 'preschool-1',
        assessment_type: 'emotional',
        title: 'Emotional Regulation Assessment',
        description: 'Assessing ability to manage emotions and transitions',
        score: null,
        max_score: 100,
        grade: null,
        notes: 'Pending assessment',
        assessment_date: today,
        skills_assessed: ['Self-Regulation', 'Transition Management', 'Emotional Expression'],
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        student: {
          first_name: 'Ava',
          last_name: 'Miller',
          avatar_url: null,
        },
        teacher: {
          name: 'Mrs. Smith',
          avatar_url: null,
        },
      },
    ];
  }

  static getMockAssessmentSummary(): AssessmentSummary {
    return {
      total_assessments: 15,
      completed_today: 2,
      pending_assessments: 3,
      average_score: 85.2,
      assessments_by_type: {
        cognitive: 4,
        social: 3,
        physical: 3,
        emotional: 2,
        language: 3,
      },
    };
  }
}
