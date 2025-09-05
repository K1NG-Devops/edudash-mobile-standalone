import { claudeAI, claudeService } from '@/lib/ai/claudeService';
import { HomeworkAssignment, HomeworkFilter, HomeworkNotification, HomeworkSubmissionData, HomeworkSummary, StudentHomeworkSubmission } from '@/types/homework-types';
import { supabase } from '../supabase';
import { logger as log } from '@/lib/utils/logger';

// Unified AI feature flag: enabled if either public flag is true
const AI_ENABLED = (process.env.EXPO_PUBLIC_AI_ENABLED === 'true') || (process.env.EXPO_PUBLIC_ENABLE_AI_FEATURES === 'true');

export class HomeworkService {
  // Subscriptions for real-time updates
  static subscribeToAssignments(userId: string, callback: (assignment: any) => void) {
    const channel = (supabase as any)
      .channel(`homework_assignments_user_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework_assignments' }, (payload: any) => {
        callback(payload.new ?? payload.old);
      })
      .subscribe();
    return () => {
      try { (supabase as any).removeChannel(channel); } catch { }
    };
  }

  // AI-powered homework grading
  static async gradeHomework(submissionId: string, submissionContent: string, assignmentTitle: string, gradeLevel: string): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
    strengths: string[];
    areasForImprovement: string[];
  }> {
    try {
      if (!AI_ENABLED) {
        // Fallback grading without AI
        return {
          score: 75,
          feedback: 'Good effort on this assignment. Keep working hard!',
          suggestions: ['Review the material again', 'Practice more examples'],
          strengths: ['Shows understanding of basic concepts'],
          areasForImprovement: ['Attention to detail', 'Following instructions']
        };
      }

      // Derive a rough student age from gradeLevel (if possible)
      const ageMatch = String(gradeLevel || '').match(/(\d{1,2})/);
      const studentAge = ageMatch ? Math.max(3, Math.min(12, parseInt(ageMatch[1], 10))) : 5;

      // Resolve current auth user and preschool for logging/association
      let internalUserId: string | null = null;
      let preschoolId: string | null = null;
      try {
        const { data: auth } = await supabase.auth.getUser();
        const authUserId = auth?.user?.id || null;
        if (authUserId) {
          const { data: userRow } = await supabase
            .from('users')
            .select('id, preschool_id')
            .eq('auth_user_id', authUserId)
            .maybeSingle();
          if (userRow) {
            internalUserId = userRow.id;
            preschoolId = userRow.preschool_id;
          }
        }
      } catch {}

      // Call the structured Claude grading pathway
      const result = await claudeAI.gradeHomework({
        assignmentTitle,
        assignmentInstructions: '',
        studentSubmission: submissionContent,
        studentAge,
        userId: internalUserId || 'unknown',
        preschoolId: preschoolId || 'unknown',
      });

      if (!result.success || !result.grading) {
        throw new Error(result.error || 'AI grading failed');
      }

      // Normalize to the legacy return shape expected by callers
      const category = result.grading.grade || 'Good';
      const scoreMap: Record<string, number> = {
        'Excellent': 95,
        'Good': 85,
        'Needs Improvement': 65,
        'Incomplete': 40,
      };
      const score = scoreMap[category] ?? 80;

      const normalized = {
        score,
        feedback: result.grading.feedback || 'Great effort! Keep practicing.',
        suggestions: Array.isArray(result.grading.nextSteps) ? result.grading.nextSteps : [],
        strengths: Array.isArray(result.grading.strengths) ? result.grading.strengths : [],
        areasForImprovement: Array.isArray(result.grading.areasForImprovement) ? result.grading.areasForImprovement : [],
      };

      // Update the submission with AI grading
      try {
        await supabase
          .from('homework_submissions')
          .update({
            grade: Number(normalized.score),
            feedback: normalized.feedback,
            graded_at: new Date().toISOString(),
            graded_by: 'ai',
            status: 'reviewed'
          })
          .eq('id', submissionId);
      } catch (dbErr) {
        log.warn('Failed to update submission with AI grade:', dbErr);
      }

      return normalized;
    } catch (error) {
      log.error('Error in AI homework grading:', error);
      // Return basic fallback grading
      return {
        score: 70,
        feedback: 'Thank you for submitting your homework. Keep up the good work!',
        suggestions: ['Review the lesson materials', 'Practice similar exercises'],
        strengths: ['Completed the assignment'],
        areasForImprovement: ['Follow instructions carefully']
      };
    }
  }

  /**
   * Stream homework grading in real-time. Calls onDelta with JSON text chunks as they arrive.
   * On final, attempts to parse JSON and returns normalized grading.
   */
  static async streamGradeHomework(
    submissionId: string,
    submissionContent: string,
    assignmentTitle: string,
    gradeLevel: string,
    handlers: {
      onDelta?: (chunk: string) => void;
      onFinal?: (payload: { score: number; feedback: string; suggestions: string[]; strengths: string[]; areasForImprovement: string[] }) => void;
      onError?: (err: { message: string; code?: string }) => void;
    }
  ): Promise<void> {
    try {
      if (!AI_ENABLED) {
        handlers.onFinal?.({
          score: 75,
          feedback: 'Good effort on this assignment. Keep working hard!',
          suggestions: ['Review the material again', 'Practice more examples'],
          strengths: ['Shows understanding of basic concepts'],
          areasForImprovement: ['Attention to detail', 'Following instructions'],
        });
        return;
      }

      const ageMatch = String(gradeLevel || '').match(/(\d{1,2})/);
      const studentAge = ageMatch ? Math.max(3, Math.min(12, parseInt(ageMatch[1], 10))) : 5;

      await claudeAI.streamHomeworkGrading({
        assignmentTitle,
        assignmentInstructions: '',
        studentSubmission: submissionContent,
        studentAge,
      }, {
        onDelta: (chunk) => handlers.onDelta?.(chunk),
        onFinal: async ({ content }) => {
          // Local robust JSON extractor (subset) to avoid importing internals
          const extract = (raw: string): any | null => {
            if (!raw) return null;
            const text = String(raw).trim();
            const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
            if (fence && fence[1]) {
              const inside = fence[1].replace(/[\u0000-\u001F]/g, '');
              try { return JSON.parse(inside); } catch {}
              try { return JSON.parse(inside.replace(/,\s*([}\]])/g, '$1')); } catch {}
            }
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
            try { return JSON.parse(text.replace(/[\u0000-\u001F]/g, '')); } catch {}
            return null;
          };

          // Parse grading JSON robustly and normalize to legacy shape
          let score = 80;
          let feedback = 'Great effort! Keep practicing.';
          let strengths: string[] = [];
          let areasForImprovement: string[] = [];
          let suggestions: string[] = [];
          try {
            const parsed: any = extract(String(content || ''));
            if (parsed) {
              const category = parsed.grade || 'Good';
              const scoreMap: Record<string, number> = { 'Excellent': 95, 'Good': 85, 'Needs Improvement': 65, 'Incomplete': 40 };
              score = scoreMap[category] ?? 80;
              feedback = parsed.feedback || feedback;
              strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
              areasForImprovement = Array.isArray(parsed.areasForImprovement) ? parsed.areasForImprovement : [];
              suggestions = Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [];
            }
          } catch {}
          handlers.onFinal?.({ score, feedback, suggestions, strengths, areasForImprovement });

          // Best-effort DB update mirroring non-streaming path
          try {
            await supabase
              .from('homework_submissions')
              .update({
                grade: Number(score),
                feedback: feedback,
                graded_at: new Date().toISOString(),
                graded_by: 'ai',
                status: 'reviewed'
              })
              .eq('id', submissionId);
          } catch (dbErr) {
            log.warn('Failed to update submission with streamed AI grade:', dbErr);
          }
        },
        onError: (err) => handlers.onError?.(err),
      });
    } catch (e: any) {
      log.error('Stream AI homework grading error:', e);
      handlers.onError?.({ message: e?.message || 'Streaming error' });
    }
  }

  static async getAssignments(filter?: HomeworkFilter): Promise<HomeworkAssignment[]> {
    try {
      let query = supabase
        .from('homework_assignments')
        .select(`
          id,
          title,
          description,
          created_at,
          due_date,
          class_id,
          teacher_id
        `);

      // Apply filters if provided (limited to known HomeworkFilter fields)
      if (filter) {
        const f: any = filter as any; // allow legacy fields without breaking types
        if (f.lesson_id) {
          query = query.eq('lesson_id', f.lesson_id);
        }
        if (filter.student_id) {
          // Note: filtering assignments by student requires a view/join; left as-is if backend supports it
          query = query.eq('student_id', filter.student_id);
        }
        if (f.difficulty_level) {
          query = query.eq('difficulty_level', f.difficulty_level);
        }
        if (typeof f.is_required === 'boolean') {
          query = query.eq('is_required', f.is_required);
        }
        if (f.due_after) {
          query = query.gte('created_at', f.due_after);
        }
        if (f.due_before) {
          query = query.lte('created_at', f.due_before);
        }
      }

      query = query.order('created_at', { ascending: false });

      const response = await query;

      if (response.error) {
        throw new Error(`Failed to fetch homework assignments: ${response.error.message}`);
      }

      return (response.data as unknown) as HomeworkAssignment[];
    } catch (error) {
      log.error('Error fetching homework assignments:', error);
      throw error;
    }
  }

  static async getSubmissions(studentId: string): Promise<StudentHomeworkSubmission[]> {
    try {
      const response = await supabase
        .from('homework_submissions')
        .select(`
          id,
          status,
          created_at,
          submission_text,
          file_urls,
          grade,
          graded_at,
          teacher_feedback:feedback,
          homework_assignment:homework_assignments(
            id,
            title,
            description,
            created_at,
            due_date
          ),
          student:students(
            id,
            first_name,
            last_name
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (response.error) {
        throw new Error(`Failed to fetch homework submissions: ${response.error.message}`);
      }
      const rows = (response.data || []) as any[];
      const mapped: StudentHomeworkSubmission[] = rows.map((r) => ({
        ...r,
        grade: r.grade != null ? String(r.grade) : null,
        teacher_feedback: r.teacher_feedback ?? r.feedback ?? null,
        submission_content: r.submission_content ?? r.submission_text ?? null,
      }));
      return mapped;
    } catch (error) {
      log.error('Error fetching homework submissions:', error);
      throw error;
    }
  }

  static async submitHomework(data: HomeworkSubmissionData, mediaFiles?: {
    uri: string;
    fileName: string;
    mimeType: string;
  }[]): Promise<{ submissionId: string; uploadedFiles: string[] }> {
    try {
      // First, create the homework submission
        const submissionData = {
        homework_assignment_id: data.homework_assignment_id,
        student_id: data.student_id,
        submission_text: data.submission_content,
        file_urls: data.attachment_urls || [],
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      };

      const response = await supabase
        .from('homework_submissions')
        .insert(submissionData)
        .select()
        .single();

      if (response.error) throw new Error(response.error.message);

      const submissionId = response.data.id;
      const uploadedFiles: string[] = [];

      // If there are media files, upload them and update the submission
      if (mediaFiles && mediaFiles.length > 0) {
        const { MediaService } = await import('./mediaService');

        // Get student and preschool info for upload
        const { data: studentData } = await supabase
          .from('students')
          .select('preschool_id, parent_id')
          .eq('id', data.student_id)
          .single();

        if (!studentData) throw new Error('Student not found');

        // Upload each media file
        const uploadPromises = mediaFiles.map(async (file, index) => {
          const fileName = file.fileName || `homework_${submissionId}_${index}_${Date.now()}.jpg`;
          return MediaService.uploadMedia(
            file.uri,
            fileName,
            file.mimeType,
            (studentData.parent_id ?? data.student_id) as string,
            studentData.preschool_id,
            {
              studentId: data.student_id,
              homeworkSubmissionId: submissionId
            }
          );
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Check for upload failures
        const failedUploads = uploadResults.filter(result => result.error);
        if (failedUploads.length > 0) {
          log.warn('Some file uploads failed:', failedUploads);
          // You might want to handle this differently based on your requirements
        }

        // Collect successful upload URLs
        const successfulUploads = (uploadResults as any[])
          .filter((result: any) => result.data)
          .map((result: any) => result.data!.file_url);

        uploadedFiles.push(...successfulUploads);

        // Update submission with uploaded file URLs
        if (successfulUploads.length > 0) {
          const { error: updateError } = await supabase
            .from('homework_submissions')
            .update({
              file_urls: [...(data.attachment_urls || []), ...successfulUploads]
            })
            .eq('id', submissionId);

          if (updateError) {
            log.warn('Failed to update submission with uploaded files:', updateError);
          }
        }
      }

      return { submissionId, uploadedFiles };
    } catch (error) {
      log.error('Error submitting homework:', error);
      throw error;
    }
  }

  static async getNotifications(userId: string): Promise<HomeworkNotification[]> {
    // homework_notifications table not present; return empty for now
    return [] as HomeworkNotification[];
  }

  static async getSummary(studentId: string): Promise<HomeworkSummary> {
    try {
      // Calculate summary locally

      const submissions = await this.getSubmissions(studentId);

      const summary: HomeworkSummary = {
        total_assignments: submissions.length,
        completed_assignments: submissions.filter(s => s.status === 'submitted' || s.status === 'completed' || s.status === 'reviewed').length,
        pending_assignments: submissions.filter(s => s.status === 'assigned' || s.status === 'in_progress').length,
        overdue_assignments: submissions.filter(s => {
          if (!s.homework_assignment?.due_date_offset_days) return false;
          const dueDate = new Date(s.created_at);
          dueDate.setDate(dueDate.getDate() + s.homework_assignment.due_date_offset_days);
          return new Date() > dueDate && (s.status === 'assigned' || s.status === 'in_progress');
        }).length,
        in_progress_assignments: submissions.filter(s => s.status === 'in_progress').length,
        upcoming_deadlines: [],
        recent_feedback: [],
      };

      return summary;
    } catch (error) {
      log.error('Error generating homework summary:', error);
      throw new Error('Failed to generate homework summary');
    }
  }

  // AI-powered homework assistance (uses structured AI proxy with optional attachments support)
  static async getHomeworkHelp(
    assignmentTitle: string,
    question: string,
    gradeLevelOrAge: string | number,
    studentId?: string,
    childName?: string,
    parentName?: string,
    languageCode?: string,
    hintsOnly?: boolean,
  ): Promise<{
    explanation: string;
    hints: string[];
    examples: string[];
  }> {
    try {
      if (!AI_ENABLED) {
        return {
          explanation: 'For help with this assignment, please ask your teacher or parent.',
          hints: ['Read the instructions carefully', 'Take your time'],
          examples: ['Practice similar problems']
        };
      }

      // Resolve student age with priority: studentId -> numeric param -> parsed from string
      let studentAge = 5;
      try {
        if (studentId) {
          const { data: studentRow } = await supabase
            .from('students')
            .select('date_of_birth')
            .eq('id', studentId)
            .maybeSingle();
          if (studentRow?.date_of_birth) {
            const dob = new Date(studentRow.date_of_birth);
            const now = new Date();
            let ageYears = now.getFullYear() - dob.getFullYear();
            const m = now.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) ageYears--;
            if (Number.isFinite(ageYears)) studentAge = ageYears;
          }
        }
      } catch {}
      if (!Number.isFinite(studentAge) || studentAge <= 0) {
        if (typeof gradeLevelOrAge === 'number') {
          studentAge = gradeLevelOrAge;
        } else {
          const ageMatch = String(gradeLevelOrAge || '').match(/(\d{1,2})/);
          studentAge = ageMatch ? parseInt(ageMatch[1], 10) : 5;
        }
      }
      // Clamp to a reasonable band for school-aged children
      studentAge = Math.max(3, Math.min(17, Math.round(studentAge)));

      // Resolve current auth user and preschool for logging/association
      let internalUserId: string | null = null;
      let preschoolId: string | null = null;
      try {
        const { data: auth } = await supabase.auth.getUser();
        const authUserId = auth?.user?.id || null;
        if (authUserId) {
          const { data: userRow } = await supabase
            .from('users')
            .select('id, preschool_id')
            .eq('auth_user_id', authUserId)
            .maybeSingle();
          if (userRow) {
            internalUserId = userRow.id;
            preschoolId = userRow.preschool_id;
          }
        }
      } catch {}

      // Provide assignment context inline within the question
      const combinedQuestion = assignmentTitle
        ? `[Assignment: ${assignmentTitle}] ${question}`
        : question;

      // Call the structured homework help pathway (supports attachments via other UIs)
      const result = await claudeAI.askHomeworkHelp({
        question: combinedQuestion,
        childName: childName,
        parentName: parentName,
        languageCode: languageCode,
        hintsOnly: !!hintsOnly,
        childAge: studentAge,
        userId: internalUserId || 'unknown',
        preschoolId: preschoolId || 'unknown',
      });

      if (result.success) {
        return {
          explanation: result.answer || 'Here are some tips to get started...',
          hints: Array.isArray(result.suggestions) ? result.suggestions : [],
          examples: [],
        };
      }

      // When the AI proxy returns a structured error, surface it to the user instead of a generic template
      const code = String(result?.errorCode || '').toUpperCase();
      const msg = String(result?.error || '').trim() || 'AI service is temporarily unavailable.';
      if (code) {
        const explanationBase = (() => {
          switch (code) {
            case 'USAGE_LIMIT':
              return 'You\'ve reached your monthly AI usage limit for this plan. Please try again after your usage resets, enable tester access, or ask your school admin to upgrade your plan.';
            case 'TRIAL_EXPIRED':
              return 'Your 14-day trial has expired. To continue using AI features, please upgrade your plan or contact your school administrator.';
            case 'TRIAL_DAILY_LIMIT':
              return 'You\'ve reached the daily AI usage limit during your trial. Please try again tomorrow or contact your admin for additional access.';
            case 'TRIAL_TOTAL_LIMIT':
              return 'You\'ve reached the total AI usage limit for your trial. Please contact your admin to upgrade or request tester access.';
            case 'RATE_LIMIT':
            case 'RATE_LIMIT_BURST':
            case 'RATE_LIMIT_MINUTE':
              return 'You\'re sending requests too quickly. Please wait a moment and try again.';
            default:
              return msg;
          }
        })();
        const explanation = result?.quota_charged === false
          ? `${explanationBase} This failed request has not been counted against your quota.`
          : explanationBase;
        return {
          explanation,
          hints: [],
          examples: []
        };
      }

      // Generic failure
      throw new Error(msg || 'AI homework help service unavailable');
    } catch (error) {
      log.error('Error getting homework help:', error);

      // Check if this was a quota-protected error
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const isQuotaProtected = errorMsg.includes('not counted against your quota');

      return {
        explanation: isQuotaProtected ?
          'AI service temporarily unavailable. Your quota was not charged for this request. Please try again or ask your teacher.' :
          'For help with this assignment, please ask your teacher or parent.',
        hints: ['Read the problem carefully', 'Take your time to understand'],
        examples: ['Practice makes perfect']
      };
    }
  }

  /**
   * Stream homework help chat. Provides incremental text updates via onDelta.
   */
  static async streamHomeworkHelp(
    assignmentTitle: string,
    question: string,
    gradeLevelOrAge: string | number,
    studentId: string | undefined,
    childName: string | undefined,
    parentName: string | undefined,
    languageCode: string | undefined,
    hintsOnly: boolean | undefined,
    handlers: {
      onDelta?: (chunk: string) => void;
      onFinal?: (payload: { explanation: string }) => void;
      onError?: (err: { message: string; code?: string }) => void;
    }
  ): Promise<void> {
    try {
      if (!AI_ENABLED) {
        handlers.onFinal?.({ explanation: 'For help with this assignment, please ask your teacher or parent.' });
        return;
      }

      // Resolve student age
      let studentAge = 5;
      try {
        if (studentId) {
          const { data: studentRow } = await supabase
            .from('students')
            .select('date_of_birth')
            .eq('id', studentId)
            .maybeSingle();
          if (studentRow?.date_of_birth) {
            const dob = new Date(studentRow.date_of_birth);
            const now = new Date();
            let ageYears = now.getFullYear() - dob.getFullYear();
            const m = now.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) ageYears--;
            if (Number.isFinite(ageYears)) studentAge = ageYears;
          }
        }
      } catch {}
      if (!Number.isFinite(studentAge) || studentAge <= 0) {
        if (typeof gradeLevelOrAge === 'number') studentAge = gradeLevelOrAge;
        else {
          const ageMatch = String(gradeLevelOrAge || '').match(/(\d{1,2})/);
          studentAge = ageMatch ? parseInt(ageMatch[1], 10) : 5;
        }
      }
      studentAge = Math.max(3, Math.min(17, Math.round(studentAge)));

      // Provide assignment context inline within the question
      const combinedQuestion = assignmentTitle ? `[Assignment: ${assignmentTitle}] ${question}` : question;

      await claudeAI.streamHomeworkHelp({
        question: combinedQuestion,
        childAge: studentAge,
        childName,
        parentName,
        languageCode,
        hintsOnly,
      }, {
        onDelta: (chunk) => handlers.onDelta?.(chunk),
        onFinal: ({ content }) => {
          const text = String(content || '');
          handlers.onFinal?.({ explanation: text });
        },
        onError: (err) => handlers.onError?.(err),
      });
    } catch (e: any) {
      log.error('Stream AI homework help error:', e);
      handlers.onError?.({ message: e?.message || 'Streaming error' });
    }
  }

  // Create homework assignment with AI assistance
  static async createAssignmentWithAI(lessonId: string, gradeLevel: string, subject: string, learningObjectives: string[]): Promise<{
    title: string;
    description: string;
    instructions: string;
    materials_needed: string;
    estimated_time_minutes: number;
    difficulty_level: number;
  }> {
    try {
      if (!AI_ENABLED) {
        return {
          title: 'Practice Assignment',
          description: 'Complete the practice exercises',
          instructions: 'Follow the lesson materials and complete all exercises',
          materials_needed: 'Pencil, paper, lesson materials',
          estimated_time_minutes: 30,
          difficulty_level: 2
        };
      }

      const prompt = `
        Create a homework assignment for early childhood education:
        
        Grade Level: ${gradeLevel}
        Subject: ${subject}
        Learning Objectives: ${learningObjectives.join(', ')}
        
        Please create:
        1. An engaging title
        2. Clear description of what students will do
        3. Step-by-step instructions appropriate for the age group
        4. List of materials needed
        5. Estimated time in minutes (realistic for young learners)
        6. Difficulty level (1-5 scale, where 1 is easiest)
        
        Make it age-appropriate, engaging, and educational.
        
        Format as JSON: {
          "title": "string",
          "description": "string",
          "instructions": "string",
          "materials_needed": "string",
          "estimated_time_minutes": number,
          "difficulty_level": number
        }
      `;

      const response = await claudeService.generateContent({
        prompt,
        type: 'assignment_creation',
        context: { lessonId, gradeLevel, subject },
      });

      if (response.success && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (parseError) {
          log.warn('Failed to parse assignment creation response:', parseError);
          return {
            title: 'Practice Assignment',
            description: response.content.slice(0, 100),
            instructions: 'Complete the activities as described',
            materials_needed: 'Basic school supplies',
            estimated_time_minutes: 30,
            difficulty_level: 2
          };
        }
      }

      throw new Error('AI assignment creation service unavailable');
    } catch (error) {
      log.error('Error creating assignment with AI:', error);
      return {
        title: 'Practice Assignment',
        description: 'Complete the practice exercises based on today\'s lesson',
        instructions: 'Follow the lesson materials and complete all exercises carefully',
        materials_needed: 'Pencil, paper, lesson materials',
        estimated_time_minutes: 30,
        difficulty_level: 2
      };
    }
  }
}

