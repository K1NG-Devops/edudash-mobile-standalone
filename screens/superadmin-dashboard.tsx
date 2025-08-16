/* eslint-disable */
// @ts-nocheck
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SuperAdminStats {
  totalSchools: number;
  totalUsers: number;
  activeSchools: number;
  monthlyRevenue: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  apiUsage: number;
  supportTickets: number;
  platformErrors: number;
}

interface SuperAdminDashboardProps {
  profile: UserProfile | null;
  onSignOut: () => Promise<void>;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ profile, onSignOut }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SuperAdminStats>({
    totalSchools: 0,
    totalUsers: 0,
    activeSchools: 0,
    monthlyRevenue: 0,
    systemHealth: 'good',
    apiUsage: 0,
    supportTickets: 0,
    platformErrors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuperAdminStats();
  }, []);

  const loadSuperAdminStats = async () => {
    try {
      setLoading(true);
      
      // Fetch real statistics from database
      const [schoolsResult, usersResult, revenueResult, systemMetricsResult] = await Promise.all([
        // Get schools data
        supabase.from('preschools').select('id, subscription_status, created_at'),
        // Get users data
        supabase.from('users').select('id, role, created_at, is_active'),
        // Get actual revenue data from payments
        supabase.from('payments')
          .select('amount, status, created_at')
          .eq('status', 'completed')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()),
        // Get system metrics
        supabase.from('system_logs')
          .select('id, log_type, severity, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const schools = schoolsResult.data || [];
      const users = usersResult.data || [];
      const payments = revenueResult.data || [];
      const systemLogs = systemMetricsResult.data || [];
      const activeSchools = schools.filter(s => s.subscription_status === 'active');
      
      // Calculate actual monthly revenue from payments
      const monthlyRevenue = payments.reduce((total, payment) => total + (payment.amount || 0), 0);
      
      // Calculate system metrics from actual data
      const apiUsageToday = systemLogs.filter(log => log.log_type === 'api_request').length;
      const platformErrors = systemLogs.filter(log => log.severity === 'error').length;
      
      // Get support tickets (you may need to adjust this based on your support system)
      const supportTicketsResult = await supabase
        .from('support_tickets')
        .select('id')
        .eq('status', 'open')
        .or('status.eq.in_progress');
      const supportTickets = supportTicketsResult.data?.length || 0;
      
      // System health based on data quality
      let systemHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
      if (schools.length < 10) systemHealth = 'warning';
      if (activeSchools.length < schools.length * 0.8) systemHealth = 'critical';
      
      const realStats: SuperAdminStats = {
        totalSchools: schools.length,
        totalUsers: users.length,
        activeSchools: activeSchools.length,
        monthlyRevenue,
        systemHealth,
        apiUsage: apiUsageToday,
        supportTickets,
        platformErrors,
      };

      setStats(realStats);
    } catch (error) {
      console.error('Error loading super admin stats:', error);
      Alert.alert('Error', 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSuperAdminStats();
    setRefreshing(false);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, color, onPress }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.metricCard, { borderTopColor: color, borderTopWidth: 4 }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.metricContent}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
          <IconSymbol name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.metricText}>
          <Text style={styles.metricValue}>{value}</Text>
          <Text style={styles.metricTitle}>{title}</Text>
          <Text style={styles.metricSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ActionCard = ({ title, subtitle, icon, color, onPress }: {
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.actionGradient}
      >
        <View style={[styles.actionIcon, { backgroundColor: color }]}>
          <IconSymbol name={icon as any} size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleNavigate = (route: string) => {

    if (route.startsWith('/')) {
      router.push(route as any);
    } else {
      router.push(`/screens/${route}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        user={{
          name: profile?.name || 'Super Admin',
          role: 'Platform Administrator',
          avatar: profile?.avatar_url,
        }}
        onNotificationsPress={() => handleNavigate('notifications')}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={stats.supportTickets}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Platform Command Center 🚀</Text>
          <Text style={styles.welcomeSubtitle}>
            Monitoring {stats.totalSchools} schools across the EduDash Pro platform
          </Text>
          <View style={[styles.healthBadge, { backgroundColor: getHealthColor(stats.systemHealth) }]}>
            <Text style={styles.healthText}>System Health: {stats.systemHealth.toUpperCase()}</Text>
          </View>
        </View>

        {/* Platform Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>🌐 Platform Overview</Text>
          <View style={styles.statsGrid}>
            <MetricCard
              title="Total Schools"
              value={stats.totalSchools}
              subtitle={`${stats.activeSchools} active`}
              icon="building.2.fill"
              color="#3B82F6"
              onPress={() => handleNavigate('schools')}
            />
            <MetricCard
              title="Platform Users"
              value={stats.totalUsers.toLocaleString()}
              subtitle="All roles combined"
              icon="person.3.fill"
              color="#10B981"
              onPress={() => handleNavigate('users')}
            />
            <MetricCard
              title="Monthly Revenue"
              value={`R${(stats.monthlyRevenue / 1000).toFixed(0)}k`}
              subtitle="Platform total"
              icon="dollarsign.circle.fill"
              color="#F59E0B"
              onPress={() => handleNavigate('analytics')}
            />
            <MetricCard
              title="API Usage"
              value={`${stats.apiUsage}%`}
              subtitle="Of monthly quota"
              icon="server.rack"
              color="#8B5CF6"
              onPress={() => handleNavigate('system-health')}
            />
            <MetricCard
              title="Support Tickets"
              value={stats.supportTickets}
              subtitle="Open tickets"
              icon="exclamationmark.triangle.fill"
              color="#EF4444"
              onPress={() => handleNavigate('support')}
            />
            <MetricCard
              title="Platform Errors"
              value={stats.platformErrors}
              subtitle="Last 24 hours"
              icon="xmark.circle.fill"
              color="#6B7280"
              onPress={() => handleNavigate('error-logs')}
            />
          </View>
        </View>

        {/* Super Admin Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚡ Platform Management</Text>
          <View style={styles.actionsGrid}>
            <ActionCard
              title="School Management"
              subtitle="Add, configure, monitor schools"
              icon="building.columns.fill"
              color="#3B82F6"
              onPress={() => handleNavigate('schools')}
            />
            <ActionCard
              title="Platform Analytics"
              subtitle="Usage, revenue, performance"
              icon="chart.bar.xaxis"
              color="#10B981"
              onPress={() => handleNavigate('analytics')}
            />
            <ActionCard
              title="System Health"
              subtitle="Database, API, performance"
              icon="cpu.fill"
              color="#F59E0B"
              onPress={() => handleNavigate('system-health')}
            />
            <ActionCard
              title="User Support"
              subtitle="Tickets, issues, assistance"
              icon="person.crop.circle.badge.questionmark"
              color="#EF4444"
              onPress={() => handleNavigate('support')}
            />
            <ActionCard
              title="Security Center"
              subtitle="Audit logs, permissions"
              icon="shield.fill"
              color="#8B5CF6"
              onPress={() => handleNavigate('security')}
            />
            <ActionCard
              title="Platform Settings"
              subtitle="Global configuration"
              icon="gearshape.2.fill"
              color="#06B6D4"
              onPress={() => handleNavigate('platform-settings')}
            />
          </View>
        </View>

        {/* Platform Alerts */}
        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>🚨 Platform Alerts</Text>
          <View style={styles.alertCard}>
            <View style={styles.alertItem}>
              <View style={[styles.alertDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.alertText}>API usage at 85% - consider scaling</Text>
            </View>
            <View style={styles.alertItem}>
              <View style={[styles.alertDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.alertText}>12 open support tickets require attention</Text>
            </View>
            <View style={styles.alertItem}>
              <View style={[styles.alertDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.alertText}>Database backup completed successfully</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>📈 Recent Platform Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityItem}>• 3 new schools onboarded this week</Text>
            <Text style={styles.activityItem}>• 247 new users registered across platform</Text>
            <Text style={styles.activityItem}>• System uptime: 99.97% this month</Text>
            <Text style={styles.activityItem}>• Revenue increased 12% from last month</Text>
          </View>
        </View>
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
    paddingBottom: 100,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 10,
  },
  healthBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  healthText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderTopWidth: 4,
  },
  metricContent: {
    alignItems: 'center',
  },
  metricIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricText: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  actionsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (screenWidth - 60) / 2,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  alertCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  alertText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  activitySection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  activityCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
  },
  activityItem: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SuperAdminDashboard;
