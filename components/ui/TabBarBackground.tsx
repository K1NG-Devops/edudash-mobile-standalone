import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabBarBackground() {
  if (Platform.OS === 'ios') {
    // On iOS, use a blur effect background with gradient overlay
    return (
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.98)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.borderTop} />
      </View>
    );
  }
  
  // On Android, use a solid gradient background
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.borderTop} />
      <View style={styles.shadow} />
    </View>
  );
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  shadow: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
});
