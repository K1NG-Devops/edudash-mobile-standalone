import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  sender_id: string;
  message_type: 'text' | 'image' | 'file' | 'announcement' | 'system' | 'general';
  created_at: string;
  sender_name?: string;
}

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  status?: 'sent' | 'delivered' | 'read' | null;
  showAvatar?: boolean;
  avatarUrl?: string | null;
  senderName?: string;
  onPress?: () => void;
  role?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isMine,
  status,
  showAvatar = false,
  avatarUrl,
  senderName,
  onPress,
  role = 'parent',
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  // WhatsApp-like colors
  const bubbleColors = {
    outgoing: {
      light: '#DCF8C6', // WhatsApp green
      dark: '#005C4B',
    },
    incoming: {
      light: '#FFFFFF',
      dark: '#202C33',
    },
  };

  const textColors = {
    outgoing: {
      light: '#111827',
      dark: '#E5E7EB',
    },
    incoming: {
      light: '#111827',
      dark: '#E5E7EB',
    },
    timestamp: {
      light: 'rgba(17, 24, 39, 0.6)',
      dark: 'rgba(229, 231, 235, 0.6)',
    },
  };

  const getBubbleBackgroundColor = () => {
    if (isMine) {
      return isDark ? bubbleColors.outgoing.dark : bubbleColors.outgoing.light;
    } else {
      return isDark ? bubbleColors.incoming.dark : bubbleColors.incoming.light;
    }
  };

  const getTextColor = () => {
    if (isMine) {
      return isDark ? textColors.outgoing.dark : textColors.outgoing.light;
    } else {
      return isDark ? textColors.incoming.dark : textColors.incoming.light;
    }
  };

  const getTimestampColor = () => {
    return isDark ? textColors.timestamp.dark : textColors.timestamp.light;
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderStatusTicks = () => {
    if (!isMine || !status) return null;

    const tickColor = status === 'read' ? '#34D399' : getTimestampColor();
    
    switch (status) {
      case 'sent':
        return (
          <Text style={[styles.statusTick, { color: tickColor }]}>
            ✓
          </Text>
        );
      case 'delivered':
        return (
          <Text style={[styles.statusTick, { color: tickColor }]}>
            ✓✓
          </Text>
        );
      case 'read':
        return (
          <Text style={[styles.statusTick, { color: tickColor }]}>
            ✓✓
          </Text>
        );
      default:
        return null;
    }
  };

  const bubbleStyle = [
    styles.messageBubble,
    {
      backgroundColor: getBubbleBackgroundColor(),
      alignSelf: (isMine ? 'flex-end' : 'flex-start') as 'flex-end' | 'flex-start',
      borderBottomRightRadius: isMine ? 4 : 16,
      borderBottomLeftRadius: isMine ? 16 : 4,
      maxWidth: screenWidth * 0.78,
    },
    !isDark && !isMine && styles.incomingShadow,
  ];

  return (
    <View style={[styles.messageContainer, isMine ? styles.sentContainer : styles.receivedContainer]}>
      {showAvatar && !isMine && (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {(senderName || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      
      <Pressable
        style={bubbleStyle}
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      >
        {!isMine && showAvatar && senderName && (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {senderName}
          </Text>
        )}
        
        <Text style={[styles.messageText, { color: getTextColor() }]}>
          {message.content}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, { color: getTimestampColor() }]}>
            {formatTime(message.created_at)}
          </Text>
          {renderStatusTicks()}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-end',
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 60,
  },
  incomingShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  senderName: {
    ...Typography.roleLabel,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  messageText: {
    ...Typography.messageText,
    marginBottom: Spacing.xs,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  messageTime: {
    ...Typography.messageTime,
  },
  statusTick: {
    ...Typography.messageTime,
    fontWeight: '600',
  },
});
