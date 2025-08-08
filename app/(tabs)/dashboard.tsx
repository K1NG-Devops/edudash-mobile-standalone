import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AuthConsumer, UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ParentDashboard from '@/components/dashboard/ParentDashboard';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import SchoolAdminDashboard from '@/components/dashboard/SchoolAdminDashboard';
import { TeacherDataService } from '@/lib/services/teacherDataService';
import React from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  teacher: string;
  emoji: string;
  attendance: number;
}

interface DashboardState {
  refreshing: boolean;
  selectedChildId: string | null;
  todaysMood: number; // 1-5 stars
  weeklyProgress: number; // percentage
  showChildSelector: boolean;
  skillsGained: number;
  activitiesCompleted: number;
  attendanceRate: number;
  recentAchievements: string[];
  recentUpdates: RecentUpdate[];
  upcomingEvents: UpcomingEvent[];
  loading: boolean;
  error: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
}

interface RecentUpdate {
  id: string;
  type: 'message' | 'homework' | 'activity' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'assignment' | 'activity' | 'meeting' | 'event';
  location?: string;
}

class DashboardScreen extends React.Component<{}, DashboardState> {
  state: DashboardState = {
    refreshing: false,
    selectedChildId: null,
    todaysMood: 0,
    weeklyProgress: 0,
    showChildSelector: false,
    skillsGained: 0,
    activitiesCompleted: 0,
    attendanceRate: 0,
    recentAchievements: [],
    recentUpdates: [],
    upcomingEvents: [],
    loading: true,
    error: null,
    tenantSlug: null,
    tenantName: null,
  };

  private children: Child[] = [];

  onRefresh = async (parentUserId?: string) => {
    this.setState({ refreshing: true });
    if (parentUserId) {
      await this.fetchChildrenData(parentUserId);
    }
    this.setState({ refreshing: false });
  };

componentDidMount() {
    // Initial load will be handled by the render method when profile is available
  }

  fetchTenantInfo = async (userProfile: UserProfile) => {
    try {
      console.log('🏫 [DEBUG] Fetching tenant info for preschool_id:', userProfile.preschool_id);
      if (userProfile.preschool_id) {
        const { data: tenant, error: tenantError } = await supabase
          .from('preschools')
          .select('name, id')
          .eq('id', userProfile.preschool_id)
          .single();

        console.log('🏫 [DEBUG] Tenant query result:', { tenant, tenantError });

        if (!tenantError && tenant) {
          console.log('🏫 [DEBUG] Setting tenant name:', tenant.name);
          this.setState({ 
            tenantName: tenant.name,
            tenantSlug: tenant.id || tenant.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'
          });
        }
      }
    } catch (error) {
      console.log('❌ Failed to fetch tenant info:', error);
    }
  };

  fetchChildrenData = async (parentUserId: string) => {
    try {
      this.setState({ loading: true, error: null });

      // First get the parent's user profile to get their ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id, name, preschool_id')
        .eq('auth_user_id', parentUserId)
        .single();

      if (parentError || !parentProfile) {
        console.error('Error fetching parent profile:', parentError);
        this.setState({ 
          loading: false, 
          error: 'Unable to fetch parent profile',
          tenantSlug: null 
        });
        return;
      }

      // Store parent name for fallback display
      const parentName = parentProfile.name || 'Teacher';
      this.setState({ tenantSlug: parentName });

      // Fetch tenant info if available
      if (parentProfile.preschool_id) {
        const { data: tenant, error: tenantError } = await supabase
          .from('preschools')
          .select('name, id')
          .eq('id', parentProfile.preschool_id)
          .single();

        if (!tenantError && tenant) {
          this.setState({ 
            tenantName: tenant.name,
            tenantSlug: tenant.id || tenant.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'
          });
        }
      }

      // Then get the students for this parent with class and teacher info
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          class_id,
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

      if (error) {
        console.error('Error fetching children:', error);
        this.setState({ 
          loading: false, 
          error: 'Unable to fetch children data' 
        });
        return;
      }

      if (students && students.length > 0) {
        this.children = students.map((student: any) => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          age: this.calculateAge(student.date_of_birth),
          grade: student.classes?.name || 'Not Assigned',
          teacher: student.classes?.users?.name || parentName || 'No Teacher Assigned',
          emoji: '👤', // Default emoji for students
          attendance: 0, // Will be calculated from actual attendance data
        }));
        
        // Set the first child as selected if no selection exists
        if (!this.state.selectedChildId || !this.children.find(c => c.id === this.state.selectedChildId)) {
          this.setState({ selectedChildId: this.children[0].id });
        }
        
        this.setState({ loading: false });
        this.forceUpdate();
      } else {
        // No children found
        this.children = [];
        this.setState({ 
          loading: false, 
          selectedChildId: null,
          error: 'No children found for this parent' 
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      this.setState({ 
        loading: false, 
        error: 'An unexpected error occurred' 
      });
    }
  };

  calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  getSelectedChild = (): Child | null => {
    if (this.children.length === 0) return null;
    return this.children.find(child => child.id === this.state.selectedChildId) || this.children[0];
  };

  getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <IconSymbol
        key={i}
        name={i < rating ? "star.fill" : "star"}
        size={20}
        color={i < rating ? "#F59E0B" : "#E5E7EB"}
      />
    ));
  };

  private handleSignOut = async () => {
    try {
      // This will be handled by AuthConsumer context
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  private handleNavigate = (route: string) => {
    console.log('Navigating to:', route);
    // Handle navigation based on route
    if (route.startsWith('/(tabs)')) {
      router.push(route as any);
    } else if (route.startsWith('/')) {
      // Handle screen routes
      const screenName = route.substring(1);
      router.push(`/screens/${screenName}` as any);
    }
  };

  private handleQuickAction = (action: string) => {
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

  private toggleChildSelector = () => {
    this.setState({ showChildSelector: !this.state.showChildSelector });
  };

  private selectChild = (childId: string) => {
    this.setState({ 
      selectedChildId: childId,
      showChildSelector: false 
    });
  };

  private renderParentDashboard = (profile: UserProfile | null, signOut: () => Promise<void>) => {
    // Always fetch tenant info for parent users if we have a profile and preschool_id
    if (profile && profile.preschool_id && !this.state.tenantName) {
      console.log('🏫 [DEBUG] Triggering tenant fetch for parent dashboard');
      this.fetchTenantInfo(profile);
    }

    // Use the new ParentDashboard component with real data
    return (
      <ParentDashboard
        userId={profile?.auth_user_id || ''}
        userProfile={{
          name: profile?.name || 'Parent',
          role: 'parent',
          avatar: profile?.avatar_url,
        }}
        tenantName={this.state.tenantName || undefined}
        onSignOut={signOut}
      />
    );
  };

  // Method to render admin/teacher dashboard
  private renderAdminDashboard = (profile: UserProfile | null, signOut: () => Promise<void>) => {
    // Always fetch tenant info for admin/teacher users if we have a profile and preschool_id
    if (profile && profile.preschool_id && !this.state.tenantName) {
      console.log('🏫 [DEBUG] Triggering tenant fetch for admin dashboard');
      this.fetchTenantInfo(profile);
    }

    return (
      <View style={styles.container}>
        {/* Mobile Header */}
        <MobileHeader
          user={{
            name: profile?.name || 'Admin',
            role: profile?.role || 'admin',
            avatar: profile?.avatar_url,
          }}
          schoolName={this.state.tenantName || undefined}
          onNotificationsPress={() => console.log('Notifications')}
          onSignOut={signOut}
          onNavigate={this.handleNavigate}
          notificationCount={3}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Text */}
          <View style={styles.headerTextSection}>
            <Text style={styles.greeting}>{this.getGreeting()} 👋</Text>
            <Text style={styles.subtitle}>
              Welcome to your {profile?.role || 'admin'} dashboard
            </Text>
          </View>

          {/* Admin/Teacher Dashboard Content */}
          <View style={styles.adminDashboard}>
            {this.state.tenantName && (
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantLabel}>🏫 Managing {this.state.tenantName}</Text>
              </View>
            )}
            <Text style={styles.adminTitle}>
              {profile?.role === 'teacher' ? '👩‍🏫 Teacher Dashboard' : '👨‍💼 Admin Dashboard'}
            </Text>
            
            {/* Quick Actions Grid */}
            <View style={styles.teacherQuickActions}>
              {profile?.role === 'teacher' && (
                <>
                  <TouchableOpacity 
                    style={styles.teacherActionCard}
                    onPress={() => router.push('/(teacher)/reports')}
                  >
                    <View style={styles.teacherActionIcon}>
                      <IconSymbol name="doc.text.fill" size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.teacherActionTitle}>Child Evaluations</Text>
                    <Text style={styles.teacherActionSubtitle}>Reports & assessments for students</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.teacherActionCard}
                    onPress={() => router.push('/(tabs)/videocalls')}
                  >
                    <View style={styles.teacherActionIcon}>
                      <IconSymbol name="video.fill" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.teacherActionTitle}>Video Calls</Text>
                    <Text style={styles.teacherActionSubtitle}>Schedule parent meetings</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.teacherActionCard}
                    onPress={() => router.push('/(tabs)/messages')}
                  >
                    <View style={styles.teacherActionIcon}>
                      <IconSymbol name="message.fill" size={24} color="#F59E0B" />
                    </View>
                    <Text style={styles.teacherActionTitle}>Messages</Text>
                    <Text style={styles.teacherActionSubtitle}>Communicate with parents</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.teacherActionCard}
                    onPress={() => console.log('Class Management')}
                  >
                    <View style={styles.teacherActionIcon}>
                      <IconSymbol name="person.3.fill" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={styles.teacherActionTitle}>My Classes</Text>
                    <Text style={styles.teacherActionSubtitle}>Manage students & activities</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {profile?.role !== 'teacher' && (
                <>
                  <TouchableOpacity style={styles.teacherActionCard}>
                    <View style={styles.teacherActionIcon}>
                      <IconSymbol name="gear" size={24} color="#6B7280" />
                    </View>
                    <Text style={styles.teacherActionTitle}>Settings</Text>
                    <Text style={styles.teacherActionSubtitle}>System configuration</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.teacherActionCard}>
                    <View style={styles.teacherActionIcon}>
                      <IconSymbol name="person.2.fill" size={24} color="#6B7280" />
                    </View>
                    <Text style={styles.teacherActionTitle}>Users</Text>
                    <Text style={styles.teacherActionSubtitle}>Manage teachers & parents</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {/* Today's Summary for Teachers */}
            {profile?.role === 'teacher' && (
              <View style={styles.teacherSummaryCard}>
                <Text style={styles.teacherSummaryTitle}>📊 Today&apos;s Overview</Text>
                <View style={styles.teacherSummaryRow}>
                  <View style={styles.teacherSummaryItem}>
                    <Text style={styles.teacherSummaryNumber}>0</Text>
                    <Text style={styles.teacherSummaryLabel}>Reports Created</Text>
                  </View>
                  <View style={styles.teacherSummaryItem}>
                    <Text style={styles.teacherSummaryNumber}>0</Text>
                    <Text style={styles.teacherSummaryLabel}>Messages Sent</Text>
                  </View>
                  <View style={styles.teacherSummaryItem}>
                    <Text style={styles.teacherSummaryNumber}>0</Text>
                    <Text style={styles.teacherSummaryLabel}>Video Calls</Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Recent Activity */}
            <View style={styles.adminCard}>
              <Text style={styles.adminCardTitle}>Recent Activity</Text>
              <Text style={styles.adminCardText}>
                {profile?.role === 'teacher' 
                  ? 'Your recent reports, messages, and student interactions will appear here.'
                  : 'System activity and user management updates will be shown here.'
                }
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  render() {
    return (
      <AuthConsumer>
        {({ profile, signOut }) => {
          // Add debugging
          console.log('🎭 Dashboard Role Check:', profile?.role);
          
          // Route based on user role
          switch (profile?.role) {
            case 'parent':
              return this.renderParentDashboard(profile, signOut);
            case 'superadmin':
              return (
                <SuperAdminDashboard
                  userId={profile?.auth_user_id || ''}
                  userProfile={{
                    name: profile?.name || 'Super Admin',
                    role: 'superadmin',
                    avatar: profile?.avatar_url,
                  }}
                  onSignOut={signOut}
                />
              );
            case 'preschool_admin':
              return (
                <SchoolAdminDashboard
                  userId={profile?.auth_user_id || ''}
                  userProfile={{
                    name: profile?.name || 'School Admin',
                    role: 'preschool_admin',
                    avatar: profile?.avatar_url,
                  }}
                  schoolName={this.state.tenantName || undefined}
                  onSignOut={signOut}
                />
              );
            case 'teacher':
              return this.renderAdminDashboard(profile, signOut);
            default:
              // If no role or unknown role, show parent dashboard as fallback
              console.log('⚠️ Unknown role, showing parent dashboard as fallback');
              return this.renderParentDashboard(profile, signOut);
          }
        }}
      </AuthConsumer>
    );
  }
}

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
    marginBottom: 4,
  },
  // Admin dashboard styles
  adminDashboard: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  adminTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  adminCardText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Tenant info styles
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
  // Teacher dashboard styles
  teacherQuickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  teacherActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teacherActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  teacherActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  teacherSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teacherSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  teacherSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teacherSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  teacherSummaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  teacherSummaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default DashboardScreen;
