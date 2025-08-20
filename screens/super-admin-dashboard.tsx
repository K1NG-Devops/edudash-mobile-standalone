import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { 
  SuperAdminDataService, 
  type SuperAdminDashboardData,
  type SchoolOverview,
  type UserOverview,
  type PlatformActivity 
} from '@/lib/services/superAdminDataService';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('super-admin-dashboard');
const { width } = Dimensions.get('window');

interface SuperAdminDashboardProps {
  navigation: any;
  route: any;
}

export default function SuperAdminDashboard({ navigation, route }: SuperAdminDashboardProps) {
  const [dashboardData, setDashboardData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [createSchoolModalVisible, setCreateSchoolModalVisible] = useState(false);
  const [resendWelcomeModalVisible, setResendWelcomeModalVisible] = useState(false);
  
  // Form states
  const [newSchool, setNewSchool] = useState({
    name: '',
    email: '',
    admin_name: '',
    subscription_plan: 'trial'
  });
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [resendReason, setResendReason] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  // Mock user ID for super admin - in real app, get from auth context
  const superAdminUserId = 'super-admin-user-id';

  const loadDashboardData = async () => {
    try {
      log.info('📊 Loading super admin dashboard data...');
      const data = await SuperAdminDataService.getSuperAdminDashboardData(superAdminUserId);
      setDashboardData(data);
      log.info('✅ Dashboard data loaded successfully');
    } catch (error) {
      log.error('❌ Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleCreateSchool = async () => {
    if (!newSchool.name || !newSchool.email || !newSchool.admin_name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    try {
      log.info('🏫 Creating new school:', newSchool.name);
      const result = await SuperAdminDataService.createSchool(newSchool);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          `School created successfully!\n\nAdmin Email: ${result.admin_email}\nTemp Password: ${result.temp_password}\n\nWelcome email sent to admin.`,
          [{ text: 'OK', onPress: () => {
            setCreateSchoolModalVisible(false);
            setNewSchool({ name: '', email: '', admin_name: '', subscription_plan: 'trial' });
            handleRefresh();
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create school');
      }
    } catch (error) {
      log.error('❌ Error creating school:', error);
      Alert.alert('Error', 'Failed to create school');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendWelcomeInstructions = async () => {
    if (!selectedSchoolId) {
      Alert.alert('Error', 'No school selected');
      return;
    }

    setActionLoading(true);
    try {
      log.info('📧 Resending welcome instructions for school:', selectedSchoolId);
      const result = await SuperAdminDataService.resendWelcomeInstructions(
        selectedSchoolId, 
        resendReason || 'Admin requested resend'
      );
      
      if (result.success) {
        Alert.alert(
          'Success', 
          `Welcome instructions sent to ${result.admin_email}!`,
          [{ text: 'OK', onPress: () => {
            setResendWelcomeModalVisible(false);
            setResendReason('');
            setSelectedSchoolId(null);
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to resend welcome instructions');
      }
    } catch (error) {
      log.error('❌ Error resending welcome instructions:', error);
      Alert.alert('Error', 'Failed to resend welcome instructions');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendSchool = (schoolId: string, schoolName: string) => {
    Alert.alert(
      'Suspend School',
      `Are you sure you want to suspend ${schoolName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await SuperAdminDataService.suspendSchool(schoolId, 'Admin suspended');
              if (result.success) {
                Alert.alert('Success', 'School suspended successfully');
                handleRefresh();
              } else {
                Alert.alert('Error', result.error || 'Failed to suspend school');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to suspend school');
            }
          }
        }
      ]
    );
  };

  const handleSuspendUser = (userId: string, userName: string) => {
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await SuperAdminDataService.suspendUser(userId, 'Admin suspended');
              if (result.success) {
                Alert.alert('Success', 'User suspended successfully');
                handleRefresh();
              } else {
                Alert.alert('Error', result.error || 'Failed to suspend user');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to suspend user');
            }
          }
        }
      ]
    );
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderSystemHealthIndicator = () => {
    if (!dashboardData?.system_health) return null;
    
    const { database_status, uptime_percentage, api_response_time } = dashboardData.system_health;
    
    const getHealthColor = (status: string) => {
      switch (status) {
        case 'healthy': return '#10b981';
        case 'warning': return '#f59e0b';
        case 'error': return '#ef4444';
        default: return '#6b7280';
      }
    };

    return (
      <View style={styles.systemHealthCard}>
        <Text style={styles.sectionTitle}>🚀 System Health</Text>
        <View style={styles.healthIndicators}>
          <View style={styles.healthItem}>
            <View style={[styles.healthDot, { backgroundColor: getHealthColor(database_status) }]} />
            <Text style={styles.healthText}>Database: {database_status}</Text>
          </View>
          <View style={styles.healthItem}>
            <View style={[styles.healthDot, { backgroundColor: uptime_percentage > 99 ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.healthText}>Uptime: {uptime_percentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.healthItem}>
            <View style={[styles.healthDot, { backgroundColor: api_response_time < 1000 ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.healthText}>Response: {api_response_time}ms</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSchoolCard = (school: SchoolOverview) => (
    <View key={school.id} style={styles.itemCard}>
      <View style={styles.itemCardHeader}>
        <Text style={styles.itemName}>{school.name}</Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: school.subscription_status === 'active' ? '#10b981' : '#f59e0b' 
        }]}>
          <Text style={styles.statusText}>{school.subscription_status}</Text>
        </View>
      </View>
      
      <Text style={styles.itemSubtitle}>{school.email}</Text>
      
      <View style={styles.itemStats}>
        <Text style={styles.itemStatText}>👥 {school.user_count} users</Text>
        <Text style={styles.itemStatText}>🎓 {school.student_count} students</Text>
        <Text style={styles.itemStatText}>👨‍🏫 {school.teacher_count} teachers</Text>
      </View>
      
      <View style={styles.itemActions}>
        <Pressable 
          style={styles.actionButton}
          onPress={() => {
            setSelectedSchoolId(school.id);
            setResendWelcomeModalVisible(true);
          }}
        >
          <Ionicons name="mail" size={16} color="#3b82f6" />
          <Text style={[styles.actionButtonText, { color: '#3b82f6' }]}>Resend Welcome</Text>
        </Pressable>
        
        <Pressable 
          style={styles.actionButton}
          onPress={() => handleSuspendSchool(school.id, school.name)}
        >
          <Ionicons name="pause-circle" size={16} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Suspend</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderUserCard = (user: UserOverview) => (
    <View key={user.id} style={styles.itemCard}>
      <View style={styles.itemCardHeader}>
        <Text style={styles.itemName}>{user.name}</Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: user.account_status === 'active' ? '#10b981' : '#6b7280' 
        }]}>
          <Text style={styles.statusText}>{user.account_status}</Text>
        </View>
      </View>
      
      <Text style={styles.itemSubtitle}>{user.email}</Text>
      <Text style={styles.itemRole}>🏷️ {user.role} • {user.school_name || 'No school'}</Text>
      
      <View style={styles.itemActions}>
        <Pressable 
          style={styles.actionButton}
          onPress={() => handleSuspendUser(user.id, user.name)}
        >
          <Ionicons name="person-remove" size={16} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Suspend</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderActivityItem = (activity: PlatformActivity) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'user_registration': return 'person-add';
        case 'school_created': return 'business';
        case 'subscription_change': return 'card';
        case 'payment_received': return 'cash';
        case 'ai_usage': return 'brain';
        case 'security_alert': return 'shield-half';
        default: return 'information-circle';
      }
    };

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'critical': return '#ef4444';
        case 'high': return '#f59e0b';
        case 'medium': return '#3b82f6';
        case 'low': return '#10b981';
        default: return '#6b7280';
      }
    };

    return (
      <View key={activity.id} style={styles.activityItem}>
        <View style={styles.activityIcon}>
          <Ionicons 
            name={getActivityIcon(activity.type) as any} 
            size={20} 
            color={getSeverityColor(activity.severity)} 
          />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
          <Text style={styles.activityTime}>
            {new Date(activity.timestamp).toLocaleDateString()} • {activity.severity}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading super admin dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Super Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>EduDash Pro Platform Control</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionGrid}>
            <Pressable 
              style={styles.quickActionCard}
              onPress={() => setCreateSchoolModalVisible(true)}
            >
              <Ionicons name="add-circle" size={32} color="#10b981" />
              <Text style={styles.quickActionText}>Create School</Text>
            </Pressable>
            
            <Pressable 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Ionicons name="key" size={32} color="#3b82f6" />
              <Text style={styles.quickActionText}>Password Reset</Text>
            </Pressable>
          </View>
        </View>

        {/* Platform Stats */}
        {dashboardData?.platform_stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Platform Statistics</Text>
            <View style={styles.statsGrid}>
              {renderStatCard('Schools', dashboardData.platform_stats.total_schools, 'business', '#3b82f6')}
              {renderStatCard('Users', dashboardData.platform_stats.total_users, 'people', '#10b981')}
              {renderStatCard('Students', dashboardData.platform_stats.total_students, 'school', '#f59e0b')}
              {renderStatCard('Teachers', dashboardData.platform_stats.total_teachers, 'person', '#8b5cf6')}
              {renderStatCard('Active Subs', dashboardData.platform_stats.active_subscriptions, 'card', '#ef4444')}
              {renderStatCard('AI Usage', dashboardData.platform_stats.ai_usage_count, 'brain', '#06b6d4')}
            </View>
          </View>
        )}

        {/* System Health */}
        {renderSystemHealthIndicator()}

        {/* Pending Approvals */}
        {dashboardData?.pending_approvals && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Pending Approvals</Text>
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

        {/* Recent Schools */}
        {dashboardData?.recent_schools && dashboardData.recent_schools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏫 Recent Schools</Text>
            {dashboardData.recent_schools.slice(0, 5).map(renderSchoolCard)}
          </View>
        )}

        {/* Recent Users */}
        {dashboardData?.recent_users && dashboardData.recent_users.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Recent Users</Text>
            {dashboardData.recent_users.slice(0, 5).map(renderUserCard)}
          </View>
        )}

        {/* Platform Activity */}
        {dashboardData?.platform_activity && dashboardData.platform_activity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
            <View style={styles.activityList}>
              {dashboardData.platform_activity.slice(0, 10).map(renderActivityItem)}
            </View>
          </View>
        )}

        {/* System Alerts */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ System Alerts</Text>
            {dashboardData.alerts.map(alert => (
              <View key={alert.id} style={[styles.alertCard, {
                borderLeftColor: alert.priority === 'critical' ? '#ef4444' : 
                                alert.priority === 'high' ? '#f59e0b' : '#3b82f6'
              }]}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleString()} • {alert.priority}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create School Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createSchoolModalVisible}
        onRequestClose={() => setCreateSchoolModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🏫 Create New School</Text>
            
            <TextInput
              style={styles.input}
              placeholder="School Name"
              value={newSchool.name}
              onChangeText={(text) => setNewSchool({...newSchool, name: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="School Email"
              value={newSchool.email}
              onChangeText={(text) => setNewSchool({...newSchool, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Admin Name (Principal)"
              value={newSchool.admin_name}
              onChangeText={(text) => setNewSchool({...newSchool, admin_name: text})}
            />
            
            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateSchoolModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateSchool}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create School</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Resend Welcome Instructions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={resendWelcomeModalVisible}
        onRequestClose={() => setResendWelcomeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>📧 Resend Welcome Instructions</Text>
            
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Reason for resending (optional)"
              value={resendReason}
              onChangeText={setResendReason}
              multiline
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setResendWelcomeModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.createButton]}
                onPress={handleResendWelcomeInstructions}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Resend</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: (width - 56) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  systemHealthCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 14,
    color: '#374151',
  },
  approvalsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  approvalCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  approvalCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  approvalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  itemRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  itemStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  itemStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  createButton: {
    backgroundColor: '#3b82f6',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
