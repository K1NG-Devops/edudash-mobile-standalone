import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getRoleColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { sharedHeaderStyles } from '../navigation/headerStyles';
import { ComingSoonAction } from '../ui/ComingSoonAction';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

const { width: screenWidth } = Dimensions.get('window');

interface MessagingHeaderProps {
  title?: string;
  subtitle?: string;
  role?: string;
  schoolName?: string;
  userName?: string;
  onCompose?: () => void;
  onVideoPress?: () => void;
  onVoicePress?: () => void;
  onMenuPress?: () => void;
  onClose?: () => void;
  showComingSoonPills?: boolean;
  containerStyle?: any;
  notificationCount?: number;
}

export const MessagingHeader: React.FC<MessagingHeaderProps> = ({
  title = 'Messages',
  subtitle = 'All conversations',
  role = 'parent',
  schoolName,
  userName,
  onCompose,
  onVideoPress,
  onVoicePress,
  onMenuPress,
  onClose,
  showComingSoonPills = true,
  containerStyle,
  notificationCount = 0,
}) => {
  const { colorScheme } = useTheme();
  
  const roleColors = useMemo(() => {
    return getRoleColors(role, colorScheme);
  }, [role, colorScheme]);

  // Better mobile breakpoints
  const isExtraSmall = screenWidth <= 320;  // iPhone 5/SE size
  const isSmall = screenWidth <= 360;       // Most small Android phones
  const isNarrow = screenWidth < 380;       // General narrow screen
  const isVeryNarrow = screenWidth < 340;   // Very narrow screens

  // Smarter title/subtitle handling for mobile
  const displayTitle = schoolName || title;
  const displaySubtitle = isExtraSmall && userName ? 
    userName.split(' ')[0] : // Just first name on very small screens
    schoolName ? subtitle : 
    (userName ? `Welcome back, ${userName}` : subtitle);

  return (
    <>
      <SafeAreaView 
        style={[styles.safeArea, { backgroundColor: roleColors.gradient[0] }]} 
        edges={['top', 'left', 'right']}
      >
        <StatusBar 
          barStyle="light-content"
          backgroundColor={roleColors.gradient[0]}
          translucent={false}
        />
        
        <LinearGradient
          colors={[roleColors.gradient[0], roleColors.gradient[1], 'rgba(0,0,0,0.1)']}
          style={[sharedHeaderStyles.headerContainer, containerStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Glass morphism overlay */}
          <View style={sharedHeaderStyles.glassOverlay} />
          
          <View style={sharedHeaderStyles.headerContent}>
            {/* Left section - Close button (if provided) + Title and subtitle */}
            <View style={[sharedHeaderStyles.leftSection, styles.leftSectionMobile]}>
              {onClose && (
                <TouchableOpacity
                  style={[
                    sharedHeaderStyles.modernActionButton,
                    styles.closeButton,
                    isExtraSmall && styles.closeButtonSmall
                  ]}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close messages"
                  accessibilityHint="Closes the messages screen"
                >
                  <IconSymbol 
                    name="xmark" 
                    size={isExtraSmall ? 16 : 18} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              )}
              <View style={[sharedHeaderStyles.titleContainer, styles.titleContainerMobile]}>
                <Text 
                  style={[
                    sharedHeaderStyles.headerTitle,
                    isExtraSmall && styles.titleExtraSmall,
                    isSmall && styles.titleSmall
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {displayTitle}
                </Text>
                {displaySubtitle && (
                  <Text 
                    style={[
                      sharedHeaderStyles.headerSubtitle,
                      isExtraSmall && styles.subtitleExtraSmall,
                      isSmall && styles.subtitleSmall
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {displaySubtitle}
                  </Text>
                )}
              </View>
            </View>

            {/* Right section - Action buttons */}
            <View style={[
              sharedHeaderStyles.rightSection, 
              { 
                gap: isExtraSmall ? 3 : isSmall ? 4 : isNarrow ? 6 : 8,
                flexShrink: 0,
                minWidth: isExtraSmall ? 100 : isSmall ? 120 : 140,
              }
            ]}>
              {/* Video Call - Coming Soon - Always show but adapt size */}
              {showComingSoonPills && (
                <ComingSoonAction
                  iconName="video.fill"
                  label={isNarrow ? undefined : "Video"}
                  feature="video_call"
                  variant="icon"
                  size={isExtraSmall ? "sm" : "sm"}
                  onPress={onVideoPress}
                  showLabel={false}
                />
              )}

              {/* Voice Call - Coming Soon - Always show but adapt size */}
              {showComingSoonPills && (
                <ComingSoonAction
                  iconName="phone.fill"
                  label={isNarrow ? undefined : "Voice"}
                  feature="voice_call"
                  variant="icon"
                  size={isExtraSmall ? "sm" : "sm"}
                  onPress={onVoicePress}
                  showLabel={false}
                />
              )}

              {/* Compose Message Button */}
              <TouchableOpacity
                style={[
                  sharedHeaderStyles.modernActionButton, 
                  styles.composeButton,
                  isExtraSmall && styles.composeButtonSmall
                ]}
                onPress={onCompose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Compose new message"
                accessibilityHint="Opens compose message screen"
              >
                <IconSymbol 
                  name="plus" 
                  size={isExtraSmall ? 16 : 18} 
                  color="#FFFFFF" 
                />
                {notificationCount > 0 && (
                  <View style={[
                    sharedHeaderStyles.notificationBadge,
                    isExtraSmall && styles.notificationBadgeSmall
                  ]}>
                    <Text style={[
                      sharedHeaderStyles.badgeText,
                      isExtraSmall && styles.badgeTextSmall
                    ]}>
                      {notificationCount > 99 ? '99+' : notificationCount.toString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Menu Button (Optional) */}
              {onMenuPress && (
                <TouchableOpacity
                  style={[
                    sharedHeaderStyles.modernActionButton,
                    isExtraSmall && styles.menuButtonSmall
                  ]}
                  onPress={onMenuPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="More options"
                  accessibilityHint="Opens additional menu options"
                >
                  <IconSymbol 
                    name="ellipsis.vertical" 
                    size={isExtraSmall ? 16 : 18} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#6366F1', // Fallback color
  },
  composeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  // Mobile-specific styles
  leftSectionMobile: {
    flex: 1,
    paddingRight: 8,
    minWidth: 0, // Allow shrinking
  },
  titleContainerMobile: {
    flex: 1,
    minWidth: 0, // Allow shrinking
  },
  // Extra small screen styles (320px and below)
  titleExtraSmall: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitleExtraSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  // Small screen styles (360px and below)
  titleSmall: {
    fontSize: 18,
    lineHeight: 22,
  },
  subtitleSmall: {
    fontSize: 13,
    lineHeight: 17,
  },
  composeButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  menuButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  notificationBadgeSmall: {
    top: -3,
    right: -3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
  },
  badgeTextSmall: {
    fontSize: 9,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  closeButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
  },
});
