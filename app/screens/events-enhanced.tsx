import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useEvents } from '@/lib/hooks/useEvents';
import { useEventInvitations } from '@/lib/hooks/useEventInvitations';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useAnalytics, useScreenTracking } from '@/lib/hooks/useAnalytics';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { EventCard } from '@/components/events/EventCard';
import { EventInvitationCard } from '@/components/events/EventInvitationCard';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import { JoinEventModal } from '@/components/events/JoinEventModal';
import { ProtectedComponent } from '@/components/auth/ProtectedComponent';
import { PERMISSIONS } from '@/lib/utils/permissions';
import type { Event } from '@/lib/hooks/useEvents';

export default function EventsEnhancedScreen() {
  const { colorScheme } = useTheme();
  const { user } = useAuth();
  const analytics = useAnalytics();
  const notifications = useNotifications();
  const isDark = colorScheme === 'dark';
  
  useScreenTracking('Events Enhanced');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'invitations' | 'my-events'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { events, loading, error, createEvent, joinEvent, refresh } = useEvents(user?.preschool_id || '');
  const { invitations, respondToInvitation } = useEventInvitations();
  const { canCreateEvent, canApproveEventRequests } = usePermissions();

  const handleCreateEvent = async (eventData: any) => {
    try {
      const newEvent = await createEvent(eventData);
      
      // Track analytics
      analytics.trackEventCreated(
        newEvent.id,
        eventData.audience_type,
        eventData.requires_approval
      );

      // Send invitations if specified
      if (eventData.invited_users?.length > 0) {
        for (const userId of eventData.invited_users) {
          await notifications.sendEventInvitation(
            newEvent.id,
            userId,
            user?.name || 'Someone'
          );
        }
      }

      setShowCreateModal(false);
      Alert.alert('Success', 'Event created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  const handleJoinEvent = async (event: Event, message?: string) => {
    try {
      if (event.requires_approval) {
        // Send approval request
        await notifications.sendApprovalRequest(
          event.id,
          event.created_by,
          user?.name || 'Someone'
        );
        analytics.trackApprovalRequest(event.id);
        Alert.alert('Request Sent', 'Your request to join this event has been sent for approval.');
      } else {
        // Direct join
        await joinEvent(event.id);
        analytics.trackEventJoined(event.id, 'direct');
        Alert.alert('Success', 'You have joined the event!');
      }
      setShowJoinModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to join event. Please try again.');
    }
  };

  const handleInvitationResponse = async (
    invitationId: string, 
    response: 'accepted' | 'declined' | 'maybe'
  ) => {
    try {
      await respondToInvitation(invitationId, response);
      analytics.trackInvitationResponse(invitationId, response);
      
      if (response === 'accepted') {
        Alert.alert('Success', 'You have accepted the invitation!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to respond to invitation.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredEvents = () => {
    switch (activeTab) {
      case 'my-events':
        return events.filter(event => 
          event.created_by === user?.id || 
          event.participants?.some(p => p.user_id === user?.id)
        );
      case 'invitations':
        return [];
      default:
        return events;
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          Events
        </Text>
        
        <ProtectedComponent permissions={[PERMISSIONS.CREATE_EVENT]}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </ProtectedComponent>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'all' ? '#3B82F6' : (isDark ? '#94A3B8' : '#64748B') }
          ]}>
            All Events
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'invitations' && styles.activeTab]}
          onPress={() => setActiveTab('invitations')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'invitations' ? '#3B82F6' : (isDark ? '#94A3B8' : '#64748B') }
          ]}>
            Invitations
            {pendingInvitations.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingInvitations.length}</Text>
              </View>
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-events' && styles.activeTab]}
          onPress={() => setActiveTab('my-events')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'my-events' ? '#3B82F6' : (isDark ? '#94A3B8' : '#64748B') }
          ]}>
            My Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: isDark ? '#EF4444' : '#DC2626' }]}>
              {error}
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'invitations' ? (
              pendingInvitations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <IconSymbol 
                    name="envelope.badge" 
                    size={48} 
                    color={isDark ? '#475569' : '#94A3B8'} 
                  />
                  <Text style={[styles.emptyText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    No pending invitations
                  </Text>
                </View>
              ) : (
                pendingInvitations.map(invitation => (
                  <EventInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    onAccept={() => handleInvitationResponse(invitation.id, 'accepted')}
                    onDecline={() => handleInvitationResponse(invitation.id, 'declined')}
                    onMaybe={() => handleInvitationResponse(invitation.id, 'maybe')}
                  />
                ))
              )
            ) : (
              filteredEvents().length === 0 ? (
                <View style={styles.emptyContainer}>
                  <IconSymbol 
                    name="calendar" 
                    size={48} 
                    color={isDark ? '#475569' : '#94A3B8'} 
                  />
                  <Text style={[styles.emptyText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                    No events found
                  </Text>
                  {canCreateEvent() && (
                    <TouchableOpacity
                      style={styles.createFirstButton}
                      onPress={() => setShowCreateModal(true)}
                    >
                      <Text style={styles.createFirstText}>Create your first event</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredEvents().map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => {
                      setSelectedEvent(event);
                      setShowJoinModal(true);
                    }}
                    showJoinButton={!event.participants?.some(p => p.user_id === user?.id)}
                  />
                ))
              )
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateEvent}
      />

      {selectedEvent && (
        <JoinEventModal
          visible={showJoinModal}
          event={selectedEvent}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedEvent(null);
          }}
          onJoin={handleJoinEvent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    marginRight: 24,
    paddingVertical: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -16,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  createFirstButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
