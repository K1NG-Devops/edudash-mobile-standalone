import Anthropic from '@anthropic-ai/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AI Configuration
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

// Initialize Claude client
const anthropic = CLAUDE_API_KEY ? new Anthropic({
  apiKey: CLAUDE_API_KEY,
}) : null;

// AI Usage Tracking
interface AIUsage {
  userId: string;
  preschoolId: string;
  feature: string;
  tokensUsed: number;
  timestamp: Date;
}

// Core AI Service Class
export class ClaudeAIService {
  private static instance: ClaudeAIService;
  private usageTracker: AIUsage[] = [];

  private constructor() {
    this.initializeUsageTracking();
  }

  static getInstance(): ClaudeAIService {
    if (!ClaudeAIService.instance) {
      ClaudeAIService.instance = new ClaudeAIService();
    }
    return ClaudeAIService.instance;
  }

  private async initializeUsageTracking() {
    // Guard for SSR / Node during web static rendering
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const savedUsage = await AsyncStorage.getItem('ai_usage_tracker');
      if (savedUsage) {
        this.usageTracker = JSON.parse(savedUsage);
      }
    } catch (error) {
      console.error('Failed to initialize AI usage tracking:', error);
    }
  }

  private async trackUsage(userId: string, preschoolId: string, feature: string, tokensUsed: number) {
    const usage: AIUsage = {
      userId,
      preschoolId,
      feature,
      tokensUsed,
      timestamp: new Date()
    };

    this.usageTracker.push(usage);
    
    // Guard for SSR / Node during web static rendering
    if (typeof window === 'undefined') {
      return;
    }

    try {
      await AsyncStorage.setItem('ai_usage_tracker', JSON.stringify(this.usageTracker));
    } catch (error) {
      console.error('Failed to save AI usage tracking:', error);
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return !!anthropic && !!CLAUDE_API_KEY;
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
      activities: Array<{
        title: string;
        description: string;
        instructions: string;
        materials: string[];
        estimatedTime: number;
      }>;
      assessmentQuestions: string[];
      homeExtension: string[];
    };
    error?: string;
  }> {
    if (!this.isAvailable()) {
      return { success: false, error: 'AI service not available' };
    }

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

      const response = await anthropic!.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const lessonData = JSON.parse(content.text);
        
        // Track AI usage
        await this.trackUsage(params.userId, params.preschoolId, 'lesson_generation', response.usage?.input_tokens || 0);

        return {
          success: true,
          content: lessonData
        };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('AI Lesson Generation Error:', error);
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
    if (!this.isAvailable()) {
      return { success: false, error: 'AI service not available' };
    }

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

      const response = await anthropic!.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 2000,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const gradingData = JSON.parse(content.text);
        
        // Track AI usage
        await this.trackUsage(params.userId, params.preschoolId, 'homework_grading', response.usage?.input_tokens || 0);

        return {
          success: true,
          grading: gradingData
        };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('AI Homework Grading Error:', error);
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
    if (!this.isAvailable()) {
      return { success: false, error: 'AI service not available' };
    }

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

      const response = await anthropic!.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const activityData = JSON.parse(content.text);
        
        // Track AI usage
        await this.trackUsage(params.userId, params.preschoolId, 'stem_activity', response.usage?.input_tokens || 0);

        return {
          success: true,
          activity: activityData
        };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('AI STEM Activity Generation Error:', error);
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
    recentActivities: Array<{
      activity: string;
      performance: string;
      date: string;
    }>;
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
    if (!this.isAvailable()) {
      return { success: false, error: 'AI service not available' };
    }

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

      const response = await anthropic!.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 2000,
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const analysisData = JSON.parse(content.text);
        
        // Track AI usage
        await this.trackUsage(params.userId, params.preschoolId, 'progress_analysis', response.usage?.input_tokens || 0);

        return {
          success: true,
          analysis: analysisData
        };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('AI Progress Analysis Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get AI usage statistics for a preschool
   */
  async getUsageStats(preschoolId: string): Promise<{
    totalQueries: number;
    totalTokens: number;
    featureBreakdown: Record<string, number>;
    monthlyUsage: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const preschoolUsage = this.usageTracker.filter(u => 
      u.preschoolId === preschoolId
    );
    
    const monthlyUsage = preschoolUsage.filter(u => 
      new Date(u.timestamp) >= monthStart
    );

    const featureBreakdown: Record<string, number> = {};
    let totalTokens = 0;

    preschoolUsage.forEach(usage => {
      featureBreakdown[usage.feature] = (featureBreakdown[usage.feature] || 0) + 1;
      totalTokens += usage.tokensUsed;
    });

    return {
      totalQueries: preschoolUsage.length,
      totalTokens,
      featureBreakdown,
      monthlyUsage: monthlyUsage.length
    };
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
