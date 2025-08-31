import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

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

interface ConversationListProps {
  conversations: Conversation[];
  onPress: (conversation: Conversation) => void;
  onLongPress?: (conversation: Conversation) => void;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyComponent?: React.ReactNode;
}

const ConversationItem = memo<{
  conversation: Conversation;
  onPress: () => void;
  onLongPress?: () => void;
  isDark: boolean;
}>(({ conversation, onPress, onLongPress, isDark }) => {
  // WhatsApp-like colors
  const colors = {
    background: {
      light: '#FFFFFF',
      dark: '#0B141A',
    },
    pressed: {
      light: '#F5F5F5',
      dark: '#1C2C33',
    },
    text: {
      light: '#111827',
      dark: '#E9EDEF',
    },
    subtitle: {
      light: '#667781',
      dark: '#8696A0',
    },
    time: {
      light: '#667781',
      dark: '#8696A0',
    },
    unreadBg: {
      light: '#25D366',
      dark: '#00A884',
    },
    border: {
      light: '#F2F3F5',
      dark: '#2A3942',
    },
  };

  const getBackgroundColor = () => {
    return isDark ? colors.background.dark : colors.background.light;
  };

  const getTextColor = () => {
    return isDark ? colors.text.dark : colors.text.light;
  };

  const getSubtitleColor = () => {
    return isDark ? colors.subtitle.dark : colors.subtitle.light;
  };

  const getTimeColor = () => {
    return isDark ? colors.time.dark : colors.time.light;
  };

  const getUnreadBadgeColor = () => {
    return isDark ? colors.unreadBg.dark : colors.unreadBg.light;
  };

  const getBorderColor = () => {
    return isDark ? colors.border.dark : colors.border.light;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher':
        return '👩‍🏫';
      case 'preschool_admin':
      case 'principal':
        return '👨‍💼';
      case 'parent':
        return '👨‍👩‍👦';
      default:
        return '👤';
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    
    try {
      const now = new Date();
      const date = new Date(timeString);
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours < 24) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        });
      } else if (hours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {
      return timeString;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        {
          backgroundColor: getBackgroundColor(),
          borderBottomColor: getBorderColor(),
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${conversation.participant_name}`}
      accessibilityHint={`${conversation.unread_count > 0 ? `${conversation.unread_count} unread messages` : 'No unread messages'}`}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {conversation.participant_avatar ? (
          <Image
            source={{ uri: conversation.participant_avatar }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.defaultAvatar, isDark && styles.defaultAvatarDark]}>
            <Text style={[styles.avatarText, { color: getSubtitleColor() }]}>
              {conversation.participant_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {conversation.is_online && <View style={styles.onlineIndicator} />}
      </View>

      {/* Conversation Info */}
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.participantName, { color: getTextColor() }]}
              numberOfLines={1}
            >
              {conversation.participant_name}
            </Text>
            <Text style={styles.roleIcon}>
              {getRoleIcon(conversation.participant_role)}
            </Text>
          </View>
          <Text style={[styles.messageTime, { color: getTimeColor() }]}>
            {formatTime(conversation.last_message_time)}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text
            style={[
              styles.lastMessage,
              { color: getSubtitleColor() },
              conversation.unread_count > 0 && { color: getTextColor(), fontWeight: '500' },
            ]}
            numberOfLines={1}
          >
            {conversation.last_message}
          </Text>
          {conversation.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: getUnreadBadgeColor() }]}>
              <Text style={styles.unreadCount}>
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count.toString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onPress,
  onLongPress,
  loading,
  refreshing,
  onRefresh,
  emptyComponent,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      onPress={() => onPress(item)}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      isDark={isDark}
    />
  );

  const keyExtractor = (item: Conversation) => item.id;

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
      </View>
    );
  }

  if (conversations.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        {emptyComponent || (
          <>
            <IconSymbol name="bubble.left.and.bubble.right" size={64} color={Colors[colorScheme].primary} />
            <Text style={[styles.emptyTitle, { color: Colors[colorScheme].text }]}>
              No conversations yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: Colors[colorScheme].textSecondary }]}>
              Start a new conversation to connect with teachers and parents
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <FlashList
      data={conversations}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={76}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
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
  defaultAvatarDark: {
    backgroundColor: '#374151',
  },
  avatarText: {
    ...Typography.conversationName,
    fontSize: 18,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantName: {
    ...Typography.conversationName,
    flex: 1,
  },
  roleIcon: {
    fontSize: 14,
    marginLeft: Spacing.xs,
  },
  messageTime: {
    ...Typography.conversationTime,
    marginLeft: Spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    ...Typography.conversationPreview,
    flex: 1,
  },
  unreadBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: Spacing.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xxxxl,
  },
  emptyTitle: {
    ...Typography.conversationName,
    fontSize: 18,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.conversationPreview,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
});
