import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/utils/logger';
import {
  MessageRecipientType,
  MessageType
} from '@/types/types';
const log = createLogger('message');

export class MessageService {
  // Subscribe to new messages for a user via Realtime channel
  static subscribeToUserMessages(userId: string, preschoolId: string, callback: (payload: any) => void) {
    const channel = (supabase as any).channel(`messages_user_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_recipients', filter: `recipient_id=eq.${userId}` }, (payload: any) => {
        callback(payload.new);
      })
      .subscribe();

    return () => {
      try { (supabase as any).removeChannel(channel); } catch { }
    };
  }

  static async getUserMessages(userId: string, preschoolId: string, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('message_recipients')
        .select(`
          *,
          message:messages(
            *,
            sender:users!messages_sender_id_fkey(id, name, avatar_url, role),
            preschool:preschools(id, name)
          )
        `)
        .or(`recipient_id.eq.${userId},recipient_id.eq.${preschoolId}`)
        // Filter on the joined messages table (PostgREST expects the table name, not the alias)
        .eq('messages.preschool_id', preschoolId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error fetching user messages:', error);
      return { data: null, error };
    }
  }

  // Subscribe to sent messages by a user via Realtime channel
  static subscribeToSentMessages(userId: string, preschoolId: string, callback: (message: any) => void) {
    const channel = (supabase as any).channel(`messages_sent_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, (payload: any) => {
        callback(payload.new);
      })
      .subscribe();

    return () => {
      try { (supabase as any).removeChannel(channel); } catch { }
    };
  }

  static async getSentMessages(userId: string, preschoolId: string, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, name, avatar_url, role),
          preschool:preschools(id, name),
          message_recipients(recipient_type, recipient_id, is_read)
        `)
        .eq('sender_id', userId)
        .eq('preschool_id', preschoolId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error fetching sent messages:', error);
      return { data: null, error };
    }
  }

  // Send a new message
  static async sendMessage(
    senderId: string,
    preschoolId: string,
    subject: string,
    content: string,
    messageType: MessageType,
    recipients: { type: MessageRecipientType; id: string }[],
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      attachmentUrls?: string[];
      scheduledSendAt?: string;
      expiresAt?: string;
      homeworkAssignmentId?: string;
      studentId?: string;
    }
  ) {
    try {
      // Insert the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          preschool_id: preschoolId,
          sender_id: senderId,
          subject,
          content,
          message_type: messageType,
          priority: (options?.priority as 'low' | 'normal' | 'high' | 'urgent' | undefined) ?? 'normal',
          attachment_urls: options?.attachmentUrls || null,
          scheduled_send_at: options?.scheduledSendAt || null,
          expires_at: options?.expiresAt || null,
          homework_assignment_id: options?.homeworkAssignmentId || null,
          student_id: options?.studentId || null,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Insert recipients
      const recipientInserts = recipients.map(recipient => ({
        message_id: message.id,
        recipient_type: recipient.type,
        recipient_id: recipient.id,
      }));

      const { error: recipientError } = await supabase
        .from('message_recipients')
        .insert(recipientInserts);

      if (recipientError) throw recipientError;

      // Create notifications for recipients
      await this.createNotifications(message.id, recipients, messageType);

      return { data: message, error: null };
    } catch (error) {
      log.error('Error sending message:', error);
      return { data: null, error };
    }
  }

  // Reply to a message
  static async replyToMessage(
    messageId: string,
    senderId: string,
    preschoolId: string,
    content: string,
    attachmentUrls?: string[]
  ) {
    try {
      // Get original message to extract subject and recipients
      const { data: originalMessage, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          message_recipients(recipient_type, recipient_id)
        `)
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Create reply subject
      const replySubject = (originalMessage.subject || '').startsWith('Re: ')
        ? originalMessage.subject
        : `Re: ${originalMessage.subject}`;

      // Get original recipients (excluding the current sender)
      const recipients = originalMessage.message_recipients
        .filter((r: any) => r.recipient_id !== senderId)
        .map((r: any) => ({ type: r.recipient_type, id: r.recipient_id }));

      // Add original sender as recipient if not already included
      if (originalMessage.sender_id !== senderId) {
        recipients.push({ type: 'user', id: originalMessage.sender_id });
      }

      // Send the reply
      return await this.sendMessage(
        senderId,
        preschoolId,
        replySubject,
        content,
        (originalMessage.message_type as any) ?? 'general',
        recipients,
        {
          attachmentUrls,
          priority: (originalMessage.priority ?? undefined) as 'low' | 'normal' | 'high' | 'urgent' | undefined,
        }
      );
    } catch (error) {
      log.error('Error replying to message:', error);
      return { data: null, error };
    }
  }

  // Mark message as read
  static async markMessageAsRead(messageId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('message_recipients')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('message_id', messageId)
        .eq('recipient_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      log.error('Error marking message as read:', error);
      return { error };
    }
  }

  // Archive/unarchive message
  static async toggleMessageArchive(messageId: string, userId: string, archived: boolean) {
    try {
      const { error } = await supabase
        .from('message_recipients')
        .update({
          is_archived: archived,
          archived_at: archived ? new Date().toISOString() : null
        })
        .eq('message_id', messageId)
        .eq('recipient_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      log.error('Error toggling message archive:', error);
      return { error };
    }
  }

  // Get unread message count
  static async getUnreadCount(userId: string, preschoolId: string) {
    try {
      const { count, error } = await supabase
        .from('message_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null)
        .eq('is_archived', false);

      if (error) throw error;
      return { count, error: null };
    } catch (error) {
      log.error('Error getting unread count:', error);
      return { count: 0, error };
    }
  }

  // Search messages
  static async searchMessages(
    userId: string,
    preschoolId: string,
    query: string,
    limit = 20
  ) {
    try {
      const term = `%${query}%`;
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, name, avatar_url, role),
          message_recipients!inner(recipient_id)
        `)
        .eq('preschool_id', preschoolId)
        .eq('message_recipients.recipient_id', userId)
        .or(`subject.ilike.${term},content.ilike.${term}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error searching messages:', error);
      return { data: null, error };
    }
  }

  // Save draft
  static async saveDraft(
    userId: string,
    preschoolId: string,
    subject: string,
    content: string,
    messageType: MessageType,
    recipientData: any,
    attachmentUrls?: string[],
    scheduledSendAt?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('message_drafts')
        .upsert({
          user_id: userId,
          preschool_id: preschoolId,
          subject,
          content,
          message_type: messageType,
          recipient_data: recipientData,
          attachment_urls: attachmentUrls || null,
          scheduled_send_at: scheduledSendAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error saving draft:', error);
      return { data: null, error };
    }
  }

  // Get user's drafts
  static async getDrafts(userId: string, preschoolId: string) {
    try {
      const { data, error } = await supabase
        .from('message_drafts')
        .select('*')
        .eq('user_id', userId)
        .eq('preschool_id', preschoolId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error fetching drafts:', error);
      return { data: null, error };
    }
  }

  // Delete draft
  static async deleteDraft(draftId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('message_drafts')
        .delete()
        .eq('id', draftId)
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      log.error('Error deleting draft:', error);
      return { error };
    }
  }

  // Create notifications for message recipients
  private static async createNotifications(
    messageId: string,
    recipients: { type: MessageRecipientType; id: string }[],
    messageType: MessageType
  ) {
    try {
      const notificationType = this.getNotificationType(messageType);

      // Only create notifications for user recipients
      const userRecipients = recipients.filter(r => r.type === 'user');

      if (userRecipients.length === 0) return;

      const notifications = userRecipients.map(recipient => ({
        user_id: recipient.id,
        title: 'New Message',
        message: `You have a new ${messageType} message`,
        type: notificationType,
        action_url: `/messages/${messageId}`,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    } catch (error) {
      log.error('Error creating notifications:', error);
    }
  }

  private static getNotificationType(messageType: MessageType): string {
    switch (messageType) {
      case 'announcement':
        return 'announcement';
      case 'system':
        return 'urgent_message';
      case 'homework_discussion':
        return 'message_reply';
      default:
        return 'new_message';
    }
  }

  // Get possible recipients for a user (based on their role and preschool)
  static async getPossibleRecipients(userId: string, preschoolId: string, userRole: string) {
    try {
      let query: any = supabase
        .from('users')
        .select('id, name, email, role, avatar_url')
        .eq('preschool_id', preschoolId)
        .eq('is_active', true)
        .neq('id', userId);

      // Filter based on user role permissions
      switch (userRole) {
        case 'parent':
          // Parents can only message teachers and preschool admins
          query = query.in('role', ['teacher', 'preschool_admin']);
          break;
        case 'teacher':
          // Teachers can message anyone in their preschool
          break;
        case 'preschool_admin':
          // Preschool admins can message anyone in their preschool
          break;
        case 'superadmin':
          // Super admins can message anyone
          query = supabase
            .from('users')
            .select('id, name, email, role, avatar_url, preschool:preschools(name)')
            .eq('is_active', true)
            .neq('id', userId);
          break;
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error fetching possible recipients:', error);
      return { data: null, error };
    }
  }
}
