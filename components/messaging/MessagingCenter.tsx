import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import ComposeMessageModal from './ComposeMessageModal';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  sender_type: 'parent' | 'teacher' | 'admin';
  receiver_type: 'parent' | 'teacher' | 'admin';
  message_type: 'text' | 'image' | 'file' | 'announcement';
  child_id?: string;
  thread_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar?: string;
  attachments?: MessageAttachment[];
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
  participant_avatar?: string;
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
}

const MessagingCenter: React.FC<MessagingCenterProps> = ({
  profile,
  childrenList,
  onClose,
}) => {
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

  const setupRealtimeSubscription = () => {
    if (!profile?.auth_user_id) return;

    // Subscribe to new messages
    messageSubscription.current = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.auth_user_id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          loadConversations(); // Refresh conversations to update last message
          scrollToBottom();
        }
      )
      .subscribe();
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

      // Fetch conversations with teachers and staff
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          sender_type,
          receiver_type,
          content,
          created_at,
          is_read,
          child_id,
          sender:users!messages_sender_id_fkey(name, avatar_url, role),
          receiver:users!messages_receiver_id_fkey(name, avatar_url, role),
          child:students(first_name, last_name)
        `)
        .or(`sender_id.eq.${parentProfile.id},receiver_id.eq.${parentProfile.id}`)
        .order('created_at', { ascending: false });

      if (conversationsError) {
        throw conversationsError;
      }

      // Group messages by conversation participants
      const conversationMap = new Map<string, Conversation>();
      
      conversationsData?.forEach((msg: any) => {
        const isFromParent = msg.sender_id === parentProfile.id;
        const otherParticipant = isFromParent ? msg.receiver : msg.sender;
        const conversationKey = isFromParent ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            id: conversationKey,
            participant_name: otherParticipant?.name || 'Unknown',
            participant_avatar: otherParticipant?.avatar_url,
            participant_role: otherParticipant?.role || 'teacher',
            child_name: msg.child ? `${msg.child.first_name} ${msg.child.last_name}` : undefined,
            last_message: msg.content,
            last_message_time: formatMessageTime(msg.created_at),
            unread_count: isFromParent ? 0 : (msg.is_read ? 0 : 1),
  // TODO: Replace with real presence status
  is_online: false,
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    if (!profile?.preschool_id) return;

    try {
      // Fetch school announcements
      const { data: announcementsData, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender:users!messages_sender_id_fkey(name, avatar_url, role)
        `)
        .eq('message_type', 'announcement')
        .eq('receiver_type', 'parent')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      setAnnouncements(announcementsData || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
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

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          sender_type,
          message_type,
          created_at,
          is_read,
          sender:users!messages_sender_id_fkey(name, avatar_url)
        `)
        .or(`and(sender_id.eq.${parentProfile.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${parentProfile.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(messagesData || []);
      
      // Mark messages as read
      // Mark as read in message_recipients
      await supabase
        .from('message_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', parentProfile.id)
        .eq('is_read', false);

      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
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
            user_id: selectedConversation,
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
      console.error('Error sending message:', error);
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
            selectedConversation === conversation.id && styles.selectedConversation
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
              <View style={styles.defaultAvatar}>
                <Text style={styles.avatarText}>
                  {conversation.participant_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {conversation.is_online && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.participantName}>{conversation.participant_name}</Text>
              <Text style={styles.messageTime}>{conversation.last_message_time}</Text>
            </View>
            
            <View style={styles.conversationDetails}>
              <Text style={styles.participantRole}>
                {conversation.participant_role === 'teacher' ? '👩‍🏫 Teacher' : '👨‍💼 Admin'}
                {conversation.child_name && ` • ${conversation.child_name}`}
              </Text>
            </View>

            <Text
              style={[
                styles.lastMessage,
                conversation.unread_count > 0 && styles.unreadMessage
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
          <Text style={styles.emptyStateTitle}>Start Your First Conversation</Text>
          <Text style={styles.emptyStateText}>
            Connect with your child&apos;s teachers, school staff, and other parents.
            Tap the + button above to send your first message!
          </Text>
          
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowComposeModal(true)}
          >
            <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
            <Text style={styles.emptyStateButtonText}>Start a Conversation</Text>
          </TouchableOpacity>
          
          <View style={styles.emptyStateFeatures}>
            <View style={styles.featureItem}>
              <IconSymbol name="person.2.fill" size={16} color="#10B981" />
              <Text style={styles.featureText}>Connect with teachers</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="bell.fill" size={16} color="#F59E0B" />
              <Text style={styles.featureText}>Get real-time updates</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol name="heart.fill" size={16} color="#EF4444" />
              <Text style={styles.featureText}>Stay involved in learning</Text>
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
      {announcements.map((announcement) => (
        <View key={announcement.id} style={styles.announcementItem}>
          <View style={styles.announcementHeader}>
            <View style={styles.announcementSender}>
              <IconSymbol name="megaphone.fill" size={20} color="#3B82F6" />
              <Text style={styles.announcementSenderName}>
                {announcement.sender_name || 'School Administration'}
              </Text>
            </View>
            <Text style={styles.announcementTime}>
              {formatMessageTime(announcement.created_at)}
            </Text>
          </View>
          <Text style={styles.announcementContent}>{announcement.content}</Text>
        </View>
      ))}

      {announcements.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <IconSymbol name="megaphone.fill" size={64} color="#8B5CF6" />
          </View>
          <Text style={styles.emptyStateTitle}>No Announcements Yet</Text>
          <Text style={styles.emptyStateText}>
            Important school updates, events, and news will appear here.
            Stay tuned for the latest from your preschool!
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
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <IconSymbol name="chevron.left" size={20} color="#3B82F6" />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatParticipantName}>{conversation.participant_name}</Text>
            <Text style={styles.chatParticipantRole}>
              {conversation.participant_role === 'teacher' ? 'Teacher' : 'Administrator'}
              {conversation.child_name && ` • ${conversation.child_name}`}
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
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message) => {
            const isFromParent = message.sender_type === 'parent';
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
                    isFromParent ? styles.sentBubble : styles.receivedBubble
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isFromParent ? styles.sentText : styles.receivedText
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isFromParent ? styles.sentTime : styles.receivedTime
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
          style={styles.messageInputContainer}
        >
          <View style={styles.messageInputWrapper}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <IconSymbol name="xmark" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Messages</Text>
        
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setShowComposeModal(true)}
        >
          <IconSymbol name="plus" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

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
