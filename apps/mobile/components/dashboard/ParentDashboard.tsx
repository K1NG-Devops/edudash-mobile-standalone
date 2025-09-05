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
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { StudentDataService, EnhancedStudent, ParentDashboardData } from '@/lib/services/studentDataService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { shadow } from '@/lib/ui/shadow';
import { useT } from '@/i18n';

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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;
const isVerySmallScreen = screenWidth < 320;

const ParentDashboard: React.FC<ParentDashboardProps> = ({
  userId,
  userProfile,
  tenantName,
  onSignOut
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<EnhancedStudent | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todaysMood, setTodaysMood] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  const { t } = useT();

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
      // Removed debug statement: console.error('Error fetching parent dashboard data:', err);
      setError(t('errors.somethingWentWrong'));
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
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
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

  const timeAgo = (isoDate: string) => {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diff = Math.max(0, now - then);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('relative.justNow');
    if (minutes < 60) return t('relative.minutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('relative.hours', { count: hours });
    const days = Math.floor(hours / 24);
    return t('relative.days', { count: days });
  };

  // Navigation handlers
  const handleNavigate = (route: string) => {

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
        router.push(`/screens/homework${selectedChild ? `?childId=${selectedChild.id}` : ''}` as any);
        break;
      case 'activities':
        router.push('/(tabs)/activities');
        break;
      case 'calendar':
        router.push('/screens/lessons');
        break;
      case 'messages':
        router.push('/messages');
        break;
      default:

    }
  };

  // If loading initially, show a loading indicator
  if (loading && !refreshing && !dashboardData) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        {Platform.OS === 'android' && (
          <View style={{ height: insets.top, backgroundColor: palette.background }} />
        )}
        <MobileHeader
          user={userProfile}
          schoolName={tenantName}
          onNotificationsPress={() => {/* TODO: Implement notifications */}}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
          actionsPlacement="below"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>{t('dashboard.loading')}</Text>
        </View>
      </View>
    );
  }

  // If there's an error, show error message
  if (error && !loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        {Platform.OS === 'android' && (
          <View style={{ height: insets.top, backgroundColor: palette.background }} />
        )}
        <MobileHeader
          user={userProfile}
          schoolName={tenantName}
          onNotificationsPress={() => {/* TODO: Implement notifications */}}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
          actionsPlacement="below"
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EA4335" />
          <Text style={[styles.errorTitle, { color: palette.text }]}>{t('errors.somethingWentWrong')}</Text>
          <Text style={[styles.errorMessage, { color: palette.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>{t('errors.tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {Platform.OS === 'android' && (
        <View style={{ height: insets.top, backgroundColor: palette.background }} />
      )}
      
      <MobileHeader
        user={userProfile}
        schoolName={tenantName}
        onNotificationsPress={() => {/* TODO: Implement notifications */}}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={dashboardData?.recent_updates.length || 0}
        actionsPlacement="below"
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4285F4']} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(100, insets.bottom + 80) }
        ]}
      >
        {/* Modern Header Section */}
        <View style={[
          styles.modernHeaderSection,
          { 
            paddingLeft: Math.max(12, insets.left + (isSmallScreen ? 12 : 16)),
            paddingRight: Math.max(12, insets.right + (isSmallScreen ? 12 : 16))
          }
        ]}>
          <View style={styles.titleSection}>
            <Text style={[
              styles.modernTitle, 
              { 
                color: palette.text,
                fontSize: isVerySmallScreen ? 24 : isSmallScreen ? 28 : 32,
                lineHeight: isVerySmallScreen ? 30 : isSmallScreen ? 34 : 40,
              }
            ]}>
              {getGreeting()} 👋
            </Text>
            <Text style={[
              styles.modernSubtitle, 
              { 
                color: palette.textSecondary,
                fontSize: isSmallScreen ? 13 : 14,
              }
            ]}>
              {selectedChild 
                ? t('dashboard.parent.seeHowChildDoing', { name: selectedChild.first_name })
                : t('dashboard.parent.welcome')}
            </Text>
            {tenantName && (
              <View style={[
                styles.tenantBadge,
                { backgroundColor: isDark ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.1)' }
              ]}>
                <Text style={[styles.tenantLabel, { color: '#4285F4' }]} numberOfLines={1} ellipsizeMode="tail">🏫 {tenantName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Child Selector Card */}
        {selectedChild ? (
          <TouchableOpacity 
            style={[
              styles.childSelectorCard,
              { marginHorizontal: isSmallScreen ? 12 : 16 }
            ]}
            onPress={() => setShowChildSelector(!showChildSelector)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#4285F4', '#5E9BFF', '#7EB0FF']}
              style={[
                styles.childCard,
                { 
                  borderRadius: isSmallScreen ? 10 : 12,
                  padding: isSmallScreen ? 16 : 20
                }
              ]}
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
                    🎂 {t('age.years', { count: selectedChild.age })}
                  </Text>
                  <Text style={styles.childDetails}>
                    👩‍🏫 {selectedChild.teacher_name || t('dashboard.parent.noTeacherAssigned')}
                  </Text>
                </View>
                <View style={styles.childEmoji}>
                  <Text style={styles.emojiLarge}>👤</Text>
                </View>
              </View>
              
              <View style={styles.childCardFooter}>
                <View style={styles.childBadge}>
                  <Text style={styles.childBadgeText}>{selectedChild.class_name || selectedChild.age_group_name || t('common.unassigned')}</Text>
                </View>
                <View style={styles.attendanceButton}>
                  <Text style={styles.attendanceText}>{t('education.attendance')}: {selectedChild.attendance_percentage}%</Text>
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
                    <Text style={styles.emptyStateTitle}>{t('common.loading')}</Text>
                    <Text style={styles.emptyStateText}>{t('dashboard.loading')}</Text>
                  </>
                ) : dashboardData && dashboardData.children.length === 0 ? (
                  <>
                    <Text style={styles.emptyStateTitle}>{t('dashboard.parent.noChildrenTitle')}</Text>
                    <Text style={styles.emptyStateText}>{t('dashboard.parent.noChildrenDescription')}</Text>
                    <TouchableOpacity 
                      style={styles.registerButton}
                      onPress={() => router.push('/(tabs)/register')}
                    >
                      <Text style={styles.registerButtonText}>{t('dashboard.parent.registerChild')}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyStateTitle}>{t('dashboard.parent.welcome')}</Text>
                    <Text style={styles.emptyStateText}>{t('dashboard.loading')}</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Child Selector Dropdown */}
        {showChildSelector && dashboardData && dashboardData.children.length > 1 && (
            <View style={[styles.childDropdown, { backgroundColor: palette.surface }]}>
            {dashboardData.children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childDropdownItem,
                  { borderBottomColor: palette.outline },
                  child.id === selectedChildId && styles.childDropdownItemSelected
                ]}
                onPress={() => handleSelectChild(child.id)}
              >
                <View style={styles.childDropdownEmoji}>
                  <Text style={styles.childDropdownEmojiText}>👤</Text>
                </View>
                <View style={styles.childDropdownInfo}>
                  <Text style={[styles.childDropdownName, { color: palette.text }]}>{child.full_name}</Text>
                  <Text style={[styles.childDropdownDetails, { color: palette.textSecondary }]}>
                    {t('age.years', { count: child.age })} • {child.class_name || child.age_group_name || t('common.unassigned')} • {child.teacher_name || t('dashboard.parent.noTeacher')}
                  </Text>
                </View>
                {child.id === selectedChildId && (
                  <IconSymbol name="checkmark" size={16} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Horizontal Scrollable Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[
            styles.sectionTitle,
            { 
              color: palette.text,
              fontSize: isSmallScreen ? 16 : 18,
              marginHorizontal: isSmallScreen ? 12 : 16
            }
          ]}>
            {t('dashboard.quickActions')}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.quickActionsScrollContent,
              { paddingHorizontal: isSmallScreen ? 12 : 16 }
            ]}
            style={styles.quickActionsContainer}
          >
            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
                  borderColor: isDark ? palette.border : '#E8EAED',
                  paddingHorizontal: isSmallScreen ? 14 : 16,
                  paddingVertical: isSmallScreen ? 8 : 10,
                }
              ]}
              onPress={() => handleQuickAction('calendar')}
              activeOpacity={0.7}
            >
              <IconSymbol name="book.fill" size={isSmallScreen ? 14 : 16} color="#34A853" />
              <Text style={[
                styles.quickActionText,
                { 
                  color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
]}>{t('education.lessons')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
                  borderColor: isDark ? palette.border : '#E8EAED',
                  paddingHorizontal: isSmallScreen ? 14 : 16,
                  paddingVertical: isSmallScreen ? 8 : 10,
                }
              ]}
              onPress={() => handleQuickAction('homework')}
              activeOpacity={0.7}
            >
              <IconSymbol name="doc.text.fill" size={isSmallScreen ? 14 : 16} color="#EA4335" />
              <Text style={[
                styles.quickActionText,
                { 
                  color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
]}>{t('education.homework')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
                  borderColor: isDark ? palette.border : '#E8EAED',
                  paddingHorizontal: isSmallScreen ? 14 : 16,
                  paddingVertical: isSmallScreen ? 8 : 10,
                }
              ]}
              onPress={() => handleQuickAction('activities')}
              activeOpacity={0.7}
            >
              <IconSymbol name="gamecontroller.fill" size={isSmallScreen ? 14 : 16} color="#FBBC05" />
              <Text style={[
                styles.quickActionText,
                { 
                  color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
]}>{t('education.activities')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
                  borderColor: isDark ? palette.border : '#E8EAED',
                  paddingHorizontal: isSmallScreen ? 14 : 16,
                  paddingVertical: isSmallScreen ? 8 : 10,
                }
              ]}
              onPress={() => handleQuickAction('messages')}
              activeOpacity={0.7}
            >
              <IconSymbol name="message.fill" size={isSmallScreen ? 14 : 16} color="#4285F4" />
              <Text style={[
                styles.quickActionText,
                { 
                  color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
]}>{t('nav.messages')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
                  borderColor: isDark ? palette.border : '#E8EAED',
                  paddingHorizontal: isSmallScreen ? 14 : 16,
                  paddingVertical: isSmallScreen ? 8 : 10,
                }
              ]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <IconSymbol name="person.fill" size={isSmallScreen ? 14 : 16} color="#6366F1" />
              <Text style={[
                styles.quickActionText,
                { 
                  color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
]}>{t('nav.profile')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Key Metrics Section - Only show for selected child */}
        {selectedChild && (
          <View style={styles.metricsSection}>
            <View style={styles.metricsRow}>
              <TouchableOpacity style={[styles.metricCard, { backgroundColor: palette.surface }]}>
                <View style={styles.metricContent}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.metricIconContainer}
                  >
                    <IconSymbol name="figure.run" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.metricValue, { color: palette.text }]}>{selectedChild.completed_activities || 0}</Text>
                  <Text style={[styles.metricTitle, { color: palette.textSecondary }]}>{t('education.activities')}</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.metricCard, { backgroundColor: palette.surface }]}>
                <View style={styles.metricContent}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.metricIconContainer}
                  >
                    <IconSymbol name="doc.text" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.metricValue, { color: palette.text }]}>{selectedChild.pending_homework || 0}</Text>
                  <Text style={[styles.metricTitle, { color: palette.textSecondary }]}>{t('dashboard.cards.pending')}</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.metricCard, { backgroundColor: palette.surface }]}>
                <View style={styles.metricContent}>
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    style={styles.metricIconContainer}
                  >
                    <IconSymbol name="checkmark.circle" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.metricValue, { color: palette.text }]}>{selectedChild.attendance_percentage}%</Text>
                  <Text style={[styles.metricTitle, { color: palette.textSecondary }]}>{t('education.attendance')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Activity for selected child */}
        {selectedChild && dashboardData && dashboardData.recent_updates && (
          <View style={styles.activitySection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>🕒 {t('dashboard.recentActivity')}</Text>
            {dashboardData.recent_updates
              .filter((u) => !selectedChild || u.student_id === selectedChild.id)
              .slice(0, 5)
              .map((u) => (
                <View key={u.id} style={[styles.activityItemRow, { backgroundColor: palette.surface }] }>
                  <View style={styles.activityIconWrap}>
                    <IconSymbol
                      name={u.icon as any}
                      size={16}
                      color={u.type === 'homework' ? '#3B82F6' : u.type === 'activity' ? '#10B981' : '#8B5CF6'}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitleText, { color: palette.text }]}>{u.title}</Text>
                    <Text style={[styles.activityDescText, { color: palette.textSecondary }]}>{u.description}</Text>
                  </View>
                  <Text style={[styles.activityTimeText, { color: palette.textSecondary }]}>{timeAgo(u.timestamp)}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Recent Achievements - Only show if there are achievements */}
        {selectedChild && selectedChild.recent_achievements && selectedChild.recent_achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>🏆 {t('dashboard.achievements.recent')}</Text>
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
            <Text style={[styles.sectionTitle, { color: palette.text }]}>📢 {t('dashboard.updates.recent')}</Text>
            {dashboardData.recent_updates.slice(0, 3).map((update) => (
              <TouchableOpacity key={update.id} style={[styles.updateItem, { backgroundColor: palette.surface }] }>
                <View style={styles.updateIcon}>
                  <IconSymbol name={update.icon as any} size={16} color="#3B82F6" />
                </View>
                <View style={styles.updateContent}>
                  <Text style={[styles.updateTitle, { color: palette.text }]}>{update.title}</Text>
                  <Text style={[styles.updateDescription, { color: palette.textSecondary }]}>{update.description}</Text>
                  <Text style={[styles.updateTimestamp, { color: palette.textSecondary }]}>{new Date(update.timestamp).toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Upcoming Events */}
        {dashboardData && dashboardData.upcoming_events.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>📅 {t('dashboard.upcomingEvents')}</Text>
            {dashboardData.upcoming_events.slice(0, 3).map((event) => (
              <TouchableOpacity key={event.id} style={[styles.eventItem, { backgroundColor: palette.surface }]}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDateText}>{event.date}</Text>
                  <Text style={[styles.eventTimeText, { color: palette.textSecondary }]}>{event.time}</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, { color: palette.text }]}>{event.title}</Text>
                  {event.location && (
                    <Text style={[styles.eventLocation, { color: palette.textSecondary }]}>📍 {event.location}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Today's Mood Card - Only show for selected child */}
        {selectedChild && (
          <View style={[styles.moodCard, { backgroundColor: palette.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{t('dashboard.mood.today')}</Text>
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
          <View style={[styles.progressCard, { backgroundColor: palette.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{t('dashboard.progress.weekly')}</Text>
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
    paddingBottom: 100, // Dynamic padding added in component
  },
  
  // Modern Header Section - Google Style
  modernHeaderSection: {
    paddingHorizontal: 4,
    paddingVertical: 20,
    marginBottom: 8,
  },
  titleSection: {
    marginBottom: 20,
  },
  modernTitle: {
    fontSize: 32, // Responsive in component
    fontWeight: '300', // Light weight for Google style
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 8,
    color: '#1F2937',
  },
  modernSubtitle: {
    fontSize: 14, // Responsive in component
    lineHeight: 20,
    opacity: 0.7,
    color: '#6B7280',
  },
  tenantBadge: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  tenantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
  },
  // Child Selector Card - Updated with responsive design
  childSelectorCard: {
    marginHorizontal: 16, // Responsive in component
    marginBottom: 16,
  },
  childCard: {
    borderRadius: 12, // Responsive in component
    padding: 20, // Responsive in component
    minHeight: 140,
    ...shadow(3),
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20, // Pill shape
  },
  childBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  attendanceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20, // Pill shape
  },
  attendanceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  // Quick Actions - Horizontal Scrollable Google-style Chips
  quickActionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18, // Responsive in component
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  quickActionsContainer: {
    flexGrow: 0,
  },
  quickActionsScrollContent: {
    paddingRight: 20,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // Responsive in component
    paddingVertical: 10, // Responsive in component
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Pill shape
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 44, // Accessibility
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 14, // Responsive in component
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
  },
  moodCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    ...shadow(3),
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    ...shadow(3),
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
  // Metrics Section - Google-style with responsive design
  metricsSection: {
    marginHorizontal: 16, // Responsive in component
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: 12, // Responsive in component
    rowGap: 12, // Responsive in component
  },
  metricCard: {
    width: '48%',
    minWidth: 160, // Responsive in component
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Responsive in component
    padding: 16, // Responsive in component
    marginBottom: 0, // Using gap instead
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricCardTopBorder: {
    borderTopWidth: 3, // Responsive in component
  },
  metricContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIcon: {
    width: 40, // Responsive in component
    height: 40, // Responsive in component
    borderRadius: 20, // Responsive in component
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, // Responsive in component
    // backgroundColor set dynamically with 20% opacity
  },
  metricValue: {
    fontSize: 20, // Responsive in component
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
    color: '#1F2937',
  },
  metricTitle: {
    fontSize: 13, // Responsive in component
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    color: '#6B7280',
  },
  metricSubtitle: {
    fontSize: 11, // Responsive in component
    textAlign: 'center',
    color: '#9CA3AF',
  },
  achievementsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
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
    ...shadow(2),
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
  // Activity Section - Google-style cards
  activitySection: {
    marginHorizontal: 16, // Responsive in component
    marginBottom: 20,
  },
  sectionCard: {
    marginBottom: 16, // Responsive in component
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Responsive in component
    padding: 20, // Responsive in component
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // Responsive in component
    paddingVertical: 12, // Responsive in component
  },
  activityIconWrap: {
    width: 36, // Responsive in component
    height: 36, // Responsive in component
    borderRadius: 18, // Responsive in component
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitleText: {
    fontSize: 14, // Responsive in component
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityDescText: {
    fontSize: 12, // Responsive in component
    color: '#6B7280',
  },
  activityTimeText: {
    fontSize: 11, // Responsive in component
    color: '#9CA3AF',
    marginLeft: 8,
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
    ...shadow(2),
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
  // Child dropdown styles - Google Material Design
  childDropdown: {
    marginHorizontal: 16, // Responsive in component
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  childDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  childDropdownItemSelected: {
    backgroundColor: 'rgba(66, 133, 244, 0.08)',
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
  // Loading and Error states - Google Material Design
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#5F6368', // Google Grey
    marginTop: 16,
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#202124',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4', // Google Blue
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24, // Pill shape
    elevation: 2,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  // Register button - Google Material Design
  registerButton: {
    backgroundColor: '#34A853', // Google Green
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24, // Pill shape
    elevation: 2,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
});

export default ParentDashboard;
