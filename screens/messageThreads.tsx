import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { CommunicationService, MessageThread } from '@/lib/services/communicationService';
import { MessageService } from '@/lib/services/messageService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';

export default function MessageThreadsScreen() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (user) {
      loadThreads();
      // Set up real-time subscriptions
      const subscription = MessageService.subscribeToUserMessages(
        user.id, 
        user.preschool_id || '', 
        handleNewMessage
      );
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const handleNewMessage = useCallback((newMessage: any) => {
    // Refresh threads when new message arrives
    loadThreads();
  }, []);

  const loadThreads = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await CommunicationService.getMessageThreads(user.id);
      if (error) throw error;
      setThreads(data || []);
      
      // Load unread counts for each thread
      const unreadData: {[key: string]: number} = {};
      for (const thread of data || []) {
        const { count } = await MessageService.getUnreadCount(user.id, user.preschool_id || '');
        unreadData[thread.id] = count || 0;
      }
      setUnreadCounts(unreadData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load message threads');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadThreads();
    setRefreshing(false);
  }, [user]);

  const renderThreadItem = ({ item }: { item: MessageThread }) => {
    const unreadCount = unreadCounts[item.id] || 0;
    const hasUnread = unreadCount > 0;
    
    return (
      <TouchableOpacity 
        style={[styles.threadItem, hasUnread && styles.threadItemUnread]} 
        onPress={() => handleThreadPress(item.id)}
      >
        <View style={styles.threadHeader}>
          <View style={styles.threadAvatar}>
            <IconSymbol name="person.circle.fill" size={24} color="#6B7280" />
          </View>
          <View style={styles.threadInfo}>
            <View style={styles.threadTitleRow}>
              <Text style={[styles.threadName, hasUnread && styles.threadNameUnread]}>
                Thread {item.id}
              </Text>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.threadLastMessage}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleThreadPress = (threadId: string) => {
    // Navigate to conversation screen
    router.push(`/screens/conversation?threadId=${threadId}`);
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No message threads found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
  },
  threadItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  threadItemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  threadInfo: {
    flex: 1,
  },
  threadTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  threadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  threadNameUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  threadLastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },
});

