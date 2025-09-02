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
// Heuristic JSON extractor to robustly parse AI responses
function extractJsonFromText(raw: string): any | null {
  if (!raw) return null;
  const text = String(raw).trim();
  // 1) Code fence block
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) {
    const inside = fence[1].replace(/[\u0000-\u001F]/g, '');
    try { return JSON.parse(inside); } catch {}
    try { return JSON.parse(inside.replace(/,\s*([}\]])/g, '$1')); } catch {}
  }
  // 2) Find first balanced { ... }
  const first = text.indexOf('{');
  if (first !== -1) {
    let depth = 0;
    for (let i = first; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(first, i + 1).replace(/[\u0000-\u001F]/g, '');
          try { return JSON.parse(candidate); } catch {}
          try { return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1')); } catch {}
          break;
        }
      }
    }
  }
  // 3) Last resort: sanitize and try whole text
  const sanitized = text.replace(/[\u0000-\u001F]/g, '');
  try { return JSON.parse(sanitized); } catch {}
  try { return JSON.parse(sanitized.replace(/,\s*([}\]])/g, '$1')); } catch {}
  return null;
}

// Attempt to parse Supabase Functions error payloads to surface server codes like USAGE_LIMIT
function parseFunctionsError(err: any): { status?: number; error?: string; code?: string; error_type?: string; quota_charged?: boolean } {
  try {
    if (!err) return {};
    // Many supabase-js errors include a context with the raw response/body
    const ctx: any = (err as any).context || {};
    // Some versions put the body directly, others only include a message with the JSON string
    const possibleBodies: any[] = [];
    if (typeof ctx.body === 'string' || typeof ctx.body === 'object') possibleBodies.push(ctx.body);
    if (typeof (err as any).message === 'string') possibleBodies.push((err as any).message);

    for (const src of possibleBodies) {
      const text = typeof src === 'string' ? src : JSON.stringify(src);
      const parsed = extractJsonFromText(text);
      if (parsed && typeof parsed === 'object') {
        return {
          status: (ctx.response && ctx.response.status) || (err.status as number | undefined),
          error: parsed.error || parsed.message,
          code: parsed.code,
          error_type: parsed.error_type,
          quota_charged: parsed.quota_charged,
        };
      }
    }
    // Fallback minimal info
    return {
      status: (ctx.response && ctx.response.status) || (err.status as number | undefined),
      error: (err as any).message,
    };
  } catch {
    return {};
  }
}

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
    languageCode?: string;
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
    errorCode?: string;
    errorType?: string;
    quota_charged?: boolean;
  }> {
    try {
      const langInstruction = params.languageCode && params.languageCode !== 'en' ? `\n\nPlease write your response in ${params.languageCode}.` : '';
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

Make it educational, fun, and age-appropriate with hands-on learning experiences.${langInstruction}`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          feature: 'lesson_generation',
          prompt,
        },
      });

      if (error) {
        return { success: false, error: error.message, errorCode: 'EDGE_FUNC_ERROR', errorType: 'network', quota_charged: false };
      }

      const quotaCharged = data?.quota_charged === true;
      const contentText: string | undefined = data?.content;
      
      if (!contentText) {
        const errorMsg = data?.error || 'Empty AI response';
        const code = data?.code as string | undefined;
        const errorType = data?.error_type as string | undefined;
        const isQuotaProtected = data?.quota_charged === false || /not counted against your quota|not count towards your quota/i.test(errorMsg);
        const message = isQuotaProtected && !/not counted against your quota|not count towards your quota/i.test(errorMsg)
          ? `${errorMsg} This failed request has not been counted against your quota.`
          : errorMsg;
        return { 
          success: false, 
          error: message,
          errorCode: code,
          errorType,
          quota_charged: quotaCharged
        };
      }

      // Sanitize control characters that can cause JSON.parse to fail
      const sanitized = String(contentText).replace(/[\u0000-\u001F]/g, '');
      const parsed = extractJsonFromText(sanitized);
      if (!parsed) {
        if (__DEV__) {
          console.log('[ai-proxy] parse failure: lesson_generation', {
            snippet: sanitized.slice(0, 200),
            quota_charged: quotaCharged,
            code: data?.code,
            error_type: data?.error_type,
          });
        }
        const message = 'The AI returned an unexpected format. Please try again.';
        return { success: false, error: message, errorCode: 'PARSE_ERROR', errorType: 'validation', quota_charged: quotaCharged } as any;
      }
      return { success: true, content: parsed, quota_charged: quotaCharged };
    } catch (error) {
      log.error('AI Lesson Generation Error:', error);
      const base = error instanceof Error ? error.message : 'Unknown error occurred';
      const message = `${base} This failed request has not been counted against your quota.`;
      return {
        success: false,
        error: message,
        errorCode: 'CLIENT_EXCEPTION',
        errorType: 'unknown',
        quota_charged: false,
      };
    }
  }

  /**
   * Generate integrated lesson content blending Robotics/AI/STEM with traditional subjects.
   * Returns the same JSON structure as generateLessonContent for compatibility.
   */
  async generateIntegratedLesson(params: {
    topic: string;
    ageGroup: string; // e.g., '3-4 years' or '11-13 years'
    duration: number; // minutes
    learningObjectives: string[];
    subjects: string[]; // e.g., ['Robotics', 'Math']
    emphasis?: Array<'Robotics' | 'AI' | 'STEM' | 'Engineering' | 'Technology' | 'Computer Science'>;
    userId: string;
    preschoolId: string;
    languageCode?: string;
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
    errorCode?: string;
    errorType?: string;
    quota_charged?: boolean;
  }> {
    try {
      const integrations = params.emphasis && params.emphasis.length > 0 ? params.emphasis : ((): Array<string> => {
        const s = params.subjects.map(x => x.toLowerCase());
        const out: string[] = [];
        if (s.some(x => ['robotics'].includes(x))) out.push('Robotics');
        if (s.some(x => ['ai literacy', 'ai'].includes(x))) out.push('AI');
        if (s.some(x => ['science','math','engineering','technology','stem'].includes(x))) out.push('STEM');
        if (s.some(x => ['computer science', 'coding', 'programming'].includes(x))) out.push('Computer Science');
        return out.length ? out : ['STEM'];
      })();

      // Tailor guidance for ECD vs older ages
      const ageLabel = params.ageGroup;
      const agePrefix = (() => {
        if (ageLabel.startsWith('2-') || ageLabel.startsWith('3-') || ageLabel.startsWith('4-') || ageLabel.startsWith('5-6')) {
          return 'ECD';
        }
        if (ageLabel.startsWith('5-7') || ageLabel.startsWith('8-10')) return 'Primary';
        return 'Secondary';
      })();

      const langInstruction2 = params.languageCode && params.languageCode !== 'en' ? `\n\nPlease write your response in ${params.languageCode}.` : '';
      const prompt = `Create a cross-curricular lesson that integrates ${integrations.join(', ')} with traditional subjects

REQUIREMENTS:
- Duration: ${params.duration} minutes
- Age Band: ${params.ageGroup} (${agePrefix})
- Learning Objectives: ${params.learningObjectives.join(', ')}
- Integration Focus: ${integrations.join(', ')}

Design:
- ${agePrefix === 'ECD' ? 'Play-based, hands-on, and unplugged options (e.g., card-based sequencing, tangible manipulatives). Emphasize safety and adult guidance.' : ''}
- ${agePrefix !== 'ECD' ? 'Project-based learning with inquiry and iteration; encourage documentation, testing, and reflection.' : ''}
- Explicitly connect Robotics/AI/STEM concepts to the traditional subject(s) selected.
- Include equitable, inclusive, and safe practice notes (e.g., device sharing, privacy, bias awareness in AI).

Return JSON with this exact structure:
{
  "title": "lesson title",
  "description": "brief description explaining the integration",
  "content": "detailed lesson plan with sections: Warm-up, Concept Intro, Integration Plan, Guided Practice, Independent Practice, Reflection, Safety/Equity Notes",
  "activities": [
    {
      "title": "activity name",
      "description": "what learners will do and which integration elements are used",
      "instructions": "clear step-by-step instructions",
      "materials": ["item1", "item2"],
      "estimatedTime": minutes
    }
  ],
  "assessmentQuestions": ["question1", "question2"],
  "homeExtension": ["home idea 1 (low/no tech where possible)", "home idea 2"]
}

Ensure the activities demonstrate the integration focus (${integrations.join(', ')}), while staying age-appropriate.${langInstruction2}`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          feature: 'lesson_generation',
          prompt,
        },
      });

      if (error) return { success: false, error: error.message, errorCode: 'EDGE_FUNC_ERROR', errorType: 'network', quota_charged: false };
      const text: string | undefined = data?.content;
      if (!text) {
        const errorMsg = data?.error || 'Empty AI response';
        const isQuotaProtected = data?.quota_charged === false || /not counted against your quota|not count towards your quota/i.test(errorMsg);
        const message = isQuotaProtected && !/not counted against your quota|not count towards your quota/i.test(errorMsg)
          ? `${errorMsg} This failed request has not been counted against your quota.`
          : errorMsg;
        return { success: false, error: message, errorCode: data?.code, errorType: data?.error_type, quota_charged: data?.quota_charged };
      }
      // Sanitize unescaped control characters that can break JSON.parse
      const sanitized = String(text).replace(/[\u0000-\u001F]/g, '');
      const parsed = extractJsonFromText(sanitized);
      if (!parsed) {
        if (__DEV__) {
          console.log('[ai-proxy] parse failure: lesson_generation.integrated', {
            snippet: sanitized.slice(0, 200),
            quota_charged: data?.quota_charged,
            code: data?.code,
            error_type: data?.error_type,
          });
        }
        const message = 'The AI returned an unexpected format. Please try again.';
        return { success: false, error: message, errorCode: 'PARSE_ERROR', errorType: 'validation', quota_charged: data?.quota_charged } as any;
      }
      return { success: true, content: parsed, quota_charged: data?.quota_charged === true };
    } catch (error) {
      log.error('AI Integrated Lesson Generation Error:', error);
      const base = error instanceof Error ? error.message : 'Unknown error occurred';
      const message = `${base} This failed request has not been counted against your quota.`;
      return {
        success: false,
        error: message,
        errorCode: 'CLIENT_EXCEPTION',
        errorType: 'unknown',
        quota_charged: false,
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
    errorCode?: string;
    errorType?: string;
    quota_charged?: boolean;
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
        },
      });

      if (error) return { success: false, error: error.message, errorCode: 'EDGE_FUNC_ERROR', errorType: 'network', quota_charged: false };
      const text: string | undefined = data?.content;
      if (!text) {
        const errorMsg = data?.error || 'Empty AI response';
        const isQuotaProtected = data?.quota_charged === false || /not counted against your quota|not count towards your quota/i.test(errorMsg);
        const message = isQuotaProtected && !/not counted against your quota|not count towards your quota/i.test(errorMsg)
          ? `${errorMsg} This failed request has not been counted against your quota.`
          : errorMsg;
        return { success: false, error: message, errorCode: data?.code, errorType: data?.error_type, quota_charged: data?.quota_charged };
      }
const gradingParsed = extractJsonFromText(String(text));
      if (!gradingParsed) {
        if (__DEV__) {
          console.log('[ai-proxy] parse failure: homework_grading', {
            snippet: String(text).slice(0, 200),
            quota_charged: data?.quota_charged,
            code: data?.code,
            error_type: data?.error_type,
          });
        }
        return { success: false, error: 'Unexpected grading format from AI', errorCode: 'PARSE_ERROR', errorType: 'validation', quota_charged: data?.quota_charged } as any;
      }
      return { success: true, grading: gradingParsed, quota_charged: data?.quota_charged === true };
    } catch (error) {
      log.error('AI Homework Grading Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: 'CLIENT_EXCEPTION',
        errorType: 'unknown',
        quota_charged: false,
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
    errorCode?: string;
    errorType?: string;
    quota_charged?: boolean;
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
        },
      });

      if (error) return { success: false, error: error.message, errorCode: 'EDGE_FUNC_ERROR', errorType: 'network', quota_charged: false };
      const text: string | undefined = data?.content;
      if (!text) {
        const errorMsg = data?.error || 'Empty AI response';
        const isQuotaProtected = data?.quota_charged === false || /not counted against your quota|not count towards your quota/i.test(errorMsg);
        const message = isQuotaProtected && !/not counted against your quota|not count towards your quota/i.test(errorMsg)
          ? `${errorMsg} This failed request has not been counted against your quota.`
          : errorMsg;
        return { success: false, error: message, errorCode: data?.code, errorType: data?.error_type, quota_charged: data?.quota_charged };
      }
const activityParsed = extractJsonFromText(String(text));
      if (!activityParsed) {
        if (__DEV__) {
          console.log('[ai-proxy] parse failure: stem_activity', {
            snippet: String(text).slice(0, 200),
            quota_charged: data?.quota_charged,
            code: data?.code,
            error_type: data?.error_type,
          });
        }
        return { success: false, error: 'Unexpected activity format from AI', errorCode: 'PARSE_ERROR', errorType: 'validation', quota_charged: data?.quota_charged } as any;
      }
      return { success: true, activity: activityParsed, quota_charged: data?.quota_charged === true };
    } catch (error) {
      log.error('AI STEM Activity Generation Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: 'CLIENT_EXCEPTION',
        errorType: 'unknown',
        quota_charged: false,
      };
    }
  }

  /**
   * Provide homework help chat-style response with optional attachments.
   */
  async askHomeworkHelp(params: {
    question: string;
    childName?: string;
    parentName?: string;
    childAge: number;
    userId: string;
    preschoolId: string;
    languageCode?: string; // ISO 639 code to influence response language
    hintsOnly?: boolean;
    attachments?: { url: string; mimeType: string; name?: string }[];
  }): Promise<{
    success: boolean;
    answer?: string;
    suggestions?: string[];
    error?: string;
    errorCode?: string;
    errorType?: string;
    quota_charged?: boolean;
  }> {
    try {
      const who = params.parentName ? `${params.parentName} (the parent)` : 'the parent';
      const childRef = params.childName || 'their child';
      const langInstruction = params.languageCode && params.languageCode !== 'en'
        ? `\n\nPlease write your response in ${params.languageCode}.`
        : '';
      const hintsInstruction = params.hintsOnly ? `\n\nImportant: Provide hints and gentle guidance without giving the full solution outright. Ask guiding questions and suggest next steps.` : '';
      const prompt = `You are a warm, practical AI tutor helping ${who} support ${childRef}, age ${params.childAge}, with homework.\n\nQuestion: "${params.question}"\n\nUse any provided attachments as context. Provide a step-by-step plan, tips, and point out when to involve the teacher.${langInstruction}${hintsInstruction}`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          feature: 'homework_help',
          prompt,
          params: { question: params.question, childAge: params.childAge, childName: params.childName || 'child', parentName: params.parentName, languageCode: params.languageCode },
          attachments: (params.attachments || []).map(a => ({ url: a.url, mime_type: a.mimeType, name: a.name })),
        },
      });

      if (error) {
        const pe = parseFunctionsError(error);
        return { success: false, error: pe.error || error.message, errorCode: pe.code || 'EDGE_FUNC_ERROR', errorType: pe.error_type || 'network', quota_charged: pe.quota_charged === true };
      }
      const text: string | undefined = data?.content;
      if (!text) {
        const errorMsg = data?.error || 'Empty AI response';
        const isQuotaProtected = data?.quota_charged === false || /not counted against your quota|not count towards your quota/i.test(errorMsg);
        const message = isQuotaProtected && !/not counted against your quota|not count towards your quota/i.test(errorMsg)
          ? `${errorMsg} This failed request has not been counted against your quota.`
          : errorMsg;
        return { success: false, error: message, errorCode: data?.code, errorType: data?.error_type, quota_charged: data?.quota_charged };
      }

      // Try to parse JSON robustly, fall back to plain text
      let answer = '';
      let suggestions: string[] = [];
      const sanitized = String(text).replace(/[\u0000-\u001F]/g, '');
      const parsed = extractJsonFromText(sanitized);
      if (parsed && typeof parsed === 'object') {
        answer = (parsed as any).answer || (parsed as any).content || '';
        suggestions = Array.isArray((parsed as any).suggestions) ? (parsed as any).suggestions : [];
      } else {
        if (__DEV__) {
          console.log('[ai-proxy] JSON parse failed: homework_help', {
            snippet: sanitized.slice(0, 200),
          });
        }
        answer = text;
      }

      return { success: true, answer: answer || text, suggestions, quota_charged: data?.quota_charged === true };
    } catch (err) {
      log.error('AI Homework Help Error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        errorCode: 'CLIENT_EXCEPTION',
        errorType: 'unknown',
        quota_charged: false,
      };
    }
  }

  /**
   * Analyze student progress and provide insights
   */
  async analyzeStudentProgress(params: {
    studentName: string;
    age: number;
    languageCode?: string;
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
    errorCode?: string;
    errorType?: string;
    quota_charged?: boolean;
  }> {
    try {
      const activitiesText = params.recentActivities
        .map(a => `${a.activity}: ${a.performance} (${a.date})`)
        .join('\n');

      const notesText = params.teacherNotes.join('\n');

      const langInstruction3 = params.languageCode && params.languageCode !== 'en' ? `\n\nPlease write your response in ${params.languageCode}.` : '';
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
  \"parentSuggestions\": [\"suggestion1\", \"suggestion2\"]\n}\n${langInstruction3}`;

      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          feature: 'progress_analysis',
          prompt,
        },
      });

      if (error) return { success: false, error: error.message, errorCode: 'EDGE_FUNC_ERROR', errorType: 'network', quota_charged: false };
      const text: string | undefined = data?.content;
      if (!text) {
        const errorMsg = data?.error || 'Empty AI response';
        const isQuotaProtected = data?.quota_charged === false || /not counted against your quota|not count towards your quota/i.test(errorMsg);
        const message = isQuotaProtected && !/not counted against your quota|not count towards your quota/i.test(errorMsg)
          ? `${errorMsg} This failed request has not been counted against your quota.`
          : errorMsg;
        return { success: false, error: message, errorCode: data?.code, errorType: data?.error_type, quota_charged: data?.quota_charged };
      }
const analysisParsed = extractJsonFromText(String(text));
      if (!analysisParsed) {
        if (__DEV__) {
          console.log('[ai-proxy] parse failure: progress_analysis', {
            snippet: String(text).slice(0, 200),
            quota_charged: data?.quota_charged,
            code: data?.code,
            error_type: data?.error_type,
          });
        }
        return { success: false, error: 'Unexpected analysis format from AI', errorCode: 'PARSE_ERROR', errorType: 'validation', quota_charged: data?.quota_charged } as any;
      }
      return { success: true, analysis: analysisParsed, quota_charged: data?.quota_charged === true };
    } catch (error) {
      log.error('AI Progress Analysis Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: 'CLIENT_EXCEPTION',
        errorType: 'unknown',
        quota_charged: false,
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
export type HomeworkHelpAnswer = Awaited<ReturnType<typeof claudeAI.askHomeworkHelp>>;

// Backward-compatible simple content generator used by legacy services
export const claudeService = {
  async generateContent(args: { prompt: string; type?: string; context?: any }) {
    const { prompt } = args;
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { feature: 'content', prompt },
      });
      if (error) {
        const pe = parseFunctionsError(error);
        return { success: false, content: '', error: pe.error || error.message, errorCode: pe.code, errorType: pe.error_type, quota_charged: pe.quota_charged } as any;
      }
      const text: string = data?.content || '';
      return { success: !!text, content: text, quota_charged: data?.quota_charged === true } as any;
    } catch (error) {
      log.error('Claude simple generateContent error:', error);
      return { success: false, content: '' } as { success: boolean; content: string };
    }
  },
};
