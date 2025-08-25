/* eslint-disable */
// @ts-nocheck
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import OnboardingRequestManager from '@/components/admin/OnboardingRequestManager';
import UserManagementScreen from '@/components/admin/UserManagementScreen';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { NotificationService } from '@/lib/services/notificationService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import {
  SuperAdminDashboardData,
  SuperAdminDataService
} from '@/lib/services/superAdminDataService';

const { width: screenWidth } = Dimensions.get('window');

type TabType = 'overview' | 'schools' | 'onboarding' | 'users' | 'activity' | 'system' | 'analytics' | 'billing' | 'ai-usage' | 'moderation' | 'reports' | 'announcements';

const SuperAdminDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const TAB_HEIGHT = 64; // approx. height of our local bottom nav
  const { user, signOut } = useAuth();
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const params = useLocalSearchParams();
  const [dashboardData, setDashboardData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [notificationCount, setNotificationCount] = useState(0);
  const [navHeight, setNavHeight] = useState(0);

  // Fetch notification count
  const fetchNotificationCount = async () => {
    if (!user?.id) return;

    try {
      const count = await NotificationService.getUnreadCount(user.id);
      setNotificationCount(count);
    } catch (err) {
      // Removed debug statement: console.error('Error fetching notification count:', err);
      // Don't show error for notification count, just log it
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data and notification count in parallel
      const [data] = await Promise.all([
        SuperAdminDataService.getSuperAdminDashboardData(user.id),
        fetchNotificationCount()
      ]);


      setDashboardData(data);
    } catch (err: any) {
      // Removed debug statement: console.error('❌ [SuperAdmin] Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  // Handle URL tab parameter
  useEffect(() => {
    if (params.tab && typeof params.tab === 'string') {
      const tabParam = params.tab as TabType;
      if (['overview', 'schools', 'onboarding', 'users', 'activity', 'system'].includes(tabParam)) {
        setSelectedTab(tabParam);
      }
    }
  }, [params.tab]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  // Register global refresh callback for OnboardingRequestManager
  useFocusEffect(
    React.useCallback(() => {
      // Register the global callback function for immediate refresh after onboarding approval
      (global as any).refreshSuperAdminDashboard = () => {
        // Add small delay to ensure database consistency after approvals
        setTimeout(() => {
          fetchDashboardData();
        }, 1000);
      };

      // Set up periodic refresh every 30 seconds while screen is focused
      const refreshInterval = setInterval(() => {
        fetchDashboardData();
      }, 30000); // 30 seconds

      // Cleanup function when screen loses focus
      return () => {
        clearInterval(refreshInterval);
        delete (global as any).refreshSuperAdminDashboard;
      };
    }, [user?.id]) // Dependency on user.id to re-register when user changes
  );

  // Handle navigation
  const handleNavigate = (route: string) => {

    if (route.startsWith('/(tabs)')) {
      // Handle tab routes directly
      router.push(route as any);
    } else if (route.includes('?tab=')) {
      // Handle routes with tab query parameters - these should stay on current page
      // and just change the tab
      const url = new URL(route, 'http://localhost');
      const tabParam = url.searchParams.get('tab');
      if (tabParam) {
        setSelectedTab(tabParam as TabType);
      }
    } else if (route.startsWith('/screens/') || route.startsWith('screens/')) {
      // Handle screen routes - normalize to ensure proper format
      const cleanRoute = route.startsWith('/') ? route : `/${route}`;
      router.push(cleanRoute as any);
    } else if (route.startsWith('/')) {
      // Handle other absolute routes
      router.push(route as any);
    } else {
      // Handle relative routes by making them absolute
      router.push(`/${route}` as any);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'suspended': return '#EF4444';
      case 'trial': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  // Render platform stats cards
  const renderStatsCards = () => {
    if (!dashboardData) return null;

    const { platform_stats } = dashboardData;

    return (
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
          <IconSymbol name="building.2" size={24} color="#3B82F6" />
          <Text style={[styles.statValue, { color: palette.text }]}>{platform_stats.total_schools}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Schools</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
          <IconSymbol name="person.3" size={24} color="#10B981" />
          <Text style={[styles.statValue, { color: palette.text }]}>{platform_stats.total_users}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Total Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
          <IconSymbol name="graduationcap" size={24} color="#DC2626" />
          <Text style={[styles.statValue, { color: palette.text }]}>{platform_stats.total_students}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Students</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
          <IconSymbol name="person.badge.plus" size={24} color="#059669" />
          <Text style={[styles.statValue, { color: palette.text }]}>{platform_stats.total_teachers}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Teachers</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
          <IconSymbol name="person.2" size={24} color="#DC2626" />
          <Text style={[styles.statValue, { color: palette.text }]}>{platform_stats.total_parents}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Parents</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
          <IconSymbol name="cpu" size={24} color="#6366F1" />
          <Text style={[styles.statValue, { color: palette.text }]}>{platform_stats.ai_usage_count.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: palette.textSecondary }]}>AI Requests</Text>
        </View>
      </View>
    );
  };

  // Render system health indicator
  const renderSystemHealth = () => {
    if (!dashboardData) return null;

    const { system_health } = dashboardData;

    return (
      <View style={[styles.healthCard, { backgroundColor: palette.surface }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>🖥️ System Health</Text>
          <View style={[styles.healthStatus, {
            backgroundColor: system_health.database_status === 'healthy' ? '#10B981' : '#EF4444'
          }]}>
            <Text style={styles.healthStatusText}>
              {system_health.database_status === 'healthy' ? 'Healthy' : 'Issues'}
            </Text>
          </View>
        </View>

        <View style={styles.healthMetrics}>
          <View style={styles.healthMetric}>
            <Text style={[styles.healthMetricLabel, { color: palette.textSecondary }]}>API Response</Text>
            <Text style={[styles.healthMetricValue, { color: palette.text }]}>{system_health.api_response_time}ms</Text>
          </View>
          <View style={styles.healthMetric}>
            <Text style={[styles.healthMetricLabel, { color: palette.textSecondary }]}>Uptime</Text>
            <Text style={[styles.healthMetricValue, { color: palette.text }]}>{system_health.uptime_percentage}%</Text>
          </View>
          <View style={styles.healthMetric}>
            <Text style={[styles.healthMetricLabel, { color: palette.textSecondary }]}>Storage</Text>
            <Text style={[styles.healthMetricValue, { color: palette.text }]}>{system_health.storage_usage_percentage}%</Text>
          </View>
          <View style={styles.healthMetric}>
            <Text style={[styles.healthMetricLabel, { color: palette.textSecondary }]}>Connections</Text>
            <Text style={[styles.healthMetricValue, { color: palette.text }]}>{system_health.active_connections}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render quick actions
  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: palette.surface }]}
          onPress={() => setSelectedTab('onboarding')}
        >
          <IconSymbol name="plus.app" size={24} color="#3B82F6" />
          <Text style={[styles.quickActionLabel, { color: palette.text }]}>Manage Onboarding</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: palette.surface }]}
          onPress={() => setSelectedTab('activity')}
        >
          <IconSymbol name="chart.bar.doc.horizontal" size={24} color="#10B981" />
          <Text style={[styles.quickActionLabel, { color: palette.text }]}>Platform Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: palette.surface }]}
          onPress={() => setSelectedTab('system')}
        >
          <IconSymbol name="gear.badge" size={24} color="#F59E0B" />
          <Text style={[styles.quickActionLabel, { color: palette.text }]}>System Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: palette.surface }]}
          onPress={() => setSelectedTab('users')}
        >
          <IconSymbol name="person.badge.shield.checkmark" size={24} color="#DC2626" />
          <Text style={[styles.quickActionLabel, { color: palette.text }]}>User Management</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

// Tab navigation (bottom bar)
const renderTabNavigation = () => (
    <SafeAreaView edges={['bottom','left','right']} style={styles.tabNavWrapper}>
      <View
        style={[styles.tabNavigationBottom, { backgroundColor: palette.surface, borderTopColor: palette.outline }]}
        onLayout={(e) => {
          const h = e?.nativeEvent?.layout?.height || 0;
          if (h && Math.abs(h - navHeight) > 1) setNavHeight(h);
        }}
      >
        {[
          { key: 'overview', label: 'Overview', icon: 'chart.bar' },
          { key: 'schools', label: 'Schools', icon: 'building.2' },
          { key: 'onboarding', label: 'Onboard', icon: 'person.badge.plus' },
          { key: 'users', label: 'Users', icon: 'person.3' },
          { key: 'system', label: 'System', icon: 'gear' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selectedTab === tab.key && styles.tabButtonActive]}
            onPress={() => setSelectedTab(tab.key as TabType)}
          >
            <IconSymbol
              name={tab.icon as any}
              size={16}
              color={selectedTab === tab.key ? '#DC2626' : palette.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: selectedTab === tab.key ? '#DC2626' : palette.textSecondary }, selectedTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="person.slash" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: palette.text }]}>Authentication Required</Text>
          <Text style={[styles.errorMessage, { color: palette.textSecondary }]}>Please sign in to access the Super Admin dashboard</Text>
        </View>
      </View>
    );
  }



  // Loading state
  if (loading && !refreshing && !dashboardData) {
    return (
      <View style={styles.container}>
        <MobileHeader
          user={{
            name: user.name || 'Super Admin',
            role: 'superadmin',
            avatar: user.avatar_url
          }}
          schoolName="EduDash Pro Platform"
          onNotificationsPress={() => {/* TODO: Implement action */ }}
          onSignOut={signOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner
            size="large"
            color="#DC2626"
            showGradient={false}
            message="Loading platform data..."
          />
        </View>
      </View>
    );
  }

  // Error state
  if (error && !loading && !refreshing) {
    return (
      <View style={styles.container}>
        <MobileHeader
          user={{
            name: user.name || 'Super Admin',
            role: 'superadmin',
            avatar: user.avatar_url
          }}
          schoolName="EduDash Pro Platform"
          onNotificationsPress={() => {/* TODO: Implement action */ }}
          onSignOut={signOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: palette.text }]}>Access Denied</Text>
          <Text style={[styles.errorMessage, { color: palette.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }



  return (
<SafeAreaView edges={['bottom','left','right']} style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <MobileHeader
        user={{
          name: user.name || 'Super Admin',
          role: 'superadmin',
          avatar: user.avatar_url
        }}
        schoolName="EduDash Pro Platform"
        onNotificationsPress={() => handleNavigate('/screens/notifications')}
        onSignOut={signOut}
        onNavigate={handleNavigate}
        notificationCount={notificationCount}
      />

      {/* Content */}
      {(() => {
        if (selectedTab === 'onboarding') {
          return <OnboardingRequestManager superAdminUserId={user.id} />;
        }
        if (selectedTab === 'users') {
          return <UserManagementScreen superAdminUserId={user.id} />;
        }
        return (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(navHeight + 32, insets.bottom + TAB_HEIGHT + 32) }]}
          >
            {/* Header Text */}
            <View style={styles.headerTextSection}>
              <Text style={[styles.greeting, { color: palette.text }]}>🔱 Super Admin Dashboard</Text>
              <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
                Manage the entire EduDash Pro platform
              </Text>
            </View>

            {/* Platform Overview Section */}
            <View style={styles.platformOverviewSection}>
              <Text style={[styles.platformOverviewTitle, { color: palette.text }]}>📊 Platform Overview</Text>
              <Text style={[styles.platformOverviewSubtitle, { color: palette.textSecondary }]}>
                Real-time insights into your EduDash Pro platform performance
              </Text>
            </View>

            {/* Alerts Section */}
            {dashboardData && dashboardData.alerts.length > 0 && (
              <View style={styles.alertsSection}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>⚠️ Platform Alerts</Text>
                {dashboardData.alerts.map((alert) => (
                  <View key={alert.id} style={[styles.alertCard, { borderLeftColor: getSeverityColor(alert.priority), backgroundColor: colorScheme === 'dark' ? palette.surfaceVariant : '#FEF2F2' }]}>
                    <Text style={[styles.alertMessage, { color: palette.text }]}>{alert.message}</Text>
                    <Text style={[styles.alertTime, { color: palette.textSecondary }]}>{new Date(alert.timestamp).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tab Content */}

            {selectedTab === 'overview' && (
              <>
                {renderStatsCards()}
                {renderSystemHealth()}
                {renderQuickActions()}

                {/* Pending Approvals */}
                {dashboardData && (
                  <View style={styles.approvalsSection}>
                    <Text style={[styles.sectionTitle, { color: palette.text }]}>📋 Pending Approvals</Text>
                    <View style={styles.approvalsGrid}>
                      <View style={styles.approvalCard}>
                        <Text style={styles.approvalCount}>{dashboardData.pending_approvals.schools}</Text>
                        <Text style={styles.approvalLabel}>Schools</Text>
                      </View>
                      <View style={styles.approvalCard}>
                        <Text style={styles.approvalCount}>{dashboardData.pending_approvals.users}</Text>
                        <Text style={styles.approvalLabel}>Users</Text>
                      </View>
                      <View style={styles.approvalCard}>
                        <Text style={styles.approvalCount}>{dashboardData.pending_approvals.content_reports}</Text>
                        <Text style={styles.approvalLabel}>Reports</Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}

            {selectedTab === 'schools' && dashboardData && (
              <View style={styles.schoolsList}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>🏫 Recent Schools</Text>
                {dashboardData.recent_schools.map((school) => (
                  <View key={school.id} style={[styles.schoolCard, { backgroundColor: palette.surface }]}>
                    <View style={styles.schoolInfo}>
                      <Text style={[styles.schoolName, { color: palette.text }]}>{school.name}</Text>
                      <Text style={[styles.schoolDetails, { color: palette.textSecondary }]}>
                        {school.user_count} users • {school.student_count} students
                      </Text>
                      <Text style={styles.schoolDetails}>
                        Last active: {new Date(school.last_activity).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.schoolActions}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(school.subscription_status) }]}>
                        <Text style={styles.statusText}>{school.subscription_status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {selectedTab === 'users' && dashboardData && (
              <View style={styles.usersList}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>👥 Recent Users</Text>
                {dashboardData.recent_users.slice(0, 10).map((user) => (
                  <View key={user.id} style={[styles.userCard, { backgroundColor: palette.surface }]}>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: palette.text }]}>{user.name}</Text>
                      <Text style={[styles.userDetails, { color: palette.textSecondary }]}>
                        {user.role} • {user.school_name || 'No School'}
                      </Text>
                      <Text style={styles.userDetails}>
                        Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </Text>
                    </View>
                    <View style={styles.userActions}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.account_status) }]}>
                        <Text style={styles.statusText}>{user.account_status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {selectedTab === 'system' && (
              <View style={styles.systemSection}>
                {renderSystemHealth()}
                {renderQuickActions()}
              </View>
            )}

            {selectedTab === 'analytics' && (
              <View style={styles.analyticsSection}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>📈 Platform Analytics</Text>
                <View style={[styles.comingSoonCard, { backgroundColor: palette.surface }]}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={48} color="#DC2626" />
                  <Text style={[styles.comingSoonTitle, { color: palette.text }]}>Analytics Dashboard</Text>
                  <Text style={[styles.comingSoonText, { color: palette.textSecondary }]}>
                    Advanced analytics and insights coming soon. Track growth metrics, user engagement, and platform performance.
                  </Text>
                </View>
              </View>
            )}

            {selectedTab === 'billing' && (
              <View style={styles.billingSection}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>💳 Billing & Subscriptions</Text>
                <View style={[styles.comingSoonCard, { backgroundColor: palette.surface }]}>
                  <IconSymbol name="creditcard.fill" size={48} color="#DC2626" />
                  <Text style={[styles.comingSoonTitle, { color: palette.text }]}>Revenue Management</Text>
                  <Text style={[styles.comingSoonText, { color: palette.textSecondary }]}>
                    Comprehensive billing dashboard coming soon. Monitor subscriptions, revenue, and payment analytics.
                  </Text>
                </View>
              </View>
            )}

            {selectedTab === 'ai-usage' && (
              <View style={styles.aiUsageSection}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>🧠 AI Usage Monitoring</Text>
                <View style={[styles.comingSoonCard, { backgroundColor: palette.surface }]}>
                  <IconSymbol name="brain.head.profile" size={48} color="#DC2626" />
                  <Text style={[styles.comingSoonTitle, { color: palette.text }]}>AI Cost Tracking</Text>
                  <Text style={[styles.comingSoonText, { color: palette.textSecondary }]}>
                    Monitor AI usage, costs, and set limits across all schools. Advanced AI analytics coming soon.
                  </Text>
                </View>
              </View>
            )}

            {selectedTab === 'moderation' && (
              <View style={styles.moderationSection}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>🚩 Content Moderation</Text>
                <View style={[styles.comingSoonCard, { backgroundColor: palette.surface }]}>
                  <IconSymbol name="flag.fill" size={48} color="#DC2626" />
                  <Text style={[styles.comingSoonTitle, { color: palette.text }]}>Content Review</Text>
                  <Text style={[styles.comingSoonText, { color: palette.textSecondary }]}>
                    Review flagged content, manage reports, and maintain platform safety standards.
                  </Text>
                </View>
              </View>
            )}

            {selectedTab === 'reports' && (
              <View style={styles.reportsSection}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>📊 Platform Reports</Text>
                <View style={[styles.comingSoonCard, { backgroundColor: palette.surface }]}>
                  <IconSymbol name="doc.text.fill" size={48} color="#DC2626" />
                  <Text style={[styles.comingSoonTitle, { color: palette.text }]}>Export & Compliance</Text>
                  <Text style={[styles.comingSoonText, { color: palette.textSecondary }]}>
                    Generate comprehensive reports for compliance, auditing, and business intelligence.
                  </Text>
                </View>
              </View>
            )}

            {selectedTab === 'announcements' && (
              <View style={styles.announcementsSection}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>📢 Platform Announcements</Text>
                <View style={[styles.comingSoonCard, { backgroundColor: palette.surface }]}>
                  <IconSymbol name="megaphone.fill" size={48} color="#DC2626" />
                  <Text style={[styles.comingSoonTitle, { color: palette.text }]}>Broadcast System</Text>
                  <Text style={[styles.comingSoonText, { color: palette.textSecondary }]}>
                    Send announcements to all schools, manage communications, and track engagement.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.bottomSpacing} />
          </ScrollView>
        );
      })()}

      {/* Bottom Tab Navigation */}
      {renderTabNavigation()}
    </SafeAreaView>
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
    paddingBottom: 100,
  },
  headerTextSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
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

  // Platform Overview Section
  platformOverviewSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  platformOverviewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  platformOverviewSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 20,
  },

// Bottom Tab Navigation
  tabNavWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabNavigationBottom: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  tabLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#DC2626',
    fontWeight: '600',
  },

  // Stats Cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (screenWidth - 60) / 3,
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
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // System Health
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  healthStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  healthStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthMetric: {
    alignItems: 'center',
  },
  healthMetricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  healthMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (screenWidth - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },

  // Common Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Schools List
  schoolsList: {
    paddingHorizontal: 20,
  },
  schoolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  schoolDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  schoolActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Users List
  usersList: {
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Status & Action Buttons
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Alerts
  alertsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Approvals
  approvalsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  approvalsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  approvalCard: {
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
  approvalCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  approvalLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  // System Section
  systemSection: {
    paddingHorizontal: 20,
  },

  // Loading and Error States
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

  bottomSpacing: {
    height: 32,
  },

  // New Tab Sections
  analyticsSection: {
    padding: 20,
  },
  billingSection: {
    padding: 20,
  },
  aiUsageSection: {
    padding: 20,
  },
  moderationSection: {
    padding: 20,
  },
  reportsSection: {
    padding: 20,
  },
  announcementsSection: {
    padding: 20,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SuperAdminDashboardScreen;
