import { HomeworkAssignment, StudentHomeworkSubmission, HomeworkSubmissionData, HomeworkNotification, HomeworkFilter, HomeworkSummary } from '@/types/homework-types';
import { supabase } from '@/lib/supabase';

export class HomeworkService {
  // Mock data for testing
  private static mockAssignments: HomeworkAssignment[] = [
    {
      id: '1',
      lesson_id: 'lesson1',
      title: 'Math Practice - Addition',
      description: 'Practice addition problems with numbers 1-10',
      instructions: 'Complete the worksheet and show your work',
      materials_needed: 'Pencil, worksheet',
      estimated_time_minutes: 30,
      due_date_offset_days: 3,
      difficulty_level: 2,
      is_required: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lesson: {
        id: 'lesson1',
        title: 'Basic Addition',
        description: 'Learning to add numbers',
        thumbnail_url: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=Math'
      }
    },
    {
      id: '2',
      lesson_id: 'lesson2',
      title: 'Reading Comprehension',
      description: 'Read the story and answer questions',
      instructions: 'Read the story carefully and answer all questions',
      materials_needed: 'Story book, worksheet',
      estimated_time_minutes: 45,
      due_date_offset_days: 5,
      difficulty_level: 3,
      is_required: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lesson: {
        id: 'lesson2',
        title: 'Story Time',
        description: 'Reading and comprehension',
        thumbnail_url: 'https://via.placeholder.com/150/10B981/FFFFFF?text=Reading'
      }
    },
    {
      id: '3',
      lesson_id: 'lesson3',
      title: 'Art Project - Drawing',
      description: 'Draw your favorite animal',
      instructions: 'Use colors and be creative',
      materials_needed: 'Paper, crayons, markers',
      estimated_time_minutes: 60,
      due_date_offset_days: 7,
      difficulty_level: 1,
      is_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lesson: {
        id: 'lesson3',
        title: 'Creative Arts',
        description: 'Express your creativity',
        thumbnail_url: 'https://via.placeholder.com/150/F59E0B/FFFFFF?text=Art'
      }
    }
  ];

  static async getAssignments(filter?: HomeworkFilter): Promise<HomeworkAssignment[]> {
    try {
      // Try to fetch from Supabase first
      const response = await supabase
        .from('homework_assignments')
        .select('*')
        .match(filter || {});

      if (response.error) {
        console.log('Using mock data:', response.error.message);
        return this.mockAssignments;
      }
      
      // If successful but no data, return mock data
      if (!response.data || response.data.length === 0) {
        return this.mockAssignments;
      }
      
      return response.data as HomeworkAssignment[];
    } catch (error) {
      console.log('Error fetching assignments, using mock data:', error);
      return this.mockAssignments;
    }
  }

  static async getSubmissions(studentId: string): Promise<StudentHomeworkSubmission[]> {
    const response = await supabase
      .from('student_homework_submissions')
      .select('*')
      .eq('student_id', studentId);

    if (response.error) throw new Error(response.error.message);
    return response.data as StudentHomeworkSubmission[];
  }

  static async submitHomework(data: HomeworkSubmissionData): Promise<void> {
    const response = await supabase
      .from('student_homework_submissions')
      .insert(data);

    if (response.error) throw new Error(response.error.message);
  }

  static async getNotifications(userId: string): Promise<HomeworkNotification[]> {
    const response = await supabase
      .from('homework_notifications')
      .select('*')
      .eq('user_id', userId);

    if (response.error) throw new Error(response.error.message);
    return response.data as HomeworkNotification[];
  }

  static async getSummary(studentId: string): Promise<HomeworkSummary> {
    const response = await supabase
      .rpc('get_homework_summary', { student_id: studentId });

    if (response.error) throw new Error(response.error.message);
    return response.data as HomeworkSummary;
  }

  // More CRUD operations as needed
}

