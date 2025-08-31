import { supabase } from '@/lib/supabase';
import { logger as log } from '@/lib/utils/logger';

// Model selection based on subscription tier
const TIER_MODELS: Record<string, string> = {
  free: 'claude-3-haiku-20240307',           // Fast, cost-effective
  starter: 'claude-3-5-sonnet-20241022',     // Better quality
  premium: 'claude-3-5-sonnet-20241022',     // High quality
  enterprise: 'claude-3-5-sonnet-20241022'   // Could upgrade to Opus
};

const DEFAULT_MODEL = 'claude-3-haiku-20240307';

// Get model for user's subscription tier
function getModelForTier(tier?: string): string {
  return TIER_MODELS[tier || 'free'] || DEFAULT_MODEL;
}

// Core AI Service Class
export class ClaudeAIService {
  private static instance: ClaudeAIService;

  static getInstance(): ClaudeAIService {
    if (!ClaudeAIService.instance) {
      ClaudeAIService.instance = new ClaudeAIService();
    }
    return ClaudeAIService.instance;
  }

  /**
   * Check if AI service is available (edge function is reachable)
   */
  isAvailable(): boolean {
    // If Supabase is configured, the edge function will be reachable
    return true;
  }

  /**
   * Generate educational lesson content
   */
  async generateLessonContent(params: {
    topic: string;
    ageGroup: string;
    duration: number; // minutes
    learningObjectives: string[];
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    content?: {
      title: string;
      description: string;
      content: string;
      activities: {
        title: string;
        description: string;
        instructions: string;
        materials: string[];
        estimatedTime: number;
      }[];
      assessmentQuestions: string[];
      homeExtension: string[];
    };
    error?: string;
  }> {
    try {
      const prompt = `Create an engaging preschool lesson plan for ${params.ageGroup} children on the topic "${params.topic}".

REQUIREMENTS:
- Duration: ${params.duration} minutes
- Age Group: ${params.ageGroup}
- Learning Objectives: ${params.learningObjectives.join(', ')}

Please provide a comprehensive lesson plan with:
1. Engaging title and description
2. Detailed lesson content with step-by-step instructions
3. 3-5 interactive activities suitable for the age group
4. Assessment questions to check understanding
5. Home extension activities for parents

Format as JSON with this structure:
{
  "title": "lesson title",
  "description": "brief description",
  "content": "detailed lesson content with instructions",
  "activities": [
    {
      "title": "activity name",
      "description": "what children will do",
      "instructions": "step by step instructions",
      "materials": ["item1", "item2"],
      "estimatedTime": minutes
    }
  ],
  "assessmentQuestions": ["question1", "question2"],
  "homeExtension": ["activity1", "activity2"]
}

Make it educational, fun, and age-appropriate with hands-on learning experiences.`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          feature: 'lesson_generation',
          prompt,
          model: DEFAULT_MODEL,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if this was a quota-protected error
      const quotaCharged = data?.quota_charged !== false;
      const contentText: string | undefined = data?.content;
      
      if (!contentText) {
        const errorMsg = data?.error || 'Empty AI response';
        const isQuotaProtected = errorMsg.includes('not counted against your quota') || !quotaCharged;
        return { 
          success: false, 
          error: isQuotaProtected ? errorMsg : 'AI service temporarily unavailable'
        };
      }

      const lessonData = JSON.parse(contentText);
      return { success: true, content: lessonData };
    } catch (error) {
      log.error('AI Lesson Generation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Grade homework submission with AI feedback
   */
  async gradeHomework(params: {
    assignmentTitle: string;
    assignmentInstructions: string;
    studentSubmission: string;
    attachmentDescriptions?: string[];
    studentAge: number;
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    grading?: {
      grade: 'Excellent' | 'Good' | 'Needs Improvement' | 'Incomplete';
      feedback: string;
      strengths: string[];
      areasForImprovement: string[];
      nextSteps: string[];
      parentNotes: string;
    };
    error?: string;
  }> {
    try {
      const prompt = `Grade this preschool homework submission for a ${params.studentAge}-year-old child.

ASSIGNMENT: "${params.assignmentTitle}"
INSTRUCTIONS: ${params.assignmentInstructions}

STUDENT SUBMISSION: "${params.studentSubmission}"
${params.attachmentDescriptions ? `ATTACHMENTS: ${params.attachmentDescriptions.join(', ')}` : ''}

Please provide:
1. Age-appropriate grade (Excellent/Good/Needs Improvement/Incomplete)
2. Encouraging feedback for the child
3. Strengths demonstrated
4. Areas for gentle improvement
5. Suggested next steps
6. Notes for parents

Consider the child's age and developmental stage. Focus on effort, creativity, and learning progress rather than perfection.

Format as JSON:
{
  "grade": "grade level",
  "feedback": "encouraging feedback for child",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "nextSteps": ["step1", "step2"],
  "parentNotes": "notes for parents to support at home"
}`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          feature: 'homework_grading',
          prompt,
          model: DEFAULT_MODEL,
        },
      });

      if (error) return { success: false, error: error.message };
      const text: string | undefined = data?.content;
      if (!text) return { success: false, error: 'Empty AI response' };
      const gradingData = JSON.parse(text);
      return { success: true, grading: gradingData };
    } catch (error) {
      log.error('AI Homework Grading Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate STEM activity suggestions
   */
  async generateSTEMActivity(params: {
    topic: string;
    ageGroup: string;
    materials: string[];
    learningGoals: string[];
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    activity?: {
      title: string;
      description: string;
      instructions: string[];
      scientificConcepts: string[];
      extensions: string[];
      safetyNotes: string[];
    };
    error?: string;
  }> {
    try {
      const prompt = `Create an engaging STEM activity for ${params.ageGroup} children on "${params.topic}".

AVAILABLE MATERIALS: ${params.materials.join(', ')}
LEARNING GOALS: ${params.learningGoals.join(', ')}

Design a hands-on STEM activity that:
1. Uses the available materials creatively
2. Introduces age-appropriate scientific concepts
3. Encourages exploration and discovery
4. Includes safety considerations
5. Offers extensions for different skill levels

Format as JSON:
{
  "title": "activity title",
  "description": "what children will discover",
  "instructions": ["step1", "step2", "step3"],
  "scientificConcepts": ["concept1", "concept2"],
  "extensions": ["extension1", "extension2"],
  "safetyNotes": ["safety1", "safety2"]
}`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          feature: 'stem_activity',
          prompt,
          model: DEFAULT_MODEL,
        },
      });

      if (error) return { success: false, error: error.message };
      const text: string | undefined = data?.content;
      if (!text) return { success: false, error: 'Empty AI response' };
      const activityData = JSON.parse(text);
      return { success: true, activity: activityData };
    } catch (error) {
      log.error('AI STEM Activity Generation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Analyze student progress and provide insights
   */
  async analyzeStudentProgress(params: {
    studentName: string;
    age: number;
    recentActivities: {
      activity: string;
      performance: string;
      date: string;
    }[];
    teacherNotes: string[];
    userId: string;
    preschoolId: string;
  }): Promise<{
    success: boolean;
    analysis?: {
      overallProgress: 'Excellent' | 'Good' | 'Developing' | 'Needs Support';
      keyStrengths: string[];
      developmentAreas: string[];
      recommendations: string[];
      parentSuggestions: string[];
    };
    error?: string;
  }> {
    try {
      const activitiesText = params.recentActivities
        .map(a => `${a.activity}: ${a.performance} (${a.date})`)
        .join('\n');

      const notesText = params.teacherNotes.join('\n');

      const prompt = `Analyze the learning progress for ${params.studentName}, a ${params.age}-year-old preschooler.

RECENT ACTIVITIES:
${activitiesText}

TEACHER NOTES:
${notesText}

Provide a comprehensive analysis considering typical developmental milestones for this age group:
1. Overall progress assessment
2. Key strengths and interests
3. Areas for continued development
4. Specific recommendations for teachers
5. Suggestions for parents to support at home

Be positive, encouraging, and developmentally appropriate.

Format as JSON:
{
  "overallProgress": "progress level",
  "keyStrengths": ["strength1", "strength2"],
  "developmentAreas": ["area1", "area2"],
  "recommendations": ["rec1", "rec2"],
  "parentSuggestions": ["suggestion1", "suggestion2"]
}`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          feature: 'progress_analysis',
          prompt,
          model: DEFAULT_MODEL,
        },
      });

      if (error) return { success: false, error: error.message };
      const text: string | undefined = data?.content;
      if (!text) return { success: false, error: 'Empty AI response' };
      const analysisData = JSON.parse(text);
      return { success: true, analysis: analysisData };
    } catch (error) {
      log.error('AI Progress Analysis Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get AI usage statistics for a preschool (client-side approximation only)
   */
  async getUsageStats(_preschoolId: string): Promise<{
    totalQueries: number;
    totalTokens: number;
    featureBreakdown: Record<string, number>;
    monthlyUsage: number;
  }> {
    // Usage is authoritatively tracked server-side. Provide zeros here to avoid misleading billing data.
    return { totalQueries: 0, totalTokens: 0, featureBreakdown: {}, monthlyUsage: 0 };
  }
}

// Export singleton instance
export const claudeAI = ClaudeAIService.getInstance();

// Helper function to check AI availability
export const isAIAvailable = (): boolean => {
  return claudeAI.isAvailable();
};

// Utility types for AI responses
export type LessonContent = Awaited<ReturnType<typeof claudeAI.generateLessonContent>>['content'];
export type HomeworkGrading = Awaited<ReturnType<typeof claudeAI.gradeHomework>>['grading'];
export type STEMActivity = Awaited<ReturnType<typeof claudeAI.generateSTEMActivity>>['activity'];
export type ProgressAnalysis = Awaited<ReturnType<typeof claudeAI.analyzeStudentProgress>>['analysis'];

// Backward-compatible simple content generator used by legacy services
export const claudeService = {
  async generateContent(args: { prompt: string; type?: string; context?: any }) {
    const { prompt } = args;
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { feature: 'content', prompt, model: DEFAULT_MODEL },
      });
      if (error) return { success: false, content: '' } as { success: boolean; content: string };
      const text: string = data?.content || '';
      return { success: !!text, content: text } as { success: boolean; content: string };
    } catch (error) {
      log.error('Claude simple generateContent error:', error);
      return { success: false, content: '' } as { success: boolean; content: string };
    }
  },
};
