import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { sharedHeaderStyles } from '../navigation/headerStyles';

interface ComingSoonActionProps {
  iconName: string;
  label?: string;
  feature: string;
  variant?: 'icon' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  showLabel?: boolean;
}

export const ComingSoonAction: React.FC<ComingSoonActionProps> = ({
  iconName,
  label,
  feature,
  variant = 'pill',
  size = 'sm',
  onPress,
  showLabel = true,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Alert.alert(
        'Coming Soon',
        `${label || feature} feature is coming soon! Stay tuned for updates.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 18 : 20;
  const buttonSize = size === 'sm' ? 32 : 36;

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        style={[
          sharedHeaderStyles.modernActionButton, 
          sharedHeaderStyles.comingSoonPill,
          size === 'sm' && {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label || feature}
        accessibilityHint={`${label || feature} - Coming soon feature`}
      >
        <IconSymbol name={iconName} size={iconSize} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        sharedHeaderStyles.pillButton,
        sharedHeaderStyles.comingSoonPill,
        size === 'sm' && sharedHeaderStyles.pillButtonCompact
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label || feature}
      accessibilityHint={`${label || feature} - Coming soon feature`}
    >
      <IconSymbol name={iconName} size={iconSize} color="#FFFFFF" />
      {showLabel && label && (
        <Text style={sharedHeaderStyles.pillButtonText}>{label}</Text>
      )}
      <View style={sharedHeaderStyles.soonBadge}>
        <Text style={sharedHeaderStyles.soonBadgeText}>SOON</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});
