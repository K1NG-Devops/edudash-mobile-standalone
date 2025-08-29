/* eslint-disable */
// @ts-nocheck
import { claudeAI, HomeworkGrading } from './claudeService';
import { supabase } from '@/lib/supabase';

// Homework grading types and interfaces
export interface GradingCriteria {
  rubric: Array<{
    criterion: string;
    description: string;
    weight: number; // 1-5
  }>;
  ageExpectations: {
    minAge: number;
    maxAge: number;
    developmentalNotes: string[];
  };
}

export interface GradedSubmission extends HomeworkGrading {
  submissionId: string;
  gradedAt: Date;
  aiConfidence: number; // 0-1
  teacherReview?: {
    approved: boolean;
    modifications?: string;
    additionalNotes?: string;
  };
}

// Pre-defined grading criteria for different types of assignments
export const GRADING_CRITERIA: Record<string, GradingCriteria> = {
  'drawing_art': {
    rubric: [
      { criterion: 'Creativity', description: 'Original ideas and imagination', weight: 3 },
      { criterion: 'Effort', description: 'Time and care put into work', weight: 4 },
      { criterion: 'Following Instructions', description: 'Addressed assignment requirements', weight: 3 },
      { criterion: 'Use of Materials', description: 'Appropriate tool usage', weight: 2 },
      { criterion: 'Self-Expression', description: 'Personal voice and style', weight: 3 }
    ],
    ageExpectations: {
      minAge: 3,
      maxAge: 5,
      developmentalNotes: [
        'Focus on effort over accuracy',
        'Celebrate attempts at representation',
        'Encourage storytelling about artwork'
      ]
    }
  },
  'counting_math': {
    rubric: [
      { criterion: 'Accuracy', description: 'Correct counting and number recognition', weight: 4 },
      { criterion: 'Method', description: 'Shows understanding of counting process', weight: 3 },
      { criterion: 'Problem Solving', description: 'Attempts different approaches', weight: 2 },
      { criterion: 'Explanation', description: 'Can describe thinking process', weight: 2 },
      { criterion: 'Persistence', description: 'Continues when challenged', weight: 3 }
    ],
    ageExpectations: {
      minAge: 3,
      maxAge: 5,
      developmentalNotes: [
        'One-to-one correspondence is developing',
        'Number sequence may have gaps',
        'Visual and tactile counting important'
      ]
    }
  },
  'writing_letters': {
    rubric: [
      { criterion: 'Letter Formation', description: 'Shape and structure of letters', weight: 3 },
      { criterion: 'Effort', description: 'Sustained attention to task', weight: 4 },
      { criterion: 'Grip and Control', description: 'Pencil hold and movement', weight: 2 },
      { criterion: 'Letter Recognition', description: 'Knows letter names/sounds', weight: 3 },
      { criterion: 'Interest', description: 'Shows enthusiasm for writing', weight: 3 }
    ],
    ageExpectations: {
      minAge: 4,
      maxAge: 5,
      developmentalNotes: [
        'Fine motor skills still developing',
        'Letter reversals are normal',
        'Focus on meaningful writing experiences'
      ]
    }
  },
  'story_telling': {
    rubric: [
      { criterion: 'Imagination', description: 'Creative and original ideas', weight: 4 },
      { criterion: 'Sequence', description: 'Beginning, middle, end structure', weight: 2 },
      { criterion: 'Details', description: 'Descriptive elements and elaboration', weight: 3 },
      { criterion: 'Engagement', description: 'Holds listener attention', weight: 3 },
      { criterion: 'Vocabulary', description: 'Uses varied and appropriate words', weight: 2 }
    ],
    ageExpectations: {
      minAge: 3,
      maxAge: 5,
      developmentalNotes: [
        'Stories may jump between topics',
        'Personal experiences often included',
        'Repetition is normal and helpful'
      ]
    }
  },
  'science_observation': {
    rubric: [
      { criterion: 'Observation', description: 'Notices details and changes', weight: 4 },
      { criterion: 'Recording', description: 'Documents findings appropriately', weight: 3 },
      { criterion: 'Questions', description: 'Shows curiosity and inquiry', weight: 3 },
      { criterion: 'Prediction', description: 'Makes reasonable guesses', weight: 2 },
      { criterion: 'Conclusion', description: 'Summarizes learning', weight: 2 }
    ],
    ageExpectations: {
      minAge: 3,
      maxAge: 5,
      developmentalNotes: [
        'Focus on sensory observations',
        'Simple drawings or marks to record',
        'Adult support needed for conclusions'
      ]
    }
  }
};

export class HomeworkGraderService {
  /**
   * Grade a homework submission using AI with specific criteria
   */
  static async gradeSubmission(params: {
    submissionId: string;
    assignmentTitle: string;
    assignmentInstructions: string;
    studentSubmission: string;
    attachmentDescriptions?: string[];
    studentAge: number;
    assignmentType: keyof typeof GRADING_CRITERIA;
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    grading?: GradedSubmission;
    error?: string;
  }> {
    try {
      // Get grading criteria for this assignment type
      const criteria = GRADING_CRITERIA[params.assignmentType];
      if (!criteria) {
        return { success: false, error: 'Invalid assignment type for grading' };
      }

      // Check if student age is within expected range
      const withinAgeRange = params.studentAge >= criteria.ageExpectations.minAge && 
                           params.studentAge <= criteria.ageExpectations.maxAge;

      // Grade using AI
      const result = await claudeAI.gradeHomework({
        assignmentTitle: params.assignmentTitle,
        assignmentInstructions: params.assignmentInstructions,
        studentSubmission: params.studentSubmission,
        attachmentDescriptions: params.attachmentDescriptions,
        studentAge: params.studentAge,
        userId: params.userId,
        preschoolId: params.preschoolId
      });

      if (!result.success || !result.grading) {
        return { success: false, error: result.error };
      }

      // Calculate AI confidence based on submission quality and age appropriateness
      const confidence = HomeworkGraderService.calculateConfidence(
        result.grading,
        criteria,
        withinAgeRange
      );

      const gradedSubmission: GradedSubmission = {
        ...result.grading,
        submissionId: params.submissionId,
        gradedAt: new Date(),
        aiConfidence: confidence
      };

      return {
        success: true,
        grading: gradedSubmission
      };
    } catch (error) {
      log.error('Error grading submission:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to grade submission'
      };
    }
  }

  /**
   * Save graded submission to database
   */
  static async saveGradedSubmission(params: {
    grading: GradedSubmission;
    teacherId: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('homework_submissions')
        .update({
          status: 'reviewed',
          teacher_feedback: params.grading.feedback,
          grade: params.grading.grade,
          graded_at: params.grading.gradedAt.toISOString(),
          reviewed_by: params.teacherId
        })
        .eq('id', params.grading.submissionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      log.error('Error saving graded submission:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save graded submission'
      };
    }
  }

  /**
   * Batch grade multiple submissions
   */
  static async batchGradeSubmissions(params: {
    submissions: Array<{
      submissionId: string;
      assignmentTitle: string;
      assignmentInstructions: string;
      studentSubmission: string;
      attachmentDescriptions?: string[];
      studentAge: number;
      assignmentType: keyof typeof GRADING_CRITERIA;
    }>;
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    results?: Array<{
      submissionId: string;
      grading?: GradedSubmission;
      error?: string;
    }>;
    error?: string;
  }> {
    try {
      const results = await Promise.all(
        params.submissions.map(async (submission) => {
          const result = await HomeworkGraderService.gradeSubmission({
            ...submission,
            userId: params.userId,
            preschoolId: params.preschoolId
          });

          return {
            submissionId: submission.submissionId,
            grading: result.grading,
            error: result.error
          };
        })
      );

      return {
        success: true,
        results
      };
    } catch (error) {
      log.error('Error batch grading submissions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to batch grade submissions'
      };
    }
  }

  /**
   * Generate detailed progress report from graded submissions
   */
  static async generateProgressReport(params: {
    studentId: string;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    report?: {
      overallProgress: string;
      subjectBreakdown: Record<string, {
        averageGrade: string;
        improvementTrend: 'improving' | 'stable' | 'needs_attention';
        keyStrengths: string[];
        developmentAreas: string[];
      }>;
      recommendations: string[];
      parentNotes: string;
    };
    error?: string;
  }> {
    try {
      // Fetch student's graded submissions in date range
      const { data: submissions, error: fetchError } = await supabase
        .from('homework_submissions')
        .select(`
          *,
          homework_assignments (
            title,
            description,
            lesson_id,
            lessons (
              category_id,
              lesson_categories (name)
            )
          ),
          students (
            first_name,
            last_name,
            date_of_birth
          )
        `)
        .eq('student_id', params.studentId)
        .gte('graded_at', params.dateRange.startDate.toISOString())
        .lte('graded_at', params.dateRange.endDate.toISOString())
        .not('teacher_feedback', 'is', null)
        .order('graded_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (!submissions || submissions.length === 0) {
        return {
          success: false,
          error: 'No graded submissions found for this period'
        };
      }

      // Prepare data for AI analysis
      const studentData = submissions[0].students;
      const studentAge = new Date().getFullYear() - new Date(studentData.date_of_birth).getFullYear();
      
      const recentActivities = submissions.map(sub => ({
        activity: sub.homework_assignments?.title || 'Unknown Assignment',
        performance: sub.grade || 'Not Graded',
        date: new Date(sub.graded_at).toLocaleDateString()
      }));

      const teacherNotes = submissions
        .map(sub => sub.teacher_feedback)
        .filter(note => note && note.trim().length > 0);

      // Use AI to analyze progress
      const analysisResult = await claudeAI.analyzeStudentProgress({
        studentName: `${studentData.first_name} ${studentData.last_name}`,
        age: studentAge,
        recentActivities,
        teacherNotes,
        userId: params.userId,
        preschoolId: params.preschoolId
      });

      if (!analysisResult.success || !analysisResult.analysis) {
        return { success: false, error: analysisResult.error };
      }

      // Process subject-specific breakdown
      const subjectBreakdown: Record<string, any> = {};
      
      // Group submissions by subject/category
      const submissionsBySubject = submissions.reduce((acc, sub) => {
        const subject = sub.homework_assignments?.lessons?.lesson_categories?.name || 'General';
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(sub);
        return acc;
      }, {} as Record<string, any[]>);

      Object.entries(submissionsBySubject).forEach(([subject, subs]) => {
        const grades = subs.map(s => s.grade).filter(g => g);
        const gradeValues = grades.map(g => {
          switch(g) {
            case 'Excellent': return 4;
            case 'Good': return 3;
            case 'Needs Improvement': return 2;
            case 'Incomplete': return 1;
            default: return 2;
          }
        });

        const averageValue = gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length;
        let averageGrade = 'Needs Improvement';
        if (averageValue >= 3.5) averageGrade = 'Excellent';
        else if (averageValue >= 2.5) averageGrade = 'Good';

        // Determine trend (simplified)
        const recentGrades = gradeValues.slice(-3);
        const earlierGrades = gradeValues.slice(0, -3);
        let trend: 'improving' | 'stable' | 'needs_attention' = 'stable';
        
        if (recentGrades.length >= 2 && earlierGrades.length >= 2) {
          const recentAvg = recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length;
          const earlierAvg = earlierGrades.reduce((a, b) => a + b, 0) / earlierGrades.length;
          
          if (recentAvg > earlierAvg + 0.3) trend = 'improving';
          else if (recentAvg < earlierAvg - 0.3) trend = 'needs_attention';
        }

        subjectBreakdown[subject] = {
          averageGrade,
          improvementTrend: trend,
          keyStrengths: analysisResult.analysis?.keyStrengths?.slice(0, 2) || [],
          developmentAreas: analysisResult.analysis?.developmentAreas?.slice(0, 2) || []
        };
      });

      return {
        success: true,
        report: {
          overallProgress: analysisResult.analysis.overallProgress,
          subjectBreakdown,
          recommendations: analysisResult.analysis.recommendations,
          parentNotes: analysisResult.analysis.parentSuggestions.join(' ')
        }
      };
    } catch (error) {
      log.error('Error generating progress report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate progress report'
      };
    }
  }

  /**
   * Calculate AI confidence score based on grading quality
   */
  private static calculateConfidence(
    grading: HomeworkGrading,
    criteria: GradingCriteria,
    withinAgeRange: boolean
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if grade aligns with detailed feedback
    if (grading.strengths.length > 0 && grading.areasForImprovement.length > 0) {
      confidence += 0.2;
    }

    // Increase confidence if within age range expectations
    if (withinAgeRange) {
      confidence += 0.1;
    }

    // Increase confidence if feedback is detailed and constructive
    if (grading.feedback.length > 50 && grading.nextSteps.length > 0) {
      confidence += 0.15;
    }

    // Decrease confidence for extreme grades without supporting evidence
    if (grading.grade === 'Excellent' && grading.strengths.length < 2) {
      confidence -= 0.1;
    }
    if (grading.grade === 'Incomplete' && grading.areasForImprovement.length < 2) {
      confidence -= 0.1;
    }

    return Math.max(0.3, Math.min(0.95, confidence)); // Clamp between 0.3 and 0.95
  }

  /**
   * Get grading statistics for a teacher or school
   */
  static async getGradingStatistics(params: {
    preschoolId: string;
    teacherId?: string;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
  }): Promise<{
    success: boolean;
    statistics?: {
      totalGraded: number;
      averageGradeDistribution: Record<string, number>;
      aiUsageRate: number;
      teacherReviewRate: number;
      subjectBreakdown: Record<string, number>;
    };
    error?: string;
  }> {
    try {
      let query = supabase
        .from('homework_submissions')
        .select(`
          grade,
          graded_at,
          homework_assignments (
            lessons (
              lesson_categories (name)
            )
          )
        `)
        .eq('status', 'reviewed')
        .not('grade', 'is', null);

      // Add filters
      if (params.teacherId) {
        query = query.eq('reviewed_by', params.teacherId);
      } else {
        // Filter by preschool through homework assignments
        query = query.in('homework_assignment_id', 
          supabase
            .from('homework_assignments')
            .select('id')
            .eq('preschool_id', params.preschoolId)
        );
      }

      if (params.dateRange) {
        query = query
          .gte('graded_at', params.dateRange.startDate.toISOString())
          .lte('graded_at', params.dateRange.endDate.toISOString());
      }

      const { data: submissions, error } = await query;

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        return {
          success: true,
          statistics: {
            totalGraded: 0,
            averageGradeDistribution: {},
            aiUsageRate: 0,
            teacherReviewRate: 0,
            subjectBreakdown: {}
          }
        };
      }

      // Calculate statistics
      const gradeDistribution: Record<string, number> = {};
      const subjectBreakdown: Record<string, number> = {};

      submissions.forEach(sub => {
        // Grade distribution
        const grade = sub.grade || 'Ungraded';
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;

        // Subject breakdown
        const subject = sub.homework_assignments?.lessons?.lesson_categories?.name || 'General';
        subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + 1;
      });

      return {
        success: true,
        statistics: {
          totalGraded: submissions.length,
          averageGradeDistribution: gradeDistribution,
          aiUsageRate: 1.0, // All grading currently uses AI
          teacherReviewRate: 1.0, // All AI grades are reviewed by teachers
          subjectBreakdown
        }
      };
    } catch (error) {
      log.error('Error getting grading statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics'
      };
    }
  }
}

// Export for convenience
export const homeworkGrader = HomeworkGraderService;
