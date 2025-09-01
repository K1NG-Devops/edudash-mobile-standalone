import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

interface StatusIndicator {
  icon: string;
  label: string;
  color?: string;
}

interface CompactHeaderProps {
  title: string;
  subtitle?: string;
  avatarUri?: string;
  avatarInitial?: string;
  statusIndicators?: StatusIndicator[];
  rightActions?: React.ReactNode;
  onBackPress?: () => void;
  backgroundMode?: 'primary' | 'surface' | 'gradient';
  gradientColors?: string[];
  showBackButton?: boolean;
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  title,
  subtitle,
  avatarUri,
  avatarInitial,
  statusIndicators = [],
  rightActions,
  onBackPress,
  backgroundMode = 'surface',
  gradientColors,
  showBackButton = true,
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  // Determine background and text colors based on mode
  const getColors = () => {
    switch (backgroundMode) {
      case 'primary':
        return {
          background: palette.primary,
          text: palette.onPrimary,
          secondaryText: isDark ? palette.onPrimary : 'rgba(255, 255, 255, 0.8)',
        };
      case 'gradient':
        return {
          background: gradientColors?.[0] || palette.primary,
          text: '#FFFFFF',
          secondaryText: 'rgba(255, 255, 255, 0.8)',
        };
      case 'surface':
      default:
        return {
          background: palette.surface,
          text: palette.onSurface,
          secondaryText: palette.textSecondary,
        };
    }
  };

  const colors = getColors();
  const displayInitial = avatarInitial || title.charAt(0).toUpperCase();

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBackButton && onBackPress && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
          )}

          {/* Avatar */}
          {avatarInitial && (
            <View style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Text style={[styles.avatarText, { color: colors.text }]}>
                {displayInitial}
              </Text>
            </View>
          )}

          {/* Title and Subtitle */}
          <View style={styles.titleContainer}>
            <Text 
              style={[styles.title, { color: colors.text }]} 
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            {subtitle && (
              <Text 
                style={[styles.subtitle, { color: colors.secondaryText }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Section - Status Indicators */}
        <View style={styles.rightSection}>
          {statusIndicators.map((indicator, index) => (
            <View key={index} style={styles.indicator}>
              <IconSymbol 
                name={indicator.icon} 
                size={16} 
                color={indicator.color || colors.text} 
              />
              <Text style={[styles.indicatorLabel, { color: colors.text }]}>
                {indicator.label}
              </Text>
            </View>
          ))}
          {rightActions}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    // Total height target: 56-64dp
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 56,
    maxHeight: 64,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8, // Compensate for padding
    marginRight: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
