import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageRecipient } from '@/types/types';

interface MessageListItemProps {
  messageRecipient: MessageRecipient & {
    message: {
      id: string;
      subject: string;
      content: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      message_type: string;
      created_at: string;
      sender: {
        id: string;
        name: string;
        avatar_url?: string;
        role: string;
      };
    };
  };
  onPress: () => void;
  onLongPress?: () => void;
}

export default function MessageListItem({ 
  messageRecipient, 
  onPress, 
  onLongPress 
}: MessageListItemProps) {
  const { message, is_read, is_archived } = messageRecipient;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return '#3B82F6';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'system': return '⚙️';
      case 'homework_discussion': return '📚';
      default: return '💬';
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !is_read && styles.unreadContainer,
        is_archived && styles.archivedContainer
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.senderInfo}>
          <Text style={[styles.senderName, !is_read && styles.unreadText]}>
            {message.sender.name}
          </Text>
          <View style={styles.metaInfo}>
            <Text style={styles.messageType}>
              {getMessageTypeIcon(message.message_type)}
            </Text>
            <View 
              style={[
                styles.priorityDot, 
                { backgroundColor: getPriorityColor(message.priority) }
              ]} 
            />
          </View>
        </View>
        <Text style={styles.timestamp}>
          {formatDate(message.created_at)}
        </Text>
      </View>
      
      <Text style={[styles.subject, !is_read && styles.unreadText]} numberOfLines={1}>
        {message.subject}
      </Text>
      
      <Text style={styles.preview} numberOfLines={2}>
        {truncateContent(message.content)}
      </Text>
      
      {!is_read && <View style={styles.unreadIndicator} />}
      
      {is_archived && (
        <View style={styles.archivedBadge}>
          <Text style={styles.archivedText}>Archived</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  unreadContainer: {
    backgroundColor: '#F8FAFC',
  },
  archivedContainer: {
    opacity: 0.7,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageType: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  subject: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  preview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadText: {
    fontWeight: '600',
    color: '#111827',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 8,
    top: '50%',
    width: 3,
    height: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 1.5,
    marginTop: -10,
  },
  archivedBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: '#6B7280',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  archivedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
