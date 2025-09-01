import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { EnhancedEvent } from '@/types/events';
import { EventVisibilityInfo } from '@/types/groups';

type JoinableEvent = Pick<EnhancedEvent, 'id' | 'title' | 'start_date' | 'description' | 'location' | 'cover_image_url'>;

interface JoinEventModalProps {
  visible: boolean;
  event: JoinableEvent | null;
  visibilityInfo?: EventVisibilityInfo | null;
  onClose: () => void;
  onJoin: (event: JoinableEvent, message?: string) => Promise<void>;
  onRequestAccess?: (event: JoinableEvent, message: string) => Promise<void>;
}

export const JoinEventModal: React.FC<JoinEventModalProps> = ({
  visible,
  event,
  visibilityInfo,
  onClose,
  onJoin,
  onRequestAccess,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  const handleJoin = async () => {
    if (!event) return;

    try {
      setLoading(true);
      
      if (visibilityInfo?.requires_approval) {
        if (!message.trim()) {
          Alert.alert('Message Required', 'Please provide a message explaining why you want to join this event.');
          return;
        }
        if (onRequestAccess) {
          await onRequestAccess(event, message.trim());
        } else {
          await onJoin(event, message.trim());
        }
        Alert.alert('Request Sent', 'Your request to join this event has been sent for approval.');
      } else {
        await onJoin(event, message.trim() || undefined);
        Alert.alert('Joined Successfully', `You have successfully joined "${event.title}".`);
      }
      
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to join event');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const canJoin = visibilityInfo?.can_join ?? true;
  const requiresApproval = visibilityInfo?.requires_approval ?? false;
  const isAlreadyRegistered = visibilityInfo?.user_status === 'registered';

  let actionText = 'Join Event';
  let actionIcon = 'plus.circle';
  let actionColor = '#10B981';

  if (requiresApproval) {
    actionText = 'Request to Join';
    actionIcon = 'envelope';
    actionColor = '#3B82F6';
  }

  if (isAlreadyRegistered) {
    actionText = 'Already Registered';
    actionIcon = 'checkmark.circle.fill';
    actionColor = '#6B7280';
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E5E7EB',
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#F8FAFC' : '#111827' }
              ]}
            >
              Join Event
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              disabled={loading}
            >
              <IconSymbol
                name="xmark"
                size={20}
                color={isDark ? '#CBD5E1' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Event Info */}
            <View style={styles.eventSection}>
              <View style={styles.eventHeader}>
                {event.cover_image_url ? (
                  <View
                    style={[
                      styles.eventImage,
                      { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
                    ]}
                  >
                    <IconSymbol
                      name="photo"
                      size={32}
                      color={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.eventIconContainer,
                      { backgroundColor: '#3B82F6' + '20' }
                    ]}
                  >
                    <IconSymbol
                      name="calendar"
                      size={32}
                      color="#3B82F6"
                    />
                  </View>
                )}
                
                <View style={styles.eventInfo}>
                  <Text
                    style={[
                      styles.eventTitle,
                      { color: isDark ? '#F8FAFC' : '#111827' }
                    ]}
                  >
                    {event.title}
                  </Text>
                  
                  <Text
                    style={[
                      styles.eventDate,
                      { color: isDark ? '#94A3B8' : '#6B7280' }
                    ]}
                  >
                    {formatDate(event.start_date)}
                  </Text>

                  {event.location && (
                    <View style={styles.locationRow}>
                      <IconSymbol
                        name="location"
                        size={14}
                        color={isDark ? '#94A3B8' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.locationText,
                          { color: isDark ? '#94A3B8' : '#6B7280' }
                        ]}
                      >
                        {event.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {event.description && (
                <View style={styles.descriptionSection}>
                  <Text
                    style={[
                      styles.descriptionTitle,
                      { color: isDark ? '#E5E7EB' : '#374151' }
                    ]}
                  >
                    About this event
                  </Text>
                  <Text
                    style={[
                      styles.descriptionText,
                      { color: isDark ? '#CBD5E1' : '#4B5563' }
                    ]}
                  >
                    {event.description}
                  </Text>
                </View>
              )}
            </View>

            {/* Status Information */}
            <View
              style={[
                styles.statusSection,
                { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }
              ]}
            >
              <View style={styles.statusHeader}>
                <IconSymbol
                  name="info.circle"
                  size={20}
                  color="#3B82F6"
                />
                <Text
                  style={[
                    styles.statusTitle,
                    { color: isDark ? '#E5E7EB' : '#374151' }
                  ]}
                >
                  Event Access
                </Text>
              </View>

              {!canJoin && (
                <View style={styles.statusRow}>
                  <IconSymbol
                    name="exclamationmark.triangle"
                    size={16}
                    color="#F59E0B"
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isDark ? '#CBD5E1' : '#4B5563' }
                    ]}
                  >
                    {visibilityInfo?.reason || 'You cannot join this event'}
                  </Text>
                </View>
              )}

              {canJoin && requiresApproval && (
                <View style={styles.statusRow}>
                  <IconSymbol
                    name="checkmark.seal"
                    size={16}
                    color="#F59E0B"
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isDark ? '#CBD5E1' : '#4B5563' }
                    ]}
                  >
                    This event requires approval to join
                  </Text>
                </View>
              )}

              {canJoin && !requiresApproval && (
                <View style={styles.statusRow}>
                  <IconSymbol
                    name="checkmark.circle"
                    size={16}
                    color="#10B981"
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isDark ? '#CBD5E1' : '#4B5563' }
                    ]}
                  >
                    You can join this event immediately
                  </Text>
                </View>
              )}

              {isAlreadyRegistered && (
                <View style={styles.statusRow}>
                  <IconSymbol
                    name="person.circle"
                    size={16}
                    color="#6366F1"
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isDark ? '#CBD5E1' : '#4B5563' }
                    ]}
                  >
                    You are already registered for this event
                  </Text>
                </View>
              )}
            </View>

            {/* Message Input */}
            {canJoin && !isAlreadyRegistered && (
              <View style={styles.messageSection}>
                <Text
                  style={[
                    styles.messageLabel,
                    { color: isDark ? '#E5E7EB' : '#374151' }
                  ]}
                >
                  {requiresApproval ? 'Message (Required)' : 'Message (Optional)'}
                </Text>
                <TextInput
                  style={[
                    styles.messageInput,
                    {
                      color: isDark ? '#E5E7EB' : '#111827',
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
                    }
                  ]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={
                    requiresApproval 
                      ? "Explain why you'd like to join this event..."
                      : "Add a message (optional)..."
                  }
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text
                  style={[
                    styles.charCount,
                    { color: isDark ? '#64748B' : '#9CA3AF' }
                  ]}
                >
                  {message.length}/500
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  borderColor: isDark ? '#374151' : '#D1D5DB',
                }
              ]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? '#CBD5E1' : '#6B7280' }
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            {canJoin && !isAlreadyRegistered && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.joinButton,
                  { backgroundColor: actionColor }
                ]}
                onPress={handleJoin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <IconSymbol name={actionIcon} size={16} color="#FFFFFF" />
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                      {actionText}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  eventSection: {
    marginBottom: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 24,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  messageSection: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 50,
  },
  cancelButton: {
    borderWidth: 1,
  },
  joinButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
