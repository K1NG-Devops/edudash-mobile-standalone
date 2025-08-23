import React from 'react';
import { Modal, View, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export default function ThemedModal({ visible, onRequestClose, title, children }: ThemedModalProps) {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: palette.outline,
      width: '100%',
      maxWidth: 380,
    },
    title: {
      color: palette.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

