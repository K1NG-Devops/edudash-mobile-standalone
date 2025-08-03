import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { MessageService } from '@/lib/services/messageService';
import MessageListItem from '@/components/messaging/MessageListItem';
import { MessageRecipient, Message, User } from '@/types/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type MessageWithRecipient = MessageRecipient & {
  message: Message & {
    sender: {
      id: string;
      name: string;
      avatar_url: string | null;
      role: string;
    };
    preschool: {
      id: string;
      name: string;
    };
  };
};

export default function MessagesScreen() {
  const [messages, setMessages] = useState<MessageWithRecipient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await MessageService.getUserMessages('user-id', 'preschool-id');
      if (!error) {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.content}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <MessageListItem
              messageRecipient={item}
              onPress={() => console.log('Open message:', item.message.id)}
            />
          )}
          keyExtractor={(item) => item.message.id}
          style={styles.messageList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messageList: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});
