import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachPress?: () => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  maxLength?: number;
  sendOnEnter?: boolean; // If true, Enter key sends instead of newline
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  onChangeText,
  onSend,
  onAttachPress,
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

  // WhatsApp-like colors
  const inputColors = {
    background: {
      light: '#F8F9FA',
      dark: '#202C33',
    },
    border: {
      light: '#E1E5E9',
      dark: '#3C4A53',
    },
    placeholder: {
      light: '#8696A0',
      dark: '#8696A0',
    },
    text: {
      light: '#111827',
      dark: '#E9EDEF',
    },
    button: {
      light: '#25D366', // WhatsApp green
      dark: '#00A884',
    },
    attachButton: {
      light: '#54656F',
      dark: '#8696A0',
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

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.md),
          backgroundColor: isDark ? '#0B141A' : '#FFFFFF',
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
                backgroundColor: hasText || sending ? getSendButtonColor() : getAttachButtonColor(),
                opacity: disabled ? 0.6 : 1,
              },
            ]}
            onPress={(e: any) => { try { e?.preventDefault?.(); } catch {} if (hasText) handleSend(); }}
            disabled={disabled || (!hasText && !sending)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={hasText ? 'Send message' : 'Voice message'}
            accessibilityHint={hasText ? 'Sends the typed message' : 'Record a voice message'}
          >
            {sending ? (
              <IconSymbol
                name="arrow.up"
                size={18}
                color="#FFFFFF"
              />
            ) : hasText ? (
              <IconSymbol
                name="arrow.up"
                size={18}
                color="#FFFFFF"
              />
            ) : (
              <IconSymbol
                name="mic"
                size={18}
                color="#FFFFFF"
              />
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
    paddingTop: Spacing.md,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
