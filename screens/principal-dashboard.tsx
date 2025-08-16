/* eslint-disable */
// @ts-nocheck
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { PrincipalService } from '@/lib/services/principalService';
import { TeacherManagement } from '@/components/admin/TeacherManagement';
import { SchoolCodeManager } from '@/components/admin/SchoolCodeManager';
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
  const [pendingTasks, setPendingTasks] = useState<Array<{priority: string, text: string, color: string}>>([]);

  useEffect(() => {
    loadPrincipalStats();
  }, []);

  const loadPrincipalStats = async () => {
    try {
      setLoading(true);
      
      if (!profile?.preschool_id) {
        console.warn('No preschool_id found in profile');
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
        console.error('❌ [DEBUG] Failed to load stats:', statsResult.error);
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
      console.error('Error loading principal stats:', error);
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
      style={[styles.metricCard, { borderTopColor: color, borderTopWidth: 3 }]} 
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
    <View style={styles.container}>
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
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome, Principal! 🏫</Text>
          <Text style={styles.welcomeSubtitle}>
            Managing {schoolName} with {stats.totalStudents} students
          </Text>
          <View style={styles.attendanceBadge}>
            <Text style={styles.attendanceText}>📊 {stats.attendanceRate}% Attendance Rate</Text>
          </View>
        </View>

        {/* School Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>🏫 School Overview</Text>
          <View style={styles.statsGrid}>
            <MetricCard
              title="Total Students"
              value={stats.totalStudents}
              subtitle={`${stats.newEnrollments} new this month`}
              icon="graduationcap.fill"
              color="#3B82F6"
              onPress={() => handleNavigate('students')}
            />
            <MetricCard
              title="Teaching Staff"
              value={stats.totalTeachers}
              subtitle={`${stats.activeClasses} active classes`}
              icon="person.2.square.stack.fill"
              color="#10B981"
              onPress={() => handleNavigate('teachers')}
            />
            <MetricCard
              title="Parent Community"
              value={stats.totalParents}
              subtitle="Engaged families"
              icon="heart.fill"
              color="#F59E0B"
              onPress={() => handleNavigate('parents')}
            />
            <MetricCard
              title="Monthly Revenue"
              value={`R${(stats.monthlyRevenue / 1000).toFixed(0)}k`}
              subtitle={`${stats.pendingPayments} pending payments`}
              icon="dollarsign.circle.fill"
              color="#EF4444"
              onPress={() => router.push('/(tabs)/payment')}
            />
          </View>
        </View>

        {/* Principal Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚡ Principal Tools</Text>
          <View style={styles.actionsGrid}>
            <ActionCard
              title="Teacher Management"
              subtitle="Invite & manage teachers"
              icon="person.crop.circle.badge.plus"
              color="#3B82F6"
              onPress={() => setShowTeacherManagement(true)}
            />
            <ActionCard
              title="School Code"
              subtitle="Parent invitation codes"
              icon="qrcode.viewfinder"
              color="#10B981"
              onPress={() => setShowSchoolCodeManager(true)}
            />
            <ActionCard
              title="Financial Reports"
              subtitle="Revenue & expenses"
              icon="chart.bar.fill"
              color="#F59E0B"
              onPress={() => router.push('/(tabs)/payment')}
            />
            <ActionCard
              title="Parent Communication"
              subtitle="Send announcements"
              icon="megaphone.fill"
              color="#EF4444"
              onPress={() => router.push('/(tabs)/messages')}
            />
            <ActionCard
              title="School Analytics"
              subtitle="Performance insights"
              icon="chart.line.uptrend.xyaxis"
              color="#8B5CF6"
              onPress={() => handleNavigate('analytics')}
            />
            <ActionCard
              title="School Settings"
              subtitle="Configure policies"
              icon="gearshape.fill"
              color="#06B6D4"
              onPress={() => router.push('/(tabs)/settings')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
          <View style={styles.quickActionsList}>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => handleNavigate('register-child')}>
              <IconSymbol name="plus.circle.fill" size={20} color="#3B82F6" />
              <Text style={styles.quickActionText}>Add New Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => handleNavigate('teachers')}>
              <IconSymbol name="person.badge.plus" size={20} color="#10B981" />
              <Text style={styles.quickActionText}>Hire Teacher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/(tabs)/messages')}>
              <IconSymbol name="envelope.fill" size={20} color="#F59E0B" />
              <Text style={styles.quickActionText}>Send Announcement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => handleNavigate('support')}>
              <IconSymbol name="questionmark.circle.fill" size={20} color="#EF4444" />
              <Text style={styles.quickActionText}>Get Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>📈 Recent School Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <Text key={index} style={styles.activityItem}>• {activity}</Text>
              ))
            ) : (
              <>
                <Text style={styles.activityItem}>• {stats.newEnrollments} new student enrollments this month</Text>
                <Text style={styles.activityItem}>• 23 parent-teacher meetings scheduled</Text>
                <Text style={styles.activityItem}>• R{(stats.monthlyRevenue * 0.15).toFixed(0)} collected this week</Text>
                <Text style={styles.activityItem}>• 4 staff training sessions completed</Text>
              </>
            )}
          </View>
        </View>

        {/* Pending Tasks */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>📋 Pending Tasks</Text>
          <View style={styles.tasksList}>
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <View style={[styles.taskDot, { backgroundColor: task.color }]} />
                  <Text style={styles.taskText}>{task.text}</Text>
                </View>
              ))
            ) : (
              <>
                <View style={styles.taskItem}>
                  <View style={[styles.taskDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.taskText}>Review {stats.pendingPayments} payment confirmations</Text>
                </View>
                <View style={styles.taskItem}>
                  <View style={[styles.taskDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.taskText}>Approve 3 new teacher applications</Text>
                </View>
                <View style={styles.taskItem}>
                  <View style={[styles.taskDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.taskText}>Schedule parent information session</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

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
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
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
