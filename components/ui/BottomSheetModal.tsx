import React, { useEffect, useMemo, useRef } from 'react';
import { View, Pressable, Platform, Dimensions, Animated, PanResponder, Easing, ScrollView } from 'react-native';
import WebSafeModal from '@/components/ui/WebSafeModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showHandle?: boolean;
  testID?: string;
  disableSwipeToClose?: boolean;
}

// A lightweight WhatsApp-style bottom sheet modal using NativeWind classes.
// - Dimmed overlay
// - Rounded top corners
// - Drag handle bar
// - Swipe down to close
// - Closes on backdrop press or Android back
export default function BottomSheetModal({
  visible,
  onClose,
  children,
  showHandle = true,
  testID,
  disableSwipeToClose = false,
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const screenHeight = Dimensions.get('window').height;
  const sheetMaxHeight = Math.floor(screenHeight * 0.9);

  const translateY = useRef(new Animated.Value(sheetMaxHeight)).current;
  const canUseNativeDriver = Platform.OS !== 'web';

  // Open/close animation
  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: canUseNativeDriver,
      }).start();
    } else {
      // Reset position for next open
      translateY.setValue(sheetMaxHeight);
    }
  }, [visible, sheetMaxHeight, translateY]);

  const closeAnimated = () => {
    Animated.timing(translateY, {
      toValue: sheetMaxHeight,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: canUseNativeDriver,
    }).start(() => {
      try { onClose(); } catch {}
    });
  };

  // Pan to close
  const panResponder = useMemo(() => {
    if (disableSwipeToClose) return null as any;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        // Start responding if user is dragging vertically
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 2;
      },
      onPanResponderMove: Animated.event([null, { dy: translateY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_evt, gestureState) => {
        const shouldClose = gestureState.dy > 100 || gestureState.vy > 0.75;
        if (shouldClose) {
          closeAnimated();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 6,
            useNativeDriver: canUseNativeDriver,
          }).start();
        }
      },
    });
  }, [translateY, disableSwipeToClose]);

  return (
    <WebSafeModal
      visible={visible}
      animationType={Platform.OS === 'android' ? 'fade' : 'fade'}
      transparent
      statusBarTranslucent
      onRequestClose={closeAnimated}
      blockBackgroundScroll
    >
      <View className="flex-1 justify-end" style={{ zIndex: 9999, position: 'relative' }} pointerEvents="box-none">
        {/* Backdrop */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          onPress={closeAnimated}
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2147483645 }}
          testID={testID ? `${testID}-backdrop` : undefined}
        />

        {/* Sheet container */}
        <Animated.View
          className="rounded-t-2xl pt-2 pb-2 max-h-[90%] overflow-hidden"
          style={{ width: '100%', alignSelf: 'stretch', backgroundColor: palette?.surface || '#FFFFFF', transform: [{ translateY }], maxHeight: sheetMaxHeight, minHeight: Math.floor(screenHeight * 0.75), paddingBottom: insets.bottom, zIndex: 2147483646, elevation: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: -2 } }}
          testID={testID ? `${testID}-sheet` : undefined}
          {...(disableSwipeToClose ? {} : panResponder?.panHandlers)}
        >
          {showHandle && (
            <View className="items-center py-1">
              <View className="h-1.5 w-12 rounded-full bg-foreground-muted" />
            </View>
          )}

          {/* Content */}
          <ScrollView className="px-3" contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 12 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </WebSafeModal>
  );
}

