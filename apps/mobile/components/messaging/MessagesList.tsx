import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ChatBubble } from './ChatBubble';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface User {
  id: string;
  name: string;
}

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: User;
  isCurrentUser: boolean;
}

interface MessagesListProps {
  messages: Message[];
  currentUserId: string;
  onEndReached?: () => void;
  loadingMore?: boolean;
  role?: string;
  showAvatars?: boolean;
  onMessagePress?: (message: Message) => void;
  style?: any;
  onContentSizeChange?: () => void;
}

export interface MessagesListRef {
  scrollToBottom: () => void;
}

export const MessagesList = forwardRef<MessagesListRef, MessagesListProps>(({
  messages,
  currentUserId,
  onEndReached,
  loadingMore,
  role = 'parent',
  showAvatars = false,
  onMessagePress,
  style,
  onContentSizeChange,
}, ref) => {
  const { colorScheme } = useTheme();
  const listRef = useRef<FlashList<Message>>(null);
  const isDark = colorScheme === 'dark';

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (listRef.current && messages.length > 0) {
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    },
  }));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.isCurrentUser;
    const isLastMessage = index === messages.length - 1;
    
    // Determine if we should show avatar for this message
    const shouldShowAvatar = showAvatars && !isMine && (
      isLastMessage || 
      messages[index + 1]?.user.id !== item.user.id
    );

    // Mock status for demonstration - in real app this would come from message data
    const getMessageStatus = () => {
      if (!isMine) return null;
      
      // For demo purposes, randomly assign status based on message age
      const messageAge = Date.now() - item.createdAt.getTime();
      const hours = messageAge / (1000 * 60 * 60);
      
      if (hours < 0.5) return 'sent';
      if (hours < 2) return 'delivered';
      return 'read';
    };

    return (
      <View>
        <ChatBubble
          message={{
            id: item.id,
            content: item.text,
            created_at: item.createdAt.toISOString(),
            sender_id: item.user.id,
            message_type: 'text' as const,
            sender_name: item.user.name,
          }}
          isMine={isMine}
          status={getMessageStatus()}
          showAvatar={shouldShowAvatar}
          avatarUrl={null}
          senderName={item.user.name}
          onPress={onMessagePress ? () => onMessagePress(item) : undefined}
          role={role}
        />
      </View>
    );
  };

  const keyExtractor = (item: Message) => item.id;

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View className="py-4 items-center">
        <ActivityIndicator 
          size="small" 
          color={Colors[colorScheme].primary} 
        />
      </View>
    );
  };

  const getItemType = (item: Message, index: number) => {
    // Optimize FlashList rendering by categorizing message types
    const isMine = item.isCurrentUser;
    return isMine ? 'outgoing' : 'incoming';
  };

  // Call onContentSizeChange when messages change
  useEffect(() => {
    if (onContentSizeChange) {
      onContentSizeChange();
    }
  }, [messages, onContentSizeChange]);

  return (
    <View className="flex-1" style={[{ backgroundColor: Colors[colorScheme].background }, style]}>
      <FlashList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={64}
        getItemType={getItemType}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: Spacing.md }}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        // Performance optimizations
        removeClippedSubviews={true}
      />
    </View>
  );
});

MessagesList.displayName = 'MessagesList';

/* migrated to NativeWind classes
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.md,
  },
  messageWrapper: {
    // Minimal wrapper to allow FlashList optimizations
  },
  loadingFooter: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
*/
