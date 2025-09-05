import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type: string;
};

type Contact = {
  id: string;
  name: string;
};

type ChatViewModalProps = {
  visible: boolean;
  onClose: () => void;
  contact: Contact;
  profile: any;
  onMessageSent?: () => void;
};

export default function ChatViewModal({
  visible,
  onClose,
  contact,
  profile,
  onMessageSent
}: ChatViewModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parentUserId, setParentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  // Load messages when modal opens
  useEffect(() => {
    if (visible && contact.id && profile) {
      loadMessages();
      loadCurrentUserId();
    }
  }, [visible, contact.id, profile]);

  const loadCurrentUserId = async () => {
    if (!profile?.auth_user_id) return;
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();
      if (userProfile) {
        setParentUserId(userProfile.id);
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const loadMessages = async () => {
    if (!profile?.auth_user_id || !contact.id) return;
    
    try {
      setLoading(true);
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) return;

      // Build DM thread
      const { data: recIncoming, error: incomingError } = await supabase
        .from('message_recipients')
        .select('message_id, read_at')
        .eq('recipient_id', parentProfile.id);
      if (incomingError) throw incomingError;

      const incomingIds = (recIncoming || []).map((r: any) => r.message_id);

      const { data: recOutgoing, error: outgoingError } = await supabase
        .from('message_recipients')
        .select('message_id')
        .eq('recipient_id', contact.id);
      if (outgoingError) throw outgoingError;

      const outgoingIds = (recOutgoing || []).map((r: any) => r.message_id);
      const allIds = Array.from(new Set([...incomingIds, ...outgoingIds]));
      
      if (allIds.length === 0) { 
        setMessages([]);
        return;
      }

      const { data: msgsAll } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, message_type')
        .in('id', allIds)
        .or(`and(sender_id.eq.${contact.id}),and(sender_id.eq.${parentProfile.id})`)
        .neq('message_type', 'announcement')
        .order('created_at', { ascending: true });

      const unified: Message[] = (msgsAll || [])
        .map((m: any) => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          sender_id: m.sender_id,
          message_type: m.message_type
        }));

      setMessages(unified);

      // Mark as read
      await supabase
        .from('message_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', parentProfile.id)
        .eq('is_read', false);

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !profile?.auth_user_id || sending) return;
    
    try {
      setSending(true);
      
      // Send via RPC
      const { data: messageId, error: rpcError } = await supabase.rpc('send_direct_message', {
        p_recipient_user_id: contact.id,
        p_content: input.trim(),
        p_subject: '',
        p_message_type: 'direct',
      });

      if (rpcError || !messageId) {
        throw rpcError || new Error('Failed to send message');
      }

      setInput('');
      await loadMessages();
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = parentUserId ? item.sender_id === parentUserId : false;
    
    return (
      <View 
        style={{
          alignItems: isMe ? 'flex-end' : 'flex-start',
          marginHorizontal: 8,
          marginBottom: 4
        }}
      >
        <View 
          style={{
            maxWidth: '80%',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: isMe ? '#DCF8C6' : 'white',
            borderBottomRightRadius: isMe ? 2 : 8,
            borderBottomLeftRadius: isMe ? 8 : 2,
            elevation: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
            marginBottom: 2
          }}
        >
          <Text 
            style={{ 
              fontSize: 16, 
              color: '#333',
              lineHeight: 20
            }}
          >
            {item.content}
          </Text>
          <View 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: 4,
              marginBottom: -2
            }}
          >
            <Text 
              style={{
                fontSize: 11,
                color: '#666',
                marginRight: isMe ? 4 : 0
              }}
            >
              {formatMessageTime(item.created_at)}
            </Text>
            {isMe && (
              <IconSymbol name="checkmark.circle.fill" size={12} color="#4A90E2" />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      paddingHorizontal: 32
    }}>
      <Text style={{ 
        fontSize: 16, 
        color: '#666',
        textAlign: 'center',
        marginBottom: 8
      }}>
        Start your conversation with {contact.name}
      </Text>
      <Text style={{ 
        fontSize: 14, 
        color: '#999',
        textAlign: 'center'
      }}>
        Send a message to begin chatting
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar barStyle={Platform.OS === 'ios' ? 'light-content' : 'dark-content'} backgroundColor="#075E54" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ECE5DD' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* WhatsApp-style Header */}
          <View 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: '#075E54',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            {/* Back Button */}
            <TouchableOpacity 
              onPress={onClose} 
              style={{ 
                marginRight: 16,
                padding: 8,
                marginLeft: -8
              }}
            >
              <IconSymbol name="chevron.left" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Avatar */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#128C7E',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}
            >
              <Text 
                style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '600'
                }}
              >
                {contact.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            {/* Contact Info */}
            <View style={{ flex: 1 }}>
              <Text 
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: 'white'
                }}
                numberOfLines={1}
              >
                {contact.name}
              </Text>
              <Text 
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.8)',
                  marginTop: 1
                }}
              >
                online
              </Text>
            </View>
            
            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={{ padding: 8, marginRight: 8 }}
                onPress={() => {/* Handle video call */}}
              >
                <IconSymbol name="video" size={22} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ padding: 8, marginRight: 8 }}
                onPress={() => {/* Handle voice call */}}
              >
                <IconSymbol name="phone" size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ padding: 8 }}
                onPress={() => {/* Handle more options */}}
              >
                <IconSymbol name="ellipsis.vertical" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={!loading ? renderEmptyState : null}
            style={{ 
              flex: 1, 
              backgroundColor: '#ECE5DD'
            }}
            contentContainerStyle={{ 
              paddingVertical: 16,
              paddingHorizontal: 4,
              flexGrow: 1,
              justifyContent: messages.length === 0 ? 'center' : 'flex-start'
            }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />

          {/* Input Bar */}
          <View 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 6,
              backgroundColor: '#F7F7F7'
            }}
          >
            {/* Left Side Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Emoji Button */}
              <TouchableOpacity 
                style={{ padding: 6, marginRight: 4 }}
                onPress={() => { /* Handle emoji picker */ }}
              >
                <IconSymbol name="face.smiling" size={22} color="#666" />
              </TouchableOpacity>
              
              {/* Attachment Button */}
              <TouchableOpacity 
                style={{ padding: 6 }}
                onPress={() => {
                  Alert.alert(
                    'Attachment',
                    'Choose an option',
                    [
                      { text: 'Photo/Video', onPress: () => {} },
                      { text: 'Document', onPress: () => {} },
                      { text: 'Cancel', style: 'cancel' as const },
                    ]
                  );
                }}
              >
                <IconSymbol name="paperclip" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Message Input Container */}
            <View 
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: 20,
                marginHorizontal: 8,
                minHeight: 36,
                maxHeight: 100,
                paddingHorizontal: 12,
                paddingVertical: 8,
                justifyContent: 'center',
                elevation: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
              }}
            >
              <TextInput
                style={{
                  fontSize: 16,
                  color: '#333',
                  lineHeight: 18,
                  textAlignVertical: 'center',
                  paddingVertical: 0
                }}
                placeholder="Type a message"
                placeholderTextColor="#999"
                multiline
                value={input}
                onChangeText={setInput}
                scrollEnabled
              />
            </View>
            
            {/* Right Side - Send/Voice Button */}
            {input.trim() ? (
              <TouchableOpacity
                onPress={sendMessage}
                style={{
                  backgroundColor: '#075E54',
                  borderRadius: 20,
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconSymbol 
                  name="arrow.up" 
                  size={18} 
                  color="white" 
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={{ 
                  padding: 6
                }}
                onPress={async () => {
                  if (!isRecording) {
                    await startRecording();
                  } else {
                    const vm = await stopRecording();
                    if (vm) {
                      Alert.alert('Voice message recorded', `${vm.duration}s • ${(vm.size/1024).toFixed(0)} KB`);
                    }
                  }
                }}
              >
                <IconSymbol name="mic" size={22} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

