 
// @ts-nocheck
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useT } from '@/i18n';
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

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
}

interface AdminDashboardProps {
  profile: UserProfile | null;
  onSignOut: () => Promise<void>;
}

const AdminDashboardScreen: React.FC<AdminDashboardProps> = ({ profile, onSignOut }) => {
  const { t } = useT();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      
      // Fetch user statistics
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('preschool_id', profile?.preschool_id);

      if (usersError) throw usersError;

      // Calculate stats
      const totalUsers = users?.length || 0;
      const totalStudents = users?.filter(u => u.role === 'student')?.length || 0;
      const totalTeachers = users?.filter(u => u.role === 'teacher')?.length || 0;
      const totalParents = users?.filter(u => u.role === 'parent')?.length || 0;
      const activeUsers = users?.filter(u => u.is_active)?.length || 0;

      // Fetch financial data (mock for now)
      const totalRevenue = 45000;
      const monthlyRevenue = 8500;
      const pendingPayments = 12;

      setStats({
        totalUsers,
        totalStudents,
        totalTeachers,
        totalParents,
        activeUsers,
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.adminStatsLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminStats();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color, onPress }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <IconSymbol name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, subtitle, icon, color, onPress }: {
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        user={{
          name: profile?.name || 'Admin',
          role: profile?.role || 'preschool_admin',
          avatar: profile?.avatar_url,
        }}
        onNotificationsPress={() => { /* TODO: Implement notifications */ }}
        onSignOut={onSignOut}
        onNavigate={(screen) => router.push(screen as any)}
        notificationCount={5}
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
          <Text style={styles.welcomeTitle}>{getGreeting()} 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            {profile?.role === 'superadmin' ? t('admin.super.pageTitle') : t('dashboard.adminDashboard')}
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 {t('dashboard.overview')}</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title={t('admin.stats.totalUsers')}
              value={stats.totalUsers}
              icon="person.3.fill"
              color="#3B82F6"
              onPress={() => router.push('/screens/users')}
            />
            <StatCard
              title={t('nav.students')}
              value={stats.totalStudents}
              icon="graduationcap.fill"
              color="#10B981"
              onPress={() => router.push('/screens/students')}
            />
            <StatCard
              title={t('nav.teachers')}
              value={stats.totalTeachers}
              icon="person.2.square.stack.fill"
              color="#F59E0B"
              onPress={() => router.push('/screens/teachers')}
            />
            <StatCard
              title={t('nav.parents')}
              value={stats.totalParents}
              icon="heart.fill"
              color="#EF4444"
              onPress={() => router.push('/screens/parents')}
            />
            <StatCard
              title={t('admin.stats.activeUsers')}
              value={stats.activeUsers}
              icon="checkmark.circle.fill"
              color="#8B5CF6"
            />
            <StatCard
              title={t('dashboard.metrics.monthlyRevenue')}
              value={`R${stats.monthlyRevenue.toLocaleString()}`}
              icon="dollarsign.circle.fill"
              color="#06B6D4"
              onPress={() => router.push('/(tabs)/payment')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚡ {t('dashboard.quickActions')}</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              title={t('admin.actions.userManagement')}
              subtitle={t('admin.quick.userManagementSubtitle')}
              icon="person.crop.circle.badge.plus"
              color="#3B82F6"
              onPress={() => router.push('/screens/users')}
            />
            <QuickActionCard
              title={t('finance.overview')}
              subtitle={t('admin.quick.financialReportsSubtitle')}
              icon="chart.bar.fill"
              color="#10B981"
              onPress={() => router.push('/(tabs)/payment')}
            />
            <QuickActionCard
              title={t('admin.quick.studentAnalyticsTitle')}
              subtitle={t('admin.quick.studentAnalyticsSubtitle')}
              icon="chart.line.uptrend.xyaxis"
              color="#F59E0B"
              onPress={() => router.push('/screens/analytics')}
            />
            <QuickActionCard
              title={t('admin.quick.communicationTitle')}
              subtitle={t('admin.quick.communicationSubtitle')}
              icon="megaphone.fill"
              color="#EF4444"
              onPress={() => router.push('/messages')}
            />
            <QuickActionCard
              title={t('admin.actions.systemSettings')}
              subtitle={t('admin.quick.systemSettingsSubtitle')}
              icon="gearshape.fill"
              color="#8B5CF6"
              onPress={() => router.push('/(tabs)/settings')}
            />
            <QuickActionCard
              title={t('admin.quick.supportCenterTitle')}
              subtitle={t('admin.quick.supportCenterSubtitle')}
              icon="questionmark.circle.fill"
              color="#06B6D4"
              onPress={() => router.push('/screens/support')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>📈 {t('dashboard.recentActivity')}</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityItem}>• {t('admin.activity.newParentRegistrations', { count: 3 })}</Text>
            <Text style={styles.activityItem}>• {t('admin.activity.paymentsReceived', { count: 15 })}</Text>
            <Text style={styles.activityItem}>• {t('admin.activity.teacherEvaluationsPending', { count: 2 })}</Text>
            <Text style={styles.activityItem}>• {t('admin.activity.newMessagesFromParents', { count: 8 })}</Text>
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
  statCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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

export default AdminDashboardScreen;
