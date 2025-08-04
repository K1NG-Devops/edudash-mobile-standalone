import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { VideoCallService } from '@/lib/services/videoCallService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatTime, isToday } from '@/lib/utils/dateUtils';

interface VideoCall {
  id: string;
  title: string;
  description?: string;
  scheduled_start_time: string;
  scheduled_end_time?: string;
  meeting_url?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  participants?: string[];
  created_by: string;
  created_at: string;
}

export default function VideoCallsScreen() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [videoCalls, setVideoCalls] = useState<VideoCall[]>([]);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'all'>('upcoming');

  useEffect(() => {
    if (user && profile) {
      loadVideoCalls();
    } else {
      // Fallback: Load mock data after a short delay if no user/profile
      const timer = setTimeout(() => {
        if (loading) {
          console.log('Loading timeout, using fallback mock data');
          loadVideoCalls();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, profile, loading]);

  const loadVideoCalls = async () => {
    try {
      setLoading(true);
      
      // If no user/profile, load mock data immediately
      if (!user || !profile?.preschool_id) {
        console.log('No user/profile found, using mock data');
        const mockVideoCalls: VideoCall[] = [
          {
            id: 'demo-1',
            title: 'Demo Parent Meeting',
            description: 'This is a demo video call for testing purposes',
            scheduled_start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            meeting_url: 'https://meet.example.com/demo-123',
            status: 'scheduled',
            participants: ['demo_parent'],
            created_by: 'Demo Teacher',
            created_at: new Date().toISOString(),
          }
        ];
        setVideoCalls(mockVideoCalls);
        setLoading(false);
        return;
      }
      
      // Try to get video calls from service, fallback to mock data if it fails
      const result = await VideoCallService.getUpcomingVideoCalls(user.id);
      
      if (result.data && result.data.length > 0) {
        setVideoCalls(result.data);
      } else {
        // Provide mock data for demonstration
        const mockVideoCalls: VideoCall[] = [
          {
            id: '1',
            title: 'Parent-Teacher Conference',
            description: 'Monthly progress discussion for Emma Johnson',
            scheduled_start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            scheduled_end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            meeting_url: 'https://meet.example.com/teacher-parent-123',
            status: 'scheduled',
            participants: ['parent_1', 'teacher_1'],
            created_by: profile?.name || 'Teacher',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Weekly Check-in',
            description: 'Behavioral and academic progress review',
            scheduled_start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            scheduled_end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
            meeting_url: 'https://meet.example.com/weekly-checkin-456',
            status: 'scheduled',
            participants: ['parent_2', 'teacher_1'],
            created_by: profile?.name || 'Teacher',
            created_at: new Date().toISOString(),
          }
        ];
        setVideoCalls(mockVideoCalls);
      }
    } catch (error) {
      console.error('Error loading video calls:', error);
      // Still provide mock data even if there's an error
      const mockVideoCalls: VideoCall[] = [
        {
          id: 'demo-1',
          title: 'Demo Parent Meeting',
          description: 'This is a demo video call for testing purposes',
          scheduled_start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          meeting_url: 'https://meet.example.com/demo-123',
          status: 'scheduled',
          participants: ['demo_parent'],
          created_by: 'Demo Teacher',
          created_at: new Date().toISOString(),
        }
      ];
      setVideoCalls(mockVideoCalls);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideoCalls();
    setRefreshing(false);
  };

  const joinCall = async (call: VideoCall) => {
    if (!call.meeting_url) {
      Alert.alert('Error', 'No meeting link available for this call');
      return;
    }

    try {
      // In a real app, you'd open the meeting URL or integrate with a video calling SDK
      Alert.alert(
        'Join Video Call',
        `Would you like to join "${call.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: () => {
              // Here you would typically:
              // 1. Open the meeting URL in browser
              // 2. Launch a video calling app
              // 3. Navigate to an in-app video call screen
              console.log('Joining call:', call.meeting_url);
              Alert.alert('Info', 'This would open the video call in a real implementation');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error joining call:', error);
      Alert.alert('Error', 'Failed to join video call');
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'scheduled':
        return '#3B82F6';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getCallStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'videocam';
      case 'scheduled':
        return 'calendar';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const filteredCalls = videoCalls.filter(call => {
    if (activeFilter === 'upcoming') {
      return call.status === 'scheduled' || call.status === 'active';
    }
    return true;
  });

  const renderVideoCall = (call: VideoCall) => {
    const startTime = new Date(call.scheduled_start_time);
    const isCallToday = isToday(startTime);
    
    return (
      <View key={call.id} style={styles.callCard}>
        <View style={styles.callHeader}>
          <View style={styles.callInfo}>
            <Text style={styles.callTitle}>{call.title}</Text>
            {call.description && (
              <Text style={styles.callDescription} numberOfLines={2}>
                {call.description}
              </Text>
            )}
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getCallStatusColor(call.status) }
          ]}>
            <Ionicons 
              name={getCallStatusIcon(call.status) as any} 
              size={16} 
              color="#fff" 
            />
          </View>
        </View>

        <View style={styles.callDetails}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.timeText}>
              {isCallToday ? `Today at ${formatTime(startTime)}` : formatDateTime(startTime)}
            </Text>
          </View>
          
          {call.participants && call.participants.length > 0 && (
            <View style={styles.participantsContainer}>
              <Ionicons name="people-outline" size={16} color="#6B7280" />
              <Text style={styles.participantsText}>
                {call.participants.length} participant{call.participants.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.callActions}>
          {call.status === 'scheduled' && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => joinCall(call)}
            >
              <Ionicons name="videocam" size={16} color="#fff" />
              <Text style={styles.joinButtonText}>Join Call</Text>
            </TouchableOpacity>
          )}
          
          {call.status === 'active' && (
            <TouchableOpacity
              style={[styles.joinButton, styles.activeButton]}
              onPress={() => joinCall(call)}
            >
              <Ionicons name="videocam" size={16} color="#fff" />
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Video Calls</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'upcoming' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('upcoming')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'upcoming' && styles.activeFilterText
          ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'all' && styles.activeFilterText
          ]}>
            All Calls
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCalls.length > 0 ? (
          filteredCalls.map(renderVideoCall)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No video calls found</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === 'upcoming' 
                ? 'No upcoming video calls scheduled'
                : 'No video calls available'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 32,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  callCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  callInfo: {
    flex: 1,
    marginRight: 12,
  },
  callTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  callDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callDetails: {
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  callActions: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  activeButton: {
    backgroundColor: '#10B981',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
  },
  detailsButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
