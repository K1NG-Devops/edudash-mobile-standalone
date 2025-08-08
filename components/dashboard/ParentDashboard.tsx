/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { StudentDataService, EnhancedStudent, ParentDashboardData } from '@/lib/services/studentDataService';

interface ParentDashboardProps {
  userId: string;
  userProfile: {
    name: string;
    role: string;
    avatar?: string | null;
  };
  tenantName?: string;
  onSignOut: () => Promise<void>;
}

const { width: screenWidth } = Dimensions.get('window');

const ParentDashboard: React.FC<ParentDashboardProps> = ({
  userId,
  userProfile,
  tenantName,
  onSignOut
}) => {
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<EnhancedStudent | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todaysMood, setTodaysMood] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await StudentDataService.getParentDashboardData(userId);
      setDashboardData(data);

      if (data.children.length > 0) {
        // If no child is selected or the previously selected child is not in the list,
        // select the first child
        if (!selectedChildId || !data.children.find(c => c.id === selectedChildId)) {
          setSelectedChildId(data.children[0].id);
          setSelectedChild(data.children[0]);
          
          // Get student progress for the selected child
          const progress = await StudentDataService.getStudentProgress(data.children[0].id);
          if (progress) {
            // Get the most recent mood rating
            const latestMood = progress.mood_ratings.length > 0 
              ? progress.mood_ratings[progress.mood_ratings.length - 1].rating 
              : 0;
            
            setTodaysMood(latestMood);
            setWeeklyProgress(progress.weekly_progress);
          }
        } else {
          // Update the selected child data with fresh data
          const child = data.children.find(c => c.id === selectedChildId);
          if (child) {
            setSelectedChild(child);
            
            // Get student progress for the selected child
            const progress = await StudentDataService.getStudentProgress(child.id);
            if (progress) {
              const latestMood = progress.mood_ratings.length > 0 
                ? progress.mood_ratings[progress.mood_ratings.length - 1].rating 
                : 0;
              
              setTodaysMood(latestMood);
              setWeeklyProgress(progress.weekly_progress);
            }
          }
        }
      } else {
        setSelectedChildId(null);
        setSelectedChild(null);
      }
    } catch (err) {
      console.error('Error fetching parent dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  // Handle child selection
  const handleSelectChild = async (childId: string) => {
    setSelectedChildId(childId);
    setShowChildSelector(false);

    if (dashboardData) {
      const child = dashboardData.children.find(c => c.id === childId);
      if (child) {
        setSelectedChild(child);
        
        // Get student progress for the selected child
        const progress = await StudentDataService.getStudentProgress(child.id);
        if (progress) {
          const latestMood = progress.mood_ratings.length > 0 
            ? progress.mood_ratings[progress.mood_ratings.length - 1].rating 
            : 0;
          
          setTodaysMood(latestMood);
          setWeeklyProgress(progress.weekly_progress);
        }
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <IconSymbol
        key={i}
        name={i < rating ? "star.fill" : "star"}
        size={20}
        color={i < rating ? "#F59E0B" : "#E5E7EB"}
      />
    ));
  };

  // Navigation handlers
  const handleNavigate = (route: string) => {
    console.log('Navigating to:', route);
    if (route.startsWith('/(tabs)')) {
      router.push(route as any);
    } else if (route.startsWith('/')) {
      const screenName = route.substring(1);
      router.push(`/screens/${screenName}` as any);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'home':
        router.push('/(tabs)/dashboard');
        break;
      case 'homework':
        router.push('/screens/homework' as any);
        break;
      case 'activities':
        router.push('/(tabs)/activities');
        break;
      case 'calendar':
        router.push('/(tabs)/lessons');
        break;
      case 'messages':
        router.push('/(tabs)/messages');
        break;
      default:
        console.log(`Quick action: ${action}`);
    }
  };

  // If loading initially, show a loading indicator
  if (loading && !refreshing && !dashboardData) {
    return (
      <View style={styles.container}>
        <MobileHeader
          user={userProfile}
          schoolName={tenantName}
          onNotificationsPress={() => console.log('Notifications')}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

  // If there's an error, show error message
  if (error && !loading && !refreshing) {
    return (
      <View style={styles.container}>
        <MobileHeader
          user={userProfile}
          schoolName={tenantName}
          onNotificationsPress={() => console.log('Notifications')}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mobile Header */}
      <MobileHeader
        user={userProfile}
        schoolName={tenantName}
        onNotificationsPress={() => console.log('Notifications')}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={dashboardData?.recent_updates.length || 0}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Text */}
        <View style={styles.headerTextSection}>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.subtitle}>
            {selectedChild 
              ? `Let's see how ${selectedChild.first_name} is doing today`
              : 'Welcome to your dashboard'}
          </Text>
          {tenantName && (
            <View style={styles.tenantInfo}>
              <Text style={styles.tenantLabel}>🏫 {tenantName}</Text>
            </View>
          )}
        </View>

        {/* Child Selector Card or Empty State */}
        {selectedChild ? (
          <TouchableOpacity 
            style={styles.childSelectorCard}
            onPress={() => setShowChildSelector(!showChildSelector)}
          >
            <LinearGradient
              colors={['#8B5CF6', '#A855F7', '#C084FC']}
              style={styles.childCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.childCardHeader}>
                <View style={styles.childInfo}>
                  <View style={styles.childNameRow}>
                    <Text style={styles.childName}>{selectedChild.full_name}</Text>
                    {dashboardData && dashboardData.children.length > 1 && (
                      <IconSymbol 
                        name="chevron.down" 
                        size={20} 
                        color="rgba(255, 255, 255, 0.8)" 
                      />
                    )}
                  </View>
                  <Text style={styles.childDetails}>
                    🎂 {selectedChild.age} years old
                  </Text>
                  <Text style={styles.childDetails}>
                    👩‍🏫 {selectedChild.teacher_name || 'No Teacher Assigned'}
                  </Text>
                </View>
                <View style={styles.childEmoji}>
                  <Text style={styles.emojiLarge}>👤</Text>
                </View>
              </View>
              
              <View style={styles.childCardFooter}>
                <View style={styles.childBadge}>
                  <Text style={styles.childBadgeText}>{selectedChild.class_name || selectedChild.age_group_name || 'Unassigned'}</Text>
                </View>
                <View style={styles.attendanceButton}>
                  <Text style={styles.attendanceText}>Attendance: {selectedChild.attendance_percentage}%</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyStateCard}>
            <LinearGradient
              colors={['#F3F4F6', '#E5E7EB', '#D1D5DB']}
              style={styles.childCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.emptyStateContent}>
                {loading ? (
                  <>
                    <Text style={styles.emptyStateTitle}>Loading...</Text>
                    <Text style={styles.emptyStateText}>Fetching your child's information</Text>
                  </>
                ) : dashboardData && dashboardData.children.length === 0 ? (
                  <>
                    <Text style={styles.emptyStateTitle}>No Children Found</Text>
                    <Text style={styles.emptyStateText}>You don't have any children registered</Text>
                    <TouchableOpacity 
                      style={styles.registerButton}
                      onPress={() => router.push('/(tabs)/register')}
                    >
                      <Text style={styles.registerButtonText}>Register a Child</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyStateTitle}>Welcome!</Text>
                    <Text style={styles.emptyStateText}>Setting up your dashboard...</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Child Selector Dropdown */}
        {showChildSelector && dashboardData && dashboardData.children.length > 1 && (
          <View style={styles.childDropdown}>
            {dashboardData.children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childDropdownItem,
                  child.id === selectedChildId && styles.childDropdownItemSelected
                ]}
                onPress={() => handleSelectChild(child.id)}
              >
                <View style={styles.childDropdownEmoji}>
                  <Text style={styles.childDropdownEmojiText}>👤</Text>
                </View>
                <View style={styles.childDropdownInfo}>
                  <Text style={styles.childDropdownName}>{child.full_name}</Text>
                  <Text style={styles.childDropdownDetails}>
                    {child.age} years • {child.class_name || child.age_group_name || 'Unassigned'} • {child.teacher_name || 'No Teacher'}
                  </Text>
                </View>
                {child.id === selectedChildId && (
                  <IconSymbol name="checkmark" size={16} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleQuickAction('home')}
          >
            <View style={styles.quickActionIcon}>
              <IconSymbol name="house.fill" size={24} color="#6B7280" />
            </View>
            <Text style={styles.quickActionLabel}>
              Home
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleQuickAction('homework')}
          >
            <View style={styles.quickActionIcon}>
              <IconSymbol name="doc.text.fill" size={24} color="#6B7280" />
            </View>
            <Text style={styles.quickActionLabel}>
              Homework
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleQuickAction('activities')}
          >
            <View style={styles.quickActionIcon}>
              <IconSymbol name="location.fill" size={24} color="#6B7280" />
            </View>
            <Text style={styles.quickActionLabel}>
              Activities
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleQuickAction('calendar')}
          >
            <View style={styles.quickActionIcon}>
              <IconSymbol name="calendar" size={24} color="#6B7280" />
            </View>
            <Text style={styles.quickActionLabel}>
              Lessons
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleQuickAction('messages')}
          >
            <View style={styles.quickActionIcon}>
              <IconSymbol name="message.fill" size={24} color="#6B7280" />
            </View>
            <Text style={styles.quickActionLabel}>
              Messages
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics Section - Only show for selected child */}
        {selectedChild && (
          <View style={styles.metricsSection}>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{selectedChild.completed_activities || 0}</Text>
                <Text style={styles.metricTitle}>Activities</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{selectedChild.pending_homework || 0}</Text>
                <Text style={styles.metricTitle}>Pending Tasks</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{selectedChild.attendance_percentage}%</Text>
                <Text style={styles.metricTitle}>Attendance</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Achievements - Only show if there are achievements */}
        {selectedChild && selectedChild.recent_achievements && selectedChild.recent_achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🏆 Recent Achievements</Text>
            <View style={styles.achievementsList}>
              {selectedChild.recent_achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementBadge}>
                  <Text style={styles.achievementText}>{achievement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Updates */}
        {dashboardData && dashboardData.recent_updates.length > 0 && (
          <View style={styles.updatesSection}>
            <Text style={styles.sectionTitle}>📢 Recent Updates</Text>
            {dashboardData.recent_updates.slice(0, 3).map((update) => (
              <TouchableOpacity key={update.id} style={styles.updateItem}>
                <View style={styles.updateIcon}>
                  <IconSymbol name={update.icon as any} size={16} color="#3B82F6" />
                </View>
                <View style={styles.updateContent}>
                  <Text style={styles.updateTitle}>{update.title}</Text>
                  <Text style={styles.updateDescription}>{update.description}</Text>
                  <Text style={styles.updateTimestamp}>{new Date(update.timestamp).toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Upcoming Events */}
        {dashboardData && dashboardData.upcoming_events.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
            {dashboardData.upcoming_events.slice(0, 3).map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventItem}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDateText}>{event.date}</Text>
                  <Text style={styles.eventTimeText}>{event.time}</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.location && (
                    <Text style={styles.eventLocation}>📍 {event.location}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Today's Mood Card - Only show for selected child */}
        {selectedChild && (
          <View style={styles.moodCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's Mood</Text>
              <TouchableOpacity>
                <IconSymbol name="heart.fill" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View style={styles.starsContainer}>
              {renderStars(todaysMood)}
            </View>
          </View>
        )}

        {/* Weekly Progress Card - Only show for selected child */}
        {selectedChild && (
          <View style={styles.progressCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Weekly Progress</Text>
              <View style={styles.progressTrend}>
                <IconSymbol name="arrow.up.right" size={16} color="#10B981" />
                <Text style={styles.progressPercentage}>{weeklyProgress}%</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${weeklyProgress}%` }]} />
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  headerTextSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  childSelectorCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  childCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 160,
  },
  childCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  childDetails: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  childEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiLarge: {
    fontSize: 32,
  },
  childCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  childBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  attendanceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  attendanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  progressTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  bottomSpacing: {
    height: 20,
  },
  // New styles for enhanced features
  metricsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  achievementsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  achievementText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  // Updates section styles
  updatesSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  updateItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  updateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  updateDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  updateTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  // Events section styles
  eventsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventDate: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  eventDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  eventTimeText: {
    fontSize: 11,
    color: '#6B7280',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Child dropdown styles
  childDropdown: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  childDropdownItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  childDropdownEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childDropdownEmojiText: {
    fontSize: 20,
  },
  childDropdownInfo: {
    flex: 1,
  },
  childDropdownName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  childDropdownDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Quick action label style
  quickActionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  // Empty state styles
  emptyStateCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Register button
  registerButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tenant info
  tenantInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  tenantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
});

export default ParentDashboard;
