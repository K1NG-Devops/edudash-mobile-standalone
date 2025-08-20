/* eslint-disable */
// @ts-nocheck
import { claudeService } from '@/lib/ai/claudeService';
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
        .from('assessments' as any)
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
        .from('assessments' as any)
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
        .from('assessments' as any)
        .insert([assessment as any])
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
        .from('assessments' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
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
        .from('assessments' as any)
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
        .from('assessments' as any)
        .insert(assessmentsToCreate)
        .select();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // AI-powered assessment scoring and analysis
  static async scoreAssessmentWithAI(assessmentId: string, observationNotes: string, skillsAssessed: string[], assessmentType: Assessment['assessment_type'], studentAge: number): Promise<{
    score: number;
    grade: Assessment['grade'];
    feedback: string;
    strengths: string[];
    developmentAreas: string[];
    recommendations: string[];
  }> {
    try {
      if (process.env.EXPO_PUBLIC_AI_ENABLED !== 'true') {
        // Fallback scoring without AI
        return {
          score: 75,
          grade: 'B',
          feedback: 'Student shows good understanding and effort in the assessed skills.',
          strengths: ['Shows effort and engagement', 'Follows instructions well'],
          developmentAreas: ['Continue practicing key skills', 'Work on consistency'],
          recommendations: ['Provide additional practice opportunities', 'Use positive reinforcement']
        };
      }

      const prompt = `
        As an experienced early childhood development specialist, assess this student's performance:
        
        Assessment Type: ${assessmentType}
        Student Age: ${studentAge} years
        Skills Assessed: ${skillsAssessed.join(', ')}
        Observation Notes: ${observationNotes}
        
        Please provide:
        1. A score out of 100 based on age-appropriate expectations
        2. A letter grade (A, B, C, D, F)
        3. Constructive feedback appropriate for early childhood
        4. 2-3 observed strengths
        5. 1-2 areas for development
        6. 2-3 specific recommendations for improvement
        
        Consider developmental milestones appropriate for this age group.
        
        Format as JSON: {
          "score": number,
          "grade": "A"|"B"|"C"|"D"|"F",
          "feedback": "string",
          "strengths": ["strength1", "strength2"],
          "developmentAreas": ["area1", "area2"],
          "recommendations": ["rec1", "rec2", "rec3"]
        }
      `;

      const response = await claudeService.generateContent({
        prompt,
        type: 'assessment_scoring',
        context: { assessmentId, assessmentType, studentAge },
      });

      if (response.success && response.content) {
        try {
          const scoringResult = JSON.parse(response.content);

          // Update the assessment with AI scoring
          await supabase
            .from('assessments' as any)
            .update({
              score: scoringResult.score,
              grade: scoringResult.grade,
              notes: `${observationNotes}\n\nAI Analysis: ${scoringResult.feedback}`,
              is_completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', assessmentId);

          return scoringResult;
        } catch (parseError) {
          log.warn('Failed to parse AI scoring response:', parseError);
          return {
            score: 75,
            grade: 'B',
            feedback: response.content.slice(0, 200),
            strengths: ['Shows engagement with the activity'],
            developmentAreas: ['Continue building skills'],
            recommendations: ['Provide regular practice', 'Use encouraging feedback']
          };
        }
      }

      throw new Error('AI assessment scoring service unavailable');
    } catch (error) {
      log.error('Error in AI assessment scoring:', error);
      return {
        score: 70,
        grade: 'C',
        feedback: 'Assessment completed. Continue supporting student development.',
        strengths: ['Participated in assessment'],
        developmentAreas: ['Continue skill development'],
        recommendations: ['Provide supportive learning environment', 'Regular practice and reinforcement']
      };
    }
  }

  // AI-powered developmental milestone analysis
  static async analyzeDevelopmentalProgress(studentId: string, age: number): Promise<{
    overallDevelopment: string;
    milestoneStatus: {
      cognitive: 'advanced' | 'on_track' | 'needs_support';
      social: 'advanced' | 'on_track' | 'needs_support';
      physical: 'advanced' | 'on_track' | 'needs_support';
      emotional: 'advanced' | 'on_track' | 'needs_support';
      language: 'advanced' | 'on_track' | 'needs_support';
    };
    recommendations: string[];
    nextMilestones: string[];
  }> {
    try {
      // Get recent assessments for this student
      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_completed', true)
        .order('assessment_date', { ascending: false })
        .limit(10);

      if (!assessments || assessments.length === 0) {
        return {
          overallDevelopment: 'Insufficient assessment data available for analysis.',
          milestoneStatus: {
            cognitive: 'on_track',
            social: 'on_track',
            physical: 'on_track',
            emotional: 'on_track',
            language: 'on_track'
          },
          recommendations: ['Complete initial assessments', 'Observe student in various activities'],
          nextMilestones: ['Begin comprehensive assessment program']
        };
      }

      if (process.env.EXPO_PUBLIC_AI_ENABLED !== 'true') {
        return {
          overallDevelopment: 'Student is developing well across multiple areas.',
          milestoneStatus: {
            cognitive: 'on_track',
            social: 'on_track',
            physical: 'on_track',
            emotional: 'on_track',
            language: 'on_track'
          },
          recommendations: ['Continue current activities', 'Monitor progress regularly'],
          nextMilestones: ['Focus on age-appropriate skill building']
        };
      }

      const assessmentSummary = assessments.map(a => ({
        type: a.assessment_type,
        score: a.score,
        grade: a.grade,
        skills: a.skills_assessed,
        notes: a.notes
      }));

      const prompt = `
        As a developmental specialist, analyze this ${age}-year-old child's assessment data:
        
        Recent Assessments: ${JSON.stringify(assessmentSummary, null, 2)}
        
        Provide:
        1. Overall developmental analysis
        2. Status for each domain (advanced/on_track/needs_support)
        3. 3-4 specific recommendations
        4. 2-3 upcoming developmental milestones to focus on
        
        Base analysis on typical developmental milestones for age ${age}.
        
        Format as JSON: {
          "overallDevelopment": "string",
          "milestoneStatus": {
            "cognitive": "advanced"|"on_track"|"needs_support",
            "social": "advanced"|"on_track"|"needs_support",
            "physical": "advanced"|"on_track"|"needs_support",
            "emotional": "advanced"|"on_track"|"needs_support",
            "language": "advanced"|"on_track"|"needs_support"
          },
          "recommendations": ["rec1", "rec2", "rec3"],
          "nextMilestones": ["milestone1", "milestone2"]
        }
      `;

      const response = await claudeService.generateContent({
        prompt,
        type: 'developmental_analysis',
        context: { studentId, age },
      });

      if (response.success && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (parseError) {
          log.warn('Failed to parse developmental analysis response:', parseError);
          return {
            overallDevelopment: response.content.slice(0, 200),
            milestoneStatus: {
              cognitive: 'on_track',
              social: 'on_track',
              physical: 'on_track',
              emotional: 'on_track',
              language: 'on_track'
            },
            recommendations: ['Continue supportive activities', 'Monitor development'],
            nextMilestones: ['Focus on age-appropriate skills']
          };
        }
      }

      throw new Error('AI developmental analysis service unavailable');
    } catch (error) {
      log.error('Error in developmental analysis:', error);
      return {
        overallDevelopment: 'Unable to complete developmental analysis at this time.',
        milestoneStatus: {
          cognitive: 'on_track',
          social: 'on_track',
          physical: 'on_track',
          emotional: 'on_track',
          language: 'on_track'
        },
        recommendations: ['Continue regular observations', 'Document progress'],
        nextMilestones: ['Maintain focus on core developmental areas']
      };
    }
  }

  // Create personalized assessment plan with AI
  static async createAssessmentPlanWithAI(studentId: string, age: number, focusAreas: Assessment['assessment_type'][]): Promise<{
    assessmentPlan: {
      title: string;
      description: string;
      assessmentType: Assessment['assessment_type'];
      skills: string[];
      duration: string;
      materials: string[];
    }[];
    timeline: string;
    goals: string[];
  }> {
    try {
      if (process.env.EXPO_PUBLIC_AI_ENABLED !== 'true') {
        return {
          assessmentPlan: focusAreas.map(area => ({
            title: `${area.charAt(0).toUpperCase() + area.slice(1)} Assessment`,
            description: `Comprehensive assessment of ${area} skills`,
            assessmentType: area,
            skills: ['Basic skills', 'Age-appropriate abilities'],
            duration: '15-20 minutes',
            materials: ['Standard assessment materials']
          })),
          timeline: 'Complete assessments over 2-3 weeks',
          goals: ['Establish baseline', 'Identify strengths', 'Plan interventions']
        };
      }

      const prompt = `
        Create a personalized assessment plan for a ${age}-year-old child:
        
        Focus Areas: ${focusAreas.join(', ')}
        
        For each focus area, provide:
        1. Assessment title and description
        2. Specific skills to assess (age-appropriate)
        3. Estimated duration
        4. Required materials
        
        Also include:
        - Overall timeline for completion
        - 3-4 main goals for the assessment plan
        
        Format as JSON: {
          "assessmentPlan": [{
            "title": "string",
            "description": "string",
            "assessmentType": "cognitive"|"social"|"physical"|"emotional"|"language",
            "skills": ["skill1", "skill2"],
            "duration": "string",
            "materials": ["material1", "material2"]
          }],
          "timeline": "string",
          "goals": ["goal1", "goal2", "goal3"]
        }
      `;

      const response = await claudeService.generateContent({
        prompt,
        type: 'assessment_planning',
        context: { studentId, age, focusAreas },
      });

      if (response.success && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (parseError) {
          log.warn('Failed to parse assessment plan response:', parseError);
          return {
            assessmentPlan: focusAreas.map(area => ({
              title: `${area.charAt(0).toUpperCase() + area.slice(1)} Assessment`,
              description: `Assess ${area} development`,
              assessmentType: area,
              skills: ['Core skills', 'Development markers'],
              duration: '15-20 minutes',
              materials: ['Assessment tools', 'Recording materials']
            })),
            timeline: 'Complete over 2-3 weeks',
            goals: ['Assess current abilities', 'Plan support strategies']
          };
        }
      }

      throw new Error('AI assessment planning service unavailable');
    } catch (error) {
      log.error('Error creating assessment plan:', error);
      return {
        assessmentPlan: focusAreas.map(area => ({
          title: `${area.charAt(0).toUpperCase() + area.slice(1)} Assessment`,
          description: `Evaluate ${area} skills and development`,
          assessmentType: area,
          skills: ['Age-appropriate skills', 'Developmental milestones'],
          duration: '15-30 minutes',
          materials: ['Assessment materials', 'Observation forms']
        })),
        timeline: 'Complete assessments over 2-4 weeks',
        goals: ['Document current abilities', 'Identify support needs', 'Track progress']
      };
    }
  }
}
