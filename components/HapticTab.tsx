import React from 'react';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { Animated, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface HapticTabState {
  scaleValue: Animated.Value;
  isPressed: boolean;
}

export class HapticTab extends React.Component<BottomTabBarButtonProps, HapticTabState> {
  constructor(props: BottomTabBarButtonProps) {
    super(props);
    this.state = {
      scaleValue: new Animated.Value(1),
      isPressed: false,
    };
  }

  private handlePressIn = (ev: any) => {
    // Add haptic feedback
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale animation
    this.setState({ isPressed: true });
    Animated.spring(this.state.scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    this.props.onPressIn?.(ev);
  };

  private handlePressOut = (ev: any) => {
    this.setState({ isPressed: false });
    Animated.spring(this.state.scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    this.props.onPressOut?.(ev);
  };

  private handlePress = (ev: any) => {
    // Additional haptic feedback on successful press
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    this.props.onPress?.(ev);
  };

  render() {
    const { children, style, ...restProps } = this.props;
    const { scaleValue, isPressed } = this.state;

    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleValue }],
          },
          isPressed && styles.pressed,
        ]}
      >
        <PlatformPressable
          {...restProps}
          style={[styles.pressable, style]}
          onPressIn={this.handlePressIn}
          onPressOut={this.handlePressOut}
          onPress={this.handlePress}
          android_ripple={{
            color: 'rgba(99, 102, 241, 0.1)',
            borderless: true,
            radius: 32,
          }}
        >
          <View style={styles.content}>
            {children}
          </View>
        </PlatformPressable>
      </Animated.View>
    );
  }
}

// Export as default function to maintain compatibility
export default function HapticTabFunction(props: BottomTabBarButtonProps) {
  return <HapticTab {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minHeight: 56,
  },
  pressed: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});
