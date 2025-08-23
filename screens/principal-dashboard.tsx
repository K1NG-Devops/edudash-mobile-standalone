/* eslint-disable */
// @ts-nocheck
import { SchoolCodeManager } from '@/components/admin/SchoolCodeManager';
import { TeacherManagement } from '@/components/admin/TeacherManagement';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { PrincipalService } from '@/lib/services/principalService';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
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

interface PrincipalStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  attendanceRate: number;
  monthlyRevenue: number;
  pendingPayments: number;
  activeClasses: number;
  newEnrollments: number;
}

interface PrincipalDashboardProps {
  profile: UserProfile | null;
  onSignOut: () => Promise<void>;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ profile, onSignOut }) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PrincipalStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    attendanceRate: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    activeClasses: 0,
    newEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('');
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  const [showSchoolCodeManager, setShowSchoolCodeManager] = useState(false);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Array<{ priority: string, text: string, color: string }>>([]);

  useEffect(() => {
    loadPrincipalStats();
  }, []);

  const loadPrincipalStats = async () => {
    try {
      setLoading(true);

      if (!profile?.preschool_id) {
        // Removed debug statement: console.warn('No preschool_id found in profile');
        setSchoolName('Your Preschool');
        return;
      }

      // Fetch school information
      const schoolResult = await PrincipalService.getSchoolInfo(profile.preschool_id);
      if (schoolResult.data) {

        setSchoolName(schoolResult.data.name);
      } else {

        setSchoolName('Your Preschool');
      }

      // Fetch real stats from database
      const statsResult = await PrincipalService.getPrincipalStats(profile.preschool_id);
      if (statsResult.data) {

        setStats(statsResult.data);
      } else {
        // Removed debug statement: console.error('❌ [DEBUG] Failed to load stats:', statsResult.error);
        // Keep existing stats or use defaults
      }

      // Load recent activity
      const activityResult = await PrincipalService.getRecentActivity(profile.preschool_id);
      if (activityResult.data) {
        setRecentActivity(activityResult.data);
      }

      // Load pending tasks
      const tasksResult = await PrincipalService.getPendingTasks(profile.preschool_id);
      if (tasksResult.data) {
        setPendingTasks(tasksResult.data);
      }

    } catch (error) {
      // Removed debug statement: console.error('Error loading principal stats:', error);
      Alert.alert('Error', 'Failed to load school statistics');
      setSchoolName('Your Preschool');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrincipalStats();
    setRefreshing(false);
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
      style={[styles.metricCard, { borderTopColor: color, borderTopWidth: 3, backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.metricContent}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
          <IconSymbol name={icon as any} size={28} color={color} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
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
    <View style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
      <MobileHeader
        user={{
          name: profile?.name || 'Principal',
          role: profile?.role || 'preschool_admin',
          avatar: profile?.avatar_url,
        }}
        schoolName={schoolName || undefined}
        onNotificationsPress={() => handleNavigate('notifications')}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={stats.pendingPayments}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Header (matches Super Admin look) */}
        <View style={[styles.welcomeSection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          <Text style={[styles.welcomeTitle, { color: isDark ? '#F8FAFC' : '#1F2937' }]}>📊 School Overview</Text>
          <Text style={[styles.welcomeSubtitle, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Manage {schoolName}</Text>
        </View>

        {/* School Statistics */}
        <View style={[styles.statsSection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>🏫 School Overview</Text>
          <View style={styles.statsGrid}>
            <MetricCard
              title="Total Students"
              value={stats.totalStudents}
              subtitle={`${stats.newEnrollments} new this month`}
              icon="graduationcap.fill"
              color="#EA4335"
              onPress={() => handleNavigate('students')}
            />
            <MetricCard
              title="Teaching Staff"
              value={stats.totalTeachers}
              subtitle={`${stats.activeClasses} active classes`}
              icon="person.2.fill"
              color="#EA4335"
              onPress={() => handleNavigate('teachers')}
            />
            <MetricCard
              title="Parent Community"
              value={stats.totalParents}
              subtitle="Engaged families"
              icon="heart.fill"
              color="#EA4335"
              onPress={() => handleNavigate('parents')}
            />
            <MetricCard
              title="Monthly Revenue"
              value={`R${(stats.monthlyRevenue / 1000).toFixed(0)}k`}
              subtitle={`${stats.pendingPayments} pending payments`}
              icon="creditcard.fill"
              color="#EA4335"
              onPress={() => handleNavigate('/screens/principal-reports')}
            />
          </View>
        </View>

        {/* Principal Actions */}
        <View style={[styles.actionsSection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>⚡ Principal Tools</Text>
          <View style={styles.actionsGrid}>
            <ActionCard
              title="Teacher Management"
              subtitle="Invite & manage teachers"
              icon="person.badge.plus"
              color="#4285F4"
              onPress={() => setShowTeacherManagement(true)}
            />
            <ActionCard
              title="School Code"
              subtitle="Parent invitation codes"
              icon="qrcode.viewfinder"
              color="#34A853"
              onPress={() => setShowSchoolCodeManager(true)}
            />
            <ActionCard
              title="Financial Reports"
              subtitle="Revenue & expenses"
              icon="chart.bar.fill"
              color="#FBBC05"
              onPress={() => handleNavigate('/screens/principal-reports')}
            />
            <ActionCard
              title="Parent Communication"
              subtitle="Send announcements"
              icon="megaphone.fill"
              color="#EA4335"
              onPress={() => router.push('/(tabs)/messages')}
            />
            <ActionCard
              title="School Analytics"
              subtitle="Performance insights"
              icon="chart.line.uptrend.xyaxis"
              color="#4285F4"
              onPress={() => handleNavigate('analytics')}
            />
            <ActionCard
              title="School Settings"
              subtitle="Configure policies"
              icon="gearshape.fill"
              color="#34A853"
              onPress={() => handleNavigate('/screens/settings')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.quickActionsSection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>🚀 Quick Actions</Text>
          <View style={styles.quickActionsList}>
            <TouchableOpacity style={[styles.quickActionItem, isDark && { backgroundColor: '#0B1220' }]} onPress={() => handleNavigate('register-child')}>
              <IconSymbol name="plus.circle.fill" size={20} color="#4285F4" />
              <Text style={[styles.quickActionText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Add New Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionItem, isDark && { backgroundColor: '#0B1220' }]} onPress={() => handleNavigate('teachers')}>
              <IconSymbol name="person.badge.plus" size={20} color="#34A853" />
              <Text style={[styles.quickActionText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Hire Teacher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionItem, isDark && { backgroundColor: '#0B1220' }]} onPress={() => router.push('/(tabs)/messages')}>
              <IconSymbol name="envelope.fill" size={20} color="#FBBC05" />
              <Text style={[styles.quickActionText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Send Announcement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionItem, isDark && { backgroundColor: '#0B1220' }]} onPress={() => handleNavigate('support')}>
              <IconSymbol name="questionmark.circle.fill" size={20} color="#EA4335" />
              <Text style={[styles.quickActionText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Get Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.activitySection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>📈 Recent School Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }] }>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <Text key={index} style={styles.activityItem}>• {activity}</Text>
              ))
            ) : (
              <Text style={[styles.activityItem, { color: isDark ? '#94A3B8' : '#4B5563' }]}>No recent activity.</Text>
            )}
          </View>
        </View>

        {/* Pending Tasks */}
        <View style={styles.tasksSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>📋 Pending Tasks</Text>
          <View style={styles.tasksList}>
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task, index) => (
                <View key={index} style={[styles.taskItem, isDark && { backgroundColor: '#0B1220' }]}>
                  <View style={[styles.taskDot, { backgroundColor: task.color }]} />
                  <Text style={[styles.taskText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>{task.text}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.taskText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>No pending tasks.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom nav removed; now rendered globally in RootLayout */}

      {/* Management Modals */}
      {profile?.preschool_id && profile?.id && (
        <>
          <TeacherManagement
            visible={showTeacherManagement}
            preschoolId={profile.preschool_id}
            principalId={profile.id}
            onClose={() => {
              setShowTeacherManagement(false);
              // Refresh stats when closing to reflect any changes
              loadPrincipalStats();
            }}
          />

          <SchoolCodeManager
            visible={showSchoolCodeManager}
            preschoolId={profile.preschool_id}
            principalId={profile.id}
            schoolName={schoolName}
            onClose={() => setShowSchoolCodeManager(false)}
          />
        </>
      )}
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
  attendanceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  attendanceText: {
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
    width: (screenWidth - 80) / 2, // slightly smaller tiles to match Super Admin
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
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
  quickActionsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  quickActionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    width: (screenWidth - 60) / 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 8,
    fontWeight: '500',
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
  tasksSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  tasksList: {
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  taskText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
});

export default PrincipalDashboard;
