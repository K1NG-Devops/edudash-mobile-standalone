import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingSpinnerProps {
  message?: string;
  color?: string;
  size?: 'small' | 'large';
  showGradient?: boolean;
}

export class LoadingSpinner extends React.Component<LoadingSpinnerProps> {
  render() {
    const { 
      message = 'Loading...', 
      color = '#667eea', 
      size = 'large',
      showGradient = true 
    } = this.props;

    if (showGradient) {
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.gradientContainer}
          >
            <View style={styles.spinnerContainer}>
              <ActivityIndicator size={size} color="white" />
              <Text style={styles.gradientText}>{message}</Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size={size} color={color} />
          <Text style={[styles.text, { color }]}>{message}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  spinnerContainer: {
    alignItems: 'center',
    padding: 32,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  gradientText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default LoadingSpinner;
