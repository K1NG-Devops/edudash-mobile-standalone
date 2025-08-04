import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { CommunicationService, MessageThread } from '@/lib/services/communicationService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MessageThreadsScreen() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user]);

  const loadThreads = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await CommunicationService.getMessageThreads(user.id);
      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load message threads');
    } finally {
      setLoading(false);
    }
  };

  const renderThreadItem = ({ item }: { item: MessageThread }) => (
    <TouchableOpacity style={styles.threadItem} onPress={() => handleThreadPress(item.id)}>
      <Text style={styles.threadName}>{item.id}</Text>
      <Text style={styles.threadLastMessage}>Last message at {item.last_message_at}</Text>
    </TouchableOpacity>
  );

  const handleThreadPress = (threadId: string) => {
    // Navigate to conversation screen
    console.log(`Navigating to thread: ${threadId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={renderThreadItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No message threads found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  threadItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  threadName: {
    fontSize: 16,
    fontWeight: '600',
  },
  threadLastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

