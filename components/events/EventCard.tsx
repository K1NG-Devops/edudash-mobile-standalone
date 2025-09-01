import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import type { Event } from '@/lib/hooks/useEvents';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  showJoinButton?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onJoin,
  onLeave,
  showJoinButton = false,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const eventTypeColors: Record<string, string> = {
    meeting: '#3B82F6',
    activity: '#10B981',
    announcement: '#F59E0B',
    other: '#8B5CF6',
  };

  const eventTypeIcons: Record<string, string> = {
    meeting: 'person.3.fill',
    activity: 'figure.run',
    announcement: 'megaphone.fill',
    other: 'calendar',
  };

  const backgroundColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          shadowColor: isDark ? '#000' : '#64748B',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: (eventTypeColors[event.event_type] || '#3B82F6') + '20' },
          ]}
        >
          <IconSymbol
            name={eventTypeIcons[event.event_type] || 'calendar'}
            size={24}
            color={eventTypeColors[event.event_type] || '#3B82F6'}
          />
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[styles.date, { color: subtextColor }]}>
            {format(new Date(event.start_date), 'MMM d, yyyy • h:mm a')}
          </Text>
        </View>

        {event.requires_approval && (
          <View style={styles.approvalBadge}>
            <IconSymbol name="lock.fill" size={12} color="#F59E0B" />
            <Text style={styles.approvalText}>Approval Required</Text>
          </View>
        )}
      </View>

      {event.description && (
        <Text
          style={[styles.description, { color: subtextColor }]}
          numberOfLines={2}
        >
          {event.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <IconSymbol
              name="person.2.fill"
              size={16}
              color={subtextColor}
            />
            <Text style={[styles.statText, { color: subtextColor }]}>
              {(event.participants?.length ?? 0)}
              {event.max_participants && `/${event.max_participants}`} participants
            </Text>
          </View>

          {event.location && (
            <View style={styles.statItem}>
              <IconSymbol
                name="location.fill"
                size={16}
                color={subtextColor}
              />
              <Text style={[styles.statText, { color: subtextColor }]} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>

        {showJoinButton && onJoin && (
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: eventTypeColors[event.event_type] || '#3B82F6' }]}
            onPress={(e) => {
              e.stopPropagation();
              onJoin();
            }}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}

        {!showJoinButton && onLeave && (
          <TouchableOpacity
            style={[styles.leaveButton, { borderColor: '#EF4444' }]}
            onPress={(e) => {
              e.stopPropagation();
              onLeave();
            }}
          >
            <Text style={[styles.leaveButtonText, { color: '#EF4444' }]}>Leave</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvalText: {
    fontSize: 11,
    color: '#92400E',
    marginLeft: 4,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
