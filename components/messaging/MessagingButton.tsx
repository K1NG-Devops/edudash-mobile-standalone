import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import MessagingCenter from './MessagingCenter';

interface MessagingButtonProps {
  profile: UserProfile | null;
  children: any[];
  style?: any;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'floating';
}

const MessagingButton: React.FC<MessagingButtonProps> = ({
  profile,
  children,
  style,
  size = 'medium',
  variant = 'primary',
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      loadUnreadCount();
      setupRealtimeSubscription();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [profile]);

  const setupRealtimeSubscription = () => {
    if (!profile?.auth_user_id) return;

    // Subscribe to new messages to update unread count
    const messageSubscription = supabase
      .channel('message_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Refresh unread count when messages are inserted, updated, or deleted
          loadUnreadCount();
        }
      )
      .subscribe();

    setSubscription(messageSubscription);
  };

  const loadUnreadCount = async () => {
    if (!profile?.auth_user_id) return;

    try {
      setLoading(true);

      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) {
        return;
      }

      // Count unread messages
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', parentProfile.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    setShowMessaging(true);
  };

  const handleClose = () => {
    setShowMessaging(false);
    // Refresh unread count when closing messaging center
    loadUnreadCount();
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, iconSize: 20 };
      case 'large':
        return { width: 64, height: 64, iconSize: 28 };
      default:
        return { width: 56, height: 56, iconSize: 24 };
    }
  };

  const getButtonStyles = () => {
    const buttonSize = getButtonSize();
    
    switch (variant) {
      case 'secondary':
        return [
          styles.button,
          styles.secondaryButton,
          { width: buttonSize.width, height: buttonSize.height },
          style,
        ];
      case 'floating':
        return [
          styles.button,
          styles.floatingButton,
          { width: buttonSize.width, height: buttonSize.height },
          style,
        ];
      default:
        return [
          styles.button,
          styles.primaryButton,
          { width: buttonSize.width, height: buttonSize.height },
          style,
        ];
    }
  };

  const renderButton = () => {
    const buttonSize = getButtonSize();
    
    if (variant === 'primary') {
      return (
        <TouchableOpacity
          style={getButtonStyles()}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={[styles.gradientButton, { borderRadius: buttonSize.width / 2 }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol 
                name="message.fill" 
                size={buttonSize.iconSize} 
                color="#FFFFFF" 
              />
            )}
          </LinearGradient>
          
          {unreadCount > 0 && (
            <View style={[styles.badge, getBadgePosition()]}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={getButtonStyles()}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'floating' ? '#3B82F6' : '#6B7280'} 
          />
        ) : (
          <IconSymbol 
            name="message.fill" 
            size={buttonSize.iconSize} 
            color={variant === 'floating' ? '#3B82F6' : '#6B7280'} 
          />
        )}
        
        {unreadCount > 0 && (
          <View style={[styles.badge, getBadgePosition()]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getBadgePosition = () => {
    const buttonSize = getButtonSize();
    return {
      top: -2,
      right: -2,
      minWidth: buttonSize.width * 0.35,
      height: buttonSize.width * 0.35,
      borderRadius: buttonSize.width * 0.175,
    };
  };

  return (
    <>
      {renderButton()}
      
      <Modal
        visible={showMessaging}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <MessagingCenter
          profile={profile}
          childrenList={children}
          onClose={handleClose}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  primaryButton: {
    // Gradient styling is handled by LinearGradient component
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gradientButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default MessagingButton;
