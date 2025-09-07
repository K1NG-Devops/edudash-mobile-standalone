import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useNavigationVisibility } from '@/contexts/NavigationContext';
import FloatingButton from '@/src/design-system/components/FloatingButton';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConversationMessages } from '@/lib/hooks/useConversationMessages';
import { useConversationRealtime } from '@/lib/hooks/useConversationRealtime';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Image,
} from 'react-native';
import ComposeMessageModal from './ComposeMessageModal';
import { ConversationService, type Conversation as RoomConversation } from '@/lib/services/conversationService';
import ChatViewModal from '@/components/messaging/ChatViewModal';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { router } from 'expo-router';
import { MessagingHeader } from './MessagingHeader';
import { ConversationList } from './ConversationList';
import { ChatInputBar } from './ChatInputBar';
import { MessagesList } from './MessagesList';
import type { MessagesListRef } from './MessagesList';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

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
  last_message_timestamp?: string; // Raw timestamp for sorting
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
  const [myRoomMuted, setMyRoomMuted] = useState<boolean>(false);
  const [myRoomClearedAt, setMyRoomClearedAt] = useState<string | null>(null);
  const [dmIsMuted, setDmIsMuted] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  // Draft state for Direct Messages (DM). We store one draft per DM target.
  const [dmDraftId, setDmDraftId] = useState<string | null>(null);
  const draftTimerRef = useRef<any>(null);
  // Removed announcements tab - now handled in Activities tab
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [parentUserId, setParentUserId] = useState<string | null>(null);
  const [preschoolName, setPreschoolName] = useState<string | null>(null);
  const [sendOnEnter, setSendOnEnter] = useState(false);
  const [showChatViewModal, setShowChatViewModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const messageSubscription = useRef<any>(null);

  // Use navigation visibility hook
  const inConversation = !!(selectedConversation || selectedRoomId);
  useNavigationVisibility(inConversation);

  // Calculate nav padding after state is initialized
  const NAV_OFFSET = 64; // approximate bottom nav height
  const navPad = inConversation ? 0 : NAV_OFFSET; // Remove nav padding when in conversation

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

  // Load preschool name if user has a preschool_id
  const loadPreschoolName = async () => {
    if (!profile?.preschool_id) return;
    
    try {
      const { data: preschool, error } = await supabase
        .from('preschools')
        .select('name')
        .eq('id', profile.preschool_id)
        .single();
      
      if (error) {
        console.error('Error loading preschool name:', error);
        return;
      }
      
      setPreschoolName(preschool?.name || null);
    } catch (error) {
      console.error('Error in loadPreschoolName:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!profile) return;
      await waitForAuthSession();
      await Promise.all([loadConversations(true), loadRooms(), loadPreschoolName()]);
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
              loadConversations(false);
              scrollToBottom();
            }
          }
        )
        .subscribe();
    } catch { }
  };

  // Load contacts for staff using secure RPC to avoid RLS issues
  const loadSchoolContacts = async (userProfile: any, initial = false) => {
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
      if (initial) setLoading(false);
    }
  };

  const loadRooms = async () => {
    if (!profile?.auth_user_id) return;
    try {
      const data = await ConversationService.listMyConversations(profile.auth_user_id);
      setRooms(data || []);
    } catch {}
  };

  const loadConversations = async (initial = false) => {
    if (!profile) return;

    try {
      if (initial) setLoading(true);

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
          await loadSchoolContacts(userProfile, initial);
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
            await loadSchoolContacts({ ...userProfile, preschool_id: fallbackSchool }, initial);
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
            sender_id,
            message_type
          )
        `)
        .eq('recipient_id', userProfile.id)
        .neq('messages.message_type', 'announcement')
        .order('created_at', { ascending: false });
      if (incomingError) throw incomingError;

      const { data: outgoing, error: outgoingError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          message_type,
          message_recipients(recipient_id)
        `)
        .eq('sender_id', userProfile.id)
        .neq('message_type', 'announcement')
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
            last_message_timestamp: msg.created_at,
            unread_count: row.read_at ? 0 : 1,
            is_online: false,
          });
        } else {
          const existing = conversationMap.get(otherId)!;
          if (!row.read_at) existing.unread_count += 1;
          const existingTime = new Date(existing.last_message_timestamp || 0);
          const newTime = new Date(msg.created_at);
          if (newTime > existingTime) {
            existing.last_message = msg.content;
            existing.last_message_time = formatMessageTime(msg.created_at);
            existing.last_message_timestamp = msg.created_at;
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
              last_message_timestamp: msg.created_at,
              unread_count: 0,
              is_online: false,
            });
          } else {
            const existing = conversationMap.get(otherId)!;
            const existingTime = new Date(existing.last_message_timestamp || 0);
            const newTime = new Date(msg.created_at);
            if (newTime > existingTime) {
              existing.last_message = msg.content;
              existing.last_message_time = formatMessageTime(msg.created_at);
              existing.last_message_timestamp = msg.created_at;
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
        // If both have timestamps, sort by timestamp (most recent first)
        if (a.last_message_timestamp && b.last_message_timestamp) {
          return new Date(b.last_message_timestamp).getTime() - new Date(a.last_message_timestamp).getTime();
        }
        
        // If only one has a timestamp, that one comes first
        if (a.last_message_timestamp && !b.last_message_timestamp) return -1;
        if (!a.last_message_timestamp && b.last_message_timestamp) return 1;
        
        // If neither has a timestamp, sort alphabetically by name
        return a.participant_name.localeCompare(b.participant_name);
      });

      setConversations(allConversations);
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      if (initial) setLoading(false);
    }
  };

  // Announcements moved to Activities tab

  const loadRoomContext = async (roomId: string) => {
    try {
      // Pull conversation row and my membership
      const list = await ConversationService.listMyConversations(profile!.auth_user_id);
      const found = (list || []).find((c: any) => c.id === roomId);
      setRoomSettings(found?.settings || null);
      // Find my role and mute status; also mark as read on open
      const uid = await ConversationService.getCurrentUserId(profile!.auth_user_id);
      if (uid) {
        const { data } = await supabase
          .from('conversation_members')
          .select('role, is_muted, last_read_at, cleared_at')
          .eq('conversation_id', roomId)
          .eq('user_id', uid)
          .maybeSingle();
        const row: any = data as any;
        if (row?.role) setMyRoomRole(row.role);
        setMyRoomMuted(!!row?.is_muted);
        setMyRoomClearedAt(row?.cleared_at || null);
        // Mark as read when opening the room
        await supabase
          .from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', roomId)
          .eq('user_id', uid);
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

      // Fetch DM settings for this partner (mute/cleared_at)
      const { data: dmSetting } = await (supabase as any)
        .from('dm_settings')
        .select('is_muted, cleared_at')
        .eq('partner_user_id', conversationId)
        .eq('user_id', parentProfile.id)
        .maybeSingle();
      setDmIsMuted(!!dmSetting?.is_muted);

      const { data: msgsAll } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, message_type')
        .in('id', allIds)
        .or(`and(sender_id.eq.${conversationId}),and(sender_id.eq.${parentProfile.id})`)
        .neq('message_type', 'announcement')
        .order('created_at', { ascending: true });

      let unified: Message[] = (msgsAll || [])
        .map((m: any) => ({ id: m.id, content: m.content, created_at: m.created_at, sender_id: m.sender_id, message_type: 'general' }));

      // Apply clear filter if present
      if (dmSetting?.cleared_at) {
        const clearedAt = new Date(dmSetting.cleared_at).getTime();
        unified = unified.filter(m => new Date(m.created_at).getTime() > clearedAt);
      }

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
        p_recipient_user_id: selectedConversation!,
        p_content: newMessage.trim(),
        p_subject: '',
        p_message_type: 'direct',
      });

      if (rpcError || !messageId) {
        throw rpcError || new Error('send_direct_message failed');
      }

      setNewMessage('');
      await deleteDMDraft();
      await loadMessages(selectedConversation!);
      await loadConversations(false);
    } catch (error) {
      // Removed debug statement: console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    
    // Check if timestamp is already a formatted string (contains 'ago', 'Yesterday', etc.)
    if (typeof timestamp === 'string' && (timestamp.includes('ago') || timestamp === 'Yesterday' || timestamp === 'Just now')) {
      return timestamp;
    }
    
    const date = new Date(timestamp);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInMs < 0) {
      // Future date
      return date.toLocaleDateString();
    } else if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 2) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
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
    await loadConversations(false);
    if (selectedConversation) {
      await loadMessages(selectedConversation);
    }
    setRefreshing(false);
  }, [selectedConversation]);

  const renderConversationsList = () => {
    // Combine rooms and direct conversations into a single list for WhatsApp-like experience
    const allConversations = [
      // Convert rooms to conversation format
      ...rooms.map((room: any) => ({
        id: `room_${room.id}`,
        participant_name: room.name || 'Group',
        participant_avatar: null,
        participant_role: room.type === 'announcement' ? 'announcement' : 'group',
        last_message: room.description || 'Group conversation',
        last_message_time: '',
        unread_count: 0,
        is_online: false,
        isRoom: true,
        roomData: room,
      })),
      // Add direct conversations
      ...conversations.map(conv => ({ ...conv, isRoom: false })),
    ];

    return (
      <ConversationList
        conversations={allConversations}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onPress={(conversation: any) => {
          if (conversation.isRoom) {
            setSelectedConversation(null);
            setSelectedRoomId(conversation.roomData.id);
            loadRoomContext(conversation.roomData.id);
            scrollToBottom();
          } else {
            setSelectedConversation(conversation.id);
            setSelectedRoomId(null);
            setShowChatViewModal(true);
            // Let the modal load messages itself; also prefetch draft
            loadDMDraft(conversation.id);
          }
        }}
        onLongPress={(conversation: any) => {
          // Future: implement long-press actions like mute/archive
          console.log('Long press:', conversation.participant_name);
        }}
      />
    );
  };

  // Announcements list moved to Activities tab

  const renderChatView = () => {
    if (selectedRoomId) {
      // Room conversation view
      const room = rooms.find((r: any) => r.id === selectedRoomId);
      if (!room) return null;
      const isAdmin = myRoomRole === 'owner' || myRoomRole === 'admin';
      const readOnly = (roomSettings?.locked || roomSettings?.admins_only) && !isAdmin || roomSettings?.allow_member_posting === false && !isAdmin;
      return (
        <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
        <View style={[
          styles.chatHeader,
          { 
            backgroundColor: colors.card, 
            borderBottomColor: colors.border,
            marginTop: -insets.top,
            paddingTop: 8 + insets.top,
          }
        ]} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedRoomId(null); setMessages([]); }}>
            <IconSymbol name="chevron.left" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <View style={styles.avatarContainer}>
            <View style={[styles.groupAvatar, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
              <IconSymbol name="person.3.fill" size={20} color={colors.muted} />
            </View>
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={[styles.chatParticipantName, { color: colors.text }]}>{room?.name || 'Group'}</Text>
            <Text style={[styles.chatParticipantRole, { color: colors.muted }]}>
              {room?.type === 'announcement' ? 'Announcements' : 'Group Chat'}
            </Text>
          </View>
          <View style={styles.chatHeaderActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={() => {}}>
              <IconSymbol name="video" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={() => {}}>
              <IconSymbol name="phone" size={20} color="#3B82F6" />
            </TouchableOpacity>
            {(myRoomRole === 'owner' || myRoomRole === 'admin') && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={async () => {
                  // Quick toggle cycle: admins_only -> locked -> allow_member_posting toggle
                  const patch: any = {};
                  if (!roomSettings?.admins_only) patch.admins_only = true; else if (!roomSettings?.locked) patch.locked = true; else patch.allow_member_posting = !(roomSettings?.allow_member_posting ?? true);
                  await ConversationService.setSettings({ authUserId: profile!.auth_user_id, conversationId: room.id, patch });
                  await loadRoomContext(room.id);
                }}
              >
                <IconSymbol name="ellipsis" size={20} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>
        </View>

          {readOnly && (
            <View style={[styles.warningContainer, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#F59E0B" />
              <Text style={[styles.warningText, { color: colors.text }]}>
                {roomSettings?.locked ? 'This conversation is locked' : 'Only admins can send messages'}
              </Text>
            </View>
          )}

          {/* Messages */}
          <MessagesList
            messages={(roomMessagesQuery.data || [])
              .filter((msg: any) => {
                if (!myRoomClearedAt) return true;
                return new Date(msg.created_at).getTime() > new Date(myRoomClearedAt).getTime();
              })
              .map((msg: any) => ({
              id: msg.id,
              text: msg.content,
              createdAt: new Date(msg.created_at),
              user: {
                id: msg.sender_id,
                name: msg.sender_name || 'Unknown',
              },
              isCurrentUser: parentUserId ? msg.sender_id === parentUserId : false,
            }))}
            currentUserId={parentUserId || ''}
            style={{ paddingBottom: navPad + 96 }}
            onContentSizeChange={scrollToBottom}
          />

          {/* WhatsApp-style Message Input */}
          <ChatInputBar
            value={newMessage}
            onChangeText={setNewMessage}
            onSend={sendMessage}
            onAttachPress={() => {
              Alert.alert(
                'Attachment Options',
                'Choose an attachment type',
                [
                  { text: 'Photo', onPress: () => console.log('Photo pressed') },
                  { text: 'Document', onPress: () => console.log('Document pressed') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
            sending={sending}
            placeholder={readOnly ? 'Read-only' : 'Type a message...'}
            disabled={readOnly}
            sendOnEnter={sendOnEnter}
          />
        </KeyboardAvoidingView>
      );
    }

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return null;

    return (
      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
        {/* Chat Header */}
        <View style={[
          styles.chatHeader, 
          { 
            backgroundColor: colors.card, 
            borderBottomColor: colors.border,
            marginTop: -insets.top,
            paddingTop: 8 + insets.top,
          }
        ]} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <IconSymbol name="chevron.left" size={20} color="#3B82F6" />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            {conversation.participant_avatar ? (
              <Image source={{ uri: conversation.participant_avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.defaultAvatar, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                <Text style={[styles.avatarText, { color: colors.muted }]}>
                  {conversation.participant_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {conversation.is_online && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.chatHeaderInfo}>
            <Text style={[styles.chatParticipantName, { color: colors.text }]}>{conversation.participant_name}</Text>
            <Text style={[styles.chatParticipantRole, { color: colors.muted }]}>
              {conversation.is_online ? 'online' : `${conversation.participant_role === 'teacher' ? 'Teacher' : 'Administrator'}${conversation.child_name ? ` • ${conversation.child_name}` : ''}`}
            </Text>
          </View>

          <View style={styles.chatHeaderActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={() => {}}>
              <IconSymbol name="video" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={() => {}}>
              <IconSymbol name="phone" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={() => setShowChatMenu(true)}>
              <IconSymbol name="ellipsis.horizontal" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <MessagesList
          messages={messages.map((msg) => ({
            id: msg.id,
            text: msg.content,
            createdAt: new Date(msg.created_at),
            user: {
              id: msg.sender_id,
              name: msg.sender_name || 'Unknown',
            },
            isCurrentUser: parentUserId ? msg.sender_id === parentUserId : false,
          }))}
          currentUserId={parentUserId || ''}
          style={{ paddingBottom: navPad + 96 }}
          onContentSizeChange={scrollToBottom}
        />

        {/* WhatsApp-style Message Input */}
        <ChatInputBar
          value={newMessage}
          onChangeText={setNewMessage}
          onSend={sendMessage}
          onAttachPress={() => {
            Alert.alert(
              'Attachment Options',
              'Choose an attachment type',
              [
                { text: 'Photo', onPress: () => console.log('Photo pressed') },
                { text: 'Document', onPress: () => console.log('Document pressed') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
          sending={sending}
          placeholder="Type a message..."
          sendOnEnter={sendOnEnter}
        />
      </KeyboardAvoidingView>
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
      {/* Show header when not in conversation */}
      {showHeader && !selectedConversation && !selectedRoomId && (
        <MessagingHeader
          title="Messages"
          subtitle="Chat with teachers and staff"
          role={profile?.role || 'parent'}
          schoolName={preschoolName || undefined}
          userName={profile?.name || undefined}
          onMenuPress={() => setShowMenuModal(true)}
          showComingSoonPills={true}
        />
      )}

      {(selectedConversation || selectedRoomId) ? (
        renderChatView()
      ) : (
        <>
          {/* Single Content - Just Conversations */}
          {renderConversationsList()}
          
          {/* Floating Button for New Chat (WhatsApp style) */}
          <FloatingButton
            onPress={() => router.push('/screens/new-chat')}
            accessibilityLabel="New chat"
            accessibilityHint="Opens the New Chat screen to start a conversation"
            icon="chatbubble-ellipses"
            size={28}
            backgroundColor="#25D366" // WhatsApp green
            iconColor="#FFFFFF"
            bottom={140}
            right={24}
            buttonSize={64}
          />
        </>
      )}

      {/* Chat Settings Menu */}
      <Modal visible={showChatMenu} transparent animationType="fade" onRequestClose={() => setShowChatMenu(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowChatMenu(false)}>
          <View style={[styles.sheetContainer, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Chat Options</Text>
            
            <TouchableOpacity 
              style={styles.sheetItem} 
              onPress={() => {
                setShowChatMenu(false);
                try {
                  if (selectedConversation) {
                    const conv = conversations.find(c => c.id === selectedConversation);
                    const name = conv?.participant_name || 'Direct Message';
                    const roleKey = conv?.participant_role || 'teacher';
                    const roleLabel = roleKey === 'teacher' ? 'Teacher' : 'Administrator';
                    Alert.alert('Contact Info', `Name: ${name}\nRole: ${roleLabel}`);
                  } else if (selectedRoomId) {
                    const room = rooms.find((r: any) => r.id === selectedRoomId);
                    const typeLabel = room?.type === 'announcement' ? 'Announcements' : 'Group Chat';
                    Alert.alert('Room Info', `Name: ${room?.name || 'Group'}\nType: ${typeLabel}`);
                  } else {
                    Alert.alert('Contact Info', 'No active selection.');
                  }
                } catch {}
              }}
            >
              <IconSymbol name="person.circle" size={18} color="#3B82F6" />
              <Text style={[styles.sheetItemText, { color: colors.text }]}>Contact Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.sheetItem} 
              onPress={async () => {
                setShowChatMenu(false);
                try {
                  if (selectedRoomId) {
                    const meId = await ConversationService.getCurrentUserId(profile!.auth_user_id);
                    if (!meId) return;
                    await supabase
                      .from('conversation_members')
                      .update({ is_muted: !myRoomMuted })
                      .eq('conversation_id', selectedRoomId)
                      .eq('user_id', meId);
                    setMyRoomMuted(prev => !prev);
                    Alert.alert(!myRoomMuted ? 'Muted' : 'Unmuted', `Notifications ${!myRoomMuted ? 'muted' : 'unmuted'} for this room.`);
                  } else if (selectedConversation) {
                    // Toggle DM mute via dm_settings
                    const { data: me } = await supabase
                      .from('users')
                      .select('id')
                      .eq('auth_user_id', profile!.auth_user_id)
                      .single();
                    if (!me) return;
                    await (supabase as any)
                      .from('dm_settings')
                      .upsert({ user_id: me.id, partner_user_id: selectedConversation, is_muted: !dmIsMuted }, { onConflict: 'user_id,partner_user_id' } as any);
                    setDmIsMuted(prev => !prev);
                    Alert.alert(!dmIsMuted ? 'Muted' : 'Unmuted', `Notifications ${!dmIsMuted ? 'muted' : 'unmuted'} for this chat.`);
                  }
                } catch {}
              }}
            >
              <IconSymbol name="bell.slash" size={18} color="#F59E0B" />
            <Text style={[styles.sheetItemText, { color: colors.text }]}>{(selectedRoomId ? myRoomMuted : dmIsMuted) ? 'Unmute Notifications' : 'Mute Notifications'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setSendOnEnter(prev => !prev);
                setShowChatMenu(false);
              }}
            >
              <IconSymbol name={sendOnEnter ? 'checkmark.circle' : 'circle'} size={18} color="#3B82F6" />
              <Text style={[styles.sheetItemText, { color: colors.text }]}>Enter key sends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.sheetItem} 
              onPress={() => {
                setShowChatMenu(false);
                Alert.alert(
                  'Clear Chat',
                  'Are you sure you want to clear this chat? This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Clear', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          if (selectedRoomId) {
                            // Clearing a room: mark as read now
                            const meId = await ConversationService.getCurrentUserId(profile!.auth_user_id);
                            if (meId) {
                              const nowIso = new Date().toISOString();
                              await supabase
                                .from('conversation_members')
                                .update({ last_read_at: nowIso, cleared_at: nowIso })
                                .eq('conversation_id', selectedRoomId)
                                .eq('user_id', meId);
                              setMyRoomClearedAt(nowIso);
                            }
                            setMessages([]);
                          } else if (selectedConversation) {
                            // DM: set cleared_at and mark incoming unread as read
                            const { data: me } = await supabase
                              .from('users')
                              .select('id')
                              .eq('auth_user_id', profile!.auth_user_id)
                              .single();
                            if (me) {
                              await (supabase as any)
                                .from('dm_settings')
                                .upsert({ user_id: me.id, partner_user_id: selectedConversation, cleared_at: new Date().toISOString() }, { onConflict: 'user_id,partner_user_id' } as any);
                              // mark incoming from partner as read
                              await supabase
                                .from('message_recipients')
                                .update({ is_read: true, read_at: new Date().toISOString() })
                                .in('message_id', (
                                  (
                                    await supabase
                                      .from('messages')
                                      .select('id')
                                      .eq('sender_id', selectedConversation)
                                  ).data || []
                                ).map((r: any) => r.id))
                                .eq('recipient_id', me.id)
                                .eq('is_read', false);
                            }
                            setMessages([]);
                          }
                          Alert.alert('Chat Cleared', 'The chat has been cleared.');
                        } catch {}
                      }
                    }
                  ]
                );
              }}
            >
              <IconSymbol name="trash" size={18} color="#EF4444" />
              <Text style={[styles.sheetItemText, { color: colors.text }]}>Clear Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowChatMenu(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Menu Modal */}
      <Modal visible={showMenuModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMenuModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowMenuModal(false)}
            >
              <IconSymbol name="xmark" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Message Settings</Text>
            <View style={styles.modalCloseButton} />
          </View>

          {/* Settings Content */}
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={[styles.settingsItem, { borderBottomColor: colors.border }]} 
              onPress={() => {
                setShowMenuModal(false);
                Alert.alert('Coming Soon', 'Notification settings will be available in a future update.');
              }}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: '#3B82F6' }]}>
                  <IconSymbol name="bell" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.settingsItemTitle, { color: colors.text }]}>Notifications</Text>
                  <Text style={[styles.settingsItemSubtitle, { color: colors.muted }]}>Manage message alerts</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingsItem, { borderBottomColor: colors.border }]} 
              onPress={() => {
                setShowMenuModal(false);
                Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.');
              }}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: '#10B981' }]}>
                  <IconSymbol name="lock" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.settingsItemTitle, { color: colors.text }]}>Privacy</Text>
                  <Text style={[styles.settingsItemSubtitle, { color: colors.muted }]}>Control message privacy</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSendOnEnter(prev => !prev);
                setShowMenuModal(false);
              }}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: '#F59E0B' }]}>
                  <IconSymbol name="keyboard" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.settingsItemTitle, { color: colors.text }]}>Send Messages</Text>
                  <Text style={[styles.settingsItemSubtitle, { color: colors.muted }]}>Enter key sends messages</Text>
                </View>
              </View>
              <View style={[styles.toggle, sendOnEnter && styles.toggleActive]}>
                <View style={[styles.toggleThumb, sendOnEnter && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.settingsItem, { borderBottomWidth: 0 }]} 
              onPress={() => {
                setShowMenuModal(false);
                Alert.alert('Coming Soon', 'Message themes will be available in a future update.');
              }}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: '#8B5CF6' }]}>
                  <IconSymbol name="paintbrush" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.settingsItemTitle, { color: colors.text }]}>Themes</Text>
                  <Text style={[styles.settingsItemSubtitle, { color: colors.muted }]}>Customize message appearance</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Compose Message Modal */}
      <ComposeMessageModal
        visible={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        profile={profile}
        childrenList={childrenList}
        mode="modal"
        onMessageSent={() => {
          loadConversations(false);
        }}
      />

      {/* Chat View Modal for DM - teacher style */}
      {selectedConversation && (
        <ChatViewModal
          visible={showChatViewModal}
          onClose={() => {
            setShowChatViewModal(false);
            setSelectedConversation(null);
            setMessages([]);
          }}
          contact={{
            id: selectedConversation,
            name: conversations.find(c => c.id === selectedConversation)?.participant_name || 'Unknown User',
          }}
          profile={profile}
          onMessageSent={() => {
            loadConversations(false);
          }}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
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
  fixedInputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default MessagingCenter;
