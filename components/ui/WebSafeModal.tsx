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
  // Always call hooks at the top-level. Guard web-only behavior inside the effect.
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
    if (!visible) return null;

    return (
      <View
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        style={styles.webContainer}
      >
        {children}
      </View>
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
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default WebSafeModal;

