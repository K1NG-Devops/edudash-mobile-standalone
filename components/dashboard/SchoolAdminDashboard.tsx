/* eslint-disable */
// @ts-nocheck
/**
 * School Admin Dashboard Component
 * Individual preschool management interface for school administrators
 * Features: Student management, teacher oversight, financial tracking, parent communication
 */

import { TeacherManagement } from '@/components/admin/TeacherManagement';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  SchoolAdminDashboardData,
  SchoolAdminDataService
} from '@/lib/services/schoolAdminDataService';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
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
const isSmallScreen = screenWidth <= 350;

interface UserProfile {
  name: string;
  role: string;
  avatar?: string;
}

interface SchoolAdminDashboardProps {
  userId: string;
  userProfile: UserProfile;
  schoolName?: string;
  onSignOut: () => Promise<void>;
}

type TabType = 'overview' | 'students' | 'teachers' | 'parents' | 'classes' | 'finances';

export default function SchoolAdminDashboard({
  userId,
  userProfile,
  schoolName,
  onSignOut
}: SchoolAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dashboardData, setDashboardData] = useState<SchoolAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SchoolAdminDataService.getSchoolAdminDashboardData(userId);
      setDashboardData(data);
    } catch (err: any) {
      // Removed debug statement: console.error('❌ [SchoolAdminDashboard] Error loading data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return `R${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const handleNavigate = (route: string) => {
    // Integrate with Expo Router navigation if needed
  };

  const renderTabButton = (tab: TabType, title: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <IconSymbol
        name={icon as any}
        size={20}
        color={activeTab === tab ? '#3B82F6' : '#6B7280'}
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderBottomTabButton = (tab: TabType, title: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={styles.bottomTabButton}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <IconSymbol
        name={icon as any}
        size={24}
        color={activeTab === tab ? '#3B82F6' : '#9CA3AF'}
      />
      <Text style={[styles.bottomTabButtonText, activeTab === tab && styles.activeBottomTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: color }]}>
        <IconSymbol name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderOverview = () => {
    if (!dashboardData) return null;
    const stats = dashboardData.school_stats;

    return (
      <View style={styles.tabContent}>
        {/* Overview Header (compact, matches Super Admin) */}
        <View style={[styles.overviewHeaderLite]}>
          <Text style={styles.overviewTitleLite}>📊 School Overview</Text>
          <Text style={styles.overviewSubtitleLite}>Real-time insights into your school</Text>
        </View>

        {/* Stats Grid - Responsive Layout */}
        <View style={styles.statsGridContainer}>
          <View style={[styles.statsGrid, isSmallScreen && styles.statsGridSmall]}>
            <View style={[styles.statCardLite, isSmallScreen && styles.statCardLiteSmall]}>
              <View style={[styles.statAccentBar]} />
              <View style={styles.statContentLite}>
                <View style={[styles.statIconLite, { backgroundColor: '#EA433520' }]}>
                  <IconSymbol name="person.3.fill" size={20} color="#EA4335" />
                </View>
                <Text style={styles.statValueLite}>{stats.total_students}</Text>
                <Text style={styles.statLabelLite}>Students</Text>
              </View>
            </View>

            <View style={[styles.statCardLite, isSmallScreen && styles.statCardLiteSmall]}>
              <View style={[styles.statAccentBar]} />
              <View style={styles.statContentLite}>
                <View style={[styles.statIconLite, { backgroundColor: '#EA433520' }]}>
                  <IconSymbol name="person.badge.plus" size={20} color="#EA4335" />
                </View>
                <Text style={styles.statValueLite}>{stats.total_teachers}</Text>
                <Text style={styles.statLabelLite}>Teachers</Text>
              </View>
            </View>
          </View>

          <View style={[styles.statsGrid, isSmallScreen && styles.statsGridSmall]}>
            <View style={[styles.statCardLite, isSmallScreen && styles.statCardLiteSmall]}>
              <View style={[styles.statAccentBar]} />
              <View style={styles.statContentLite}>
                <View style={[styles.statIconLite, { backgroundColor: '#EA433520' }]}>
                  <IconSymbol name="building.2" size={20} color="#EA4335" />
                </View>
                <Text style={styles.statValueLite}>{stats.total_classes}</Text>
                <Text style={styles.statLabelLite}>Classes</Text>
              </View>
            </View>

            <View style={[styles.statCardLite, isSmallScreen && styles.statCardLiteSmall]}>
              <View style={[styles.statAccentBar]} />
              <View style={styles.statContentLite}>
                <View style={[styles.statIconLite, { backgroundColor: '#EA433520' }]}>
                  <IconSymbol name="person.2.fill" size={20} color="#EA4335" />
                </View>
                <Text style={styles.statValueLite}>{stats.total_parents}</Text>
                <Text style={styles.statLabelLite}>Parents</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Key Metrics Cards */}
        <View style={styles.keyMetricsContainer}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIcon, { backgroundColor: '#10B981' }]}>
                <IconSymbol name="creditcard.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>Monthly Revenue</Text>
                <Text style={styles.metricValue}>{formatCurrency(stats.monthly_revenue)}</Text>
              </View>
            </View>
            <Text style={styles.metricSubtext}>
              {formatCurrency(Math.round(stats.monthly_revenue / Math.max(stats.total_students, 1)))} avg per student
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIcon, { backgroundColor: '#3B82F6' }]}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>Attendance Rate</Text>
                <Text style={styles.metricValue}>{formatPercentage(stats.attendance_rate)}</Text>
              </View>
            </View>
            <Text style={styles.metricSubtext}>This month average</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <IconSymbol name="chevron.right" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {dashboardData.recent_activities.slice(0, 4).map((activity, index) => (
              <View key={activity.id} style={[styles.activityItem, index === dashboardData.recent_activities.slice(0, 4).length - 1 && styles.lastActivityItem]}>
                <View style={[styles.activityIconContainer, { backgroundColor: activity.priority === 'high' ? '#FEE2E2' : '#EBF4FF' }]}>
                  <IconSymbol
                    name={activity.type === 'payment_received' ? 'creditcard.fill' :
                      activity.type === 'student_enrolled' ? 'person.badge.plus' :
                        activity.type === 'teacher_added' ? 'person.fill.checkmark' :
                          'bell.fill'}
                    size={18}
                    color={activity.priority === 'high' ? '#EF4444' : '#3B82F6'}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* System Alerts */}
        {dashboardData.alerts.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>System Alerts</Text>
            <View style={styles.alertsList}>
              {dashboardData.alerts.map((alert, index) => (
                <View key={alert.id} style={[styles.alertItem, { borderLeftColor: alert.priority === 'high' ? '#EF4444' : '#F59E0B' }]}>
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <IconSymbol
                        name="exclamationmark.triangle.fill"
                        size={18}
                        color={alert.priority === 'high' ? '#EF4444' : '#F59E0B'}
                      />
                      <Text style={styles.alertTitle}>Alert</Text>
                    </View>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderStudents = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.tabContent}>
        {/* Enhanced Header with Search and Filters */}
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.enhancedSectionTitle}>Students</Text>
            <View style={styles.studentCountBadge}>
              <Text style={styles.countBadgeText}>{dashboardData.recent_students.length}</Text>
            </View>
          </View>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.filterButton}>
              <IconSymbol name="line.3.horizontal.decrease" size={18} color="#6B7280" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.enhancedAddButton}>
              <LinearGradient
                colors={['#3B82F6', '#1E40AF']}
                style={styles.addButtonGradient}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <Text style={styles.enhancedAddButtonText}>Add Student</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Students Grid */}
        <View style={styles.studentsGrid}>
          {dashboardData.recent_students.map((student, index) => (
            <View key={student.id} style={styles.enhancedStudentCard}>
              <LinearGradient
                colors={[
                  student.monthly_fee_status === 'paid' ? '#10B98115' : '#F59E0B15',
                  student.monthly_fee_status === 'paid' ? '#10B98108' : '#F59E0B08'
                ]}
                style={styles.studentCardGradient}
              >
                {/* Student Header */}
                <View style={styles.enhancedStudentHeader}>
                  <View style={styles.studentAvatarContainer}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.enhancedStudentAvatar}
                    >
                      <Text style={styles.enhancedStudentAvatarText}>
                        {student.full_name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </LinearGradient>
                    <View style={[styles.statusIndicator, {
                      backgroundColor: student.monthly_fee_status === 'paid' ? '#10B981' : '#F59E0B'
                    }]} />
                  </View>
                  <View style={styles.enhancedStudentInfo}>
                    <Text style={styles.enhancedStudentName}>{student.full_name}</Text>
                    <View style={styles.studentMetaRow}>
                      <IconSymbol name="calendar" size={12} color="#6B7280" />
                      <Text style={styles.studentAge}>{student.age} years old</Text>
                    </View>
                    <View style={styles.studentMetaRow}>
                      <IconSymbol name="building.2" size={12} color="#6B7280" />
                      <Text style={styles.studentClass}>{student.class_name}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.studentMenuButton}>
                    <IconSymbol name="ellipsis.vertical" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Student Stats */}
                <View style={styles.studentStatsRow}>
                  <View style={styles.studentStatItem}>
                    <Text style={styles.studentStatValue}>{formatPercentage(student.attendance_rate)}</Text>
                    <Text style={styles.studentStatLabel}>Attendance</Text>
                  </View>
                  <View style={styles.studentStatDivider} />
                  <View style={styles.studentStatItem}>
                    <View style={styles.paymentStatusRow}>
                      <IconSymbol
                        name={student.monthly_fee_status === 'paid' ? 'checkmark.circle.fill' : 'clock.fill'}
                        size={16}
                        color={student.monthly_fee_status === 'paid' ? '#10B981' : '#F59E0B'}
                      />
                      <Text style={[
                        styles.paymentStatusText,
                        { color: student.monthly_fee_status === 'paid' ? '#10B981' : '#F59E0B' }
                      ]}>
                        {student.monthly_fee_status === 'paid' ? 'Paid' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Teacher & Parent Info */}
                <View style={styles.studentContactsRow}>
                  <View style={styles.contactItem}>
                    <IconSymbol name="person.fill.checkmark" size={14} color="#7C3AED" />
                    <Text style={styles.contactText}>{student.teacher_name}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <IconSymbol name="person.2.fill" size={14} color="#8B5CF6" />
                    <Text style={styles.contactText}>{student.parent_name}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTeachers = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.tabContent}>
        {/* Enhanced Teachers Header */}
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.enhancedSectionTitle}>Teachers</Text>
            <View style={styles.teacherCountBadge}>
              <Text style={styles.countBadgeText}>{dashboardData.teachers.length}</Text>
            </View>
          </View>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.filterButton}>
              <IconSymbol name="line.3.horizontal.decrease" size={18} color="#6B7280" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.enhancedAddButton}
              onPress={() => setShowTeacherManagement(true)}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.addButtonGradient}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <Text style={styles.enhancedAddButtonText}>Add Teacher</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Teachers Grid */}
        <View style={styles.teachersGrid}>
          {dashboardData.teachers.map((teacher, index) => (
            <View key={teacher.id} style={styles.enhancedTeacherCard}>
              <LinearGradient
                colors={[
                  teacher.performance_rating >= 4 ? '#10B98115' : teacher.performance_rating >= 3 ? '#F59E0B15' : '#EF444415',
                  teacher.performance_rating >= 4 ? '#10B98108' : teacher.performance_rating >= 3 ? '#F59E0B08' : '#EF444408'
                ]}
                style={styles.teacherCardGradient}
              >
                {/* Teacher Header */}
                <View style={styles.enhancedTeacherHeader}>
                  <View style={styles.teacherAvatarContainer}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.enhancedTeacherAvatar}
                    >
                      <Text style={styles.enhancedTeacherAvatarText}>
                        {(teacher.name || '').split(' ').map(n => n[0]).join('')}
                      </Text>
                    </LinearGradient>
                    <View style={[styles.performanceIndicator, {
                      backgroundColor: teacher.performance_rating >= 4 ? '#10B981' : teacher.performance_rating >= 3 ? '#F59E0B' : '#EF4444'
                    }]} />
                  </View>
                  <View style={styles.enhancedTeacherInfo}>
                    <Text style={styles.enhancedTeacherName}>{teacher.name}</Text>
                    <View style={styles.teacherMetaRow}>
                      <IconSymbol name="building.2" size={12} color="#6B7280" />
                      <Text style={styles.teacherClasses}>{teacher.classes_assigned} classes</Text>
                    </View>
                    <View style={styles.teacherMetaRow}>
                      <IconSymbol name="person.3" size={12} color="#6B7280" />
                      <Text style={styles.teacherStudents}>{teacher.students_count} students</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.teacherMenuButton}>
                    <IconSymbol name="ellipsis.vertical" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Performance Rating */}
                <View style={styles.performanceSection}>
                  <Text style={styles.performanceLabel}>Performance Rating</Text>
                  <View style={styles.enhancedRatingContainer}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <IconSymbol
                        key={i}
                        name={i < teacher.performance_rating ? "star.fill" : "star"}
                        size={18}
                        color={i < teacher.performance_rating ? "#F59E0B" : "#E5E7EB"}
                      />
                    ))}
                    <Text style={styles.ratingText}>{teacher.performance_rating}/5</Text>
                  </View>
                </View>

                {/* Teacher Stats */}
                <View style={styles.teacherStatsRow}>
                  <View style={styles.teacherStatItem}>
                    <Text style={styles.teacherStatValue}>{teacher.monthly_summary.reports_created}</Text>
                    <Text style={styles.teacherStatLabel}>Reports</Text>
                  </View>
                  <View style={styles.teacherStatDivider} />
                  <View style={styles.teacherStatItem}>
                    <Text style={styles.teacherStatValue}>{teacher.monthly_summary.messages_sent}</Text>
                    <Text style={styles.teacherStatLabel}>Messages</Text>
                  </View>
                  <View style={styles.teacherStatDivider} />
                  <View style={styles.teacherStatItem}>
                    <Text style={styles.teacherStatValue}>{teacher.monthly_summary.video_calls_conducted}</Text>
                    <Text style={styles.teacherStatLabel}>Calls</Text>
                  </View>
                </View>

                {/* Contact Info */}
                <View style={styles.teacherContactRow}>
                  <View style={styles.contactItem}>
                    <IconSymbol name="envelope.fill" size={14} color="#8B5CF6" />
                    <Text style={styles.contactText}>{teacher.email}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderParents = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.tabContent}>
        {/* Enhanced Parents Header */}
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.enhancedSectionTitle}>Parents</Text>
            <View style={styles.parentCountBadge}>
              <Text style={styles.countBadgeText}>{dashboardData.parents.length}</Text>
            </View>
          </View>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.filterButton}>
              <IconSymbol name="line.3.horizontal.decrease" size={18} color="#6B7280" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.enhancedAddButton}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.addButtonGradient}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <Text style={styles.enhancedAddButtonText}>Add Parent</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Parents Grid */}
        <View style={styles.parentsGrid}>
          {dashboardData.parents.map((parent, index) => (
            <View key={parent.id} style={styles.enhancedParentCard}>
              <LinearGradient
                colors={[
                  parent.payment_status === 'current' ? '#8B5CF615' : '#EF444415',
                  parent.payment_status === 'current' ? '#8B5CF608' : '#EF444408'
                ]}
                style={styles.parentCardGradient}
              >
                {/* Parent Header */}
                <View style={styles.enhancedParentHeader}>
                  <View style={styles.parentAvatarContainer}>
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.enhancedParentAvatar}
                    >
                      <Text style={styles.enhancedParentAvatarText}>
                        {(parent.name || '').split(' ').map(n => n[0]).join('')}
                      </Text>
                    </LinearGradient>
                    <View style={[styles.parentStatusIndicator, {
                      backgroundColor: parent.payment_status === 'current' ? '#10B981' : '#EF4444'
                    }]} />
                  </View>
                  <View style={styles.enhancedParentInfo}>
                    <Text style={styles.enhancedParentName}>{parent.name}</Text>
                    <View style={styles.parentMetaRow}>
                      <IconSymbol name="person.2" size={12} color="#6B7280" />
                      <Text style={styles.parentChildren}>{parent.children_names.length} child{parent.children_names.length !== 1 ? 'ren' : ''}</Text>
                    </View>
                    <View style={styles.parentMetaRow}>
                      <IconSymbol name="envelope" size={12} color="#6B7280" />
                      <Text style={styles.parentEmail}>{parent.email}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.parentMenuButton}>
                    <IconSymbol name="ellipsis.vertical" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Children List */}
                <View style={styles.childrenSection}>
                  <Text style={styles.childrenLabel}>Children</Text>
                  <View style={styles.childrenTags}>
                    {parent.children_names.map((childName, idx) => (
                      <View key={idx} style={styles.childTag}>
                        <Text style={styles.childTagText}>{childName}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Parent Stats */}
                <View style={styles.parentStatsRow}>
                  <View style={styles.parentStatItem}>
                    <Text style={styles.parentStatValue}>{formatPercentage(parent.engagement_score)}</Text>
                    <Text style={styles.parentStatLabel}>Engagement</Text>
                  </View>
                  <View style={styles.parentStatDivider} />
                  <View style={styles.parentStatItem}>
                    <Text style={styles.parentStatValue}>{formatCurrency(parent.total_fees_paid)}</Text>
                    <Text style={styles.parentStatLabel}>Total Paid</Text>
                  </View>
                </View>

                {/* Payment Status */}
                <View style={styles.parentPaymentRow}>
                  <View style={styles.paymentStatusContainer}>
                    <IconSymbol
                      name={parent.payment_status === 'current' ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
                      size={16}
                      color={parent.payment_status === 'current' ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[
                      styles.paymentStatusText,
                      { color: parent.payment_status === 'current' ? '#10B981' : '#EF4444' }
                    ]}>
                      {parent.payment_status === 'current' ? 'Current' : 'Overdue'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderClasses = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Classes ({dashboardData.classes.length})</Text>
          <TouchableOpacity style={styles.addButton}>
            <IconSymbol name="plus" size={20} color="#3B82F6" />
            <Text style={styles.addButtonText}>Add Class</Text>
          </TouchableOpacity>
        </View>

        {dashboardData.classes.map((classItem) => (
          <View key={classItem.id} style={styles.classCard}>
            <View style={styles.classHeader}>
              <View style={styles.classIcon}>
                <IconSymbol name="building.2.fill" size={24} color="#3B82F6" />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.classDetails}>
                  {classItem.age_group_name} • Room {classItem.room_number || 'TBA'}
                </Text>
                <Text style={styles.classTeacher}>Teacher: {classItem.teacher_name}</Text>
              </View>
              <View style={styles.classCapacity}>
                <Text style={styles.capacityNumber}>{classItem.student_count}</Text>
                <Text style={styles.capacityLabel}>students</Text>
              </View>
            </View>
            <View style={styles.classFooter}>
              <Text style={styles.classRevenue}>
                Monthly Revenue: {formatCurrency(classItem.monthly_revenue)}
              </Text>
              <Text style={styles.classCapacityPercent}>
                Capacity: {formatPercentage(classItem.capacity_percentage)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderFinances = () => {
    if (!dashboardData) return null;
    const financials = dashboardData.financials;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>

        {/* Revenue Cards */}
        <View style={styles.financeGrid}>
          <View style={styles.financeCard}>
            <Text style={styles.financeTitle}>Monthly Revenue</Text>
            <Text style={styles.financeValue}>{formatCurrency(financials.monthly_revenue)}</Text>
          </View>
          <View style={styles.financeCard}>
            <Text style={styles.financeTitle}>Collection Rate</Text>
            <Text style={styles.financeValue}>{formatPercentage(financials.collection_rate)}</Text>
          </View>
        </View>

        <View style={styles.financeGrid}>
          <View style={styles.financeCard}>
            <Text style={styles.financeTitle}>Pending</Text>
            <Text style={[styles.financeValue, { color: '#F59E0B' }]}>{formatCurrency(financials.pending_payments)}</Text>
          </View>
          <View style={styles.financeCard}>
            <Text style={styles.financeTitle}>Overdue</Text>
            <Text style={[styles.financeValue, { color: '#EF4444' }]}>{formatCurrency(financials.overdue_payments)}</Text>
          </View>
        </View>

        {/* Payment Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Trends (Last 6 Months)</Text>
          {financials.payment_trends.map((trend, index) => (
            <View key={index} style={styles.trendItem}>
              <Text style={styles.trendMonth}>{trend.month}</Text>
              <Text style={styles.trendRevenue}>{formatCurrency(trend.revenue)}</Text>
              <Text style={styles.trendStudents}>{trend.students} students</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading school data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'students': return renderStudents();
      case 'teachers': return renderTeachers();
      case 'parents': return renderParents();
      case 'classes': return renderClasses();
      case 'finances': return renderFinances();
      default: return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader
        user={userProfile}
        schoolName={schoolName}
        onNotificationsPress={() => {/* TODO: Implement action */ }}
        onSignOut={onSignOut}
        onNavigate={handleNavigate}
        notificationCount={dashboardData?.alerts.length || 0}
      />

      <View style={styles.headerSection}>
        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        <Text style={styles.subtitle}>Manage your preschool with ease</Text>
      </View>

      <ScrollView
        style={[styles.scrollView, { marginBottom: 56 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderContent()}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabNavigation}>
        {renderBottomTabButton('overview', 'Overview', 'chart.bar.fill')}
        {renderBottomTabButton('students', 'Students', 'person.3.fill')}
        {renderBottomTabButton('teachers', 'Teachers', 'person.badge.plus')}
        {renderBottomTabButton('parents', 'Parents', 'person.2.fill')}
        {renderBottomTabButton('classes', 'Classes', 'building.2')}
        {renderBottomTabButton('finances', 'Finances', 'creditcard.fill')}
      </View>

      {/* Teacher Management Modal */}
      {showTeacherManagement && (
        <TeacherManagement
          preschoolId={dashboardData?.school_stats?.preschool_id || dashboardData?.preschool_id || userId}
          principalId={userId}
          visible={showTeacherManagement}
          onClose={() => {
            setShowTeacherManagement(false);
            // Refresh data to show any new teachers
            loadDashboardData();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  },
  tabNavigation: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabNavigationContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#EBF4FF',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activeTabButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  // Small screen: stack vertically
  statsGridSmall: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  revenueTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  revenueSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  attendanceTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  attendanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  attendanceSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  alertTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  studentTeacher: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  studentStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  studentAttendance: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  studentParent: {
    fontSize: 12,
    color: '#6B7280',
  },
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  teacherDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  teacherEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  teacherRating: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  teacherSummary: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  parentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  parentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parentAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  parentChildren: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  parentEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  parentStatus: {
    alignItems: 'flex-end',
  },
  parentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  parentEngagement: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  parentFees: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  classTeacher: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  classCapacity: {
    alignItems: 'center',
  },
  capacityNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  capacityLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  classRevenue: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  classCapacityPercent: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  financeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  financeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  financeTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  financeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  trendItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  trendMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  trendRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    flex: 1,
    textAlign: 'center',
  },
  trendStudents: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  bottomSpacing: {
    height: 20,
  },
  // New Mobile-First Overview Styles
  quickStatsContainer: {
    marginBottom: 24,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickStatCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  keyMetricsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metricSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginRight: 4,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Bottom Navigation Styles
  bottomTabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    minHeight: 56,
  },
  bottomTabButtonText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeBottomTabButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  // Next-Generation Hero Section Styles
  heroStatsContainer: {
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF90',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  heroStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 32,
  },
  heroStatItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroStatCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF30',
  },
  heroStatNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF90',
    textAlign: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  // Enhanced Students Section Styles
  enhancedSectionHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  enhancedSectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginRight: 12,
  },
  studentCountBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 32,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  filterButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  enhancedAddButton: {
    flex: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  enhancedAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  studentsGrid: {
    gap: 16,
  },
  enhancedStudentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  studentCardGradient: {
    padding: 20,
  },
  enhancedStudentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  enhancedStudentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedStudentAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  enhancedStudentInfo: {
    flex: 1,
  },
  enhancedStudentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  studentAge: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  studentClass: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  studentMenuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  studentStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF20',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  studentStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  studentStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  studentStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studentStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentContactsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF15',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  contactText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    flex: 1,
  },
  // New Overview Header and Stats Grid Styles
  overviewHeader: {
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  overviewTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  overviewSubtitle: {
    fontSize: 16,
    color: '#FFFFFF90',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  statsGridContainer: {
    marginBottom: 24,
    gap: 16,
  },
  // Compact stat cards (match Super Admin)
  statCardLite: {
    width: '48%',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    overflow: 'hidden',
  },
  statCardLiteSmall: {
    width: '100%',
  },
  statAccentBar: {
    height: 3,
    backgroundColor: '#EA4335',
    width: '100%',
  },
  statContentLite: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statIconLite: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValueLite: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabelLite: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Enhanced Teachers Section Styles
  teacherCountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 32,
    alignItems: 'center',
  },
  teachersGrid: {
    gap: 16,
  },
  enhancedTeacherCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  teacherCardGradient: {
    padding: 20,
  },
  enhancedTeacherHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  teacherAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  enhancedTeacherAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedTeacherAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  performanceIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  enhancedTeacherInfo: {
    flex: 1,
  },
  enhancedTeacherName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  teacherMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  teacherClasses: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  teacherStudents: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  teacherMenuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  enhancedRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  teacherStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF20',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  teacherStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  teacherStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  teacherStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teacherStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  teacherContactRow: {
    backgroundColor: '#FFFFFF15',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  // Enhanced Parents Section Styles
  parentCountBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 32,
    alignItems: 'center',
  },
  parentsGrid: {
    gap: 16,
  },
  enhancedParentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  parentCardGradient: {
    padding: 20,
  },
  enhancedParentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  parentAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  enhancedParentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedParentAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  parentStatusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  enhancedParentInfo: {
    flex: 1,
  },
  enhancedParentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  parentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  parentMenuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  childrenSection: {
    marginBottom: 16,
  },
  childrenLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  childrenTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  childTag: {
    backgroundColor: '#FFFFFF25',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },
  childTagText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  parentStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF20',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  parentStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  parentStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  parentStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  parentStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  parentPaymentRow: {
    backgroundColor: '#FFFFFF15',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
