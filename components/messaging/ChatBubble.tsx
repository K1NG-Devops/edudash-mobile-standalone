import React from 'react';
import {
  View,
  Text,
  Dimensions,
  Pressable,
} from 'react-native';
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

  // EduDash brand colors with proper rgba values
  const bubbleColors = {
    outgoing: {
      light: isDark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(99, 102, 241, 0.15)', // Primary with opacity
      dark: isDark ? 'rgba(165, 180, 252, 0.25)' : 'rgba(99, 102, 241, 0.2)',
    },
    incoming: {
      light: colors.surface,
      dark: colors.surfaceVariant,
    },
  };

  const textColors = {
    outgoing: {
      light: colors.text,
      dark: colors.text,
    },
    incoming: {
      light: colors.text,
      dark: colors.text,
    },
    timestamp: {
      light: colors.textSecondary,
      dark: colors.textSecondary,
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
    // Use device locale and time preference (12/24h) automatically
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderStatusTicks = () => {
    if (!isMine || !status) return null;

    // Read receipts: blue for read, timestamp color for others
    const tickColor = status === 'read' ? '#34B7F1' : getTimestampColor();
    
    switch (status) {
      case 'sent':
        return (
          <Text className="text-[11px] font-semibold" style={{ color: tickColor }}>
            ✓
          </Text>
        );
      case 'delivered':
        return (
          <Text className="text-[11px] font-semibold" style={{ color: tickColor }}>
            ✓✓
          </Text>
        );
      case 'read':
        return (
          <Text className="text-[11px] font-semibold" style={{ color: tickColor }}>
            ✓✓
          </Text>
        );
      default:
        return null;
    }
  };

  const bubbleStyle = [{
      backgroundColor: getBubbleBackgroundColor(),
      borderBottomRightRadius: isMine ? 4 : 16,
      borderBottomLeftRadius: isMine ? 16 : 4,
      maxWidth: screenWidth * 0.82,
    },
    // Subtle shadow on incoming bubbles only (WhatsApp-like)
    !isMine ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 1.5,
      elevation: 1,
    } : null].filter(Boolean as any);

  return (
    <View className={`flex-row mb-2.5 px-5 items-end ${isMine ? 'justify-end' : 'justify-start'}`}>
      {showAvatar && !isMine && (
        <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center mr-2 mb-1">
          <Text className="text-xs font-semibold text-gray-500">
            {(senderName || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      
      <Pressable
        className="rounded-2xl px-4 py-2"
        style={bubbleStyle}
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      >
        {!isMine && showAvatar && senderName && (
          <Text className="mb-1 font-semibold" style={{ color: colors.primary }}>
            {senderName}
          </Text>
        )}
        
        <Text className="text-[14px] leading-5 mb-1" style={{ color: getTextColor() }}>
          {message.content}
        </Text>
        
        <View className="flex-row items-center justify-end gap-1">
          <Text className="text-[11px]" style={{ color: getTimestampColor() }}>
            {formatTime(message.created_at)}
          </Text>
          {renderStatusTicks()}
        </View>
      </Pressable>
    </View>
  );
};

/* migrated to NativeWind classes
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
*/
