import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface LoadingSpinnerProps {
  message?: string;
  color?: string;
  size?: 'small' | 'large' | number;
  showGradient?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  color,
  size = 'small',
  showGradient = false,
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  // Prefer minimal spinner by default
  if (showGradient) {
    return (
      <View style={styles.containerMinimal}>
        <LinearGradient
          colors={[palette.primary, palette.secondary]}
          style={styles.gradientContainer}
        >
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size={size} color="#FFFFFF" />
            {message ? <Text style={styles.gradientText}>{message}</Text> : null}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.containerMinimal}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color || palette.primary} />
        {message ? (
          <Text style={[styles.text, { color: palette.textSecondary }]}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMinimal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  spinnerContainer: {
    alignItems: 'center',
    padding: 8,
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  gradientText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});

export default LoadingSpinner;
