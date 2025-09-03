import React, { useEffect } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';

export interface WebSafeModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  statusBarTranslucent?: boolean;
  hardwareAccelerated?: boolean;
  blockBackgroundScroll?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const WebSafeModal: React.FC<WebSafeModalProps> = ({
  visible,
  onRequestClose,
  children,
  animationType = 'fade',
  transparent = true,
  statusBarTranslucent = true,
  hardwareAccelerated = true,
  blockBackgroundScroll = true,
  testID,
  accessibilityLabel,
}) => {
  // Prevent background scroll on web while visible
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!blockBackgroundScroll) return;
    if (typeof document === 'undefined' || !document?.body) return;
    const original = document.body.style.overflow;
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = original;
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [visible, blockBackgroundScroll]);

  if (Platform.OS === 'web') {
    // On web, rely on React Native's Modal which already portals to the body.
    // We retain the scroll lock effect above.
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType={animationType}
        onRequestClose={onRequestClose}
        statusBarTranslucent={statusBarTranslucent}
        hardwareAccelerated={hardwareAccelerated}
      >
        <View style={styles.webContainer} testID={testID} accessibilityLabel={accessibilityLabel}>
          {children}
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onRequestClose}
      statusBarTranslucent={statusBarTranslucent}
      hardwareAccelerated={hardwareAccelerated}
    >
      {children}
    </Modal>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    zIndex: 2147483646,
    width: '100%',
    height: '100%',
  },
});

export default WebSafeModal;

