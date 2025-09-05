import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Text,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useMediaPicker, MediaFile } from '@/lib/hooks/useMediaPicker';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import * as ImagePicker from 'expo-image-picker';

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachPress?: () => void;
  onMediaSend?: (media: MediaFile) => void;
  onVoiceSend?: (voiceMessage: { uri: string; duration: number; size: number }) => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  maxLength?: number;
  sendOnEnter?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  onChangeText,
  onSend,
  onAttachPress,
  onMediaSend,
  onVoiceSend,
  placeholder = 'Type a message',
  disabled = false,
  sending = false,
  maxLength = 1000,
  sendOnEnter = false,
}) => {
  const { colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  // EduDash brand colors
  const inputColors = {
    background: {
      light: colors.surface, // Use our surface color
      dark: colors.surfaceVariant,
    },
    border: {
      light: colors.outline,
      dark: colors.outline,
    },
    placeholder: {
      light: colors.textSecondary,
      dark: colors.textSecondary,
    },
    text: {
      light: colors.text,
      dark: colors.text,
    },
    button: {
      light: colors.primary, // Use our primary brand color
      dark: colors.primary,
    },
    attachButton: {
      light: colors.textSecondary,
      dark: colors.textSecondary,
    },
  };

  const getInputBackgroundColor = () => {
    return isDark ? inputColors.background.dark : inputColors.background.light;
  };

  const getBorderColor = () => {
    return isDark ? inputColors.border.dark : inputColors.border.light;
  };

  const getPlaceholderColor = () => {
    return isDark ? inputColors.placeholder.dark : inputColors.placeholder.light;
  };

  const getTextColor = () => {
    return isDark ? inputColors.text.dark : inputColors.text.light;
  };

  const getSendButtonColor = () => {
    return isDark ? inputColors.button.dark : inputColors.button.light;
  };

  // Voice recording support
  const {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
    recordingDuration,
    formatDuration,
  } = useAudioRecorder();

  const getAttachButtonColor = () => {
    return isDark ? inputColors.attachButton.dark : inputColors.attachButton.light;
  };

  const handleSend = async () => {
    if (!value.trim() || disabled || sending) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics might not be available
    }

    onSend();
  };

  const hasText = value.trim().length > 0;

  const handleMicPress = async () => {
    if (disabled || sending) return;
    if (!onVoiceSend) return;
    if (!isRecording) {
      const ok = await startRecording();
      if (!ok) return;
    } else {
      const vm = await stopRecording();
      if (vm) {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
        onVoiceSend?.(vm);
      }
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
          // Use EduDash background colors
          backgroundColor: colors.background,
          borderTopColor: getBorderColor(),
        },
      ]}
    >
        <View style={styles.inputContainer}>

          {/* Text input with integrated attachment button */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: getInputBackgroundColor(),
                borderColor: getBorderColor(),
              },
            ]}
          >
            {/* Attachment button inside input */}
            {onAttachPress && (
              <TouchableOpacity
                style={styles.attachButtonInline}
                onPress={onAttachPress}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Add attachment"
                accessibilityHint="Opens attachment options"
              >
                <IconSymbol
                  name="paperclip"
                  size={20}
                  color={getAttachButtonColor()}
                />
              </TouchableOpacity>
            )}
            
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                Typography.inputText,
                { color: getTextColor() },
              ]}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={getPlaceholderColor()}
              multiline={!sendOnEnter}
              maxLength={maxLength}
              editable={!disabled}
              scrollEnabled
              returnKeyType={sendOnEnter ? 'send' : 'default'}
              blurOnSubmit={sendOnEnter}
              onSubmitEditing={(e) => {
                if (sendOnEnter) {
                  // RN leaves trailing newline sometimes; rely on parent to trim
                  handleSend();
                }
              }}
            />
          </View>

          {/* Send button or mic icon */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                // Always use our primary brand color for the send button
                backgroundColor: getSendButtonColor(),
                opacity: disabled ? 0.6 : 1,
              },
            ]}
            onPress={(e: any) => {
              try { e?.preventDefault?.(); } catch {}
              if (hasText) {
                handleSend();
              } else if (onVoiceSend) {
                handleMicPress();
              }
            }}
            onLongPress={async () => {
              if (disabled || sending || !onVoiceSend) return;
              if (!isRecording) await startRecording();
            }}
            onPressOut={async () => {
              if (isRecording && onVoiceSend) {
                const vm = await stopRecording();
                if (vm) onVoiceSend(vm);
              }
            }}
            disabled={disabled || (hasText ? false : (!onVoiceSend && !sending))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={hasText ? 'Send message' : (isRecording ? `Recording… ${formatDuration(recordingDuration)}` : 'Voice message')}
            accessibilityHint={hasText ? 'Sends the typed message' : (isRecording ? 'Release to send recording' : 'Tap to record, tap again to send')}
          >
            {sending ? (
              <IconSymbol name="arrow.up" size={20} color="#FFFFFF" />
            ) : hasText ? (
              <IconSymbol name="arrow.up" size={20} color="#FFFFFF" />
            ) : (
              <IconSymbol name={isRecording ? 'stop' : 'mic'} size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    minHeight: 20,
    maxHeight: 80,
    paddingVertical: 0,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  attachButtonInline: {
    padding: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
