import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { TeacherDataService } from '@/lib/services/teacherDataService';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import NotificationIndicator from '@/components/ui/NotificationIndicator';
import { useEnhancedEvents, useEventNotifications } from '@/lib/hooks/useEnhancedEvents';
import { useAnnouncementNotifications } from '@/lib/hooks/useAnnouncementNotifications';
import { handleEventJoin, handleEventCancel } from '@/lib/hooks/useEventParticipation';
import EnhancedEventCard from '@/components/events/EnhancedEventCard';
import { EnhancedEvent } from '@/types/events';
import { requestShowInterstitial } from '@/lib/ads/adEvents';
import { Alert } from 'react-native';
import EventParticipantsModal from '@/components/events/EventParticipantsModal';

interface ActivityItem {
  id: string;
  type: 'homework_graded' | 'message_sent' | 'report_created' | 'activity_completed';
  title: string;
  description: string;
  timestamp: string;
  student_name?: string;
  class_name?: string;
}

export default function ActivitiesScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeTab, setActiveTab] = useState<'teacher' | 'events' | 'announcements'>('teacher');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participantsEvent, setParticipantsEvent] = useState<EnhancedEvent | null>(null);

  // Enhanced events system
  const {
    events,
    loading: eventsLoading,
    hasMore: eventsHasMore,
    refreshing: eventsRefreshing,
    refresh: refreshEvents,
    loadMore: loadMoreEvents,
  } = useEnhancedEvents(
    profile?.preschool_id ?? undefined,
    {
      limit: 10,
      // Show strictly upcoming events, soonest first
      filters: { status: ['upcoming'] },
      sort: { field: 'start_date', direction: 'asc' },
    },
    profile?.role !== 'teacher',
    profile?.auth_user_id
  );

  // Event notifications
  const {
    unreadCount: eventNotificationsCount,
    markAllAsRead: markAllEventNotificationsRead,
  } = useEventNotifications(
    profile?.auth_user_id,
    profile?.role !== 'teacher'
  );

  // Use the announcement notifications hook for non-teachers
  const {
    unreadCount: unreadAnnouncementsCount,
    announcements,
    loading: announcementsLoading,
    refreshAnnouncements,
    markAllAsRead,
  } = useAnnouncementNotifications(
    profile?.auth_user_id,
    profile?.role !== 'teacher'
  );

  const bg = isDark ? '#0B1220' : '#F8FAFC';
  const card = isDark ? '#0F172A' : '#FFFFFF';
  const text = isDark ? '#F1F5F9' : '#1F2937';
  const sub = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? '#334155' : '#E5E7EB';

  const timeAgo = (iso: string) => {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };



  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (profile?.role === 'teacher') {
        setActiveTab('teacher');
        const data = await TeacherDataService.getTeacherDashboardData(profile.auth_user_id);
        setActivities((data?.recent_activities || []) as ActivityItem[]);
      } else {
        // Parent/Admin: events are handled by the enhanced events hook
        setActiveTab('events');
      }
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.auth_user_id, profile?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    // Also refresh announcements and events if not a teacher
    if (profile?.role !== 'teacher') {
      await refreshAnnouncements();
      await refreshEvents();
    }
  };

  const handleEventPress = (event: EnhancedEvent) => {
    // Navigate to event details screen (to be implemented)
    console.log('Open event:', event.title);
  };

  const handleEventParticipate = async (event: EnhancedEvent) => {
    // Handle event participation with proper feedback
    await handleEventJoin(event, profile?.auth_user_id, {
      onSuccess: (message) => {
        Alert.alert('Success! 🎉', message, [
          {
            text: 'OK',
            onPress: () => {
              // Refresh events to show updated participation status
              refreshEvents();
            }
          }
        ]);
      },
      onError: (error) => {
        Alert.alert('Unable to Join Event', error, [
          { text: 'OK', style: 'default' }
        ]);
      },
      participationType: profile?.role === 'parent' ? 'attendee' : 'volunteer'
    });
  };

  const iconFor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'homework_graded': return 'doc.text.below.ecg';
      case 'message_sent': return 'bubble.left.and.bubble.right';
      case 'report_created': return 'chart.bar.doc.horizontal';
      default: return 'figure.run';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} className="flex-1 bg-background" edges={['top','left','right']}>
        <View style={[styles.center, { backgroundColor: bg }]}> 
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: sub }]}>Loading activities…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profile?.role !== 'teacher') {
    // Parent/Admin view with toggle between Events and Announcements
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} className="flex-1 bg-background" edges={['top','left','right']}>
        <View style={[styles.tabsContainer, { borderBottomColor: border }]}>
          <TouchableOpacity 
            onPress={() => {
              setActiveTab('events');
              // Trigger child-safe interstitial (frequency-gated)
              try { requestShowInterstitial({ reason: 'tab-events' }); } catch {}
              // Mark event notifications as read when tab is opened
              if (eventNotificationsCount > 0) {
                setTimeout(markAllEventNotificationsRead, 500);
              }
            }} 
            style={[
              styles.tabBtn,
              activeTab === 'events' && [styles.tabBtnActive, styles.tabBtnActiveBorder]
            ]}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'events'
                    ? styles.tabTextActive
                    : (isDark ? styles.tabTextInactiveDark : styles.tabTextInactiveLight)
                ]}
              >
                Events
              </Text>
              {eventNotificationsCount > 0 && (
                <View style={styles.indicatorWrapper}>
                  <NotificationIndicator count={eventNotificationsCount} size="small" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setActiveTab('announcements');
              // Trigger child-safe interstitial (frequency-gated)
              try { requestShowInterstitial({ reason: 'tab-announcements' }); } catch {}
              // Mark announcements as read when tab is opened
              setTimeout(markAllAsRead, 500); // Small delay to allow UI update
            }} 
            style={[
              styles.tabBtn,
              activeTab === 'announcements' && [styles.tabBtnActive, styles.tabBtnActiveBorder]
            ]}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'announcements'
                    ? styles.tabTextActive
                    : (isDark ? styles.tabTextInactiveDark : styles.tabTextInactiveLight)
                ]}
              >
                Announcements
              </Text>
              {unreadAnnouncementsCount > 0 && (
                <View style={styles.indicatorWrapper}>
                  <NotificationIndicator count={unreadAnnouncementsCount} size="small" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'events' ? (
          eventsLoading ? (
            <View style={[styles.center, { backgroundColor: bg }]}> 
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={[styles.loadingText, { color: sub }]}>Loading events…</Text>
            </View>
          ) : events.length ? (
            <FlatList
              data={events}
              renderItem={({ item }) => (
                <EnhancedEventCard
                  event={item}
                  onPress={handleEventPress}
                  onParticipate={handleEventParticipate}
                  onCancel={async (ev) => {
                    await handleEventCancel(ev, profile?.auth_user_id, {
                      onSuccess: (msg) => {
                        Alert.alert('Done', msg, [{ text: 'OK', onPress: () => refreshEvents() }]);
                      },
                      onError: (e) => Alert.alert('Could not cancel', e),
                    });
                  }}
                  onViewParticipants={(ev) => {
                    setParticipantsEvent(ev);
                    setShowParticipantsModal(true);
                  }}
                  canViewParticipants={profile?.role !== 'parent' || (!!item.created_by && item.created_by === profile?.id)}
                  showActions={true}
                  compact={false}
                />
              )}
              keyExtractor={(item) => item.id}
              style={[styles.flatListContainer, { backgroundColor: bg }]}
              contentContainerStyle={styles.flatListContent}
              refreshControl={
                <RefreshControl 
                  refreshing={eventsRefreshing} 
                  onRefresh={refreshEvents}
                  tintColor="#8B5CF6"
                />
              }
              onEndReached={() => {
                if (eventsHasMore && !eventsLoading) {
                  loadMoreEvents();
                }
              }}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                eventsHasMore ? (
                  <View style={styles.listFooterContainer}>
                    <ActivityIndicator size="small" color="#8B5CF6" />
                    <Text style={[
                      styles.listFooterText,
                      isDark ? styles.subTextDark : styles.subTextLight
                    ]}>Loading more events...</Text>
                  </View>
                ) : events.length > 5 ? (
                  <View style={styles.listFooterContainer}>
                    <Text style={[
                      isDark ? styles.subTextDark : styles.subTextLight
                    ]}>You've reached the end</Text>
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={[styles.center, styles.emptyStateContainer, { backgroundColor: bg }]}> 
              <View style={[styles.emptyIcon, isDark ? styles.emptyIconDark : styles.emptyIconLight]}>
                <IconSymbol name="calendar" size={64} color="#10B981" />
              </View>
              <Text style={[styles.emptyTitle, { color: text }]}>No events yet</Text>
              <Text style={[styles.emptyText, { color: sub }]}>School events and activities will appear here when created.</Text>
            </View>
          )
        ) : (
          announcements.length ? (
            <ScrollView style={[styles.scrollViewContainer, { backgroundColor: bg }]} contentContainerStyle={styles.scrollViewContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
              {announcements
                .filter(Boolean)
                .map((a: any) => (
                  <View key={a.id} style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
                    <View style={styles.row}>
                      <View style={[styles.iconWrap, isDark ? styles.iconWrapDark : styles.iconWrapLight]}> 
                        <IconSymbol name="megaphone.fill" size={20} color="#8B5CF6" />
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={[styles.title, { color: text }]} numberOfLines={2}>{a.content}</Text>
                        <View style={styles.metaRow}>
                          <Text style={[styles.meta, { color: sub }]}>{timeAgo(a.created_at)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          ) : (
            <View style={[styles.center, styles.emptyStateContainer, { backgroundColor: bg }]}> 
              <Text style={isDark ? styles.subTextDark : styles.subTextLight}>No announcements yet.</Text>
            </View>
          )
        )}
      {participantsEvent && (
        <EventParticipantsModal
          visible={showParticipantsModal}
          eventId={participantsEvent.id}
          onClose={() => { setShowParticipantsModal(false); setParticipantsEvent(null); }}
        />
      )}
      </SafeAreaView>
    );
  }

  if (!activities.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top','left','right']}>
        <View style={[styles.center, styles.emptyStateContainer, { backgroundColor: bg }]}> 
        <View style={[styles.emptyIcon, isDark ? styles.emptyIconPurpleDark : styles.emptyIconPurpleLight]}> 
          <IconSymbol name="figure.run" size={64} color="#8B5CF6" />
        </View>
        <Text style={[styles.emptyTitle, { color: text }]}>No activities yet</Text>
        <Text style={[styles.emptyText, { color: sub }]}>Recent classroom activities will appear here.</Text>
        {profile?.role !== 'teacher' && (
          <Text style={[styles.emptyHint, { color: sub }]}>Activities for your role are coming soon.</Text>
        )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top','left','right']}>
      <ScrollView
        style={[styles.scrollViewContainer, { backgroundColor: bg }]}
      contentContainerStyle={styles.scrollViewContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {activities.map((a) => (
        <View key={a.id} style={[styles.card, { backgroundColor: card, borderColor: border }]}> 
          <View style={styles.row}>
            <View style={[styles.iconWrap, isDark ? styles.iconWrapDark : styles.iconWrapLight]}> 
              <IconSymbol name={iconFor(a.type) as any} size={20} color="#8B5CF6" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.title, { color: text }]} numberOfLines={1}>{a.title}</Text>
              <Text style={[styles.desc, { color: sub }]} numberOfLines={2}>{a.description}</Text>
              <View style={styles.metaRow}>
                {!!a.class_name && (
                  <Text style={[styles.meta, { color: sub }]}>Class: {a.class_name}</Text>
                )}
                <Text style={[styles.meta, { color: sub }]}>{timeAgo(a.timestamp)}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
      <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  tabBtnActiveBorder: {
    borderColor: '#8B5CF6',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  tabTextInactiveDark: {
    color: '#94A3B8',
  },
  tabTextInactiveLight: {
    color: '#6B7280',
  },
  indicatorWrapper: {
    marginLeft: 6,
    marginTop: -2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatListContainer: {
    flex: 1,
  },
  flatListContent: {
    padding: 16,
  },
  listFooterContainer: {
    padding: 16,
    alignItems: 'center',
  },
  listFooterText: {
    marginTop: 8,
  },
  subTextDark: {
    color: '#94A3B8',
  },
  subTextLight: {
    color: '#6B7280',
  },
  emptyStateContainer: {
    padding: 24,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIconDark: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  emptyIconLight: {
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  emptyIconPurpleDark: {
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  emptyIconPurpleLight: {
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  scrollViewContainer: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  announcementContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDark: {
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  iconWrapLight: {
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  desc: {
    fontSize: 14,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  meta: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 24,
  },
});
