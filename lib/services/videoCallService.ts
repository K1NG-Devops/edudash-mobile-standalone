import { supabase } from '@/lib/supabase';
import { logger as log } from '@/lib/utils/logger';

export class VideoCallService {
  // Schedule a video call
  static async scheduleVideoCall(
    hostId: string,
    preschoolId: string,
    title: string,
    description: string | null,
    sessionType: 'parent_teacher' | 'parent_meeting' | 'staff_meeting' | 'group_call',
    invitedParticipants: string[],
    scheduledStartTime: string,
    scheduledEndTime: string,
    options?: {
      meetingRoomId?: string;
      meetingUrl?: string;
      dialInNumber?: string;
      accessCode?: string;
      maxParticipants?: number;
    }
  ) {
    try {
      const { data: videoCall, error } = await supabase
        .from('video_calls')
        .insert({
          preschool_id: preschoolId,
          teacher_id: hostId,
          title,
          description,
          scheduled_start: scheduledStartTime,
          scheduled_end: scheduledEndTime,
          meeting_id: options?.meetingRoomId || null,
          meeting_url: options?.meetingUrl || null,
          meeting_password: options?.accessCode || null,
          max_participants: options?.maxParticipants || 10,
        })
        .select()
        .single();

      if (error) throw error;

      return { data: videoCall, error: null };
    } catch (error) {
      log.error('Error scheduling video call:', error);
      return { data: null, error };
    }
  }

  // Get upcoming video calls for a user
  static async getUpcomingVideoCalls(userId: string) {
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .select(`
          *,
          host:users!video_calls_teacher_id_fkey(name, avatar_url)
        `)
        .eq('teacher_id', userId)
        .gt('scheduled_end', new Date().toISOString())
        .order('scheduled_start', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      log.error('Error getting upcoming video calls:', error);
      return { data: null, error };
    }
  }

  // Cancel a video call
  static async cancelVideoCall(callId: string, userId: string) {
    try {
      const { data: call, error: fetchError } = await supabase
        .from('video_calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (fetchError) throw fetchError;

      if (call.teacher_id !== userId) {
        throw new Error('Only the host can cancel the call');
      }

      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'cancelled',
        })
        .eq('id', callId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      log.error('Error cancelling video call:', error);
      return { error };
    }
  }

  // Join a video call
  static async joinVideoCall(callId: string, userId: string) {
    try {
      const { data: call, error: fetchError } = await supabase
        .from('video_calls')
        .select('*')
        .eq('id', callId)
        .single();

      if (fetchError) throw fetchError;

      if (call.status !== 'scheduled' && call.status !== 'in_progress') {
        throw new Error('Cannot join a call that is not scheduled or in progress');
      }

      // For participant tracking, we should use the video_call_participants table
      const { error } = await supabase
        .from('video_call_participants')
        .insert({
          call_id: callId,
          user_id: userId,
          status: 'joined',
          joined_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      log.error('Error joining video call:', error);
      return { error };
    }
  }
}

