import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConversationMessages } from '@/lib/hooks/useConversationMessages';
import { useConversationRealtime } from '@/lib/hooks/useConversationRealtime';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import ComposeMessageModal from './ComposeMessageModal';
import { ConversationService, type Conversation as RoomConversation } from '@/lib/services/conversationService';
import { router } from 'expo-router';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  message_type: 'text' | 'image' | 'file' | 'announcement' | 'system' | 'general';
  created_at: string;
  updated_at?: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
}

interface MessageAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface Conversation {
  id: string;
  participant_name: string;
  participant_avatar?: string | null;
  participant_role: string;
  child_name?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
}

interface MessagingCenterProps {
  profile: UserProfile | null;
  childrenList: any[];
  onClose: () => void;
  showHeader?: boolean;
}

const MessagingCenter: React.FC<MessagingCenterProps> = ({
  profile,
  childrenList,
  onClose,
  showHeader = true,
}) => {
  const { colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const NAV_OFFSET = 64; // approximate bottom nav height
  const navPad = insets.bottom + NAV_OFFSET;
  const isDark = colorScheme === 'dark';
  const colors = {
    bg: isDark ? '#0B1220' : '#F8FAFC',
    card: isDark ? '#0F172A' : '#FFFFFF',
    border: isDark ? '#334155' : '#E5E7EB',
    text: isDark ? '#F1F5F9' : '#1F2937',
    muted: isDark ? '#94A3B8' : '#6B7280',
    sub: isDark ? '#CBD5E1' : '#4B5563',
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null); // DM user id
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null); // group/announcement conversation id
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<RoomConversation[]>([]);
  const [roomSettings, setRoomSettings] = useState<{ admins_only?: boolean; locked?: boolean; allow_member_posting?: boolean } | null>(null);
  const [myRoomRole, setMyRoomRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  // Draft state for Direct Messages (DM). We store one draft per DM target.
  const [dmDraftId, setDmDraftId] = useState<string | null>(null);
  const draftTimerRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState<'conversations' | 'announcements'>('conversations');
  const [announcements, setAnnouncements] = useState<Message[]>([]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [parentUserId, setParentUserId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const messageSubscription = useRef<any>(null);

  // Query-backed room messages and realtime bridge
  const selectedRoom = selectedRoomId ? rooms.find((r: any) => r.id === selectedRoomId) : null;
  const roomMessagesQuery = useConversationMessages(
    selectedRoomId || undefined,
    (profile as any)?.preschool_id || undefined,
    String(profile?.role || '')
  );
  useConversationRealtime({
    conversationId: selectedRoomId || undefined,
    conversationType: (selectedRoom as any)?.type,
    preschoolId: (profile as any)?.preschool_id || undefined,
    role: String(profile?.role || ''),
    autoScroll: () => scrollToBottom(),
  });

  useEffect(() => {
    const init = async () => {
      if (!profile) return;
      await waitForAuthSession();
      await Promise.all([loadConversations(), loadAnnouncements(), loadRooms()]);
      await setupRealtimeSubscription();
    };
    init();

    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
    };
  }, [profile]);

  const waitForAuthSession = async (timeoutMs = 3000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) return true;
      } catch {}
      await new Promise(r => setTimeout(r, 150));
    }
    return false;
  };

  const setupRealtimeSubscription = async () => {
    // Subscribe to new message deliveries for this user
    try {
      const { data: parentProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile?.auth_user_id || '')
        .single();
      if (!parentProfile) return;
      setParentUserId(parentProfile.id);

      messageSubscription.current = (supabase as any)
        .channel(`message_recipients_user_${parentProfile.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'message_recipients', filter: `recipient_id=eq.${parentProfile.id}` },
          async (payload: any) => {
            const recipientRow = payload.new as { message_id: string };
            const { data: msg } = await supabase
              .from('messages')
              .select('id, content, created_at, sender_id')
              .eq('id', recipientRow.message_id)
              .single();
            if (msg) {
              setMessages(prev => [...prev, { id: msg.id, content: msg.content, created_at: msg.created_at || new Date().toISOString(), sender_id: msg.sender_id || '', message_type: 'general' }]);
              loadConversations();
              scrollToBottom();
            }
          }
        )
        .subscribe();
    } catch { }
  };

  // Load contacts for staff using secure RPC to avoid RLS issues
  const loadSchoolContacts = async (userProfile: any) => {
    try {
      const includeParents = ['teacher','principal','preschool_admin','admin','superadmin'].includes(String(userProfile.role || ''));
      const { data: contactsRpc, error } = await (supabase as any).rpc('get_messaging_contacts', {
        p_include_staff: true,
        p_include_parents: includeParents,
        p_limit: 500,
      });
      if (error) throw error;

      const schoolContacts: Conversation[] = (contactsRpc || []).map((u: any) => ({
        id: u.id,
        participant_name: u.name || u.email || 'Unknown User',
        participant_avatar: u.avatar_url,
        participant_role: u.role,
        last_message: `Start a conversation with ${u.name || 'this user'}`,
        last_message_time: '',
        unread_count: 0,
        is_online: false,
      }));

      setConversations(schoolContacts);
    } catch (error) {
      console.error('Error loading school contacts:', error);
      Alert.alert('Error', 'Failed to load school contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    if (!profile?.auth_user_id) return;
    try {
      const data = await ConversationService.listMyConversations(profile.auth_user_id);
      setRooms(data || []);
    } catch {}
  };

  const loadConversations = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Get user's internal ID and role
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id, role, preschool_id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (userError || !userProfile) {
        throw new Error('User profile not found');
      }
      setParentUserId(userProfile.id);

      // If user is staff with a preschool, show school contacts list (even if no prior messages)
      if ((userProfile.role === 'teacher' || userProfile.role === 'principal' || userProfile.role === 'preschool_admin')) {
        if (userProfile.preschool_id) {
          await loadSchoolContacts(userProfile);
          return;
        }
        // Fallback: try infer preschool_id from invitations
        try {
          const { data: tInvite } = await supabase
            .from('teacher_invitations')
            .select('preschool_id, created_at')
            .eq('invited_by', userProfile.id)
            .not('preschool_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          let fallbackSchool = tInvite?.preschool_id as string | null;
          if (!fallbackSchool) {
            const { data: inviteCode } = await supabase
              .from('invitation_codes')
              .select('preschool_id, created_at, is_active')
              .eq('invited_by', userProfile.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            fallbackSchool = (inviteCode?.preschool_id as string | null) || null;
          }
          if (!fallbackSchool) {
            const { data: schoolCode } = await supabase
              .from('school_invitation_codes')
              .select('preschool_id, created_at, is_active')
              .eq('invited_by', userProfile.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            fallbackSchool = (schoolCode?.preschool_id as string | null) || null;
          }
          if (fallbackSchool) {
            await loadSchoolContacts({ ...userProfile, preschool_id: fallbackSchool });
            return;
          }
        } catch {}
      }

      // Build conversation history without embedding cross-table user rows to avoid RLS blockers
      const { data: incoming, error: incomingError } = await supabase
        .from('message_recipients')
        .select(`
          read_at,
          created_at,
          message:messages!inner(
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .eq('recipient_id', userProfile.id)
        .order('created_at', { ascending: false });
      if (incomingError) throw incomingError;

      const { data: outgoing, error: outgoingError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          message_recipients(recipient_id)
        `)
        .eq('sender_id', userProfile.id)
        .order('created_at', { ascending: false });
      if (outgoingError) throw outgoingError;

      // Fetch contact metadata securely via RPC instead of direct users selects
      const includeParents = ['teacher','principal','preschool_admin','admin','superadmin'].includes(String(userProfile.role || ''));
      const { data: contactsRpc } = await (supabase as any).rpc('get_messaging_contacts', {
        p_include_staff: true,
        p_include_parents: includeParents,
        p_limit: 500,
      });
      const contactById: Record<string, { name?: string; avatar_url?: string | null; role?: string | null }> = {};
      (contactsRpc || []).forEach((u: any) => { if (u?.id) contactById[u.id] = { name: u.name, avatar_url: u.avatar_url, role: u.role }; });

      const conversationMap = new Map<string, Conversation>();

      // From incoming messages
      incoming?.forEach((row: any) => {
        const msg = row.message;
        if (!msg) return;
        const otherId = msg.sender_id;
        const meta = contactById[otherId] || {};
        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, {
            id: otherId,
            participant_name: meta.name || 'Unknown',
            participant_avatar: meta.avatar_url || null,
            participant_role: meta.role || 'teacher',
            last_message: msg.content,
            last_message_time: formatMessageTime(msg.created_at),
            unread_count: row.read_at ? 0 : 1,
            is_online: false,
          });
        } else {
          const existing = conversationMap.get(otherId)!;
          if (!row.read_at) existing.unread_count += 1;
          const existingTime = new Date(existing.last_message_time || 0);
          const newTime = new Date(msg.created_at);
          if (newTime > existingTime) {
            existing.last_message = msg.content;
            existing.last_message_time = formatMessageTime(msg.created_at);
          }
        }
      });

      // From outgoing messages
      outgoing?.forEach((msg: any) => {
        (msg.message_recipients || []).forEach((r: any) => {
          const otherId = r.recipient_id;
          const meta = contactById[otherId] || {};
          if (!conversationMap.has(otherId)) {
            conversationMap.set(otherId, {
              id: otherId,
              participant_name: meta.name || 'Unknown',
              participant_avatar: meta.avatar_url || null,
              participant_role: meta.role || 'teacher',
              last_message: msg.content,
              last_message_time: formatMessageTime(msg.created_at),
              unread_count: 0,
              is_online: false,
            });
          } else {
            const existing = conversationMap.get(otherId)!;
            const existingTime = new Date(existing.last_message_time || 0);
            const newTime = new Date(msg.created_at);
            if (newTime > existingTime) {
              existing.last_message = msg.content;
              existing.last_message_time = formatMessageTime(msg.created_at);
            }
          }
        });
      });

      // If no conversations exist, surface available contacts so the user can start a chat
      const existingConversations = Array.from(conversationMap.values());
      if (existingConversations.length === 0 && userProfile.preschool_id) {
        const availableContacts: Conversation[] = (contactsRpc || []).map((u: any) => ({
          id: u.id,
          participant_name: u.name || u.email || 'Unknown User',
          participant_avatar: u.avatar_url,
          participant_role: u.role,
          last_message: `Start a conversation with ${u.name || 'this user'}`,
          last_message_time: '',
          unread_count: 0,
          is_online: false,
        }));
        setConversations(availableContacts);
        return;
      }

      // Otherwise sort conversations (recent first); fallback to alpha by name
      const allConversations = existingConversations.sort((a, b) => {
        if (a.last_message_time && !b.last_message_time) return -1;
        if (!a.last_message_time && b.last_message_time) return 1;
        if (a.last_message_time && b.last_message_time) {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        }
        return a.participant_name.localeCompare(b.participant_name);
      });

      setConversations(allConversations);
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    if (!profile?.auth_user_id) return;

    try {
      // Resolve current user id
      const { data: parentProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();
      if (!parentProfile) return;

      // Fetch announcement message deliveries
      const { data: recips, error: recErr } = await supabase
        .from('message_recipients')
        .select('message_id, read_at, created_at')
        .eq('recipient_id', parentProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (recErr) throw recErr;

      const ids = Array.from(new Set((recips || []).map((r: any) => r.message_id)));
      if (ids.length === 0) { setAnnouncements([]); return; }

      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, message_type')
        .in('id', ids)
        .eq('message_type', 'announcement')
        .order('created_at', { ascending: false });
      if (msgErr) throw msgErr;

      const senderIds = Array.from(new Set((msgs || []).map((m: any) => m.sender_id).filter(Boolean)));
      let senders: Record<string, any> = {};
      if (senderIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .in('id', senderIds);
        (users || []).forEach((u: any) => { senders[u.id] = u; });
      }

      const mapped: Message[] = (msgs || []).map((m: any) => ({
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        sender_id: m.sender_id,
        message_type: (m.message_type as any) || 'announcement',
        sender_name: senders[m.sender_id]?.name,
        sender_avatar: senders[m.sender_id]?.avatar_url,
      }));

      setAnnouncements(mapped);
    } catch (error) {
      // Removed debug statement: console.error('Error loading announcements:', error);
    }
  };

  const loadRoomContext = async (roomId: string) => {
    try {
      // Pull conversation row and my membership
      const list = await ConversationService.listMyConversations(profile!.auth_user_id);
      const found = (list || []).find((c: any) => c.id === roomId);
      setRoomSettings(found?.settings || null);
      // Find my role
      const uid = await ConversationService.getCurrentUserId(profile!.auth_user_id);
      if (uid) {
        const { data } = await supabase
          .from('conversation_members')
          .select('role')
          .eq('conversation_id', roomId)
          .eq('user_id', uid)
          .maybeSingle();
        if (data?.role) setMyRoomRole(data.role);
      }
    } catch {}
  };

  const loadMessages = async (conversationId: string) => {
    if (!profile) return;

    try {
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) return;

      // Build DM thread without embeds
      const { data: recIncoming, error: incomingError } = await supabase
        .from('message_recipients')
        .select('message_id, read_at')
        .eq('recipient_id', parentProfile.id);
      if (incomingError) throw incomingError;

      const incomingIds = (recIncoming || []).map((r: any) => r.message_id);

      const { data: recOutgoing, error: outgoingError } = await supabase
        .from('message_recipients')
        .select('message_id')
        .eq('recipient_id', conversationId);
      if (outgoingError) throw outgoingError;

      const outgoingIds = (recOutgoing || []).map((r: any) => r.message_id);

      const allIds = Array.from(new Set([...incomingIds, ...outgoingIds]));
      if (allIds.length === 0) { setMessages([]); return; }

      const { data: msgsAll } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .in('id', allIds)
        .or(`and(sender_id.eq.${conversationId}),and(sender_id.eq.${parentProfile.id})`)
        .order('created_at', { ascending: true });

      const unified: Message[] = (msgsAll || [])
        .map((m: any) => ({ id: m.id, content: m.content, created_at: m.created_at, sender_id: m.sender_id, message_type: 'general' }));

      setMessages(unified);

      // Mark as read for any incoming unread
      await supabase
        .from('message_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', parentProfile.id)
        .eq('is_read', false);

      scrollToBottom();
    } catch (error) {
      // Removed debug statement: console.error('Error loading messages:', error);
    }
  };

  const canPostInRoom = () => {
    if (!roomSettings) return true;
    const isAdmin = myRoomRole === 'owner' || myRoomRole === 'admin';
    if (roomSettings.locked) return isAdmin;
    if (roomSettings.admins_only) return isAdmin;
    if (roomSettings.allow_member_posting === false) return isAdmin;
    return true;
  };

  // Load an existing draft for a DM target (recipient user id)
  const loadDMDraft = async (recipientUserId: string) => {
    try {
      if (!profile?.auth_user_id) return;
      // Resolve current user id (sender_id)
      const { data: me } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();
      if (!me) return;

      const { data: draft } = await supabase
        .from('message_drafts')
        .select('id, subject, content, recipient_ids')
        .eq('sender_id', me.id)
        .contains('recipient_ids', [recipientUserId])
        .maybeSingle();

      if (draft) {
        setDmDraftId(draft.id);
        if (typeof draft.content === 'string') setNewMessage(draft.content);
      } else {
        setDmDraftId(null);
        // do not overwrite newMessage here; user might have started typing
      }
    } catch {}
  };

  // Save or update current DM draft (debounced by effect below)
  const saveDMDraftNow = async () => {
    try {
      if (!selectedConversation || !profile?.auth_user_id) return;
      // resolve current user id
      const { data: me } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();
      if (!me) return;

      if (!newMessage.trim()) {
        // If there is an existing draft and content is empty, we keep it for now (user may continue typing)
        return;
      }

      if (!dmDraftId) {
        // Insert new draft
        const { data: inserted, error: insErr } = await supabase
          .from('message_drafts')
          .insert({
            sender_id: me.id,
            subject: '',
            content: newMessage,
            recipient_ids: [selectedConversation],
          })
          .select('id')
          .single();
        if (!insErr && inserted?.id) setDmDraftId(inserted.id);
      } else {
        // Update existing draft
        await supabase
          .from('message_drafts')
          .update({ content: newMessage })
          .eq('id', dmDraftId);
      }
    } catch {}
  };

  const deleteDMDraft = async () => {
    try {
      if (dmDraftId) {
        await supabase.from('message_drafts').delete().eq('id', dmDraftId);
      }
      setDmDraftId(null);
    } catch {}
  };

  // Debounce saving drafts while typing for DMs only
  useEffect(() => {
    if (!selectedConversation) return; // only for DM
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      saveDMDraftNow();
    }, 600);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [newMessage, selectedConversation]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    try {
      setSending(true);

      // If room chat
      if (selectedRoomId) {
        const res = await ConversationService.sendMessage({
          authUserId: profile!.auth_user_id,
          conversationId: selectedRoomId,
          content: newMessage.trim(),
        });
        if (res.error) throw new Error(res.error);
        setNewMessage('');
        // Room messages will update via Realtime + React Query; just scroll
        scrollToBottom();
        return;
      }

      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }

      // Atomic server-side send via RPC (handles RLS)
      const { data: messageId, error: rpcError } = await supabase.rpc('send_direct_message', {
        p_recipient_user_id: selectedConversation,
        p_content: newMessage.trim(),
        p_subject: '',
        p_message_type: 'direct',
      });

      if (rpcError || !messageId) {
        throw rpcError || new Error('send_direct_message failed');
      }

      setNewMessage('');
      await deleteDMDraft();
      await loadMessages(selectedConversation);
      await loadConversations();
    } catch (error) {
      // Removed debug statement: console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadConversations(), loadAnnouncements()]);
    if (selectedConversation) {
      await loadMessages(selectedConversation);
    }
    setRefreshing(false);
  }, [selectedConversation]);

  const renderConversationsList = () => (
    <ScrollView
      style={styles.conversationsList}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Group/Announcement Conversations */}
      {rooms.map((room: any) => (
        <TouchableOpacity
          key={`room_${room.id}`}
          style={[
            styles.conversationItem,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
            selectedRoomId === room.id && (isDark ? styles.selectedConversationDark : styles.selectedConversation)
          ]}
          onPress={async () => {
            setSelectedConversation(null);
            setSelectedRoomId(room.id);
            await loadRoomContext(room.id);
            // Messages will be loaded via React Query hook; Realtime will append incoming
            scrollToBottom();
          }}
        >
          <View style={styles.avatarContainer}>
            <View style={[styles.defaultAvatar, isDark && { backgroundColor: '#334155' }]}>
              <Text style={[styles.avatarText, { color: isDark ? '#CBD5E1' : '#6B7280' }]}>
                {(room.name || 'Room').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.participantName, { color: colors.text }]}>{room.name || 'Group'}</Text>
              <Text style={[styles.messageTime, { color: colors.muted }]}></Text>
            </View>
            <View style={styles.conversationDetails}>
              <Text style={[styles.participantRole, { color: colors.muted }]}>
                {room.type === 'announcement' ? '📣 Announcements' : '👥 Group Chat'}
              </Text>
            </View>
            <Text style={[styles.lastMessage, { color: colors.muted }]} numberOfLines={1}>
              {room.description || ' '}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Direct Messages */}
      {conversations.map((conversation) => (
        <TouchableOpacity
          key={conversation.id}
          style={[
            styles.conversationItem,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
            selectedConversation === conversation.id && (isDark ? styles.selectedConversationDark : styles.selectedConversation)
          ]}
          onPress={() => {
            setSelectedConversation(conversation.id);
            setSelectedRoomId(null);
            loadMessages(conversation.id);
            // Load any existing draft for this DM
            loadDMDraft(conversation.id);
          }}
        >
          <View style={styles.avatarContainer}>
            {conversation.participant_avatar ? (
              <Image
                source={{ uri: conversation.participant_avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.defaultAvatar, isDark && { backgroundColor: '#334155' }]}>
                <Text style={[styles.avatarText, { color: isDark ? '#CBD5E1' : '#6B7280' }]}>
                  {conversation.participant_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {conversation.is_online && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.participantName, { color: colors.text }]}>{conversation.participant_name}</Text>
              <Text style={[styles.messageTime, { color: colors.muted }]}>{conversation.last_message_time}</Text>
            </View>

            <View style={styles.conversationDetails}>
              <Text style={[styles.participantRole, { color: colors.muted }]}>
                {conversation.participant_role === 'teacher' && '👩‍🏫 Teacher'}
                {(conversation.participant_role === 'preschool_admin' || conversation.participant_role === 'principal') && '👨‍💼 Principal'}
                {conversation.participant_role === 'parent' && '👨‍👩‍👦 Parent'}
                {!['teacher', 'preschool_admin', 'principal', 'parent'].includes(conversation.participant_role) && '👤 User'}
              </Text>
            </View>

            <Text
              style={[
                styles.lastMessage,
                { color: colors.muted },
                conversation.unread_count > 0 && { color: colors.text, fontWeight: '500' }
              ]}
              numberOfLines={1}
            >
              {conversation.last_message}
            </Text>
          </View>

          {conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conversation.unread_count}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {conversations.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <IconSymbol name="bubble.left.and.bubble.right" size={64} color="#3B82F6" />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Start Your First Conversation</Text>
          <Text style={[styles.emptyStateText, { color: colors.muted }]}>
            {"Connect with your child's teachers, school staff, and other parents.\nTap the + button above to send your first message!"}
          </Text>

          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowComposeModal(true)}
          >
            <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
            <Text style={styles.emptyStateButtonText}>Start a Conversation</Text>
          </TouchableOpacity>

          <View style={[styles.emptyStateFeatures, {}]}>
            <View style={styles.featureItem}>
              <IconSymbol name="person.2.fill" size={16} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.muted }]}>Connect with teachers</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="bell.fill" size={16} color="#F59E0B" />
              <Text style={[styles.featureText, { color: colors.muted }]}>Get real-time updates</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="heart.fill" size={16} color="#EF4444" />
              <Text style={[styles.featureText, { color: colors.muted }]}>Stay involved in learning</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderAnnouncementsList = () => (
    <ScrollView
      style={styles.announcementsList}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {announcements.map((a) => {
        const timeStr = formatMessageTime(a.created_at);
        const senderName = a.sender_name || 'School Administration';
        return (
          <View key={a.id} style={[styles.announcementItem, { backgroundColor: colors.card }]}>
            <View style={styles.announcementHeader}>
              <View style={styles.announcementSender}>
                <IconSymbol name="megaphone.fill" size={20} color="#3B82F6" />
                <Text style={[styles.announcementSenderName, { color: '#3B82F6' }]}>{senderName}</Text>
              </View>
              <Text style={[styles.announcementTime, { color: colors.muted }]}>{timeStr}</Text>
            </View>
            <Text style={[styles.announcementContent, { color: colors.sub }]}>{a.content}</Text>
          </View>
        );
      })}

      {announcements.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
            <IconSymbol name="megaphone.fill" size={64} color="#8B5CF6" />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Announcements Yet</Text>
          <Text style={[styles.emptyStateText, { color: colors.muted }]}>
            {"Important school updates, events, and news will appear here.\nStay tuned for the latest from your preschool!"}
          </Text>

          <View style={styles.emptyStateFeatures}>
            <View style={styles.featureItem}>
              <IconSymbol name="calendar" size={16} color="#3B82F6" />
              <Text style={styles.featureText}>Event notifications</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#F59E0B" />
              <Text style={styles.featureText}>Important updates</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="newspaper.fill" size={16} color="#10B981" />
              <Text style={styles.featureText}>School news</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderChatView = () => {
    if (selectedRoomId) {
      // Room conversation view
      const room = rooms.find((r: any) => r.id === selectedRoomId);
      if (!room) return null;
      const isAdmin = myRoomRole === 'owner' || myRoomRole === 'admin';
      const readOnly = (roomSettings?.locked || roomSettings?.admins_only) && !isAdmin || roomSettings?.allow_member_posting === false && !isAdmin;
      return (
        <View style={styles.chatContainer}>
          <View style={[styles.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedRoomId(null); setMessages([]); }}>
              <IconSymbol name="chevron.left" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={[styles.chatParticipantName, { color: colors.text }]}>{room?.name || 'Group'}</Text>
              <Text style={[styles.chatParticipantRole, { color: colors.muted }]}>
                {room?.type === 'announcement' ? 'Announcements' : 'Group Chat'}
              </Text>
            </View>
            {(myRoomRole === 'owner' || myRoomRole === 'admin') && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={async () => {
                  // Quick toggle cycle: admins_only -> locked -> allow_member_posting toggle
                  const patch: any = {};
                  if (!roomSettings?.admins_only) patch.admins_only = true; else if (!roomSettings?.locked) patch.locked = true; else patch.allow_member_posting = !(roomSettings?.allow_member_posting ?? true);
                  await ConversationService.setSettings({ authUserId: profile!.auth_user_id, conversationId: room.id, patch });
                  await loadRoomContext(room.id);
                }}
              >
                <IconSymbol name="gearshape" size={20} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>

          {readOnly && (
            <View style={[styles.warningContainer, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#F59E0B" />
              <Text style={[styles.warningText, { color: colors.text }]}>
                {roomSettings?.locked ? 'This conversation is locked' : 'Only admins can send messages'}
              </Text>
            </View>
          )}

          <ScrollView ref={scrollViewRef} style={[styles.messagesContainer, { backgroundColor: colors.bg }]} contentContainerStyle={[styles.messagesContent, { paddingBottom: navPad + 16 }]} onContentSizeChange={scrollToBottom}>
            {(roomMessagesQuery.data || []).map((message: any) => {
              const isFromParent = parentUserId ? message.sender_id === parentUserId : false;
              return (
                <View key={message.id} style={[styles.messageItem, isFromParent ? styles.sentMessage : styles.receivedMessage]}>
                  <View style={[styles.messageBubble, isFromParent ? styles.sentBubble : [styles.receivedBubble, { backgroundColor: colors.card }]]}>
                    <Text style={[styles.messageText, isFromParent ? styles.sentText : [styles.receivedText, { color: colors.text }]]}>{message.content}</Text>
                    <Text style={[styles.messageTime, isFromParent ? styles.sentTime : [styles.receivedTime, { color: colors.muted }]]}>{formatMessageTime(message.created_at)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.messageInputContainer, { backgroundColor: colors.card, borderTopColor: colors.border, marginBottom: navPad }]}>
            <View style={styles.messageInputWrapper}>
              <TextInput
                style={[styles.messageInput, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder={readOnly ? 'Read-only' : 'Type a message...'}
                placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
                multiline
                maxLength={1000}
                editable={!readOnly}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!newMessage.trim() || sending || readOnly) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending || readOnly}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Send"
                accessibilityHint="Send message"
              >
                {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <IconSymbol name="arrow.up" size={20} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      );
    }

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return null;

    return (
      <View style={styles.chatContainer}>
        {/* Chat Header */}
        <View style={[styles.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <IconSymbol name="chevron.left" size={20} color="#3B82F6" />
          </TouchableOpacity>

          <View style={styles.chatHeaderInfo}>
            <Text style={[styles.chatParticipantName, { color: colors.text }]}>{conversation.participant_name}</Text>
            <Text style={[styles.chatParticipantRole, { color: colors.muted }]}>
              {`${conversation.participant_role === 'teacher' ? 'Teacher' : 'Administrator'}${conversation.child_name ? ` • ${conversation.child_name}` : ''}`}
            </Text>
          </View>

          <View style={styles.chatHeaderActions}>
            {conversation.is_online && (
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesContainer, { backgroundColor: colors.bg }]}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: navPad + 16 }]}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message) => {
            const isFromParent = parentUserId ? message.sender_id === parentUserId : false;
            return (
              <View
                key={message.id}
                style={[
                  styles.messageItem,
                  isFromParent ? styles.sentMessage : styles.receivedMessage
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isFromParent ? styles.sentBubble : [styles.receivedBubble, { backgroundColor: colors.card }]
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isFromParent ? styles.sentText : [styles.receivedText, { color: colors.text }]
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isFromParent ? styles.sentTime : [styles.receivedTime, { color: colors.muted }]
                    ]}
                  >
                    {formatMessageTime(message.created_at)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Message Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.messageInputContainer, { backgroundColor: colors.card, borderTopColor: colors.border, marginBottom: navPad }]}
        >
          <View style={styles.messageInputWrapper}>
            <TextInput
              style={[styles.messageInput, { borderColor: colors.border, color: colors.text, backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Send"
              accessibilityHint="Send message"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol name="arrow.up" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      {showHeader && (
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]} onPress={onClose}>
            <IconSymbol name="xmark" size={20} color={colors.muted} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>

          <TouchableOpacity
            style={[styles.composeButton, { backgroundColor: isDark ? '#1E293B' : '#EBF4FF' }]}
            onPress={() => {
              const role = String(profile?.role || '');
              const isStaff = ['teacher','principal','preschool_admin','admin','superadmin'].includes(role);
              if (isStaff) {
                // Offer New Group or Direct Message
                Alert.alert(
                  'New Message',
                  'Choose what to create',
                  [
                    { text: 'Direct Message', onPress: () => setShowComposeModal(true) },
                    { text: 'New Group', onPress: () => router.push('/screens/new-group' as any) },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              } else {
                setShowComposeModal(true);
              }
            }}
          >
            <IconSymbol name="plus" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      )}

      {(selectedConversation || selectedRoomId) ? (
        renderChatView()
      ) : (
        <>
          {/* Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'conversations' && styles.activeTab
              ]}
              onPress={() => setActiveTab('conversations')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'conversations' && styles.activeTabText
                ]}
              >
                Conversations
              </Text>
              {conversations.reduce((sum, conv) => sum + conv.unread_count, 0) > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {conversations.reduce((sum, conv) => sum + conv.unread_count, 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'announcements' && styles.activeTab
              ]}
              onPress={() => setActiveTab('announcements')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'announcements' && styles.activeTabText
                ]}
              >
                Announcements
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'conversations' ? renderConversationsList() : renderAnnouncementsList()}

          {/* Floating Action Button */}
          <TouchableOpacity
            style={[styles.fab, { bottom: Math.max(24, navPad + 8) }]}
            onPress={() => {
              const role = String(profile?.role || '');
              const isStaff = ['teacher','principal','preschool_admin','admin','superadmin'].includes(role);
              if (isStaff) setShowActionSheet(true); else setShowComposeModal(true);
            }}
            accessibilityLabel="New"
            accessibilityHint="Create a new message or group"
          >
            <IconSymbol name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Quick Action Sheet */}
          <Modal visible={showActionSheet} transparent animationType="fade" onRequestClose={() => setShowActionSheet(false)}>
            <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowActionSheet(false)}>
              <View style={[styles.sheetContainer, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: colors.border }]}
              >
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Start new</Text>
                <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowActionSheet(false); setShowComposeModal(true); }}>
                  <IconSymbol name="bubble.left.and.bubble.right" size={18} color="#3B82F6" />
                  <Text style={[styles.sheetItemText, { color: colors.text }]}>Direct message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowActionSheet(false); router.push('/screens/new-group' as any); }}>
                  <IconSymbol name="person.3.fill" size={18} color="#10B981" />
                  <Text style={[styles.sheetItemText, { color: colors.text }]}>New group</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowActionSheet(false); setActiveTab('announcements'); }}>
                  <IconSymbol name="megaphone.fill" size={18} color="#F59E0B" />
                  <Text style={[styles.sheetItemText, { color: colors.text }]}>Announcements</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowActionSheet(false)}>
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}

      {/* Compose Message Modal */}
      <ComposeMessageModal
        visible={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        profile={profile}
        childrenList={childrenList}
        onMessageSent={() => {
          loadConversations();
          loadAnnouncements();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  composeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedConversation: {
    backgroundColor: '#EBF4FF',
  },
  selectedConversationDark: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  conversationDetails: {
    marginBottom: 4,
  },
  participantRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  lastMessage: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  unreadMessage: {
    color: '#1F2937',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  announcementsList: {
    flex: 1,
  },
  announcementItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementSender: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementSenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  announcementTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  announcementContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatParticipantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatParticipantRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  chatHeaderActions: {
    alignItems: 'flex-end',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageItem: {
    marginBottom: 16,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sentBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#1F2937',
  },
  messageTimestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  sentTime: {
    color: '#FFFFFF',
  },
  receivedTime: {
    color: '#6B7280',
  },
  messageInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F8FAFC',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyStateFeatures: {
    gap: 16,
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  sheetItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sheetCancel: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});

export default MessagingCenter;
