import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
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
} from 'react-native';
import ComposeMessageModal from './ComposeMessageModal';

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
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'announcements'>('conversations');
  const [announcements, setAnnouncements] = useState<Message[]>([]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [parentUserId, setParentUserId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const messageSubscription = useRef<any>(null);

  useEffect(() => {
    if (profile) {
      loadConversations();
      loadAnnouncements();
      setupRealtimeSubscription();
    }

    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
    };
  }, [profile]);

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
              setMessages(prev => [...prev, { id: msg.id, content: msg.content, created_at: msg.created_at || new Date().toISOString(), sender_id: msg.sender_id, message_type: 'general' }]);
              loadConversations();
              scrollToBottom();
            }
          }
        )
        .subscribe();
    } catch {}
  };

  const loadConversations = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }
      setParentUserId(parentProfile.id);

      // 1) Incoming messages to parent
      const { data: incoming, error: incomingError } = await supabase
        .from('message_recipients')
        .select(`
          read_at,
          created_at,
          message:messages(
            id,
            content,
            created_at,
            sender_id,
            sender:users!messages_sender_id_fkey(name, avatar_url, role)
          )
        `)
        .eq('recipient_id', parentProfile.id)
        .order('created_at', { ascending: false });
      if (incomingError) throw incomingError;

      // 2) Outgoing messages from parent (to build conversations)
      const { data: outgoing, error: outgoingError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          message_recipients(recipient_id)
        `)
        .eq('sender_id', parentProfile.id)
        .order('created_at', { ascending: false });
      if (outgoingError) throw outgoingError;

      // Collect recipient user ids from outgoing to backfill names
      const recipientIds = new Set<string>();
      outgoing?.forEach((m: any) => m.message_recipients?.forEach((r: any) => recipientIds.add(r.recipient_id)));
      const missingIds = Array.from(recipientIds);
      let recipientsById: Record<string, { name: string; avatar_url: string | null; role: string | null }> = {};
      if (missingIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, avatar_url, role')
          .in('id', missingIds);
        (usersData || []).forEach((u: any) => { recipientsById[u.id] = { name: u.name, avatar_url: u.avatar_url, role: u.role }; });
      }

      const conversationMap = new Map<string, Conversation>();

      // Build from incoming
      incoming?.forEach((row: any) => {
        const msg = row.message;
        if (!msg) return;
        const otherId = msg.sender_id;
        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, {
            id: otherId,
            participant_name: msg.sender?.name || 'Unknown',
            participant_avatar: msg.sender?.avatar_url || null,
            participant_role: msg.sender?.role || 'teacher',
            last_message: msg.content,
            last_message_time: formatMessageTime(msg.created_at),
            unread_count: row.read_at ? 0 : 1,
            is_online: false,
          });
        }
      });

      // Build from outgoing
      outgoing?.forEach((msg: any) => {
        const recipients = msg.message_recipients || [];
        recipients.forEach((r: any) => {
          const otherId = r.recipient_id;
          if (!conversationMap.has(otherId)) {
            const recipient = recipientsById[otherId];
            conversationMap.set(otherId, {
              id: otherId,
              participant_name: recipient?.name || 'Unknown',
              participant_avatar: recipient?.avatar_url || null,
              participant_role: recipient?.role || 'teacher',
              last_message: msg.content,
              last_message_time: formatMessageTime(msg.created_at),
              unread_count: 0,
              is_online: false,
            });
          }
        });
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      // Removed debug statement: console.error('Error loading conversations:', error);
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

      // Fetch announcement messages delivered to this user
      const { data, error } = await supabase
        .from('message_recipients')
        .select(`
          read_at,
          message:messages(
            id,
            content,
            created_at,
            sender_id,
            message_type,
            sender:users!messages_sender_id_fkey(name, avatar_url)
          )
        `)
        .eq('recipient_id', parentProfile.id)
        .eq('message.message_type', 'announcement')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped: Message[] = (data || [])
        .map((row: any) => row.message)
        .filter((m: any) => !!m)
        .map((m: any) => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          sender_id: m.sender_id,
          message_type: (m.message_type as any) || 'announcement',
          sender_name: m.sender?.name,
          sender_avatar: m.sender?.avatar_url,
        }));

      setAnnouncements(mapped);
    } catch (error) {
      // Removed debug statement: console.error('Error loading announcements:', error);
    }
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

      // Incoming messages from conversation user -> parent
      const { data: incoming, error: incomingError } = await supabase
        .from('message_recipients')
        .select(`
          read_at,
          message:messages(id, content, created_at, sender_id)
        `)
        .eq('recipient_id', parentProfile.id)
        .eq('message.sender_id', conversationId);
      if (incomingError) throw incomingError;

      // Outgoing messages from parent -> conversation user
      const { data: outgoing, error: outgoingError } = await supabase
        .from('message_recipients')
        .select(`
          read_at,
          message:messages(id, content, created_at, sender_id)
        `)
        .eq('recipient_id', conversationId)
        .eq('message.sender_id', parentProfile.id);
      if (outgoingError) throw outgoingError;

      const unified: Message[] = ([] as any[])
        .concat((incoming || []).map((r: any) => r.message))
        .concat((outgoing || []).map((r: any) => r.message))
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((m: any) => ({ id: m.id, content: m.content, created_at: m.created_at, sender_id: m.sender_id, message_type: 'general' }));

      setMessages(unified);

      // Mark as read for any incoming unread
      await supabase
        .from('message_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', parentProfile.id)
        .is('read_at', null);

      scrollToBottom();
    } catch (error) {
      // Removed debug statement: console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !profile) return;

    try {
      setSending(true);

      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }

      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          preschool_id: profile.preschool_id!,
          subject: '',
          content: newMessage.trim(),
          sender_id: parentProfile.id,
          message_type: 'text',
          is_draft: false,
        })
        .select()
        .single();

      if (!error) {
        await supabase
          .from('message_recipients')
          .insert({
            message_id: newMsg.id,
            recipient_id: selectedConversation,
            recipient_type: 'user'
          });
      }

      if (error) {
        throw error;
      }

      setNewMessage('');
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
            loadMessages(conversation.id);
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
                {conversation.participant_role === 'teacher' ? '👩‍🏫 Teacher' : '👨‍💼 Admin'}
                {conversation.child_name && ` • ${conversation.child_name}`}
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
          contentContainerStyle={styles.messagesContent}
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
          style={[styles.messageInputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}
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
            onPress={() => setShowComposeModal(true)}
          >
            <IconSymbol name="plus" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      )}

      {selectedConversation ? (
        renderChatView()
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
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
});

export default MessagingCenter;
