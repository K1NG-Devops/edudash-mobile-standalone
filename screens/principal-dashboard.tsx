/* eslint-disable react-native/no-raw-text */
import { SchoolCodeManager } from '@/components/admin/SchoolCodeManager';
import { TeacherManagement } from '@/components/admin/TeacherManagement';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MobileHeader } from '@/components/navigation/MobileHeader';
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
import { Colors } from '@/constants/Colors';
// Import new design system components
import { Card, CardHeader, CardContent, Button, IconButton, Heading, Text as DSText, Badge, StatusBadge, Icon, Icons, PageHeader } from '@/design-system';
import i18n, { getCurrentLocaleTag } from '@/i18n';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdZone from '@/components/ui/AdZone';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375; // iPhone SE and smaller
const isVerySmallScreen = screenWidth < 320; // Very small devices

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
  const palette = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  const [showSchoolCodeManager, setShowSchoolCodeManager] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementIncludeStaffDefault, setAnnouncementIncludeStaffDefault] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const localeTag = getCurrentLocaleTag();
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
      if (!activePreschoolId) return { name: i18n.t('common.noSchool') } as any;
      const res = await PrincipalService.getSchoolInfo(activePreschoolId);
      if (res.error) throw res.error;
      return res.data || { name: i18n.t('common.noSchool') };
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
      style={[styles.metricCard, styles.metricCardTopBorder, { borderTopColor: color, backgroundColor: palette.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.metricContent}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
          <IconSymbol name={icon as any} size={28} color={color} />
        </View>
        <Text style={[styles.metricValue, { color: palette.text }]}>{value}</Text>
        <Text style={[styles.metricTitle, { color: palette.textSecondary }]}>{title}</Text>
        <Text style={[styles.metricSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
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
        <Text style={[styles.actionTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
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
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Status bar height compensation for Android */}
      {Platform.OS === 'android' && <View style={{ height: insets.top, backgroundColor: palette.background }} />}
      
      <MobileHeader
        user={{
          name: profile?.name || 'Principal',
          role: profile?.role || 'preschool_admin',
          avatar: profile?.avatar_url || undefined,
        }}
        schoolName={(schoolInfoQuery.data as any)?.name || i18n.t('common.noSchool')}
        onNotificationsPress={() => handleNavigate('notifications')}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        onPrimaryAction={() => setShowEventModal(true)}
        notificationCount={statsQuery.data?.pendingPayments || 0}
        actionsPlacement="below"
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(100, insets.bottom + 80) } // Dynamic bottom padding
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[
          styles.contentWrapper,
          { 
            paddingHorizontal: isSmallScreen ? 12 : 16,
            paddingLeft: Math.max(12, insets.left + (isSmallScreen ? 12 : 16)),
            paddingRight: Math.max(12, insets.right + (isSmallScreen ? 12 : 16))
          }
        ]}>
        {/* Page Header */}
        {/* Modern Google-style Header Section - Responsive */}
        <View style={[
          styles.modernHeaderSection,
          { 
            paddingHorizontal: isSmallScreen ? 2 : 4,
            paddingVertical: isSmallScreen ? 16 : 20 
          }
        ]}>
          <View style={styles.titleSection}>
            <Heading 
              level="h1" 
              style={[
                styles.modernTitle,
                {
                  fontSize: isVerySmallScreen ? 24 : isSmallScreen ? 28 : 32,
                  lineHeight: isVerySmallScreen ? 30 : isSmallScreen ? 34 : 40,
                  color: palette.text
                }
              ]}
            >
              {i18n.t('dashboard.schoolOverviewTitle')}
            </Heading>
            <DSText 
              variant="muted" 
              style={[
                styles.modernSubtitle,
                {
                  fontSize: isSmallScreen ? 13 : 14,
                  color: palette.textSecondary
                }
              ]}
            >
              {`${i18n.t('dashboard.managingSchool', { name: (schoolInfoQuery.data as any)?.name || i18n.t('common.noSchool') })}${isVerySmallScreen ? '' : ` • ${new Date().toLocaleDateString(localeTag, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}` }
            </DSText>
          </View>
          
          {/* Horizontal Scrollable Quick Actions */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScrollContent}
            style={styles.quickActionsContainer}
          >
            <TouchableOpacity 
              style={[
                styles.quickActionChip, 
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
borderColor: isDark ? palette.outline : '#E8EAED'
                }
              ]} 
              onPress={() => setShowEventModal(true)}
            >
              <IconSymbol name="calendar" size={isSmallScreen ? 14 : 16} color="#4285F4" />
              <Text style={[
                styles.quickActionText,
                {
color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
              ]}>{i18n.t('dashboard.actions.newEvent')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
borderColor: isDark ? palette.outline : '#E8EAED'
                }
              ]} 
              onPress={() => { setAnnouncementIncludeStaffDefault(false); setShowAnnouncementModal(true); }}
            >
              <IconSymbol name="megaphone.fill" size={isSmallScreen ? 14 : 16} color="#34A853" />
              <Text style={[
                styles.quickActionText,
                {
color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
              ]}>{i18n.t('dashboard.actions.announce')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
borderColor: isDark ? palette.outline : '#E8EAED'
                }
              ]} 
              onPress={() => { setAnnouncementIncludeStaffDefault(true); setShowAnnouncementModal(true); }}
            >
              <IconSymbol name="person.2.fill" size={isSmallScreen ? 14 : 16} color="#FBBC05" />
              <Text style={[
                styles.quickActionText,
                {
color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
              ]}>{i18n.t('dashboard.actions.messageAll')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
borderColor: isDark ? palette.outline : '#E8EAED'
                }
              ]} 
onPress={() => router.push('/messages')}
            >
              <IconSymbol name="envelope.fill" size={isSmallScreen ? 14 : 16} color="#FBBC05" />
              <Text style={[
                styles.quickActionText,
                {
color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
              ]}>{i18n.t('nav.messages')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quickActionChip,
                { 
                  backgroundColor: isDark ? palette.surface : '#FFFFFF',
borderColor: isDark ? palette.outline : '#E8EAED'
                }
              ]} 
              onPress={() => handleNavigate('/screens/support')}
            >
              <IconSymbol name="questionmark.circle.fill" size={isSmallScreen ? 14 : 16} color="#EA4335" />
              <Text style={[
                styles.quickActionText,
                {
color: palette.text,
                  fontSize: isSmallScreen ? 13 : 14
                }
              ]}>{i18n.t('dashboard.actions.support')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        {/* Attendance Badge - Responsive */}
        {statsQuery.data?.attendanceRate && statsQuery.data.attendanceRate > 0 && (
          <View style={styles.attendanceBadgeContainer}>
            <Badge 
              variant="success" 
              className="self-start"
              style={[
                styles.attendanceBadge,
                {
                  backgroundColor: '#10B981',
                  paddingHorizontal: isSmallScreen ? 10 : 12,
                  paddingVertical: isSmallScreen ? 4 : 6
                }
              ]}
            >
              <Text style={[
                styles.attendanceText,
                { fontSize: isSmallScreen ? 11 : 12 }
              ]}>
                {i18n.t('dashboard.attendanceToday', { percent: statsQuery.data.attendanceRate })}
              </Text>
            </Badge>
          </View>
        )}

        {/* Subscription / Plan */}
          <Card variant="flat" padding="lg" className="mb-4" style={styles.sectionCard}>
            <CardHeader>
              <Heading level="h3">{`💎 ${i18n.t('subscription.title')}`}</Heading>
            </CardHeader>
            <CardContent style={styles.cardContentGap12}>
              {mounted ? (
                <>
                  <DashboardSubscriptionCard userId={profile?.auth_user_id || ''} />
                  <BillingHistoryCard userId={profile?.auth_user_id || ''} />
                </>
              ) : (
                <View style={styles.subscriptionSkeleton} testID="subscription-skeleton">
                  <DSText variant="muted">{i18n.t('subscription.loading')}</DSText>
                </View>
              )}
            </CardContent>
          </Card>

        {/* School Statistics */}
          <Card variant="flat" padding="lg" className="mb-4" style={styles.sectionCard}>
            <CardHeader>
              <Heading level="h3">{`🏫 ${i18n.t('dashboard.schoolStatisticsTitle')}`}</Heading>
            </CardHeader>
            <CardContent>
              <View style={[
                styles.statsGrid,
                {
                  columnGap: isSmallScreen ? 8 : 12,
                  rowGap: isSmallScreen ? 8 : 12
                }
              ]}>
              <MetricCard
                title={i18n.t('admin.stats.totalStudents')}
                value={statsQuery.data?.totalStudents ?? 0}
                subtitle={`${statsQuery.data?.newEnrollments ?? 0} ${i18n.t('dashboard.newThisMonth')}`}
                icon="graduationcap.fill"
                color="#EA4335"
                onPress={() => handleNavigate('students')}
              />
              <MetricCard
                title={i18n.t('admin.stats.totalTeachers')}
                value={statsQuery.data?.totalTeachers ?? 0}
                subtitle={`${statsQuery.data?.activeClasses ?? 0} ${i18n.t('dashboard.activeClasses')}`}
                icon="person.2.fill"
                color="#EA4335"
                onPress={() => handleNavigate('teachers')}
              />
              <MetricCard
                title={i18n.t('admin.stats.totalParents')}
                value={statsQuery.data?.totalParents ?? 0}
                subtitle={i18n.t('dashboard.engagedFamilies')}
                icon="heart.fill"
                color="#EA4335"
              />
              <MetricCard
                title={i18n.t('dashboard.metrics.monthlyRevenue')}
                value={`R${(((statsQuery.data?.monthlyRevenue ?? 0) / 1000) | 0).toFixed(0)}k`}
                subtitle={`${statsQuery.data?.pendingPayments ?? 0} ${i18n.t('finance.pendingPayments')}`}
                icon="creditcard.fill"
                color="#EA4335"
                onPress={() => handleNavigate('/screens/principal-reports')}
              />
              </View>
            </CardContent>
          </Card>

        {/* Principal Actions */}
          <Card variant="flat" padding="lg" className="mb-4" style={styles.sectionCard}>
            <CardHeader>
              <Heading level="h3">{`⚡ ${i18n.t('dashboard.principalTools')}`}</Heading>
            </CardHeader>
            <CardContent>
              <View style={[
                styles.actionsGrid,
                {
                  columnGap: isSmallScreen ? 8 : 12,
                  rowGap: isSmallScreen ? 12 : 15
                }
              ]}>
              <ActionCard
                title={i18n.t('principal.tools.schoolSetup')}
                subtitle={i18n.t('principal.tools.schoolSetupSubtitle')}
                icon="rectangle.and.pencil.and.ellipsis"
                color="#6366F1"
                onPress={() => handleNavigate('/screens/school-setup')}
              />
              <ActionCard
                title={i18n.t('principal.tools.teacherManagement')}
                subtitle={i18n.t('principal.tools.teacherManagementSubtitle')}
                icon="person.badge.plus"
                color="#4285F4"
                onPress={() => setShowTeacherManagement(true)}
              />
              <ActionCard
                title={i18n.t('principal.tools.schoolCode')}
                subtitle={i18n.t('principal.tools.schoolCodeSubtitle')}
                icon="qrcode.viewfinder"
                color="#34A853"
                onPress={() => setShowSchoolCodeManager(true)}
              />
              <ActionCard
                title={i18n.t('finance.overview')}
                subtitle={i18n.t('admin.quick.financialReportsSubtitle')}
                icon="chart.bar.fill"
                color="#FBBC05"
                onPress={() => handleNavigate('/screens/principal-reports')}
              />
              <ActionCard
                title={i18n.t('principal.tools.diagnostics')}
                subtitle={i18n.t('principal.tools.diagnosticsSubtitle')}
                icon="stethoscope"
                color="#10B981"
                onPress={() => handleNavigate('/screens/diagnostics')}
              />
              <ActionCard
                title={i18n.t('principal.tools.schoolAnalytics')}
                subtitle={i18n.t('principal.tools.schoolAnalyticsSubtitle')}
                icon="chart.line.uptrend.xyaxis"
                color="#4285F4"
                onPress={() => handleNavigate('/screens/principal-reports')}
              />
              <ActionCard
                title={i18n.t('principal.tools.createAnnouncement')}
                subtitle={i18n.t('principal.tools.createAnnouncementSubtitle')}
                icon="megaphone.fill"
                color="#10B981"
                onPress={() => setShowAnnouncementModal(true)}
              />
              <ActionCard
                title={i18n.t('settings.schoolSettings')}
                subtitle={i18n.t('principal.tools.schoolSettingsSubtitle')}
                icon="gearshape.fill"
                color="#34A853"
                onPress={() => handleNavigate('/screens/school-settings')}
              />
              </View>
            </CardContent>
          </Card>

        {/* Quick Actions */}
          <Card variant="flat" padding="lg" className="mb-4" style={styles.sectionCard}>
            <CardHeader>
              <Heading level="h3">{`🚀 ${i18n.t('dashboard.quickActions')}`}</Heading>
            </CardHeader>
            <CardContent>
              <View style={[
                styles.quickActionsList,
                {
                  columnGap: isSmallScreen ? 6 : 8,
                  rowGap: isSmallScreen ? 6 : 8
                }
              ]}>
              <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: palette.surface }]} onPress={() => handleNavigate('register-child')}>
                <IconSymbol name="plus.circle.fill" size={20} color="#4285F4" />
                <Text style={[styles.quickActionItemText, { color: palette.textSecondary }]}>{i18n.t('dashboard.actions.addNewStudent')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: palette.surface }]} onPress={() => handleNavigate('teachers')}>
                <IconSymbol name="person.badge.plus" size={20} color="#34A853" />
                <Text style={[styles.quickActionItemText, { color: palette.textSecondary }]}>{i18n.t('dashboard.actions.hireTeacher')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: palette.surface }]} onPress={() => { setAnnouncementIncludeStaffDefault(true); setShowAnnouncementModal(true); }}>
                <IconSymbol name="megaphone.fill" size={20} color="#10B981" />
                <Text style={[styles.quickActionItemText, { color: palette.textSecondary }]}>{i18n.t('dashboard.actions.messageAllParentsStaff')}</Text>
              </TouchableOpacity>
<TouchableOpacity style={[styles.quickActionItem, { backgroundColor: palette.surface }]} onPress={() => router.push('/messages')}>
                <IconSymbol name="envelope.fill" size={20} color="#FBBC05" />
                <Text style={[styles.quickActionItemText, { color: palette.textSecondary }]}>{i18n.t('dashboard.actions.openMessages')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: palette.surface }]} onPress={() => handleNavigate('/screens/support')}>
                <IconSymbol name="questionmark.circle.fill" size={20} color="#EA4335" />
                <Text style={[styles.quickActionItemText, { color: palette.textSecondary }]}>{i18n.t('dashboard.actions.getSupport')}</Text>
              </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

        {/* Recent Activity */}
          <Card variant="flat" padding="lg" className="mb-4" style={styles.sectionCard}>
            <CardHeader>
              <Heading level="h3">{`📈 ${i18n.t('dashboard.recentActivity')}`}</Heading>
            </CardHeader>
            <CardContent>
              <View style={[styles.activityCard, { backgroundColor: palette.surface }] }>
              {activityQuery.data && activityQuery.data.length > 0 ? (
                activityQuery.data.map((activity, index) => (
                  <Text key={index} style={[styles.activityItem, { color: palette.textSecondary }]}>• {activity}</Text>
                ))
              ) : (
                <Text style={[styles.activityItem, { color: palette.textSecondary }]}>{i18n.t('dashboard.noRecentActivity')}</Text>
              )}
              </View>
            </CardContent>
          </Card>

        {/* Pending Tasks */}
          <Card variant="flat" padding="lg" className="mb-4" style={styles.sectionCard}>
            <CardHeader>
              <Heading level="h3">{`📋 ${i18n.t('dashboard.pendingTasks')}`}</Heading>
            </CardHeader>
            <CardContent>
              <View style={styles.tasksList}>
              {tasksQuery.data && tasksQuery.data.length > 0 ? (
                tasksQuery.data.map((task, index) => (
                  <View key={index} style={[styles.taskItem, { backgroundColor: palette.surface }] }>
                    <View style={[styles.taskDot, { backgroundColor: task.color }]} />
                    <Text style={[styles.taskText, { color: palette.textSecondary }]}>{task.text}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.taskText, { color: palette.textSecondary }]}>{i18n.t('dashboard.noPendingTasks')}</Text>
              )}
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
      {/* Banner placement for principal dashboard */}
      <AdZone>
        <View />
      </AdZone>
      
      {/* Safe area bottom padding for gesture navigation */}
      <View style={{ height: Math.max(0, insets.bottom), backgroundColor: palette.background }} />
      
      {/* Management Modals */}
      {activePreschoolId && profile?.id && (
        <>
          <CreateAnnouncementModal
            visible={showAnnouncementModal}
            defaultIncludeStaff={announcementIncludeStaffDefault}
            onClose={() => setShowAnnouncementModal(false)}
            onPosted={() => {
              // Optionally navigate to Messages announcements
try { router.push('/messages' as any); } catch {}
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
  contentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
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
    rowGap: 12,
  },
  metricCard: {
    width: '48%',
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
  metricCardTopBorder: {
    borderTopWidth: 3,
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
    width: '48%',
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
    rowGap: 8,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    width: '48%',
  },
  quickActionItemText: {
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
    rowGap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
  // New spacing helpers
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  pageHeader: {
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 16,
  },
  cardContentGap12: {
    rowGap: 12,
  },
  subscriptionSkeleton: {
    padding: 16,
  },
  // Modern Google-style header styles
  modernHeaderSection: {
    paddingHorizontal: 4,
    paddingVertical: 20,
    marginBottom: 8,
  },
  titleSection: {
    marginBottom: 20,
  },
  modernTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 8,
  },
  modernSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  quickActionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C4043',
    marginLeft: 8,
  },
  // Quick Actions horizontal scroll styles
  quickActionsContainer: {
    flexGrow: 0,
  },
  quickActionsScrollContent: {
    paddingRight: 20,
    gap: 8,
  },
  // Attendance badge container
  attendanceBadgeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  // Responsive metric card styles for small screens
  metricCardSmall: {
    width: '48%',
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Responsive action card styles for small screens
  actionCardSmall: {
    width: '48%',
    minWidth: 140,
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionGradientSmall: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  // Quick action item responsive styles for small screens
  quickActionItemSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6,
    width: '100%',
    minHeight: 44, // Minimum touch target
  },
});

export default PrincipalDashboard;
