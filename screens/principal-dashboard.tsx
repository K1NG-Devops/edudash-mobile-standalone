import { SchoolCodeManager } from '@/components/admin/SchoolCodeManager';
import { TeacherManagement } from '@/components/admin/TeacherManagement';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { PrincipalService } from '@/lib/services/principalService';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import CreateAnnouncementModal from '@/components/announcements/CreateAnnouncementModal';
import CreateEventModal from '@/components/events/CreateEventModal';
import { DashboardSubscriptionCard } from '@/components/dashboard/DashboardSubscriptionCard';
import { BillingHistoryCard } from '@/components/billing/BillingHistoryCard';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  const [showSchoolCodeManager, setShowSchoolCodeManager] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const queryClient = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  // If principal profile isn't linked yet, infer schoolId from invitation artifacts
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(null);
  const preschoolId = profile?.preschool_id || '';
  const activePreschoolId = preschoolId || resolvedSchoolId || '';

  React.useEffect(() => {
    const inferSchoolId = async () => {
      if (profile?.preschool_id || !profile?.id) return;
      try {
        const { data: tInvite } = await supabase
          .from('teacher_invitations')
          .select('preschool_id, created_at')
          .eq('invited_by', profile.id)
          .not('preschool_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (tInvite?.preschool_id) { setResolvedSchoolId(tInvite.preschool_id as string); return; }
        const { data: inviteCode } = await supabase
          .from('invitation_codes')
          .select('preschool_id, created_at, is_active')
          .eq('invited_by', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (inviteCode?.preschool_id) { setResolvedSchoolId(inviteCode.preschool_id as string); return; }
        const { data: schoolCode } = await supabase
          .from('school_invitation_codes')
          .select('preschool_id, created_at, is_active')
          .eq('invited_by', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (schoolCode?.preschool_id) { setResolvedSchoolId(schoolCode.preschool_id as string); return; }
      } catch {
        // ignore
      }
    };
    inferSchoolId();
  }, [profile?.preschool_id, profile?.id]);

  // 1) School info query
  const schoolInfoQuery = useQuery({
    queryKey: ['schoolInfo', activePreschoolId],
    queryFn: async () => {
      if (!activePreschoolId) return { name: 'Your Preschool' } as any;
      const res = await PrincipalService.getSchoolInfo(activePreschoolId);
      if (res.error) throw res.error;
      return res.data || { name: 'Your Preschool' };
    },
    enabled: !!activePreschoolId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2) Principal stats query
  const statsQuery = useQuery({
    queryKey: ['principalStats', activePreschoolId],
    queryFn: async () => {
      if (!activePreschoolId) return {
        totalStudents: 0,
        totalTeachers: 0,
        totalParents: 0,
        attendanceRate: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        activeClasses: 0,
        newEnrollments: 0,
      } as PrincipalStats;
      const res = await PrincipalService.getPrincipalStats(activePreschoolId);
      if (res.error) throw res.error;
      return res.data as PrincipalStats;
    },
    enabled: !!activePreschoolId,
    staleTime: 1000 * 30, // 30s for fresher stats
  });

  // 3) Recent activity query
  const activityQuery = useQuery({
    queryKey: ['recentActivity', activePreschoolId],
    queryFn: async () => {
      if (!activePreschoolId) return [] as string[];
      const res = await PrincipalService.getRecentActivity(activePreschoolId);
      if (res.error) return [] as string[]; // show empty quietly
      return res.data || [];
    },
    enabled: !!activePreschoolId,
    staleTime: 1000 * 60, // 1 minute
  });

  // 4) Pending tasks query
  const tasksQuery = useQuery({
    queryKey: ['pendingTasks', activePreschoolId],
    queryFn: async () => {
      if (!activePreschoolId) return [] as Array<{ priority: string; text: string; color: string }>;
      const res = await PrincipalService.getPendingTasks(activePreschoolId);
      if (res.error) return [];
      return res.data || [];
    },
    enabled: !!activePreschoolId,
    staleTime: 1000 * 60, // 1 minute
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['schoolInfo', activePreschoolId] }),
      queryClient.invalidateQueries({ queryKey: ['principalStats', activePreschoolId] }),
      queryClient.invalidateQueries({ queryKey: ['recentActivity', activePreschoolId] }),
      queryClient.invalidateQueries({ queryKey: ['pendingTasks', activePreschoolId] }),
    ]);
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
        <Text style={[styles.metricValue, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>{value}</Text>
        <Text style={[styles.metricTitle, { color: isDark ? '#E5E7EB' : '#6B7280' }]}>{title}</Text>
        <Text style={[styles.metricSubtitle, { color: isDark ? '#CBD5E1' : '#9CA3AF' }]}>{subtitle}</Text>
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
        <Text style={[styles.actionTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: isDark ? '#E5E7EB' : '#6B7280' }]}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleNavigate = (route: string) => {
    if (!route) return;
    if (route.startsWith('/')) {
      router.push(route as any);
      return;
    }
    if (route.startsWith('screens/')) {
      router.push(`/${route}` as any);
      return;
    }
    router.push(`/screens/${route}` as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]} edges={['bottom', 'left', 'right']}>

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
          <Text style={[styles.welcomeSubtitle, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Manage {(schoolInfoQuery.data as any)?.name || 'Your Preschool'}</Text>
        </View>

        {/* Subscription / Plan */}
        <View style={[styles.actionsSection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          {mounted ? (
            <>
              <DashboardSubscriptionCard userId={profile?.auth_user_id || ''} />
              <BillingHistoryCard userId={profile?.auth_user_id || ''} />
            </>
          ) : (
            <View style={{ padding: 16 }} testID="subscription-skeleton">
              <Text style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Loading subscription…</Text>
            </View>
          )}
        </View>

        {/* School Statistics */}
        <View style={[styles.statsSection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>🏫 School Overview</Text>
          <View style={styles.statsGrid}>
            <MetricCard
              title="Total Students"
              value={statsQuery.data?.totalStudents ?? 0}
              subtitle={`${statsQuery.data?.newEnrollments ?? 0} new this month`}
              icon="graduationcap.fill"
              color="#EA4335"
              onPress={() => handleNavigate('students')}
            />
            <MetricCard
              title="Teaching Staff"
              value={statsQuery.data?.totalTeachers ?? 0}
              subtitle={`${statsQuery.data?.activeClasses ?? 0} active classes`}
              icon="person.2.fill"
              color="#EA4335"
              onPress={() => handleNavigate('teachers')}
            />
            <MetricCard
              title="Parent Community"
              value={statsQuery.data?.totalParents ?? 0}
              subtitle="Engaged families"
              icon="heart.fill"
              color="#EA4335"
            />
            <MetricCard
              title="Monthly Revenue"
              value={`R${(((statsQuery.data?.monthlyRevenue ?? 0) / 1000) | 0).toFixed(0)}k`}
              subtitle={`${statsQuery.data?.pendingPayments ?? 0} pending payments`}
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
              title="School Setup"
              subtitle="Classes & assignments"
              icon="rectangle.and.pencil.and.ellipsis"
              color="#6366F1"
              onPress={() => handleNavigate('/screens/school-setup')}
            />
            <ActionCard
              title="Teacher Management"
              subtitle="Invite & manage teachers"
              icon="person.badge.plus"
              color="#4285F4"
              onPress={() => setShowTeacherManagement(true)}
            />
            <ActionCard
              title="Create Event"
              subtitle="Plan a school event"
              icon="calendar.badge.plus"
              color="#3B82F6"
              onPress={() => setShowEventModal(true)}
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
              title="Diagnostics"
              subtitle="Verify counts & RLS"
              icon="stethoscope"
              color="#10B981"
              onPress={() => handleNavigate('/screens/diagnostics')}
            />
            <ActionCard
              title="School Analytics"
              subtitle="Performance insights"
              icon="chart.line.uptrend.xyaxis"
              color="#4285F4"
              onPress={() => handleNavigate('/screens/principal-reports')}
            />
            <ActionCard
              title="Create Announcement"
              subtitle="Notify all parents"
              icon="megaphone.fill"
              color="#10B981"
              onPress={() => setShowAnnouncementModal(true)}
            />
            <ActionCard
              title="School Settings"
              subtitle="Configure policies"
              icon="gearshape.fill"
              color="#34A853"
              onPress={() => handleNavigate('/screens/school-settings')}
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
            <TouchableOpacity style={[styles.quickActionItem, isDark && { backgroundColor: '#0B1220' }]} onPress={() => handleNavigate('/screens/support')}>
              <IconSymbol name="questionmark.circle.fill" size={20} color="#EA4335" />
              <Text style={[styles.quickActionText, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>Get Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.activitySection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>📈 Recent School Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }] }>
            {activityQuery.data && activityQuery.data.length > 0 ? (
              activityQuery.data.map((activity, index) => (
                <Text key={index} style={[styles.activityItem, { color: isDark ? '#CBD5E1' : '#4B5563' }]}>• {activity}</Text>
              ))
            ) : (
              <Text style={[styles.activityItem, { color: isDark ? '#94A3B8' : '#4B5563' }]}>No recent activity.</Text>
            )}
          </View>
        </View>

        {/* Pending Tasks */}
        <View style={[styles.tasksSection, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>📋 Pending Tasks</Text>
          <View style={styles.tasksList}>
            {tasksQuery.data && tasksQuery.data.length > 0 ? (
              tasksQuery.data.map((task, index) => (
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
      {activePreschoolId && profile?.id && (
        <>
          <CreateAnnouncementModal
            visible={showAnnouncementModal}
            onClose={() => setShowAnnouncementModal(false)}
            onPosted={() => {
              // Optionally navigate to Messages announcements
              try { router.push('/(tabs)/messages' as any); } catch {}
            }}
          />
          <CreateEventModal
            visible={showEventModal}
            preschoolId={activePreschoolId}
            createdByUserId={profile.id}
            onClose={() => setShowEventModal(false)}
            onCreated={() => {
              // After creating an event, consider navigating to Activities->Events
              try { router.push('/(tabs)/activities' as any); } catch {}
            }}
          />
          <TeacherManagement
            visible={showTeacherManagement}
            preschoolId={activePreschoolId}
            principalId={profile.id}
            onClose={async () => {
              setShowTeacherManagement(false);
              // Refresh stats when closing to reflect any changes
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['principalStats', activePreschoolId] }),
                queryClient.invalidateQueries({ queryKey: ['pendingTasks', activePreschoolId] }),
              ]);
            }}
          />

          <SchoolCodeManager
            visible={showSchoolCodeManager}
            preschoolId={activePreschoolId}
            principalId={profile.id}
            schoolName={(schoolInfoQuery.data as any)?.name || 'Your Preschool'}
            onClose={() => setShowSchoolCodeManager(false)}
          />
        </>
      )}
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
    // color will be dynamically set based on theme
    textAlign: 'center',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 13,
    // color will be dynamically set based on theme
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    // color will be dynamically set based on theme
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
