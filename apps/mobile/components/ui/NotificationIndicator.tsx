import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationIndicatorProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
}

const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  size = 'medium',
  color = '#EF4444',
  textColor = '#FFFFFF',
}) => {
  // Don't show indicator if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const isLargeNumber = count > 9;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          paddingHorizontal: 4,
        };
      case 'large':
        return {
          minWidth: 24,
          height: 24,
          borderRadius: 12,
          paddingHorizontal: 6,
        };
      default: // medium
        return {
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          paddingHorizontal: 5,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 14;
      default: // medium
        return 12;
    }
  };

  return (
    <View
      style={[
        styles.indicator,
        getSizeStyles(),
        { backgroundColor: color },
        isLargeNumber && { paddingHorizontal: getSizeStyles().paddingHorizontal + 2 },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: getTextSize(),
            fontWeight: '600',
          },
        ]}
        numberOfLines={1}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  indicator: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  text: {
    textAlign: 'center',
  },
});

export default NotificationIndicator;
