import { IconSymbol } from '@/components/ui/IconSymbol';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingRequest {
  id: string;
  preschool_name: string;
  admin_name: string;
  admin_email: string;
  phone?: string;
  address?: string;
  number_of_students?: number;
  number_of_teachers?: number;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface School {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tenant_slug: string;
  subscription_plan: string;
  subscription_status: 'active' | 'inactive' | 'cancelled';
  max_students?: number;
  created_at: string;
}

interface SchoolsManagementState {
  loading: boolean;
  refreshing: boolean;
  activeTab: 'requests' | 'schools' | 'stats';
  onboardingRequests: OnboardingRequest[];
  schools: School[];
  stats: {
    totalSchools: number;
    activeSchools: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
  };
  selectedRequest: OnboardingRequest | null;
  showRequestModal: boolean;
  reviewNotes: string;
}

const SchoolsManagementContent = ({ profile }: { profile: any }) => {
  const [state, setState] = useState<SchoolsManagementState>({
    loading: true,
    refreshing: false,
    activeTab: 'requests',
    onboardingRequests: [],
    schools: [],
    stats: {
      totalSchools: 0,
      activeSchools: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
    },
    selectedRequest: null,
    showRequestModal: false,
    reviewNotes: '',
  });

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Load onboarding requests
      const { data: requests, error: requestsError } = await supabase
        .from('preschool_onboarding_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error loading requests:', requestsError);
        Alert.alert('Error', 'Failed to load onboarding requests');
        return;
      }

      // Load schools/preschools
      const { data: preschools, error: preschoolsError } = await supabase
        .from('preschools')
        .select('*')
        .order('created_at', { ascending: false });

      if (preschoolsError) {
        console.error('Error loading schools:', preschoolsError);
        Alert.alert('Error', 'Failed to load schools');
        return;
      }

      // Calculate stats
      const stats = {
        totalSchools: preschools?.length || 0,
        activeSchools: preschools?.filter(s => s.subscription_status === 'active').length || 0,
        pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
        approvedRequests: requests?.filter(r => r.status === 'approved').length || 0,
        rejectedRequests: requests?.filter(r => r.status === 'rejected').length || 0,
      };

      setState(prev => ({
        ...prev,
        onboardingRequests: requests || [],
        schools: preschools || [],
        stats,
        loading: false,
      }));

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const onRefresh = async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    await loadData();
    setState(prev => ({ ...prev, refreshing: false }));
  };

  const approveRequest = async (requestId: string) => {
    console.log('=== APPROVE REQUEST FUNCTION CALLED ===');
    console.log('Request ID:', requestId);
    console.log('Current onboarding requests:', state.onboardingRequests);
    
    // Ask for confirmation first
    const userConfirmed = window.confirm(
      'This will create a new school on the platform and send login credentials to the admin. Continue?'
    );
    
    if (!userConfirmed) {
      console.log('User cancelled approval');
      return;
    }
    
    console.log('User confirmed, starting approval process...');
    
    // Check if admin client is available
    if (!supabaseAdmin) {
      alert('Error: Admin operations not available - service role key missing');
      return;
    }
    
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Get the request details first
      const request = state.onboardingRequests.find(r => r.id === requestId);
      if (!request) {
        alert('Error: Request not found');
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log('Approving request:', request);

      // Step 1: Create the preschool
      const tenantSlug = request.preschool_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);

      console.log('Creating preschool with slug:', tenantSlug);

      const { data: preschoolData, error: preschoolError } = await supabase
        .from('preschools')
        .insert({
          name: request.preschool_name,
          email: request.admin_email,
          phone: request.phone,
          address: request.address,
          tenant_slug: tenantSlug,
          subscription_plan: 'basic',
          subscription_status: 'active',
          max_students: request.number_of_students || 50,
          billing_email: request.admin_email,
          onboarding_status: 'approved',
          setup_completed: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (preschoolError) {
        console.error('Error creating preschool:', preschoolError);
        alert('Error: Failed to create preschool - ' + preschoolError.message);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log('Created preschool:', preschoolData);

      // Step 2: Create admin user in Supabase Auth using admin client
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'; // Temporary password
      console.log('Creating auth user for email:', request.admin_email);
      console.log('Using admin client for user creation...');
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: request.admin_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: request.admin_name,
          role: 'admin'
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        // If auth user creation fails, we should delete the preschool
        await supabase.from('preschools').delete().eq('id', preschoolData.id);
        alert('Error: Failed to create admin account - ' + authError.message);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log('Created auth user:', authData);

      // Step 3: Create user profile in users table
      console.log('Creating user profile...');
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          preschool_id: preschoolData.id,
          name: request.admin_name,
          email: request.admin_email,
          phone: request.phone,
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (userError) {
        console.error('Error creating user profile:', userError);
        // Cleanup: delete auth user and preschool using admin client
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        await supabase.from('preschools').delete().eq('id', preschoolData.id);
        alert('Error: Failed to create user profile - ' + userError.message);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // Step 4: Update the onboarding request status
      console.log('Updating onboarding request status...');
      const { error: updateError } = await supabase
        .from('preschool_onboarding_requests')
        .update({ 
          status: 'approved', 
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id // Assuming profile has the super admin's ID
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request status:', updateError);
        alert('Warning: School created but failed to update request status');
      }

      // Step 5: Show success message with credentials
      console.log('SUCCESS: School creation completed!');
      const successMessage = `SUCCESS! School "${request.preschool_name}" has been created.\n\nAdmin Login Details:\nEmail: ${request.admin_email}\nTemporary Password: ${tempPassword}\n\nThe admin will need to change this password on first login.`;
      
      console.log(successMessage);
      alert(successMessage);
      
      // Refresh data and close modal
      await loadData();
      setState(prev => ({ ...prev, showRequestModal: false, selectedRequest: null }));
    } catch (error) {
      console.error('Error in approve request process:', error);
      alert('Error: An unexpected error occurred while approving the request - ' + error.message);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const rejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this onboarding request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('preschool_onboarding_requests')
                .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
                .eq('id', requestId);

              if (error) {
                Alert.alert('Error', 'Failed to reject request');
                return;
              }

              Alert.alert('Success', 'Request rejected successfully.');
              await loadData();
              setState(prev => ({ ...prev, showRequestModal: false, selectedRequest: null }));
            } catch (error) {
              Alert.alert('Error', 'Failed to reject request');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderStatsCards = () => (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
        <IconSymbol name="building.2" size={24} color="#3B82F6" />
        <Text style={styles.statNumber}>{state.stats.totalSchools}</Text>
        <Text style={styles.statLabel}>Total Schools</Text>
      </View>
      <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
        <IconSymbol name="checkmark.circle" size={24} color="#10B981" />
        <Text style={styles.statNumber}>{state.stats.activeSchools}</Text>
        <Text style={styles.statLabel}>Active Schools</Text>
      </View>
      <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
        <IconSymbol name="clock" size={24} color="#F59E0B" />
        <Text style={styles.statNumber}>{state.stats.pendingRequests}</Text>
        <Text style={styles.statLabel}>Pending Requests</Text>
      </View>
      <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
        <IconSymbol name="xmark.circle" size={24} color="#EF4444" />
        <Text style={styles.statNumber}>{state.stats.rejectedRequests}</Text>
        <Text style={styles.statLabel}>Rejected</Text>
      </View>
    </View>
  );

  const renderTabButton = (tab: 'requests' | 'schools' | 'stats', title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, state.activeTab === tab && styles.activeTabButton]}
      onPress={() => setState(prev => ({ ...prev, activeTab: tab }))}
    >
      <IconSymbol 
        name={icon as any} 
        size={20} 
        color={state.activeTab === tab ? '#FFFFFF' : '#6B7280'} 
      />
      <Text style={[
        styles.tabButtonText,
        state.activeTab === tab && styles.activeTabButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderOnboardingRequest = (request: OnboardingRequest) => (
    <TouchableOpacity
      key={request.id}
      style={styles.requestCard}
      onPress={() => setState(prev => ({ 
        ...prev, 
        selectedRequest: request, 
        showRequestModal: true 
      }))}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle}>{request.preschool_name}</Text>
        <View style={[
          styles.statusBadge,
          request.status === 'approved' ? styles.approvedBadge :
          request.status === 'rejected' ? styles.rejectedBadge : styles.pendingBadge
        ]}>
          <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.requestSubtitle}>
        Admin: {request.admin_name} ({request.admin_email})
      </Text>
      <View style={styles.requestMeta}>
        <Text style={styles.requestMetaText}>
          Students: {request.number_of_students || 'N/A'}
        </Text>
        <Text style={styles.requestMetaText}>
          {new Date(request.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSchool = (school: School) => (
    <TouchableOpacity key={school.id} style={styles.schoolCard}>
      <View style={styles.schoolHeader}>
        <Text style={styles.schoolTitle}>{school.name}</Text>
        <View style={[
          styles.statusBadge,
          school.subscription_status === 'active' ? styles.approvedBadge : styles.pendingBadge
        ]}>
          <Text style={styles.statusText}>{school.subscription_status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.schoolSubtitle}>
        {school.email} • Plan: {school.subscription_plan}
      </Text>
      <View style={styles.schoolMeta}>
        <Text style={styles.schoolMetaText}>
          Slug: {school.tenant_slug}
        </Text>
        <Text style={styles.schoolMetaText}>
          Created: {new Date(school.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRequestModal = () => (
    <Modal
      visible={state.showRequestModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setState(prev => ({ 
              ...prev, 
              showRequestModal: false, 
              selectedRequest: null 
            }))}
          >
            <IconSymbol name="xmark" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Review Request</Text>
          <View style={{ width: 24 }} />
        </View>

        {state.selectedRequest && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>School Information</Text>
              <Text style={styles.modalLabel}>School Name</Text>
              <Text style={styles.modalValue}>{state.selectedRequest.preschool_name}</Text>
              
              <Text style={styles.modalLabel}>Admin Name</Text>
              <Text style={styles.modalValue}>{state.selectedRequest.admin_name}</Text>
              
              <Text style={styles.modalLabel}>Admin Email</Text>
              <Text style={styles.modalValue}>{state.selectedRequest.admin_email}</Text>
              
              {state.selectedRequest.phone && (
                <>
                  <Text style={styles.modalLabel}>Phone</Text>
                  <Text style={styles.modalValue}>{state.selectedRequest.phone}</Text>
                </>
              )}
              
              {state.selectedRequest.address && (
                <>
                  <Text style={styles.modalLabel}>Address</Text>
                  <Text style={styles.modalValue}>{state.selectedRequest.address}</Text>
                </>
              )}
              
              <Text style={styles.modalLabel}>Expected Students</Text>
              <Text style={styles.modalValue}>
                {state.selectedRequest.number_of_students || 'Not specified'}
              </Text>
              
              <Text style={styles.modalLabel}>Expected Teachers</Text>
              <Text style={styles.modalValue}>
                {state.selectedRequest.number_of_teachers || 'Not specified'}
              </Text>
              
              {state.selectedRequest.message && (
                <>
                  <Text style={styles.modalLabel}>Message</Text>
                  <Text style={styles.modalValue}>{state.selectedRequest.message}</Text>
                </>
              )}
              
              <Text style={styles.modalLabel}>Submitted</Text>
              <Text style={styles.modalValue}>
                {new Date(state.selectedRequest.created_at).toLocaleDateString()} at{' '}
                {new Date(state.selectedRequest.created_at).toLocaleTimeString()}
              </Text>
            </View>

            {state.selectedRequest.status === 'pending' && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => {
                    console.log('Approve button pressed! Request ID:', state.selectedRequest!.id);
                    console.log('Calling approveRequest function...');
                    approveRequest(state.selectedRequest!.id);
                  }}
                >
                  <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => {
                    console.log('Reject button pressed! Request ID:', state.selectedRequest!.id);
                    console.log('Calling rejectRequest function...');
                    rejectRequest(state.selectedRequest!.id);
                  }}
                >
                  <IconSymbol name="xmark" size={20} color="#FFFFFF" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (state.activeTab === 'stats') {
      return (
        <View>
          {renderStatsCards()}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewText}>
                You're managing {state.stats.totalSchools} schools on the platform with{' '}
                {state.stats.activeSchools} currently active. There are{' '}
                {state.stats.pendingRequests} requests waiting for your review.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (state.activeTab === 'schools') {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Active Schools ({state.schools.length})
          </Text>
          {state.schools.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="building.2" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No schools created yet</Text>
            </View>
          ) : (
            state.schools.map(renderSchool)
          )}
        </View>
      );
    }

    // Default: Onboarding Requests
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Onboarding Requests ({state.onboardingRequests.length})
        </Text>
        {state.onboardingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No onboarding requests</Text>
          </View>
        ) : (
          state.onboardingRequests.map(renderOnboardingRequest)
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Schools Management</Text>
          <Text style={styles.subtitle}>
            Manage preschool onboarding and platform operations
          </Text>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('requests', 'Requests', 'doc.text')}
        {renderTabButton('schools', 'Schools', 'building.2')}
        {renderTabButton('stats', 'Analytics', 'chart.bar')}
      </View>
      
      {/* Main Content */}
      <ScrollView 
        style={styles.content} 
        refreshControl={
          <RefreshControl 
            refreshing={state.refreshing} 
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        {renderContent()}
      </ScrollView>

      {renderRequestModal()}
    </SafeAreaView>
  );
};

export default function SchoolsManagementScreen() {
  return (
    <AuthConsumer>
      {({ profile }) => <SchoolsManagementContent profile={profile} />}
    </AuthConsumer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    backgroundColor: '#3B82F6',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  requestSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  schoolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  schoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  schoolTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  schoolSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  schoolMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  schoolMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  approvedBadge: {
    backgroundColor: '#D1FAE5',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 16,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
