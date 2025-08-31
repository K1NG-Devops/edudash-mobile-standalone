import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { EventInvitation, GroupInvitationCardProps } from '@/types/groups';

interface EventInvitationCardProps {
  invitation: EventInvitation;
  onAccept?: (invitation: EventInvitation) => void;
  onDecline?: (invitation: EventInvitation) => void;
  onMaybe?: (invitation: EventInvitation) => void;
  onCancel?: (invitation: EventInvitation) => void;
  showActions?: boolean;
  compact?: boolean;
}

const STATUS_COLORS = {
  pending: '#F59E0B',
  accepted: '#10B981',
  declined: '#EF4444',
  maybe: '#6366F1',
};

const STATUS_ICONS = {
  pending: 'clock',
  accepted: 'checkmark.circle.fill',
  declined: 'xmark.circle.fill',
  maybe: 'questionmark.circle.fill',
};

export const EventInvitationCard: React.FC<EventInvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
  onMaybe,
  onCancel,
  showActions = true,
  compact = false,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const isPending = invitation.status === 'pending';
  const canRespond = isPending && showActions;

  const handleAccept = () => {
    Alert.alert(
      'Accept Invitation',
      `Are you sure you want to join "${invitation.event?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => onAccept?.(invitation) }
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline the invitation to "${invitation.event?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => onDecline?.(invitation) }
      ]
    );
  };

  const handleMaybe = () => {
    onMaybe?.(invitation);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Invitation',
      'Are you sure you want to cancel this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => onCancel?.(invitation) }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View
      style={[
        styles.card,
        compact && styles.compactCard,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: isDark ? '#334155' : '#E5E7EB',
          borderLeftColor: STATUS_COLORS[invitation.status],
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.eventInfo}>
          <Text
            style={[
              styles.eventTitle,
              compact && styles.compactTitle,
              { color: isDark ? '#F8FAFC' : '#111827' }
            ]}
            numberOfLines={compact ? 1 : 2}
          >
            {invitation.event?.title || 'Event Invitation'}
          </Text>
          
          {invitation.event?.start_date && (
            <Text
              style={[
                styles.eventDate,
                { color: isDark ? '#94A3B8' : '#6B7280' }
              ]}
            >
              {formatDate(invitation.event.start_date)}
            </Text>
          )}

          {invitation.event?.event_type && (
            <View
              style={[
                styles.eventTypeBadge,
                { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
              ]}
            >
              <Text
                style={[
                  styles.eventTypeText,
                  { color: isDark ? '#D1D5DB' : '#4B5563' }
                ]}
              >
                {invitation.event.event_type.replace('_', ' ')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[invitation.status] }
            ]}
          >
            <IconSymbol
              name={STATUS_ICONS[invitation.status]}
              size={12}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {!compact && (
        <View style={styles.inviterSection}>
          <View style={styles.inviterInfo}>
            <View
              style={[
                styles.inviterAvatar,
                { backgroundColor: isDark ? '#475569' : '#CBD5E1' }
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: isDark ? '#E2E8F0' : '#475569' }
                ]}
              >
                {invitation.inviter?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.inviterDetails}>
              <Text
                style={[
                  styles.inviterName,
                  { color: isDark ? '#F8FAFC' : '#111827' }
                ]}
              >
                Invited by {invitation.inviter?.name || 'Unknown'}
              </Text>
              <Text
                style={[
                  styles.invitedTime,
                  { color: isDark ? '#94A3B8' : '#6B7280' }
                ]}
              >
                {new Date(invitation.invited_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {invitation.response_message && (
        <View
          style={[
            styles.responseMessage,
            { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }
          ]}
        >
          <Text
            style={[
              styles.responseText,
              { color: isDark ? '#CBD5E1' : '#4B5563' }
            ]}
          >
            "{invitation.response_message}"
          </Text>
        </View>
      )}

      {canRespond && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={handleDecline}
          >
            <IconSymbol name="xmark" size={14} color="#FFFFFF" />
            <Text style={styles.actionText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.maybeBtn]}
            onPress={handleMaybe}
          >
            <IconSymbol name="questionmark" size={14} color="#FFFFFF" />
            <Text style={styles.actionText}>Maybe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={handleAccept}
          >
            <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
            <Text style={styles.actionText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {invitation.status !== 'pending' && showActions && onCancel && (
        <View style={styles.cancelSection}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
          >
            <Text
              style={[
                styles.cancelBtnText,
                { color: isDark ? '#94A3B8' : '#6B7280' }
              ]}
            >
              Cancel Invitation
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  compactCard: {
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 14,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 6,
  },
  eventTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inviterSection: {
    marginBottom: 12,
  },
  inviterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inviterDetails: {
    flex: 1,
  },
  inviterName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  invitedTime: {
    fontSize: 12,
  },
  responseMessage: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  declineBtn: {
    backgroundColor: '#EF4444',
  },
  maybeBtn: {
    backgroundColor: '#6366F1',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelSection: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
