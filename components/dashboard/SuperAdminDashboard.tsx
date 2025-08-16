/* eslint-disable */
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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'schools' | 'users' | 'activity' | 'system'>('overview');
  const [showCreateSchoolModal, setShowCreateSchoolModal] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SuperAdminDataService.getSuperAdminDashboardData(userId);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching super admin dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
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

  // Handle navigation
  const handleNavigate = (route: string) => {

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

  // Handle school suspension
  const handleSuspendSchool = (school: SchoolOverview) => {
    Alert.alert(
      'Suspend School',
      `Are you sure you want to suspend "${school.name}"? This will disable access for all users at this school.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            const result = await SuperAdminDataService.suspendSchool(school.id, 'Manual suspension by super admin');
            if (result.success) {
              Alert.alert('Success', 'School has been suspended successfully.');
              fetchDashboardData(); // Refresh data
            } else {
              Alert.alert('Error', result.error || 'Failed to suspend school.');
            }
          }
        }
      ]
    );
  };

  // Handle user suspension
  const handleSuspendUser = (user: UserOverview) => {
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend "${user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            const result = await SuperAdminDataService.suspendUser(user.id, 'Manual suspension by super admin');
            if (result.success) {
              Alert.alert('Success', 'User has been suspended successfully.');
              fetchDashboardData(); // Refresh data
            } else {
              Alert.alert('Error', result.error || 'Failed to suspend user.');
            }
          }
        }
      ]
    );
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
  const renderStatsCards = (stats: PlatformStats) => (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <IconSymbol name="building.2" size={24} color="#3B82F6" />
        <Text style={styles.statValue}>{stats.total_schools}</Text>
        <Text style={styles.statLabel}>Schools</Text>
      </View>
      <View style={styles.statCard}>
        <IconSymbol name="person.3" size={24} color="#10B981" />
        <Text style={styles.statValue}>{stats.total_users}</Text>
        <Text style={styles.statLabel}>Total Users</Text>
      </View>
      <View style={styles.statCard}>
        <IconSymbol name="graduationcap" size={24} color="#8B5CF6" />
        <Text style={styles.statValue}>{stats.total_students}</Text>
        <Text style={styles.statLabel}>Students</Text>
      </View>
      <View style={styles.statCard}>
        <IconSymbol name="dollarsign" size={24} color="#F59E0B" />
        <Text style={styles.statValue}>R {stats.monthly_revenue.toLocaleString('en-ZA')}</Text>
        <Text style={styles.statLabel}>Monthly Revenue</Text>
      </View>
      <View style={styles.statCard}>
        <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color="#EF4444" />
        <Text style={styles.statValue}>{stats.growth_rate}%</Text>
        <Text style={styles.statLabel}>Growth Rate</Text>
      </View>
      <View style={styles.statCard}>
        <IconSymbol name="cpu" size={24} color="#6366F1" />
        <Text style={styles.statValue}>{stats.ai_usage_count.toLocaleString()}</Text>
        <Text style={styles.statLabel}>AI Requests</Text>
      </View>
    </View>
  );

  // Render system health indicator
  const renderSystemHealth = (health: SystemHealth) => (
    <View style={styles.healthCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>🖥️ System Health</Text>
        <View style={[styles.healthStatus, { backgroundColor: health.database_status === 'healthy' ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.healthStatusText}>
            {health.database_status === 'healthy' ? 'Healthy' : 'Issues'}
          </Text>
        </View>
      </View>

      <View style={styles.healthMetrics}>
        <View style={styles.healthMetric}>
          <Text style={styles.healthMetricLabel}>API Response</Text>
          <Text style={styles.healthMetricValue}>{health.api_response_time}ms</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthMetricLabel}>Uptime</Text>
          <Text style={styles.healthMetricValue}>{health.uptime_percentage}%</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthMetricLabel}>Storage</Text>
          <Text style={styles.healthMetricValue}>{health.storage_usage_percentage}%</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthMetricLabel}>Connections</Text>
          <Text style={styles.healthMetricValue}>{health.active_connections}</Text>
        </View>
      </View>
    </View>
  );

  // Render schools list
  const renderSchoolsList = (schools: SchoolOverview[]) => (
    <View style={styles.schoolsList}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏫 Recent Schools</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateSchoolModal(true)}
        >
          <IconSymbol name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add School</Text>
        </TouchableOpacity>
      </View>

      {schools.map((school) => (
        <View key={school.id} style={styles.schoolCard}>
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{school.name}</Text>
            <Text style={styles.schoolDetails}>
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
      <Text style={styles.sectionTitle}>👥 Recent Users</Text>

      {users.slice(0, 10).map((user) => (
        <View key={user.id} style={styles.userCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userDetails}>
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

  // Render activity feed
  const renderActivityFeed = (activities: PlatformActivity[]) => (
    <View style={styles.activityFeed}>
      <Text style={styles.sectionTitle}>📊 Platform Activity</Text>

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
    <View style={styles.tabNavigationBottom}>
      {[
        { key: 'overview', label: 'Overview', icon: 'chart.bar' },
        { key: 'schools', label: 'Schools', icon: 'building.2' },
        { key: 'users', label: 'Users', icon: 'person.3' },
        { key: 'activity', label: 'Activity', icon: 'clock' },
        { key: 'system', label: 'System', icon: 'gear' }
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
          schoolName="EduDash Pro Platform"
          onNotificationsPress={() => {/* TODO: Implement notifications */}}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading platform data...</Text>
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
          schoolName="EduDash Pro Platform"
          onNotificationsPress={() => {/* TODO: Implement notifications */}}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
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
        schoolName="EduDash Pro Platform"
        onNotificationsPress={() => {/* TODO: Implement notifications */}}
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
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Text */}
        <View style={styles.headerTextSection}>
          <Text style={styles.greeting}>🔱 Super Admin Dashboard</Text>
          <Text style={styles.subtitle}>
            Manage the entire EduDash Pro platform
          </Text>
        </View>

        {/* Alerts Section */}
        {dashboardData.alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>⚠️ Platform Alerts</Text>
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
              <Text style={styles.sectionTitle}>📋 Pending Approvals</Text>
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
              <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={styles.quickActionCard}>
                  <IconSymbol name="plus.app" size={24} color="#3B82F6" />
                  <Text style={styles.quickActionLabel}>Create School</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard}>
                  <IconSymbol name="chart.bar.doc.horizontal" size={24} color="#10B981" />
                  <Text style={styles.quickActionLabel}>Platform Reports</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard}>
                  <IconSymbol name="gear.badge" size={24} color="#F59E0B" />
                  <Text style={styles.quickActionLabel}>System Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard}>
                  <IconSymbol name="person.badge.shield.checkmark" size={24} color="#8B5CF6" />
                  <Text style={styles.quickActionLabel}>User Management</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Tab Navigation */}
      {renderTabNavigation()}
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
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (screenWidth - 60) / 3, // 3 cards per row with gaps
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  quickActionsSection: {
    marginTop: 20,
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
});

export default SuperAdminDashboard;
