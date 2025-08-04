import { supabase } from '@/lib/supabase';

interface MessageThread {
  id: string;
  participants: string[];
  student_id?: string;
  preschool_id: string;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'template';
  template_id?: string;
  is_priority: boolean;
  created_at: string;
}

interface Participant {
  thread_id: string;
  user_id: string;
  last_read_at: string;
  is_muted: boolean;
}

class CommunicationService {
  static async createMessageThread(
    participants: string[],
    preschool_id: string,
    student_id?: string
  ): Promise<{ data: MessageThread | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .insert({
          participants,
          preschool_id,
          student_id,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async getMessageThreads(user_id: string): Promise<{ data: MessageThread[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select('*')
        .contains('participants', [user_id])
        .order('last_message_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async getMessages(thread_id: string): Promise<{ data: Message[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', thread_id)
        .order('created_at', { ascending: true });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async sendMessage(
    thread_id: string,
    sender_id: string,
    content: string,
    message_type: 'text' | 'image' | 'file' | 'template',
    template_id?: string,
    is_priority: boolean = false
  ): Promise<{ data: Message | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id,
          sender_id,
          content,
          message_type,
          template_id,
          is_priority,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async addParticipant(thread_id: string, user_id: string): Promise<{ data: Participant | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('message_participants')
        .insert({
          thread_id,
          user_id,
          last_read_at: new Date().toISOString(),
          is_muted: false,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Mock data methods for development/testing
  static getMockMessageThreads(): MessageThread[] {
    return [
      {
        id: 'thread-1',
        participants: ['teacher-1', 'parent-1'],
        student_id: 'student-1',
        preschool_id: 'preschool-1',
        last_message_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'thread-2',
        participants: ['teacher-1', 'parent-2'],
        student_id: 'student-2',
        preschool_id: 'preschool-1',
        last_message_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  static getMockMessages(): Message[] {
    return [
      {
        id: 'msg-1',
        thread_id: 'thread-1',
        sender_id: 'teacher-1',
        content: 'Hello! I wanted to update you on Emma\'s progress today.',
        message_type: 'text',
        is_priority: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-2',
        thread_id: 'thread-1',
        sender_id: 'parent-1',
        content: 'Thank you for the update! How did she do with her reading today?',
        message_type: 'text',
        is_priority: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg-3',
        thread_id: 'thread-1',
        sender_id: 'teacher-1',
        content: 'She did wonderfully! She read three new words today and was very engaged.',
        message_type: 'text',
        is_priority: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ];
  }
}

export { CommunicationService, MessageThread, Message, Participant };
