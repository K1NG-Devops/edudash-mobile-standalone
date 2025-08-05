import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import MessagingButton from '@/components/messaging/MessagingButton';

const { width: screenWidth } = Dimensions.get('window');

interface Child {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  age?: number;
  date_of_birth?: string;
  class?: string;
  class_name?: string;
  age_group_name?: string;
  teacher?: string;
  attendance?: number;
  recentActivity?: string;
  nextEvent?: string;
  eventDate?: string;
  is_active?: boolean;
  age_group_id?: string | null;
  class_id?: string | null;
}

interface EnhancedParentDashboardProps {
  profile: UserProfile | null;
  onSignOut: () => Promise<void>;
}

interface DashboardStats {
  totalChildren: number;
  avgAttendance: number;
  totalActivities: number;
  upcomingEvents: number;
  recentHomework: number;
  completionRate: number;
}

interface RecentUpdate {
  id: string;
  type: 'homework' | 'activity' | 'announcement' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  child_id?: string;
  icon: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'assignment' | 'activity' | 'meeting' | 'event';
  location?: string;
  child_id?: string;
}

const EnhancedParentDashboard: React.FC<EnhancedParentDashboardProps> = ({
  profile,
  onSignOut,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    avgAttendance: 0,
    totalActivities: 0,
    upcomingEvents: 0,
    recentHomework: 0,
    completionRate: 0,
  });
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [greeting, setGreeting] = useState('');
  const [tenantInfo, setTenantInfo] = useState<{ name: string; slug?: string } | null>(null);

  const selectedChild = children.find(child => child.id === selectedChildId) || children[0];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const fetchTenantInfo = useCallback(async () => {
    if (!profile?.preschool_id) return;

    try {
      const { data: tenant, error } = await supabase
        .from('preschools')
        .select('name')
        .eq('id', profile.preschool_id)
        .single();

      if (!error && tenant) {
        setTenantInfo({ name: tenant.name });
      }
    } catch (error) {
      console.error('Failed to fetch tenant info:', error);
    }
  }, [profile?.preschool_id]);

  const checkProfileCompleteness = useCallback(async () => {
    if (!profile) return;

    // Check if required profile fields are completed
    const requiredFields = ['name', 'email', 'phone', 'address'];
    const completedFields = requiredFields.filter(field => {
      const value = profile[field as keyof UserProfile];
      return value && value.toString().trim() !== '';
    });

    setProfileComplete(completedFields.length === requiredFields.length);
  }, [profile]);

  const fetchChildrenData = useCallback(async () => {
    if (!profile?.auth_user_id) return;

    try {
      setLoading(true);

      console.log('🔍 DEBUG: Fetching children for auth_user_id:', profile.auth_user_id);
      console.log('🔍 DEBUG: Profile data:', JSON.stringify(profile, null, 2));

      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id, preschool_id, name, email')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      console.log('🔍 DEBUG: Parent profile query result:', { parentProfile, parentError });

      if (parentError || !parentProfile) {
        console.error('❌ DEBUG: Parent profile not found:', parentError);
        throw new Error('Parent profile not found');
      }

      console.log('👤 DEBUG: Found parent profile:', {
        internal_id: parentProfile.id,
        name: parentProfile.name,
        email: parentProfile.email,
        preschool_id: parentProfile.preschool_id
      });

      // Fetch children with class and teacher info
      console.log('👶 DEBUG: Querying students with parent_id:', parentProfile.id);
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          class_id,
          is_active,
          parent_id,
          classes (
            name,
            teacher_id,
            users (
              name
            )
          )
        `)
        .eq('parent_id', parentProfile.id)
        .eq('is_active', true);

      console.log('👶 DEBUG: Students query result:', {
        studentsData,
        studentsError,
        studentsCount: studentsData?.length || 0
      });

      if (studentsError) {
        throw studentsError;
      }

      const formattedChildren: Child[] = (studentsData || []).map((student: any) => ({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        name: `${student.first_name} ${student.last_name}`,
        age: calculateAge(student.date_of_birth),
        class_name: student.classes?.name || 'Not Assigned',
        teacher: student.classes?.users?.name || 'No Teacher Assigned',
        attendance: Math.floor(Math.random() * 21) + 80, // Mock data for now
        is_active: student.is_active,
        class_id: student.class_id,
      }));

      setChildren(formattedChildren);
      
      if (formattedChildren.length > 0 && !selectedChildId) {
        setSelectedChildId(formattedChildren[0].id);
      }

      // Update stats
      setStats({
        totalChildren: formattedChildren.length,
        avgAttendance: formattedChildren.reduce((sum, child) => sum + (child.attendance || 0), 0) / formattedChildren.length || 0,
        totalActivities: Math.floor(Math.random() * 20) + 10, // Mock data
        upcomingEvents: Math.floor(Math.random() * 5) + 2, // Mock data
        recentHomework: Math.floor(Math.random() * 8) + 3, // Mock data
        completionRate: Math.floor(Math.random() * 21) + 80, // Mock data
      });

      // Fetch recent updates (mock data for now)
      setRecentUpdates([
        {
          id: '1',
          type: 'homework',
          title: 'Math Assignment Due',
          description: 'Complete worksheet pages 15-16',
          timestamp: '2 hours ago',
          icon: 'doc.text.fill',
        },
        {
          id: '2',
          type: 'achievement',
          title: 'Great Job in Art Class!',
          description: 'Your child showed excellent creativity today',
          timestamp: '1 day ago',
          icon: 'star.fill',
        },
        {
          id: '3',
          type: 'announcement',
          title: 'Parent-Teacher Conference',
          description: 'Scheduled for next Friday at 3:00 PM',
          timestamp: '2 days ago',
          icon: 'megaphone.fill',
        },
      ]);

      // Fetch upcoming events (mock data for now)
      setUpcomingEvents([
        {
          id: '1',
          title: 'Show and Tell',
          date: 'Tomorrow',
          time: '10:00 AM',
          type: 'activity',
          location: 'Classroom A',
        },
        {
          id: '2',
          title: 'Math Quiz',
          date: 'Friday',
          time: '2:00 PM',
          type: 'assignment',
        },
        {
          id: '3',
          title: 'Field Trip to Zoo',
          date: 'Next Monday',
          time: '9:00 AM',
          type: 'event',
          location: 'City Zoo',
        },
      ]);

    } catch (error) {
      console.error('Error fetching children data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile?.auth_user_id, selectedChildId]);

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchChildrenData(),
      fetchTenantInfo(),
      checkProfileCompleteness(),
    ]);
    setRefreshing(false);
  }, [fetchChildrenData, fetchTenantInfo, checkProfileCompleteness]);

  useEffect(() => {
    if (profile) {
      onRefresh();
    }
  }, [profile]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'homework':
        router.push('/(tabs)/homework');
        break;
      case 'activities':
        router.push('/(tabs)/activities');
        break;
      case 'lessons':
        router.push('/(tabs)/lessons');
        break;
      case 'messages':
        router.push('/(tabs)/messages');
        break;
      case 'profile':
        router.push('/screens/complete-profile');
        break;
      case 'register-child':
        router.push('/screens/register-child');
        break;
      default:
        console.log(`Quick action: ${action}`);
    }
  };

  const toggleChildSelector = () => {
    setShowChildSelector(!showChildSelector);
  };

  const selectChild = (childId: string) => {
    setSelectedChildId(childId);
    setShowChildSelector(false);
  };

  const renderWelcomeOnboarding = () => {
    if (children.length > 0 && profileComplete) return null;

    return (
      <View style={styles.onboardingContainer}>
        <LinearGradient
          colors={['#EBF4FF', '#DBEAFE', '#BFDBFE']}
          style={styles.onboardingCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.onboardingHeader}>
            <View style={styles.sparkleIcon}>
              <IconSymbol name="sparkles" size={32} color="#3B82F6" />
            </View>
            <Text style={styles.onboardingTitle}>Welcome to EduDash Pro</Text>
            <Text style={styles.onboardingSubtitle}>
              Your gateway to your child&apos;s educational journey
            </Text>
          </View>

          {/* Progress Steps */}
          <View style={styles.progressSteps}>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepCircle, profileComplete && styles.stepCompleted]}>
                <Text style={[styles.stepNumber, profileComplete && styles.stepNumberCompleted]}>1</Text>
              </View>
              <View style={[styles.stepLine, profileComplete && styles.stepLineCompleted]} />
              <View style={[styles.stepCircle, profileComplete && children.length > 0 && styles.stepCompleted]}>
                <Text style={[styles.stepNumber, profileComplete && children.length > 0 && styles.stepNumberCompleted]}>2</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
            </View>
          </View>

          {/* Action Cards */}
          <View style={styles.onboardingActions}>
            {/* Step 1: Complete Profile */}
            <TouchableOpacity
              style={[
                styles.onboardingActionCard,
                profileComplete ? styles.actionCompleted : styles.actionActive
              ]}
              onPress={() => handleQuickAction('profile')}
              disabled={profileComplete}
            >
              <View style={styles.actionIcon}>
                <IconSymbol 
                  name={profileComplete ? "checkmark.circle.fill" : "person.circle.fill"} 
                  size={24} 
                  color={profileComplete ? "#10B981" : "#3B82F6"} 
                />
              </View>
              <Text style={styles.actionTitle}>
                {profileComplete ? 'Profile Complete!' : 'Complete Your Profile'}
              </Text>
              <Text style={styles.actionDescription}>
                {profileComplete 
                  ? 'Your contact information is ready' 
                  : 'Provide contact details for communication'
                }
              </Text>
            </TouchableOpacity>

            {/* Step 2: Register Child */}
            <TouchableOpacity
              style={[
                styles.onboardingActionCard,
                !profileComplete ? styles.actionDisabled : children.length > 0 ? styles.actionCompleted : styles.actionActive
              ]}
              onPress={() => handleQuickAction('register-child')}
              disabled={!profileComplete || children.length > 0}
            >
              <View style={styles.actionIcon}>
                <IconSymbol 
                  name={children.length > 0 ? "checkmark.circle.fill" : "graduationcap.fill"} 
                  size={24} 
                  color={!profileComplete ? "#9CA3AF" : children.length > 0 ? "#10B981" : "#8B5CF6"} 
                />
              </View>
              <Text style={styles.actionTitle}>
                {children.length > 0 ? 'Child Registered!' : 'Register Your Child'}
              </Text>
              <Text style={styles.actionDescription}>
                {children.length > 0 
                  ? 'Your child is enrolled and ready' 
                  : 'Add your child\'s information for enrollment'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {children.length === 0 && profileComplete && (
            <View style={styles.onboardingFooter}>
              <Text style={styles.onboardingFooterText}>
                Ready to register your child? Tap the card above to get started!
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderChildSelector = () => {
    if (children.length === 0) return null;

    return (
      <TouchableOpacity
        style={styles.childSelectorCard}
        onPress={toggleChildSelector}
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
                <Text style={styles.childName}>{selectedChild?.name}</Text>
                {children.length > 1 && (
                  <IconSymbol
                    name="chevron.down"
                    size={20}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                )}
              </View>
              <Text style={styles.childDetails}>
                🎂 {selectedChild?.age} years old
              </Text>
              <Text style={styles.childDetails}>
                👩‍🏫 {selectedChild?.teacher}
              </Text>
            </View>
            <View style={styles.childAvatar}>
              <Text style={styles.childAvatarText}>
                {selectedChild?.first_name?.[0]}{selectedChild?.last_name?.[0]}
              </Text>
            </View>
          </View>

          <View style={styles.childCardStats}>
            <View style={styles.childStat}>
              <Text style={styles.childStatValue}>{selectedChild?.attendance || 0}%</Text>
              <Text style={styles.childStatLabel}>Attendance</Text>
            </View>
            <View style={styles.childStat}>
              <Text style={styles.childStatValue}>{Math.floor(Math.random() * 10) + 5}</Text>
              <Text style={styles.childStatLabel}>Activities</Text>
            </View>
            <View style={styles.childStat}>
              <Text style={styles.childStatValue}>{Math.floor(Math.random() * 5) + 3}</Text>
              <Text style={styles.childStatLabel}>Homework</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderChildDropdown = () => {
    if (!showChildSelector || children.length <= 1) return null;

    return (
      <View style={styles.childDropdown}>
        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childDropdownItem,
              child.id === selectedChildId && styles.childDropdownItemSelected
            ]}
            onPress={() => selectChild(child.id)}
          >
            <View style={styles.childDropdownAvatar}>
              <Text style={styles.childDropdownAvatarText}>
                {child.first_name?.[0]}{child.last_name?.[0]}
              </Text>
            </View>
            <View style={styles.childDropdownInfo}>
              <Text style={styles.childDropdownName}>{child.name}</Text>
              <Text style={styles.childDropdownDetails}>
                {child.age} years • {child.class_name} • {child.teacher}
              </Text>
            </View>
            {child.id === selectedChildId && (
              <IconSymbol name="checkmark" size={16} color="#10B981" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderQuickStats = () => {
    if (children.length === 0) return null;

    return (
      <View style={styles.quickStatsContainer}>
        <Text style={styles.sectionTitle}>📊 Quick Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalChildren}</Text>
            <Text style={styles.statLabel}>Children</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(stats.avgAttendance)}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalActivities}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => {
    if (children.length === 0 && !profileComplete) return null;

    const actions = [
      { id: 'homework', icon: 'doc.text.fill', label: 'Homework', color: '#EF4444' },
      { id: 'activities', icon: 'gamecontroller.fill', label: 'Activities', color: '#F59E0B' },
      { id: 'lessons', icon: 'book.fill', label: 'Lessons', color: '#10B981' },
      { id: 'calendar', icon: 'calendar', label: 'Calendar', color: '#8B5CF6' },
    ];

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {actions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action.id)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <IconSymbol name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderRecentUpdates = () => {
    if (children.length === 0 || recentUpdates.length === 0) return null;

    return (
      <View style={styles.updatesContainer}>
        <Text style={styles.sectionTitle}>📢 Recent Updates</Text>
        {recentUpdates.slice(0, 3).map(update => (
          <TouchableOpacity key={update.id} style={styles.updateItem}>
            <View style={styles.updateIcon}>
              <IconSymbol name={update.icon} size={16} color="#3B82F6" />
            </View>
            <View style={styles.updateContent}>
              <Text style={styles.updateTitle}>{update.title}</Text>
              <Text style={styles.updateDescription}>{update.description}</Text>
              <Text style={styles.updateTimestamp}>{update.timestamp}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderUpcomingEvents = () => {
    if (children.length === 0 || upcomingEvents.length === 0) return null;

    return (
      <View style={styles.eventsContainer}>
        <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
        {upcomingEvents.slice(0, 3).map(event => (
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
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobileHeader
        user={{
          name: profile?.name || 'Parent',
          role: 'parent',
          avatar: profile?.avatar_url,
        }}
        onNotificationsPress={() => console.log('Notifications')}
        onSearchPress={() => console.log('Search')}
        onSignOut={onSignOut}
        onNavigate={(route) => router.push(route as any)}
        notificationCount={recentUpdates.length}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>{greeting}! 👋</Text>
          <Text style={styles.subtitle}>
            {selectedChild
              ? `Let&apos;s see how ${selectedChild.first_name || selectedChild.name?.split(' ')[0]} is doing today`
              : 'Welcome to your parent dashboard'
            }
          </Text>
          {tenantInfo && (
            <View style={styles.tenantBadge}>
              <Text style={styles.tenantLabel}>🏫 {tenantInfo.name}</Text>
            </View>
          )}
        </View>

        {/* Onboarding/Welcome Flow */}
        {renderWelcomeOnboarding()}

        {/* Child Selector */}
        {renderChildSelector()}

        {/* Child Dropdown */}
        {renderChildDropdown()}

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Recent Updates */}
        {renderRecentUpdates()}

        {/* Upcoming Events */}
        {renderUpcomingEvents()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Floating Messaging Button */}
      {(children.length > 0 || profileComplete) && (
        <View style={styles.floatingButtonContainer}>
          <MessagingButton
            profile={profile}
            childrenData={children}
            variant="floating"
            size="large"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  tenantBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  tenantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  
  // Onboarding styles
  onboardingContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  onboardingCard: {
    borderRadius: 20,
    padding: 24,
  },
  onboardingHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sparkleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressSteps: {
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCompleted: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  stepNumberCompleted: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  onboardingActions: {
    gap: 16,
  },
  onboardingActionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  actionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
  },
  actionCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    flex: 1,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  onboardingFooter: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
  },
  onboardingFooterText: {
    fontSize: 14,
    color: '#7C3AED',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Child selector styles
  childSelectorCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  childCard: {
    borderRadius: 20,
    padding: 24,
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
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  childStat: {
    alignItems: 'center',
  },
  childStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  // Child dropdown styles
  childDropdown: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  childDropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childDropdownAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
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

  // Stats section
  quickStatsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Quick actions
  quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Updates section
  updatesContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  updateItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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

  // Events section
  eventsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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

  bottomSpacing: {
    height: 20,
  },
  
  // Floating button styles
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 100, // Above the tab bar
    right: 20,
    zIndex: 1000,
  },
});

export default EnhancedParentDashboard;
