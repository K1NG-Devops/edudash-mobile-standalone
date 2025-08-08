import { HomeworkAssignment, StudentHomeworkSubmission, HomeworkSubmissionData, HomeworkNotification, HomeworkFilter, HomeworkSummary } from '@/types/homework-types';
import { supabase } from '../supabase';
import { claudeService } from '@/lib/ai/claudeService';

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
      try { (supabase as any).removeChannel(channel); } catch {}
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
      if (process.env.EXPO_PUBLIC_AI_ENABLED !== 'true') {
        // Fallback grading without AI
        return {
          score: 75,
          feedback: 'Good effort on this assignment. Keep working hard!',
          suggestions: ['Review the material again', 'Practice more examples'],
          strengths: ['Shows understanding of basic concepts'],
          areasForImprovement: ['Attention to detail', 'Following instructions']
        };
      }

      const prompt = `
        As an experienced early childhood educator, grade this homework submission:
        
        Assignment: ${assignmentTitle}
        Grade Level: ${gradeLevel}
        Student Submission: ${submissionContent}
        
        Please provide:
        1. A score out of 100
        2. Constructive feedback (age-appropriate)
        3. 2-3 specific suggestions for improvement
        4. 1-2 strengths demonstrated
        5. 1-2 areas for improvement
        
        Format as JSON: {
          "score": number,
          "feedback": "string",
          "suggestions": ["suggestion1", "suggestion2"],
          "strengths": ["strength1", "strength2"],
          "areasForImprovement": ["area1", "area2"]
        }
      `;

      const response = await claudeService.generateContent({
        prompt,
        type: 'grading',
        context: { submissionId, gradeLevel },
      });

      if (response.success && response.content) {
        try {
          const gradingResult = JSON.parse(response.content);
          
          // Update the submission with AI grading
          await supabase
            .from('homework_submissions')
            .update({
              ai_score: gradingResult.score,
              ai_feedback: gradingResult.feedback,
              graded_at: new Date().toISOString(),
              graded_by: 'ai',
              status: 'graded'
            })
            .eq('id', submissionId);
          
          return gradingResult;
        } catch (parseError) {
          console.warn('Failed to parse AI grading response:', parseError);
          // Return fallback grading
          return {
            score: 75,
            feedback: response.content.slice(0, 200),
            suggestions: ['Continue practicing', 'Ask for help when needed'],
            strengths: ['Shows effort and engagement'],
            areasForImprovement: ['Focus on accuracy']
          };
        }
      }
      
      throw new Error('AI grading service unavailable');
    } catch (error) {
      console.error('Error in AI homework grading:', error);
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

  static async getAssignments(filter?: HomeworkFilter): Promise<HomeworkAssignment[]> {
    try {
      let query = supabase
        .from('homework_assignments')
        .select(`
          *,
          lesson:lessons(
            id,
            title,
            description,
            thumbnail_url
          )
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
      
      return response.data as HomeworkAssignment[];
    } catch (error) {
      console.error('Error fetching homework assignments:', error);
      throw error;
    }
  }

  static async getSubmissions(studentId: string): Promise<StudentHomeworkSubmission[]> {
    try {
      const response = await supabase
        .from('homework_submissions')
        .select(`
          *,
          homework_assignment:homework_assignments(
            id,
            title,
            description,
            instructions,
            materials_needed,
            due_date_offset_days,
            estimated_time_minutes,
            difficulty_level,
            is_required,
            lesson:lessons(
              title,
              subject
            )
          ),
          student:students(
            id,
            full_name,
            grade_level
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
        submission_content: r.submission_content ?? r.submission_text ?? null,
      }));
      return mapped;
    } catch (error) {
      console.error('Error fetching homework submissions:', error);
      throw error;
    }
  }

  static async submitHomework(data: HomeworkSubmissionData, mediaFiles?: Array<{
    uri: string;
    fileName: string;
    mimeType: string;
  }>): Promise<{ submissionId: string; uploadedFiles: string[] }> {
    try {
      // First, create the homework submission
      const submissionData = {
        homework_assignment_id: data.homework_assignment_id,
        student_id: data.student_id,
        submission_text: data.submission_content,
        attachment_urls: data.attachment_urls || [],
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
          console.warn('Some file uploads failed:', failedUploads);
          // You might want to handle this differently based on your requirements
        }

        // Collect successful upload URLs
        const successfulUploads = uploadResults
          .filter(result => result.data)
          .map(result => result.data!.file_url);
        
        uploadedFiles.push(...successfulUploads);

        // Update submission with uploaded file URLs
        if (successfulUploads.length > 0) {
          const { error: updateError } = await supabase
            .from('homework_submissions')
            .update({ 
              attachment_urls: [...(data.attachment_urls || []), ...successfulUploads]
            })
            .eq('id', submissionId);

          if (updateError) {
            console.warn('Failed to update submission with uploaded files:', updateError);
          }
        }
      }

      return { submissionId, uploadedFiles };
    } catch (error) {
      console.error('Error submitting homework:', error);
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
      console.error('Error generating homework summary:', error);
      throw new Error('Failed to generate homework summary');
    }
  }

  // AI-powered homework assistance
  static async getHomeworkHelp(assignmentTitle: string, question: string, gradeLevel: string): Promise<{
    explanation: string;
    hints: string[];
    examples: string[];
  }> {
    try {
      if (process.env.EXPO_PUBLIC_AI_ENABLED !== 'true') {
        return {
          explanation: 'For help with this assignment, please ask your teacher or parent.',
          hints: ['Read the instructions carefully', 'Take your time'],
          examples: ['Practice similar problems']
        };
      }

      const prompt = `
        As a helpful early childhood education assistant, provide age-appropriate help for this homework question:
        
        Assignment: ${assignmentTitle}
        Grade Level: ${gradeLevel}
        Student Question: ${question}
        
        Please provide:
        1. A simple explanation appropriate for the grade level
        2. 2-3 helpful hints (not direct answers)
        3. 1-2 similar examples they can practice
        
        Keep language simple and encouraging for young learners.
        
        Format as JSON: {
          "explanation": "string",
          "hints": ["hint1", "hint2"],
          "examples": ["example1", "example2"]
        }
      `;

      const response = await claudeService.generateContent({
        prompt,
        type: 'homework_help',
        context: { assignmentTitle, gradeLevel },
      });

      if (response.success && response.content) {
        try {
          return JSON.parse(response.content);
        } catch (parseError) {
          console.warn('Failed to parse homework help response:', parseError);
          return {
            explanation: response.content.slice(0, 200),
            hints: ['Think step by step', 'Ask for help if you need it'],
            examples: ['Try a similar problem first']
          };
        }
      }
      
      throw new Error('AI homework help service unavailable');
    } catch (error) {
      console.error('Error getting homework help:', error);
      return {
        explanation: 'For help with this assignment, please ask your teacher or parent.',
        hints: ['Read the problem carefully', 'Take your time to understand'],
        examples: ['Practice makes perfect']
      };
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
      if (process.env.EXPO_PUBLIC_AI_ENABLED !== 'true') {
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
          console.warn('Failed to parse assignment creation response:', parseError);
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
      console.error('Error creating assignment with AI:', error);
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

