/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
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
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface GoogleStyleParentDashboardProps {
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

const GoogleStyleParentDashboard: React.FC<GoogleStyleParentDashboardProps> = ({
  userId,
  userProfile,
  tenantName,
  onSignOut
}) => {
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    headerSection: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 16,
      backgroundColor: palette.surface,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '400',
      color: palette.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: palette.textSecondary,
      lineHeight: 24,
      fontWeight: '400',
    },
    childCardContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    childCard: {
      borderRadius: 12,
      padding: 24,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
      fontWeight: '500',
      color: '#FFFFFF',
      marginBottom: 6,
    },
    childDetails: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.87)',
      marginBottom: 4,
    },
    childAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    childInitial: {
      fontSize: 20,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    childCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    moodSection: {
      flex: 1,
    },
    moodLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 4,
    },
    starsContainer: {
      flexDirection: 'row',
      gap: 2,
    },
    viewMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 4,
    },
    viewMoreText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
    quickActionsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: palette.text,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      minHeight: 88,
      justifyContent: 'center',
    },
    quickActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    quickActionLabel: {
      fontSize: 12,
      color: palette.textSecondary,
      fontWeight: '400',
      textAlign: 'center',
    },
    metricsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    metricsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    metricCard: {
      flex: 1,
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      minHeight: 88,
      justifyContent: 'center',
    },
    metricIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: '500',
      color: palette.text,
      marginBottom: 2,
    },
    metricLabel: {
      fontSize: 11,
      color: palette.textSecondary,
      textAlign: 'center',
      fontWeight: '400',
    },
    activityContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    activityList: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: palette.outline,
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '400',
      color: palette.text,
      marginBottom: 2,
    },
    activityTime: {
      fontSize: 12,
      color: palette.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: palette.textSecondary,
      fontWeight: '400',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.background,
      paddingHorizontal: 24,
    },
    errorText: {
      fontSize: 14,
      color: '#EA4335',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    retryButton: {
      backgroundColor: '#4285F4',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      elevation: 2,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
      letterSpacing: 0.25,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.background,
      paddingHorizontal: 24,
    },
    emptyStateIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: palette.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '400',
      color: palette.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      fontWeight: '400',
    },
  }), [colorScheme]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<EnhancedStudent | null>(null);
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
        if (!selectedChildId || !data.children.find(c => c.id === selectedChildId)) {
          setSelectedChildId(data.children[0].id);
          setSelectedChild(data.children[0]);
          
          const progress = await StudentDataService.getStudentProgress(data.children[0].id);
          if (progress) {
            const latestMood = progress.mood_ratings.length > 0 
              ? progress.mood_ratings[progress.mood_ratings.length - 1].rating 
              : 0;
            
            setTodaysMood(latestMood);
            setWeeklyProgress(progress.weekly_progress);
          }
        } else {
          const child = data.children.find(c => c.id === selectedChildId);
          if (child) {
            setSelectedChild(child);
            
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
      // Removed debug statement: console.error('Error fetching parent dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleQuickAction = (action: string) => {
    // Add navigation logic here
  };

  const renderMoodStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IconSymbol
          key={i}
          name="star.fill"
          size={16}
          color={i <= rating ? '#FBBC04' : '#E8EAED'}
        />
      );
    }
    return stars;
  };

  const renderQuickActions = () => {
    const actions = [
      { id: 'homework', icon: 'doc.text.fill', label: 'Homework', color: '#EA4335' },
      { id: 'activities', icon: 'gamecontroller.fill', label: 'Activities', color: '#FBBC04' },
      { id: 'lessons', icon: 'book.fill', label: 'Lessons', color: '#34A853' },
      { id: 'calendar', icon: 'calendar', label: 'Calendar', color: '#4285F4' },
    ];

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickActionsGrid}>
          {actions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => handleQuickAction(action.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <IconSymbol name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderMetrics = () => {
    const metrics = [
      { label: 'Attendance', value: '95%', icon: 'checkmark.circle.fill', color: '#34A853' },
      { label: 'Assignments', value: '8/10', icon: 'doc.text.fill', color: '#4285F4' },
      { label: 'Activities', value: '12', icon: 'star.fill', color: '#FBBC04' },
      { label: 'Progress', value: `${weeklyProgress}%`, icon: 'chart.line.uptrend.xyaxis', color: '#EA4335' },
    ];

    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>This week</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.color}15` }]}>
                <IconSymbol name={metric.icon} size={20} color={metric.color} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderChildCard = () => {
    if (!selectedChild) return null;

    const gradientColors = ['#4285F4', '#34A853']; // Google blue to green

    return (
      <View style={styles.childCardContainer}>
        <LinearGradient colors={gradientColors} style={styles.childCard}>
          <View style={styles.childCardHeader}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{selectedChild.name}</Text>
              <Text style={styles.childDetails}>Grade {selectedChild.grade || 'Pre-K'}</Text>
              <Text style={styles.childDetails}>Teacher: {selectedChild.teacher_name || 'Not assigned'}</Text>
            </View>
            <View style={styles.childAvatar}>
              <Text style={styles.childInitial}>{selectedChild.name.charAt(0)}</Text>
            </View>
          </View>
          <View style={styles.childCardFooter}>
            <View style={styles.moodSection}>
              <Text style={styles.moodLabel}>Today's mood</Text>
              <View style={styles.starsContainer}>
                {renderMoodStars(todaysMood)}
              </View>
            </View>
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>View details</Text>
              <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderRecentActivity = () => {
    const activities = [
      { title: 'Math worksheet completed', time: '2 hours ago', icon: 'checkmark.circle.fill', color: '#34A853' },
      { title: 'Art project submitted', time: '1 day ago', icon: 'paintbrush.fill', color: '#FBBC04' },
      { title: 'Reading assignment due', time: '2 days ago', icon: 'book.fill', color: '#EA4335' },
    ];

    return (
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <View style={styles.activityList}>
          {activities.map((activity, index) => (
            <TouchableOpacity key={index} style={styles.activityItem} activeOpacity={0.7}>
              <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                <IconSymbol name={activity.icon} size={16} color={activity.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#9AA0A6" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dashboardData || dashboardData.children.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIcon}>
          <IconSymbol name="person.badge.plus" size={32} color="#9AA0A6" />
        </View>
        <Text style={styles.emptyStateTitle}>No children enrolled</Text>
        <Text style={styles.emptyStateText}>
          Contact your school administrator to enroll your child in the system.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobileHeader
        user={{
          name: userProfile.name,
          role: 'parent',
          avatar: userProfile.avatar,
        }}
        schoolName={tenantName}
        onNotificationsPress={() => {}}
        onSignOut={onSignOut}
        onNavigate={(route) => router.push(route as any)}
        notificationCount={0}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4285F4']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>Good morning, {userProfile.name.split(' ')[0]}</Text>
          <Text style={styles.subtitle}>Here's what's happening with your child today</Text>
        </View>

        {/* Child Card */}
        {renderChildCard()}

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Metrics */}
        {renderMetrics()}

        {/* Recent Activity */}
        {renderRecentActivity()}
      </ScrollView>
    </View>
  );
};

export default GoogleStyleParentDashboard;

/*
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Google's background color
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '400',
    color: '#202124',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5F6368',
    lineHeight: 24,
    fontWeight: '400',
  },
  childCardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  childCard: {
    borderRadius: 12,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  childDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.87)',
    marginBottom: 4,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInitial: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  childCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodSection: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  viewMoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 88,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#5F6368',
    fontWeight: '400',
    textAlign: 'center',
  },
  metricsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 88,
    justifyContent: 'center',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#5F6368',
    textAlign: 'center',
    fontWeight: '400',
  },
  activityContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#202124',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#5F6368',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EA4335',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#202124',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
*/
