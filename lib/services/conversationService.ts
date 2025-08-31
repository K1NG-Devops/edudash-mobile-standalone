import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Using loose types to avoid coupling to generated types in environments where
// these tables were just added by migration and types may lag.
export type Conversation = any;
export type ConversationMember = any;

export class ConversationService {
  static async getCurrentUserId(authUserId: string): Promise<string | null> {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    return data?.id ?? null;
  }

  static async createGroup(params: {
    authUserId: string;
    preschoolId: string;
    name: string;
    description?: string;
    classId?: string | null;
    adminsOnly?: boolean;
    locked?: boolean;
    allowMemberPosting?: boolean;
    memberIds?: string[]; // array of users.id to add as members
  }): Promise<{ id?: string; error?: string }> {
    try {
      const currentId = await this.getCurrentUserId(params.authUserId);
      if (!currentId) return { error: 'Current user not found' };

      const settings = {
        admins_only: !!params.adminsOnly,
        locked: !!params.locked,
        allow_member_posting: params.allowMemberPosting ?? true,
      } as any;

      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          preschool_id: params.preschoolId,
          class_id: params.classId || null,
          type: 'group',
          name: params.name,
          description: params.description || null,
          created_by: currentId,
          settings,
        } as any)
        .select('id')
        .single();

      if (convErr) return { error: convErr.message };

      // Add owner (creator)
      const owner: Partial<ConversationMember> = {
        conversation_id: conv.id,
        user_id: currentId,
        role: 'owner' as any,
      } as any;

      const bulkMembers: Partial<ConversationMember>[] = [owner];
      for (const mid of params.memberIds || []) {
        if (mid !== currentId) {
          bulkMembers.push({ conversation_id: conv.id, user_id: mid, role: 'member' as any } as any);
        }
      }

      const { error: memErr } = await supabase
        .from('conversation_members')
        .insert(bulkMembers as any);
      if (memErr) return { error: memErr.message };

      return { id: conv.id };
    } catch (e: any) {
      return { error: e?.message || 'Failed to create group' };
    }
  }

  static async addMembers(params: {
    authUserId: string;
    conversationId: string;
    userIds: string[]; // users.id
    role?: 'member' | 'admin';
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const role = (params.role || 'member') as any;
      const rows = params.userIds.map(uid => ({ conversation_id: params.conversationId, user_id: uid, role }));
      const { error } = await supabase.from('conversation_members').insert(rows as any);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to add members' };
    }
  }

  static async setSettings(params: {
    authUserId: string;
    conversationId: string;
    patch: Partial<{ admins_only: boolean; locked: boolean; allow_member_posting: boolean }>;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Merge patch into existing settings
      const { data: conv, error: fetchErr } = await supabase
        .from('conversations')
        .select('settings')
        .eq('id', params.conversationId)
        .maybeSingle();
      if (fetchErr) return { success: false, error: fetchErr.message };

      const base = conv && typeof (conv as any).settings === 'object' && (conv as any).settings !== null
        ? ((conv as any).settings as Record<string, any>)
        : {};
      const next = { ...base, ...params.patch } as any;
      const { error } = await supabase
        .from('conversations')
        .update({ settings: next })
        .eq('id', params.conversationId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to update settings' };
    }
  }

  static async listMyConversations(authUserId: string): Promise<Conversation[]> {
    const uid = await this.getCurrentUserId(authUserId);
    if (!uid) return [];

    // Step 1: get membership rows without embeds (avoid FK alias requirements)
    const { data: memRows, error: memErr } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', uid);
    if (memErr || !memRows || memRows.length === 0) return [] as Conversation[];

    const ids = Array.from(new Set(memRows.map((r: any) => r.conversation_id).filter(Boolean)));
    if (ids.length === 0) return [] as Conversation[];

    // Step 2: fetch conversations by IDs
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .in('id', ids);
    if (convErr) return [] as Conversation[];

    // Optional: maintain membership order
    const orderMap = new Map<string, number>();
    ids.forEach((id, idx) => orderMap.set(id, idx));
    (convs || []).sort((a: any, b: any) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    return (convs || []) as Conversation[];
  }

  static async listMessages(conversationId: string, limit = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, created_at, sender_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) return [];
    return data || [];
  }

  // Scoped realtime subscription for a single conversation
  static subscribeToConversation(
    conversationId: string,
    handlers: {
      onInsert?: (row: any) => void;
      onUpdate?: (row: any) => void;
      onDelete?: (oldRow: any) => void;
      onStatus?: (status: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR') => void;
    }
  ) {
    const channel = (supabase as any)
      .channel(`conv_${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if ((payload as any)?.new) handlers.onInsert?.((payload as any).new);
        }
      )
      // Future support for edits/removals if needed
      // .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      //   (payload: RealtimePostgresChangesPayload<any>) => handlers.onUpdate?.((payload as any).new)
      // )
      // .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      //   (payload: RealtimePostgresChangesPayload<any>) => handlers.onDelete?.((payload as any).old)
      // )
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') handlers.onStatus?.('SUBSCRIBED');
        if (status === 'CLOSED') handlers.onStatus?.('CLOSED');
        if (status === 'CHANNEL_ERROR') handlers.onStatus?.('CHANNEL_ERROR');
      });

    return () => {
      try { (supabase as any).removeChannel(channel); } catch {}
    };
  }

  static async sendMessage(params: {
    authUserId: string;
    conversationId: string;
    content: string;
    messageType?: string;
  }): Promise<{ id?: string; error?: string }> {
    try {
      const uid = await this.getCurrentUserId(params.authUserId);
      if (!uid) return { error: 'Current user not found' };

      // Fetch conversation to derive preschool_id and type (announcement vs group)
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .select('type, preschool_id')
        .eq('id', params.conversationId)
        .maybeSingle();
      if (convErr) return { error: convErr.message };
      if (!conv) return { error: 'Conversation not found' };

      // Use allowed message_type values from schema; fallback to 'direct' for generic group chat
      const inferredType = conv.type === 'announcement' ? 'announcement' : 'direct';
      const messageType = (params.messageType as any) || inferredType;

      // Insert message with required preschool_id
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.conversationId,
          preschool_id: conv.preschool_id,
          sender_id: uid,
          subject: '',
          content: params.content,
          message_type: messageType,
        } as any)
        .select('id')
        .single();

      if (error) return { error: error.message };
      return { id: data?.id };
    } catch (e: any) {
      return { error: e?.message || 'Failed to send message' };
    }
  }
}

