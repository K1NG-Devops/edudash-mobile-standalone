 
// @ts-nocheck
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import CreateSchoolModal from '@/components/modals/CreateSchoolModal';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  PlatformActivity,
  PlatformStats,
  SchoolOverview,
  SuperAdminDashboardData,
  SuperAdminDataService,
  SystemHealth,
  UserOverview
} from '@/lib/services/superAdminDataService';
import { shadow } from '@/lib/ui/shadow';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Button } from '@/design-system';
import { useT } from '@/i18n';

interface SuperAdminDashboardProps {
  userId: string;
  userProfile: {
    name: string;
    role: string;
    avatar?: string | null;
  };
  onSignOut: () => Promise<void>;
  onNavigate?: (route: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;
const isVerySmallScreen = screenWidth < 320;

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  userId,
  userProfile,
  onSignOut,
  onNavigate
}) => {
  const [dashboardData, setDashboardData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'schools' | 'users' | 'activity' | 'system' | 'onboarding'>('overview');
  const [showCreateSchoolModal, setShowCreateSchoolModal] = useState(false);

  const insets = useSafeAreaInsets();
  const { t } = useT();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SuperAdminDataService.getSuperAdminDashboardData(userId);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching super admin dashboard data:', err);
      setError(err.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();

    // Expose a global refresh hook for child components (e.g., OnboardingRequestManager)
    // This allows triggering a dashboard refetch immediately after approvals.
    (global as any).refreshSuperAdminDashboard = fetchDashboardData;

    return () => {
      if ((global as any).refreshSuperAdminDashboard === fetchDashboardData) {
        (global as any).refreshSuperAdminDashboard = undefined;
      }
    };
  }, [userId]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  // Handle navigation
  const handleNavigate = (route: string) => {
    // Check if route contains a tab parameter
    if (route.includes('?tab=')) {
      const tabMatch = route.match(/\?tab=([^&]+)/);
      if (tabMatch && tabMatch[1]) {
        const tabName = tabMatch[1] as any;
        // If it's the super admin dashboard with a tab, just switch tabs
        if (route.includes('super-admin-dashboard')) {
          setSelectedTab(tabName);
          return;
        }
      }
    }

    // Use parent onNavigate if provided, otherwise use local routing
    if (onNavigate) {
      onNavigate(route);
    } else {
      // Fallback local routing logic
      if (route.startsWith('/(tabs)')) {
        router.push(route as any);
      } else if (route.includes('?tab=')) {
        router.push(route as any);
      } else if (route.startsWith('/screens/') || route.startsWith('screens/')) {
        const cleanRoute = route.startsWith('/') ? route : `/${route}`;
        router.push(cleanRoute as any);
      } else if (route.startsWith('/')) {
        router.push(route as any);
      } else {
        router.push(`/${route}` as any);
      }
    }
  };

  // Handle school creation success
  const handleSchoolCreated = (schoolId: string) => {
    setShowCreateSchoolModal(false);
    // Refresh dashboard data to show new school
    fetchDashboardData();
  };

  // Handle school suspension
  const handleSuspendSchool = (school: SchoolOverview) => {
    Alert.alert(
      t('admin.actions.suspend'),
      t('admin.messages.confirmSuspendSchool', { name: school.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.actions.suspend'),
          style: 'destructive',
          onPress: async () => {
            const result = await SuperAdminDataService.suspendSchool(school.id, 'Manual suspension by super admin');
            if (result.success) {
              Alert.alert(t('common.success'), t('admin.messages.schoolSuspended'));
              fetchDashboardData(); // Refresh data
            } else {
              Alert.alert(t('common.error'), result.error || t('admin.messages.suspendFailed'));
            }
          }
        }
      ]
    );
  };

  // Handle user suspension
  const handleSuspendUser = (user: UserOverview) => {
    Alert.alert(
      t('admin.actions.suspend'),
      t('admin.messages.confirmSuspendUser', { name: user.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.actions.suspend'),
          style: 'destructive',
          onPress: async () => {
            const result = await SuperAdminDataService.suspendUser(user.id, 'Manual suspension by super admin');
            if (result.success) {
              Alert.alert(t('common.success'), t('admin.messages.userSuspended'));
              fetchDashboardData(); // Refresh data
            } else {
              Alert.alert(t('common.error'), result.error || t('admin.messages.userSuspendFailed'));
            }
          }
        }
      ]
    );
  };

  // Reset AI usage for a user
  const handleResetAIForUser = async (user: UserOverview) => {
    const res = await SuperAdminDataService.resetAIUsage({ scope: 'user', targetUserId: user.id, mode: 'soft', reason: 'superadmin reset from dashboard' });
    if (res.success) Alert.alert(t('admin.messages.aiUsageResetTitle'), t('admin.messages.aiUsageResetUser', { name: user.name }));
    else Alert.alert(t('common.error'), res.error || t('admin.messages.resetFailed'));
  };

  // Toggle tester overage for a user
  const handleToggleOverageForUser = async (user: UserOverview, enabled: boolean) => {
    const res = await SuperAdminDataService.setTesterOverage({ scope: 'user', targetUserId: user.id, enabled, pricePerUnit: 0 });
    if (res.success) Alert.alert(enabled ? t('admin.messages.overageEnabledTitle') : t('admin.messages.overageDisabledTitle'), enabled ? t('admin.messages.userCanBypassCaps', { name: user.name }) : t('admin.messages.userCanNoLongerBypassCaps', { name: user.name }));
    else Alert.alert(t('common.error'), res.error || t('admin.messages.updateFailed'));
  };

  // School-wide actions
  const handleResetAIForSchool = async (school: SchoolOverview) => {
    const res = await SuperAdminDataService.resetAIUsage({ scope: 'preschool', targetPreschoolId: school.id, mode: 'soft', reason: 'superadmin reset for school' });
    if (res.success) Alert.alert(t('admin.messages.aiUsageResetTitle'), t('admin.messages.aiUsageResetUser', { name: school.name }));
    else Alert.alert(t('common.error'), res.error || t('admin.messages.resetFailed'));
  };

  const handleToggleOverageForSchool = async (school: SchoolOverview, enabled: boolean) => {
    const res = await SuperAdminDataService.setTesterOverage({ scope: 'preschool', targetPreschoolId: school.id, enabled, pricePerUnit: 0 });
    if (res.success) Alert.alert(enabled ? t('admin.messages.schoolOverageEnabledTitle') : t('admin.messages.schoolOverageDisabledTitle'), enabled ? t('admin.messages.schoolCanBypassCaps', { name: school.name }) : t('admin.messages.schoolCanNoLongerBypassCaps', { name: school.name }));
    else Alert.alert(t('common.error'), res.error || t('admin.messages.updateFailed'));
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
  const renderStatsCards = (stats: PlatformStats) => {
    const cards = [
      { icon: 'building.2.fill', title: t('admin.stats.schools'), value: String(stats.total_schools), color: '#3B82F6' },
      { icon: 'person.3.fill', title: t('admin.stats.totalUsers'), value: String(stats.total_users), color: '#10B981' },
      { icon: 'graduationcap', title: t('admin.stats.students'), value: String(stats.total_students), color: '#8B5CF6' },
      { icon: 'creditcard.fill', title: t('admin.stats.monthlyRevenue'), value: `R ${stats.monthly_revenue.toLocaleString('en-ZA')}`, color: '#F59E0B' },
      { icon: 'chart.line.uptrend.xyaxis', title: t('admin.stats.growthRate'), value: `${stats.growth_rate}%`, color: '#EF4444' },
      { icon: 'cpu', title: t('admin.stats.aiRequests'), value: stats.ai_usage_count.toLocaleString(), color: '#6366F1' },
    ];

    return (
      <View style={styles.statsGrid}>
        {cards.map((c, idx) => (
          <View key={`${c.title}-${idx}`} style={[styles.statCard, { borderTopColor: c.color }]}>
            <View style={styles.statHeaderRow}>
              <IconSymbol name={c.icon as any} size={20} color={c.color} />
              <Text style={styles.statTitle}>{c.title}</Text>
            </View>
            <Text style={[styles.statValue, { color: c.color }]}>{c.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render system health indicator
  const renderSystemHealth = (health: SystemHealth) => (
    <View style={styles.healthCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>🖥️ {t('admin.health.title')}</Text>
        <View
          style={[
            styles.healthStatus,
            { backgroundColor: health.database_status === 'healthy' ? '#10B981' : '#EF4444' }
          ]}
        >
          <Text style={styles.healthStatusText}>
            {health.database_status === 'healthy' ? t('admin.health.healthy') : t('admin.health.issues')}
          </Text>
        </View>
      </View>

      <View style={styles.healthMetrics}>
        <View style={styles.healthMetric}>
          <Text style={styles.healthMetricLabel}>{t('admin.health.apiResponse')}</Text>
          <Text style={styles.healthMetricValue}>{health.api_response_time}ms</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthMetricLabel}>{t('admin.health.uptime')}</Text>
          <Text style={styles.healthMetricValue}>{health.uptime_percentage}%</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthMetricLabel}>{t('admin.health.storage')}</Text>
          <Text style={styles.healthMetricValue}>{health.storage_usage_percentage}%</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthMetricLabel}>{t('admin.health.connections')}</Text>
          <Text style={styles.healthMetricValue}>{health.active_connections}</Text>
        </View>
      </View>
    </View>
  );

  // Render schools list
  const renderSchoolsList = (schools: SchoolOverview[]) => (
    <View style={styles.schoolsList}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏫 {t('admin.super.recentSchools')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateSchoolModal(true)}
        >
          <IconSymbol name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{t('admin.actions.createSchool')}</Text>
        </TouchableOpacity>
      </View>

      {schools.map((school) => (
        <View key={school.id} style={styles.schoolCard}>
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{school.name}</Text>
            <Text style={styles.schoolDetails}>
              {school.user_count} {t('admin.stats.totalUsers').toLowerCase()} • {school.student_count} {t('admin.stats.students').toLowerCase()}
            </Text>
            <Text style={styles.schoolDetails}>
              {t('common.lastActive')}: {new Date(school.last_activity).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.schoolActions}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(school.subscription_status) }]}>
              <Text style={styles.statusText}>{school.subscription_status}</Text>
            </View>

            {/* Enable tester overage for entire school */}
            <TouchableOpacity
              style={styles.actionButtonInfo}
              onPress={() => handleToggleOverageForSchool(school, true)}
            >
              <IconSymbol name="bolt.fill" size={16} color="#2563EB" />
            </TouchableOpacity>
            {/* Disable tester overage for entire school */}
            <TouchableOpacity
              style={styles.actionButtonOff}
              onPress={() => handleToggleOverageForSchool(school, false)}
            >
              <IconSymbol name="bolt.slash" size={16} color="#F97316" />
            </TouchableOpacity>
            {/* Reset AI usage baseline for school */}
            <TouchableOpacity
              style={styles.actionButtonNeutral}
              onPress={() => handleResetAIForSchool(school)}
            >
              <IconSymbol name="arrow.counterclockwise" size={16} color="#374151" />
            </TouchableOpacity>
            {/* Suspend school */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSuspendSchool(school)}
            >
              <IconSymbol name="exclamationmark.triangle" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  // Render users list
  const renderUsersList = (users: UserOverview[]) => (
    <View style={styles.usersList}>
      <Text style={styles.sectionTitle}>👥 {t('admin.super.recentUsers')}</Text>

      {users.slice(0, 10).map((user) => (
        <View key={user.id} style={styles.userCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userDetails}>
              {user.role} • {user.school_name || t('common.noSchool')}
            </Text>
            <Text style={styles.userDetails}>
              {t('common.lastLogin')}: {user.last_login ? new Date(user.last_login).toLocaleDateString() : t('common.never')}
            </Text>
          </View>

          <View style={styles.userActions}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.account_status) }]}>
              <Text style={styles.statusText}>{user.account_status}</Text>
            </View>

            {/* Enable tester overage for this user */}
            <TouchableOpacity
              style={styles.actionButtonInfo}
              onPress={() => handleToggleOverageForUser(user, true)}
            >
              <IconSymbol name="bolt.fill" size={16} color="#2563EB" />
            </TouchableOpacity>
            {/* Disable tester overage for this user */}
            <TouchableOpacity
              style={styles.actionButtonOff}
              onPress={() => handleToggleOverageForUser(user, false)}
            >
              <IconSymbol name="bolt.slash" size={16} color="#F97316" />
            </TouchableOpacity>
            {/* Reset AI usage baseline for this user */}
            <TouchableOpacity
              style={styles.actionButtonNeutral}
              onPress={() => handleResetAIForUser(user)}
            >
              <IconSymbol name="arrow.counterclockwise" size={16} color="#374151" />
            </TouchableOpacity>
            {/* Suspend */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSuspendUser(user)}
            >
              <IconSymbol name="person.badge.minus" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  // Render onboarding section
  const renderOnboardingSection = () => {
    // Use the pending approvals data to show onboarding requests
    const pendingCount = dashboardData?.pending_approvals?.schools || 0;
    
    return (
      <View style={styles.onboardingSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎓 {t('admin.super.onboarding.title')}</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/screens/schools-management')}
          >
            <Text style={styles.viewAllButtonText}>{t('common.seeAll')}</Text>
            <IconSymbol name="arrow.right" size={14} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.onboardingStats}>
          <View style={styles.onboardingStatCard}>
            <IconSymbol name="clock.fill" size={24} color="#F59E0B" />
            <Text style={styles.onboardingStatValue}>{pendingCount}</Text>
            <Text style={styles.onboardingStatLabel}>{t('status.pending')}</Text>
          </View>
          <View style={styles.onboardingStatCard}>
            <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
            <Text style={styles.onboardingStatValue}>{dashboardData?.pending_approvals?.schools || 0}</Text>
            <Text style={styles.onboardingStatLabel}>{t('dashboard.cards.thisMonth')}</Text>
          </View>
          <View style={styles.onboardingStatCard}>
            <IconSymbol name="building.2.fill" size={24} color="#3B82F6" />
            <Text style={styles.onboardingStatValue}>{dashboardData?.platform_stats?.total_schools || 0}</Text>
            <Text style={styles.onboardingStatLabel}>{t('admin.super.onboarding.totalSchools')}</Text>
          </View>
        </View>

        {/* Pending Requests List */}
        {pendingCount > 0 ? (
          <View style={styles.pendingRequestsList}>
            <Text style={styles.subsectionTitle}>{t('admin.super.onboarding.recentRequests')}</Text>
            {/* Show placeholder for now - would need to fetch actual onboarding requests */}
            <View style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestSchoolName}>{t('admin.super.onboarding.loadingRequests')}</Text>
                <Text style={styles.requestDetails}>{t('admin.super.onboarding.checkManagement')}</Text>
              </View>
              <TouchableOpacity 
                style={styles.goToRequestsButton}
                onPress={() => router.push('/screens/schools-management')}
              >
                <Text style={styles.goToRequestsButtonText}>{t('admin.super.onboarding.goToRequests')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <EmptyState
            icon={<IconSymbol name="tray" size={48} color="#9CA3AF" />}
            title={t('admin.super.onboarding.noPendingTitle')}
            description={t('admin.super.onboarding.noPendingDescription')}
            primaryAction={{ label: t('admin.actions.createSchool'), onPress: () => setShowCreateSchoolModal(true) }}
          />
        )}

        {/* Quick Actions */}
        <View style={styles.onboardingActions}>
          <TouchableOpacity 
            style={styles.onboardingActionButton}
            onPress={() => router.push('/screens/schools-management')}
          >
            <IconSymbol name="list.bullet" size={20} color="#FFFFFF" />
            <Text style={styles.onboardingActionText}>{t('admin.actions.manageAllRequests')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.onboardingActionButton, styles.secondaryActionButton]}
            onPress={() => setShowCreateSchoolModal(true)}
          >
            <IconSymbol name="plus.circle" size={20} color="#8B5CF6" />
            <Text style={[styles.onboardingActionText, styles.onboardingActionTextSecondary]}>{t('admin.actions.createSchoolManually')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render activity feed
  const renderActivityFeed = (activities: PlatformActivity[]) => (
    <View style={styles.activityFeed}>
      <Text style={styles.sectionTitle}>📊 {t('admin.super.platformActivity')}</Text>

      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityCard}>
          <View style={[styles.activitySeverity, { backgroundColor: getSeverityColor(activity.severity) }]} />

          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityDescription}>{activity.description}</Text>
            <Text style={styles.activityTime}>
              {new Date(activity.timestamp).toLocaleString()}
            </Text>
          </View>

          <IconSymbol
            name={activity.type === 'security_alert' ? 'exclamationmark.shield' : 'info.circle'}
            size={20}
            color={getSeverityColor(activity.severity)}
          />
        </View>
      ))}
    </View>
  );

  // Tab navigation (bottom bar)
  const renderTabNavigation = () => (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={[styles.tabNavigationBottom, { paddingBottom: insets.bottom, borderTopWidth: 0 }]}>
      
      {[
        { key: 'overview', label: t('admin.tabs.overview'), icon: 'chart.bar' },
        { key: 'schools', label: t('admin.tabs.schools'), icon: 'building.2' },
        { key: 'users', label: t('admin.tabs.users'), icon: 'person.3' },
        { key: 'activity', label: t('admin.tabs.activity'), icon: 'clock' },
        { key: 'system', label: t('admin.tabs.system'), icon: 'gear' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabButton, selectedTab === tab.key && styles.tabButtonActive]}
          onPress={() => setSelectedTab(tab.key as any)}
        >
          <IconSymbol
            name={tab.icon as any}
            size={16}
            color={selectedTab === tab.key ? '#8B5CF6' : '#6B7280'}
          />
          <Text style={[styles.tabLabel, selectedTab === tab.key && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Loading state
  if (loading && !refreshing && !dashboardData) {
    return (
      <View style={styles.container}>
      <MobileHeader
        user={userProfile}
        schoolName={t('common.appName')}
        onNotificationsPress={() => {/* TODO: Implement notifications */ }}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={0}
      />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>{t('dashboard.loading')}</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !loading && !refreshing) {
    return (
      <View style={styles.container}>
      <MobileHeader
        user={userProfile}
        schoolName={t('common.appName')}
        onNotificationsPress={() => {/* TODO: Implement notifications */ }}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={0}
      />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>{t('errors.forbidden')}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!dashboardData) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <MobileHeader
        user={userProfile}
        schoolName={t('common.appName')}
        onNotificationsPress={() => {/* TODO: Implement notifications */ }}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={dashboardData.alerts.length}
      />

      {/* Content */}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 64 }]}
      >
        {/* Page Header - Google-like styling to match other dashboards */}
        <View style={styles.modernHeaderSection}>
          <View style={styles.titleBlock}>
            <Text
              style={[
                styles.modernTitle,
                (isVerySmallScreen ? styles.modernTitleVerySmall : (isSmallScreen ? styles.modernTitleSmall : styles.modernTitleDefault))
              ]}
            >
              {t('admin.super.pageTitle')}
            </Text>
            <Text
              style={[
                styles.modernSubtitle,
                (isSmallScreen ? styles.modernSubtitleSmall : styles.modernSubtitleDefault)
              ]}
            >
              {t('admin.super.pageSubtitle')}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Button text={t('admin.actions.createSchool')} onPress={() => setShowCreateSchoolModal(true)} />
          </View>
        </View>

        {/* Alerts Section */}
        {dashboardData.alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>⚠️ {t('admin.super.platformAlerts')}</Text>
            {dashboardData.alerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, { borderLeftColor: getSeverityColor(alert.priority) }]}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <>
            {renderStatsCards(dashboardData.platform_stats)}
            {renderSystemHealth(dashboardData.system_health)}

            {/* Pending Approvals */}
            <View style={styles.approvalsSection}>
              <Text style={styles.sectionTitle}>📋 {t('admin.super.pendingApprovals')}</Text>
              <View style={styles.approvalsGrid}>
                <View style={styles.approvalCard}>
                  <Text style={styles.approvalCount}>{dashboardData.pending_approvals.schools}</Text>
                  <Text style={styles.approvalLabel}>{t('admin.stats.schools')}</Text>
                </View>
                <View style={styles.approvalCard}>
                  <Text style={styles.approvalCount}>{dashboardData.pending_approvals.users}</Text>
                  <Text style={styles.approvalLabel}>{t('admin.tabs.users')}</Text>
                </View>
                <View style={styles.approvalCard}>
                  <Text style={styles.approvalCount}>{dashboardData.pending_approvals.content_reports}</Text>
                  <Text style={styles.approvalLabel}>{t('nav.reports')}</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>⚡ {t('dashboard.quickActions')}</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => router.push('/screens/schools-management')}
                >
                  <IconSymbol name="person.badge.plus" size={24} color="#8B5CF6" />
                  <Text style={styles.quickActionLabel}>{t('admin.actions.manageOnboarding')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => setSelectedTab('activity')}
                >
                  <IconSymbol name="chart.bar.doc.horizontal" size={24} color="#10B981" />
                  <Text style={styles.quickActionLabel}>{t('admin.actions.platformReports')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => setSelectedTab('system')}
                >
                  <IconSymbol name="gear.badge" size={24} color="#F59E0B" />
                  <Text style={styles.quickActionLabel}>{t('admin.actions.systemSettings')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => setSelectedTab('users')}
                >
                  <IconSymbol name="person.badge.shield.checkmark" size={24} color="#3B82F6" />
                  <Text style={styles.quickActionLabel}>{t('admin.actions.userManagement')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {selectedTab === 'schools' && renderSchoolsList(dashboardData.recent_schools)}
        {selectedTab === 'users' && renderUsersList(dashboardData.recent_users)}
        {selectedTab === 'activity' && renderActivityFeed(dashboardData.platform_activity)}

        {selectedTab === 'system' && (
          <View style={styles.systemSection}>
            {renderSystemHealth(dashboardData.system_health)}

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>⚡ {t('dashboard.quickActions')}</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={styles.quickActionCard}>
                  <IconSymbol name="plus.app" size={24} color="#3B82F6" />
                  <Text style={styles.quickActionLabel}>{t('admin.actions.createSchool')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard}>
                  <IconSymbol name="chart.bar.doc.horizontal" size={24} color="#10B981" />
                  <Text style={styles.quickActionLabel}>{t('admin.actions.platformReports')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard}>
                  <IconSymbol name="gear.badge" size={24} color="#F59E0B" />
                  <Text style={styles.quickActionLabel}>{t('admin.actions.systemSettings')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard}>
                  <IconSymbol name="person.badge.shield.checkmark" size={24} color="#8B5CF6" />
                  <Text style={styles.quickActionLabel}>{t('admin.actions.userManagement')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Bottom Tab Navigation */}
      {renderTabNavigation()}

      {/* Create School Modal */}
      <CreateSchoolModal
        visible={showCreateSchoolModal}
        onClose={() => setShowCreateSchoolModal(false)}
        onSuccess={handleSchoolCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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

  // Bottom Tab Navigation
  tabNavigationBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#8B5CF6',
    fontWeight: '600',
  },

  // Stats Cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    width: '48%',
    borderTopWidth: 3,
    ...shadow(2),
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },

  // System Health
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
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

  // Schools List
  schoolsList: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  schoolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow(2),
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
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  actionButtonNeutral: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionButtonInfo: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  actionButtonOff: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
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
    ...shadow(2),
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

  // Activity Feed
  activityFeed: {
    paddingHorizontal: 20,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow(2),
  },
  activitySeverity: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
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
    ...shadow(2),
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
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
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
    ...shadow(2),
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },

  // Modern Google-like header section
  modernHeaderSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    paddingRight: 12,
    minWidth: 0,
  },
  modernTitle: {
    fontWeight: '300',
    letterSpacing: -0.5,
    color: '#111827',
    marginBottom: 4,
  },
  modernTitleDefault: { fontSize: 32, lineHeight: 40 },
  modernTitleSmall: { fontSize: 28, lineHeight: 34 },
  modernTitleVerySmall: { fontSize: 24, lineHeight: 30 },
  modernSubtitle: {
    color: '#6B7280',
    opacity: 0.85,
  },
  modernSubtitleDefault: { fontSize: 14, lineHeight: 20 },
  modernSubtitleSmall: { fontSize: 13, lineHeight: 20 },
  headerActions: {
    justifyContent: 'center',
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
    height: 20,
  },

  // Onboarding Section Styles
  onboardingSection: {
    paddingHorizontal: 20,
  },
  onboardingStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  onboardingStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...shadow(2),
  },
  onboardingStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  onboardingStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  pendingRequestsList: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow(2),
  },
  requestInfo: {
    flex: 1,
  },
  requestSchoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  requestDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  goToRequestsButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goToRequestsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  onboardingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  onboardingActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryActionButton: {
    backgroundColor: '#F3F4F6',
  },
  onboardingActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  onboardingActionTextSecondary: {
    color: '#8B5CF6',
  },
});

export default SuperAdminDashboard;
