export interface HomeworkAssignment {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  materials_needed: string | null;
  estimated_time_minutes: number;
  due_date_offset_days: number;
  difficulty_level: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  lesson?: {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
  };
}

export interface StudentHomeworkSubmission {
  id: string;
  homework_assignment_id: string;
  student_id: string;
  submitted_at: string | null;
  submission_content: string | null;
  attachment_urls: string[] | null;
  status: 'assigned' | 'in_progress' | 'submitted' | 'reviewed' | 'completed';
  teacher_feedback: string | null;
  grade: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  homework_assignment?: HomeworkAssignment;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
}

export interface HomeworkSummary {
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  overdue_assignments: number;
  in_progress_assignments: number;
  upcoming_deadlines: StudentHomeworkSubmission[];
  recent_feedback: StudentHomeworkSubmission[];
}

export interface HomeworkSubmissionData {
  homework_assignment_id: string;
  student_id: string;
  submission_content: string;
  attachment_urls?: string[];
}

export interface HomeworkNotification {
  id: string;
  user_id: string;
  homework_submission_id: string;
  type: 'deadline_reminder' | 'assignment_graded' | 'feedback_received' | 'assignment_assigned';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  homework_submission?: StudentHomeworkSubmission;
}

export interface HomeworkFilter {
  status?: 'all' | 'assigned' | 'in_progress' | 'submitted' | 'reviewed' | 'completed';
  student_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  overdue_only?: boolean;
}
