import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import NotificationIndicator from '@/components/ui/NotificationIndicator';
import { EnhancedEvent, EventCardProps } from '@/types/events';

const EnhancedEventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onParticipate,
  showActions = true,
  compact = false,
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeIcon = (type: EnhancedEvent['event_type']) => {
    const icons = {
      general: 'calendar',
      field_trip: 'car.fill',
      performance: 'theatermasks',
      celebration: 'party.popper',
      workshop: 'hammer',
      sports: 'sportscourt',
      arts: 'paintbrush',
      academic: 'book.fill',
    };
    return icons[type] || 'calendar';
  };

  const getEventTypeColor = (type: EnhancedEvent['event_type']) => {
    const colors = {
      general: '#6B7280',
      field_trip: '#10B981',
      performance: '#8B5CF6',
      celebration: '#F59E0B',
      workshop: '#EF4444',
      sports: '#3B82F6',
      arts: '#EC4899',
      academic: '#6366F1',
    };
    return colors[type] || '#6B7280';
  };

  const getStatusColor = (status: EnhancedEvent['status']) => {
    const colors = {
      upcoming: '#3B82F6',
      ongoing: '#10B981',
      completed: '#6B7280',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusText = (status: EnhancedEvent['status']) => {
    const texts = {
      upcoming: 'Upcoming',
      ongoing: 'Live Now',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return texts[status] || status;
  };

  const hasNewUpdates = event.recent_updates && event.recent_updates.length > 0;
  const isLive = event.status === 'ongoing';
  const typeColor = getEventTypeColor(event.event_type);
  const statusColor = getStatusColor(event.status);

  const renderCompactView = () => (
    <TouchableOpacity
      style={[styles.compactCard, { backgroundColor: palette.surface, borderColor: palette.outline }]}
      onPress={() => onPress?.(event)}
      activeOpacity={0.7}
    >
      <View style={styles.compactHeader}>
        <View style={[styles.typeIconSmall, { backgroundColor: `${typeColor}15` }]}>
          <IconSymbol name={getEventTypeIcon(event.event_type) as any} size={16} color={typeColor} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={[styles.compactTitle, { color: palette.text }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[styles.compactDate, { color: palette.textSecondary }]} numberOfLines={1}>
            {formatDate(event.start_date)}
          </Text>
        </View>
        {(hasNewUpdates || isLive) && (
          <View style={styles.compactIndicators}>
            {isLive && (
              <View style={[styles.liveIndicator, styles.liveIndicatorSmall]}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTextSmall}>LIVE</Text>
              </View>
            )}
            {hasNewUpdates && <NotificationIndicator count={event.recent_updates!.length} size="small" />}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFullView = () => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}
      onPress={() => onPress?.(event)}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
              <IconSymbol name={getEventTypeIcon(event.event_type) as any} size={20} color={typeColor} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.eventTitle, { color: palette.text }]} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={[styles.eventType, { color: typeColor }]}>
                {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(event.status)}
              </Text>
            </View>
            {event.is_featured && (
              <View style={styles.featuredBadge}>
                <IconSymbol name="star.fill" size={12} color="#F59E0B" />
              </View>
            )}
          </View>
        </View>

        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE EVENT</Text>
            <Text style={[styles.liveSubtext, { color: palette.textSecondary }]}>
              Happening now
            </Text>
          </View>
        )}
      </View>

      {/* Cover Image */}
      {event.cover_image_url && (
        <View style={styles.coverImageContainer}>
          <Image source={{ uri: event.cover_image_url }} style={styles.coverImage} />
          {hasNewUpdates && (
            <View style={styles.updatesBadge}>
              <NotificationIndicator count={event.recent_updates!.length} size="small" />
              <Text style={styles.updatesText}>New Updates</Text>
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        {event.description && (
          <Text style={[styles.description, { color: palette.textSecondary }]} numberOfLines={3}>
            {event.description}
          </Text>
        )}

        {/* Event Details */}
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <IconSymbol name="calendar" size={16} color={palette.textSecondary} />
            <Text style={[styles.detailText, { color: palette.textSecondary }]}>
              {formatDate(event.start_date)}
            </Text>
          </View>
          {event.location && (
            <View style={styles.detailRow}>
              <IconSymbol name="location" size={16} color={palette.textSecondary} />
              <Text style={[styles.detailText, { color: palette.textSecondary }]} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
          {event.max_participants && (
            <View style={styles.detailRow}>
              <IconSymbol name="person.2" size={16} color={palette.textSecondary} />
              <Text style={[styles.detailText, { color: palette.textSecondary }]}>
                {event.stats?.participants_count || 0}/{event.max_participants} participants
              </Text>
            </View>
          )}
        </View>

        {/* Featured Media Preview */}
        {event.featured_media && event.featured_media.length > 0 && (
          <View style={styles.mediaPreview}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
              {event.featured_media.slice(0, 5).map((media, index) => (
                <View key={media.id} style={styles.mediaItem}>
                  <Image source={{ uri: media.thumbnail_url || media.file_url }} style={styles.mediaThumbnail} />
                  {index === 4 && event.featured_media!.length > 5 && (
                    <View style={styles.mediaOverlay}>
                      <Text style={styles.mediaOverlayText}>+{event.featured_media!.length - 4}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Event Stats */}
        {event.stats && (
          <View style={styles.eventStats}>
            {event.stats.updates_count > 0 && (
              <View style={styles.statItem}>
                <IconSymbol name="bubble.left" size={14} color={palette.textSecondary} />
                <Text style={[styles.statText, { color: palette.textSecondary }]}>
                  {event.stats.updates_count} update{event.stats.updates_count !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {event.stats.media_count > 0 && (
              <View style={styles.statItem}>
                <IconSymbol name="photo" size={14} color={palette.textSecondary} />
                <Text style={[styles.statText, { color: palette.textSecondary }]}>
                  {event.stats.media_count} photo{event.stats.media_count !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {event.stats.reactions_count > 0 && (
              <View style={styles.statItem}>
                <IconSymbol name="heart" size={14} color={palette.textSecondary} />
                <Text style={[styles.statText, { color: palette.textSecondary }]}>
                  {event.stats.reactions_count} reaction{event.stats.reactions_count !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <View style={styles.tags}>
            {event.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: palette.background }]}>
                <Text style={[styles.tagText, { color: palette.textSecondary }]}>#{tag}</Text>
              </View>
            ))}
            {event.tags.length > 3 && (
              <Text style={[styles.tagText, { color: palette.textSecondary }]}>+{event.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      {showActions && event.status === 'upcoming' && (
        <View style={[styles.cardActions, { borderTopColor: palette.outline }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: typeColor }]}
            onPress={() => onParticipate?.(event)}
          >
            <IconSymbol name="person.badge.plus" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {event.user_participation ? 'Registered' : 'Join Event'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryActionButton, { borderColor: palette.outline }]}>
            <IconSymbol name="square.and.arrow.up" size={18} color={palette.text} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return compact ? renderCompactView() : renderFullView();
};

const styles = StyleSheet.create({
  // Compact View Styles
  compactCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactDate: {
    fontSize: 14,
  },
  compactIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Full View Styles
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  featuredBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  liveIndicatorSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 0,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginRight: 8,
  },
  liveTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  liveSubtext: {
    fontSize: 12,
  },
  coverImageContainer: {
    position: 'relative',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  updatesBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  updatesText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  mediaPreview: {
    marginBottom: 16,
  },
  mediaScroll: {
    marginHorizontal: -4,
  },
  mediaItem: {
    position: 'relative',
    marginHorizontal: 4,
  },
  mediaThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryActionButton: {
    flex: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    width: 48,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EnhancedEventCard;
