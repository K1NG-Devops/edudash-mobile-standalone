import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import CreateAnnouncementModal from '@/components/announcements/CreateAnnouncementModal';
import CreateEventModal from '@/components/events/CreateEventModal';
import EnhancedEventCard from '@/components/events/EnhancedEventCard';
import { useEnhancedEvents } from '@/lib/hooks/useEnhancedEvents';
import { EnhancedEvent } from '@/types/events';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';

interface Announcement {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  created_by: string;
  include_parents: boolean;
  include_staff: boolean;
  creator_name: string;
  creator_role: string;
  total_recipients: number;
  read_count: number;
}

interface AnnouncementManagementProps {
  profile: UserProfile | null;
  onSignOut: () => Promise<void>;
}

const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({ profile, onSignOut }) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');
  const queryClient = useQueryClient();

  // Fetch announcements
  const announcementsQuery = useQuery({
    queryKey: ['announcements', profile?.preschool_id],
    queryFn: async () => {
      if (!profile?.preschool_id) return [];
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles:created_by (
            name,
            role
          )
        `)
        .eq('preschool_id', profile.preschool_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(announcement => ({
        id: announcement.id,
        subject: announcement.subject || 'No Subject',
        content: announcement.content,
        created_at: announcement.created_at,
        created_by: announcement.created_by,
        include_parents: announcement.include_parents,
        include_staff: announcement.include_staff,
        creator_name: announcement.profiles?.name || 'Unknown',
        creator_role: announcement.profiles?.role || 'Unknown',
        total_recipients: (announcement.include_parents ? 1 : 0) + (announcement.include_staff ? 1 : 0),
        read_count: 0, // This would need to be calculated from read receipts if implemented
      })) as Announcement[];
    },
    enabled: !!profile?.preschool_id,
    staleTime: 1000 * 60, // 1 minute
  });

  // Events hook
  const {
    events,
    loading: eventsLoading,
    hasMore: eventsHasMore,
    refreshing: eventsRefreshing,
    refresh: refreshEvents,
    loadMore: loadMoreEvents,
  } = useEnhancedEvents(
    profile?.preschool_id,
    { limit: 10, sort: { field: 'start_date', direction: 'desc' } },
    !!profile?.preschool_id
  );

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', profile?.preschool_id] });
      Alert.alert('Success', 'Announcement deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Failed to delete announcement: ' + error.message);
    },
  });

  const handleNavigate = (route: string) => {
    if (!route) return;
    if (route.startsWith('/')) {
      router.push(route as any);
      return;
    }
    router.push(`/screens/${route}` as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['announcements', profile?.preschool_id] });
    setRefreshing(false);
  };

  const handleDeleteAnnouncement = (announcement: Announcement) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${announcement.subject}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAnnouncementMutation.mutate(announcement.id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderAnnouncementCard = ({ item }: { item: Announcement }) => (
    <View style={[styles.announcementCard, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.cardSubject, { color: palette.text }]} numberOfLines={1}>
            {item.subject}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardCreator, { color: palette.textSecondary }]}>
              By {item.creator_name}
            </Text>
            <View style={styles.cardDate}>
              <Text style={[styles.cardDateText, { color: palette.textSecondary }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteAnnouncement(item)}
        >
          <IconSymbol name="trash" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text 
        style={[styles.cardContent, { color: palette.textSecondary }]} 
        numberOfLines={3}
      >
        {item.content}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.recipientTags}>
          {item.include_parents && (
            <View style={[styles.recipientTag, { backgroundColor: '#3B82F615' }]}>
              <IconSymbol name="person.3.fill" size={12} color="#3B82F6" />
              <Text style={[styles.recipientTagText, { color: '#3B82F6' }]}>Parents</Text>
            </View>
          )}
          {item.include_staff && (
            <View style={[styles.recipientTag, { backgroundColor: '#10B98115' }]}>
              <IconSymbol name="person.2.fill" size={12} color="#10B981" />
              <Text style={[styles.recipientTagText, { color: '#10B981' }]}>Staff</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardStats}>
          <IconSymbol name="eye" size={14} color={palette.textSecondary} />
          <Text style={[styles.cardStatsText, { color: palette.textSecondary }]}>
            {item.read_count}/{item.total_recipients}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="megaphone" size={64} color={palette.textSecondary} />
      <Text style={[styles.emptyTitle, { color: palette.text }]}>No Announcements Yet</Text>
      <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
        Create your first announcement to communicate with parents and staff
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreateModal(true)}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.emptyButtonGradient}>
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Create Announcement</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom', 'left', 'right']}>
      <MobileHeader
        user={{
          name: profile?.name || 'Principal',
          role: profile?.role || 'preschool_admin',
          avatar: profile?.avatar_url || undefined,
        }}
        schoolName="Young Eagles Precious"
        onNotificationsPress={() => handleNavigate('notifications')}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={0}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tabs + Header */}
        <View style={[styles.headerSection, { backgroundColor: palette.surface }]}>
          <View style={[styles.tabRow, { borderColor: palette.outline }]}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'announcements' && styles.tabBtnActive]} onPress={() => setActiveTab('announcements')}>
              <Text style={[styles.tabText, { color: activeTab === 'announcements' ? '#3B82F6' : palette.textSecondary }]}>Announcements</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'events' && styles.tabBtnActive]} onPress={() => setActiveTab('events')}>
              <Text style={[styles.tabText, { color: activeTab === 'events' ? '#3B82F6' : palette.textSecondary }]}>Events</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.headerTitle, { color: palette.text }]}>
                {activeTab === 'announcements' ? '📢 Announcement Management' : '📅 Events Management'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
                {activeTab === 'announcements' ? 'Manage school communications and announcements' : 'Create and manage school events with media'}
                Manage school communications and announcements
              </Text>
            </View>
            {activeTab === 'announcements' ? (
              <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.createButton}>
                  <IconSymbol name="plus" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setShowEventModal(true)}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.createButton}>
                  <IconSymbol name="calendar.badge.plus" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {activeTab === 'announcements' && (
        <View style={[styles.statsSection, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>📊 Communication Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#3B82F615' }]}>
              <IconSymbol name="megaphone.fill" size={24} color="#3B82F6" />
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                {announcementsQuery.data?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Total Announcements</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#10B98115' }]}>
              <IconSymbol name="clock" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {announcementsQuery.data?.filter(a => {
                  const daysDiff = Math.ceil((new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  return daysDiff <= 7;
                }).length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: palette.textSecondary }]}>This Week</Text>
            </View>
          </View>
        </View>
        )}

        {/* Content */}
        {activeTab === 'announcements' ? (
        <View style={[styles.announcementsSection, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>📋 Recent Announcements</Text>
          
          {announcementsQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Loading announcements...</Text>
            </View>
          ) : announcementsQuery.data && announcementsQuery.data.length > 0 ? (
            <FlatList
              data={announcementsQuery.data}
              renderItem={renderAnnouncementCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
        ) : (
          <View style={[styles.announcementsSection, { backgroundColor: palette.surface }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>📅 School Events</Text>
            {eventsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Loading events...</Text>
              </View>
            ) : events && events.length > 0 ? (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <EnhancedEventCard
                    event={item as EnhancedEvent}
                    onPress={(ev) => {
                      try { router.push(`/screens/event-detail?id=${ev.id}` as any); } catch {}
                    }}
                    onParticipate={() => {}}
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="calendar" size={64} color={palette.textSecondary} />
                <Text style={[styles.emptyTitle, { color: palette.text }]}>No Events Yet</Text>
                <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>Create an event to get started</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => setShowEventModal(true)}>
                  <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.emptyButtonGradient}>
                    <IconSymbol name="calendar.badge.plus" size={20} color="#FFFFFF" />
                    <Text style={styles.emptyButtonText}>Create Event</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Modals */}
      <CreateAnnouncementModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPosted={() => {
          queryClient.invalidateQueries({ queryKey: ['announcements', profile?.preschool_id] });
        }}
      />
      <CreateEventModal
        visible={showEventModal}
        preschoolId={profile?.preschool_id || ''}
        createdByUserId={profile?.id || ''}
        onClose={() => setShowEventModal(false)}
        onCreated={() => {
          refreshEvents();
          setActiveTab('events');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    padding: 20,
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(59,130,246,0.10)'
  },
  tabText: {
    fontWeight: '700',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  announcementsSection: {
    padding: 20,
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  announcementCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardCreator: {
    fontSize: 12,
  },
  cardDate: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  cardDateText: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientTags: {
    flexDirection: 'row',
    gap: 8,
  },
  recipientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recipientTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatsText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnnouncementManagement;
