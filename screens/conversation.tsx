/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { CommunicationService, Message } from '@/lib/services/communicationService';
import { MessageService } from '@/lib/services/messageService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocalSearchParams, router } from 'expo-router';

export default function ConversationScreen() {
  const { user } = useAuth();
  const { threadId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user && threadId) {
      loadMessages();
      
      // Set up real-time message subscription
      const subscription = MessageService.subscribeToUserMessages(
        user.id,
        user.preschool_id || '',
        handleNewMessage
      );
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, threadId]);

  const handleNewMessage = useCallback((newMessage: any) => {
    // Add new message to the list and scroll to bottom
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const loadMessages = async () => {
    if (!threadId) return;
    setLoading(true);

    try {
      const { data, error } = await CommunicationService.getMessages(threadId as string);
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!user || !threadId || !newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const { data, error } = await CommunicationService.sendMessage(
        threadId as string,
        user.id,
        messageText,
        'text'
      );
      if (error) throw error;
      
      // Message will be added via real-time subscription
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
        <View style={[styles.messageItem, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
          <Text style={[styles.messageContent, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const headerColor = '#128C7E'; // WhatsApp-like green header
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: headerColor }} edges={['top','left','right']}>
      <StatusBar barStyle="light-content" translucent />

      {/* WhatsApp-like header */}
      <View style={[styles.waHeader, { backgroundColor: headerColor }]}> 
        <TouchableOpacity onPress={() => { try { router.back(); } catch {} }} style={styles.waBackBtn}>
          <IconSymbol name="chevron.left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.waTitle} numberOfLines={1}>Conversation</Text>
          <Text style={styles.waSubtitle}>Online</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity><IconSymbol name="phone.fill" size={18} color="#FFFFFF" /></TouchableOpacity>
          <TouchableOpacity><IconSymbol name="video.fill" size={18} color="#FFFFFF" /></TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlashList
          ref={flatListRef as any}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          estimatedItemSize={64}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <IconSymbol 
              name={sending ? "hourglass" : "paperplane.fill"} 
              size={16} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  waHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  waBackBtn: { padding: 6, marginRight: 8 },
  waTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  waSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    marginBottom: 8,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageItem: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownMessage: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 44,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 8,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
