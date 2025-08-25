/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Alert, FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import {
  approveOnboardingRequest,
  getAllOnboardingRequests,
  rejectOnboardingRequest
} from '@/lib/services/onboardingService';
import { SuperAdminDataService } from '@/lib/services/superAdminDataService';
import { supabase, supabaseAdmin } from '@/lib/supabase';

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
  reviewed_by?: string;
  reviewed_at?: string;
}

interface OnboardingRequestManagerProps {
  superAdminUserId: string;
}

const OnboardingRequestManager: React.FC<OnboardingRequestManagerProps> = ({
  superAdminUserId
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Track which approved requests have successfully created schools
  const [schoolCreationStatus, setSchoolCreationStatus] = useState<Record<string, boolean>>({});

  // Create School Form State
  const [schoolName, setSchoolName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('basic');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllOnboardingRequests();
      setRequests(data as OnboardingRequest[]);
      
      // Check school creation status for approved requests
      await checkSchoolCreationStatus(data as OnboardingRequest[]);
    } catch (error) {
      console.error('❌ [OnboardingManager] fetchRequests: Error fetching onboarding requests:', error);
      Alert.alert('Error', 'Failed to load onboarding requests: ' + (error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  const checkSchoolCreationStatus = async (requests: OnboardingRequest[]) => {
    try {
      const approvedRequests = requests.filter(r => r.status === 'approved');
      const statusMap: Record<string, boolean> = {};

      // Use admin client to bypass RLS restrictions for preschools table access
      const adminClient = supabaseAdmin || (window as any).supabaseClients?.supabaseAdmin;
      
      if (!adminClient) {
        console.warn('⚠️ [OnboardingManager] Admin client not available for school status check, skipping...');
        // If admin client is not available, assume all approved requests need setup completion
        approvedRequests.forEach(request => {
          statusMap[request.id] = false;
        });
        setSchoolCreationStatus(statusMap);
        return;
      }

      for (const request of approvedRequests) {
        try {
          const { data: school, error } = await adminClient
            .from('preschools')
            .select('id, name, setup_completed, onboarding_status')
            .eq('email', request.admin_email)
            .maybeSingle(); // Use maybeSingle to handle case where no school exists

          if (!error && school) {
            // School exists and is properly set up
            statusMap[request.id] = school.setup_completed && school.onboarding_status === 'completed';
          } else {
            // School not found or error
            statusMap[request.id] = false;
          }
        } catch (schoolError) {
          // Removed debug statement: console.error(`❌ [OnboardingManager] Error checking school for ${request.admin_email}:`, schoolError);
          statusMap[request.id] = false;
        }
      }

      setSchoolCreationStatus(statusMap);
    } catch (error) {
      // Removed debug statement: console.error('❌ [OnboardingManager] Error checking school creation status:', error);
    }
  };

  const handleApprove = async (request: OnboardingRequest) => {

    // TODO: Test Alert on mobile device - currently commented out for web testing
    /*
    Alert.alert(
      'Approve School',
      `Approve "${request.preschool_name}" and create school account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Create School',
          style: 'default',
          onPress: async () => {
            await performApproval(request);
          }
        }
      ]
    );
    */

    // Temporary web fallback - use window.confirm or proceed directly
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Approve "${request.preschool_name}" and create school account?`)
      : true;

    if (!confirmed) {
      return;
    }

    await performApproval(request);
  };

  const performApproval = async (request: OnboardingRequest) => {
    try {
      setProcessing(request.id);
      
      // Log current user authentication state
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated. Please sign in again.');
      }
      
      const result = await approveOnboardingRequest(request.id) as any;

      if (result?.success) {
        // Optimistically update UI to prevent stale state from showing
        setRequests(currentRequests =>
          currentRequests.map(r =>
            r.id === request.id ? { ...r, status: 'approved', reviewed_at: new Date().toISOString() as any } : r
          )
        );
        setSchoolCreationStatus(prev => ({...prev, [request.id]: true}));

        const adminEmail = result.admin_email || request.admin_email;
        const tempPassword = result.temp_password || '(Password previously sent)';

        if (typeof window !== 'undefined') {
          if (result.already_provisioned) {
            window.alert(`School \"${request.preschool_name}\" was already set up!\n\nThe school and admin account already exist.\nStatus: Already provisioned`);
          } else {
            window.alert(`School \"${request.preschool_name}\" has been created successfully!\n\nAdmin Email: ${adminEmail}\nTemporary Password: ${tempPassword}\n\nA welcome email has been sent with login instructions.`);
          }
        }
        
        // Small delay to avoid read-after-write replication lag
        await new Promise(res => setTimeout(res, 400));
        // Re-fetch to synchronize with the backend, even though UI is updated
        await fetchRequests();
        
        // Trigger dashboard refresh if callback is provided
        if (typeof (global as any).refreshSuperAdminDashboard === 'function') {
          (global as any).refreshSuperAdminDashboard();
        }
        
      } else {
        console.error('❌ [OnboardingManager] Approval failed:', result?.error);
        if (typeof window !== 'undefined') {
          window.alert(result.error || 'Failed to create school');
        }
      }
    } catch (error: any) {
      console.error('💥 [OnboardingManager] Exception during approval:', error);
      if (typeof window !== 'undefined') {
        window.alert(error.message || 'Failed to approve request');
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: OnboardingRequest) => {

    // Use window.confirm for web compatibility
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Are you sure you want to reject "${request.preschool_name}"?\n\nThis action will mark the request as rejected.`)
      : true;

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(request.id);

      await rejectOnboardingRequest(request.id, superAdminUserId);


      if (typeof window !== 'undefined') {
        window.alert(`Request for "${request.preschool_name}" has been rejected.`);
      } else {
        Alert.alert('Success', `Request for "${request.preschool_name}" has been rejected.`);
      }
      
      // Refresh data from server to get latest state
      await fetchRequests();

    } catch (error: any) {
      // Removed debug statement: console.error('💥 [OnboardingManager] Exception during rejection:', error);
      Alert.alert('Error', error.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const handleResendInstructions = async (request: OnboardingRequest) => {

    // Use window.confirm for web compatibility
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Resend welcome instructions to "${request.preschool_name}" admin?\n\nThis will generate a new password and send the setup email again.`)
      : true;

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(request.id);

      // First, find the actual school that was created from this onboarding request

      // Use admin client to bypass RLS restrictions - this is required for preschools table access
      const adminClient = supabaseAdmin || (window as any).supabaseClients?.supabaseAdmin;
      
      if (!adminClient) {
        if (typeof window !== 'undefined') {
          window.alert('Admin client not available. Cannot query preschools table due to RLS restrictions.\n\nPlease ensure the service role key is properly configured or use server-side operations.');
        }
        return;
      }
      
      const { data: schoolData, error: schoolError } = await adminClient
        .from('preschools')
        .select('id')
        .eq('email', request.admin_email)
        .maybeSingle(); // Use maybeSingle to handle case where no school exists

      if (schoolError || !schoolData) {
        // Removed debug statement: console.error('❌ [OnboardingManager] School not found for admin:', request.admin_email, schoolError);
        let errorMessage = `School not found for admin email: ${request.admin_email}`;
        
        if (schoolError) {
          // Check for specific error types
          if (schoolError.code === '406' || schoolError.message?.includes('406') || schoolError.message?.includes('Not Acceptable')) {
            errorMessage = `Database permission error (406) when looking up school for ${request.admin_email}.\n\nThis may be due to Row Level Security restrictions. Please contact technical support.`;
          } else if (schoolError.code === 'PGRST116' || schoolError.message?.includes('PGRST116')) {
            errorMessage = `No school found for admin email: ${request.admin_email}.\n\nThe school may not have been created yet. Please approve the request first.`;
          } else {
            errorMessage = `Database error when looking up school: ${schoolError.message || schoolError.code || 'Unknown error'}`;
          }
        } else {
          errorMessage = `No school found for admin email: ${request.admin_email}.\n\nThe school may not have been created yet. Please approve the request first.`;
        }
        
        if (typeof window !== 'undefined') {
          window.alert(errorMessage);
        }
        return;
      }


      // Now resend instructions using the actual school ID
      const resendResult = await SuperAdminDataService.resendWelcomeInstructions(
        schoolData.id, // Using actual school ID
        'Admin requested resend via dashboard'
      );


      if (resendResult?.success) {
        if (typeof window !== 'undefined') {
          window.alert(`Instructions resent successfully!\n\nEmail sent to: ${resendResult.admin_email}\n${resendResult.password_updated ? 'New password generated.' : 'Please contact support if issues persist.'}`);
        }
        
        // Refresh data from server to get updated school creation status
        await fetchRequests();
      } else {
        // Removed debug statement: console.error('❌ [OnboardingManager] Resend failed:', resendResult?.error);
        if (typeof window !== 'undefined') {
          window.alert(resendResult?.error || 'Failed to resend instructions');
        }
      }
    } catch (error: any) {
      // Removed debug statement: console.error('💥 [OnboardingManager] Exception during resend:', error);
      if (typeof window !== 'undefined') {
        window.alert(error.message || 'Failed to resend instructions');
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteSetup = async (request: OnboardingRequest) => {

    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Complete the setup for "${request.preschool_name}"?\n\nThis will create the missing school and admin account.`)
      : true;

    if (!confirmed) {
      return;
    }

    // Reuse the performApproval function since it does exactly what we need
    await performApproval(request);
  };

  const handleUpdateProfile = async (request: OnboardingRequest) => {

    if (typeof window !== 'undefined') {
      window.alert(`Profile update functionality will redirect to the school admin's profile management page.\n\nSchool: ${request.preschool_name}\nAdmin: ${request.admin_name}\n\nThis feature will be implemented to allow updating school information, admin details, and other profile settings.`);
    } else {
      Alert.alert(
        'Update Profile',
        `Profile update functionality for ${request.preschool_name} will be implemented to allow updating school information and admin details.`
      );
    }

    // TODO: Implement profile update modal or navigation to profile management
    // This could open a modal with editable school information, admin details, etc.
    // or navigate to a dedicated profile management screen for this school
  };

  const handleDeleteSchool = async (request: OnboardingRequest) => {

    // Use window.confirm for web compatibility
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`⚠️ DANGEROUS OPERATION ⚠️\n\nPermanently delete the ENTIRE SCHOOL "${request.preschool_name}"?\n\n🚨 This will delete:\n- The school record\n- All admin users\n- All associated data\n\nThis action CANNOT be undone!`)
      : true;

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(request.id);

      // Prefer server-side deletion to ensure Auth users and tenant data are removed
      // Find school by admin email (server will delete by ID once sent)
      const { data: schoolData, error: schoolError } = await supabase
        .from('preschools')
        .select('id')
        .eq('email', request.admin_email)
        .single();
      if (schoolError || !schoolData) {
        // Removed debug statement: console.error('❌ [OnboardingManager] School not found for admin:', request.admin_email, schoolError);
        Alert.alert('School Not Found', `School not found for admin email: ${request.admin_email}`);
        return;
      }

      const { data: delRes, error: delErr } = await supabase.functions.invoke('superadmin_delete_school', {
        body: { schoolId: schoolData.id, requestId: request.id },
      });
      if (delErr || !delRes?.success) {
        // Removed debug statement: console.error('❌ [OnboardingManager] Server-side delete failed:', delErr || delRes);
        Alert.alert('Error', delErr?.message || delRes?.error || 'Failed to delete school');
        return;
      }

      Alert.alert(
        '✅ School Deleted',
        `School "${request.preschool_name}" and all associated data has been permanently deleted.\n\nThis included:\n- School record\n- Admin users\n- Onboarding request`
      );

      await fetchRequests(); // Refresh list

    } catch (error: any) {
      // Removed debug statement: console.error('💥 [OnboardingManager] Exception during school deletion:', error);
      Alert.alert(
        'Critical Error',
        `Critical error during school deletion: ${error.message}\n\nPlease check the database manually and contact support if needed.`
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRequest = async (request: OnboardingRequest) => {

    // Use window.confirm for web compatibility
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Permanently delete the request for "${request.preschool_name}"? This cannot be undone.`)
      : true;

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(request.id);

      // Prefer server-side deletion to bypass RLS safely
      const { data: delRes, error: delErr } = await supabase.functions.invoke('superadmin_delete_onboarding_request', {
        body: { requestId: request.id },
      });
      if (delErr || !delRes?.success) {
        // Removed debug statement: console.error('❌ [OnboardingManager] Delete failed:', delErr || delRes);
        Alert.alert('Delete failed', delErr?.message || delRes?.error || 'Failed to delete request');
        return;
      }


      Alert.alert('Deleted', `Request for "${request.preschool_name}" has been permanently deleted.`);
      
      // Refresh data from server to get latest state
      await fetchRequests();

    } catch (error: any) {
      // Removed debug statement: console.error('💥 [OnboardingManager] Exception during deletion:', error);
      Alert.alert('Error', error.message || 'Failed to delete request');
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateSchool = async () => {
    if (!schoolName.trim() || !adminName.trim() || !adminEmail.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setProcessing('create');

      const result = await SuperAdminDataService.createSchool({
        name: schoolName.trim(),
        email: adminEmail.trim(),
        admin_name: adminName.trim(),
        subscription_plan: subscriptionPlan
      });

      if (result.success) {
        Alert.alert('Success', `School "${schoolName}" has been created successfully!`);
        setShowCreateModal(false);
        // Reset form
        setSchoolName('');
        setAdminName('');
        setAdminEmail('');
        setSubscriptionPlan('basic');
      } else {
        Alert.alert('Error', result.error || 'Failed to create school');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create school');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'clock';
      case 'approved': return 'checkmark.circle';
      case 'rejected': return 'x.circle';
      default: return 'questionmark.circle';
    }
  };

  const renderRequest = ({ item }: { item: OnboardingRequest }) => (
    <TouchableOpacity
      style={[styles.requestCard, { backgroundColor: palette.surface }]}
      onPress={() => setSelectedRequest(item)}
    >
      <View style={styles.requestHeader}>
        <View>
          <Text style={[styles.schoolName, { color: palette.text }]}>{item.preschool_name}</Text>
          <Text style={[styles.adminName, { color: palette.textSecondary }]}>Admin: {item.admin_name}</Text>
          <Text style={[styles.requestEmail, { color: palette.textSecondary }]}>{item.admin_email}</Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <IconSymbol
              name={getStatusIcon(item.status) as any}
              size={12}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={[styles.requestDate, { color: palette.textSecondary }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => {
                handleApprove(item);
              }}
              disabled={processing === item.id}
            >
              {processing === item.id ? (
                <LoadingSpinner size={16} color="#FFFFFF" />
              ) : (
                <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
              )}
              <Text style={styles.actionButtonText}>Approve & Create</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item)}
              disabled={processing === item.id}
            >
              <IconSymbol name="x" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
          
          {/* Delete button for pending requests */}
          <View style={[styles.actionButtons, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteRequest(item)}
              disabled={processing === item.id}
            >
              {processing === item.id ? (
                <LoadingSpinner size={16} color="#FFFFFF" />
              ) : (
                <IconSymbol name="trash" size={16} color="#FFFFFF" />
              )}
              <Text style={styles.actionButtonText}>Delete Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {item.status === 'approved' && (() => {
        const isSchoolCompleted = schoolCreationStatus[item.id] === true;
        
        return (
          <View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, isSchoolCompleted ? styles.successButton : styles.warningButton]}
                onPress={() => isSchoolCompleted ? handleUpdateProfile(item) : handleCompleteSetup(item)}
                disabled={processing === item.id}
              >
                {processing === item.id ? (
                  <LoadingSpinner size={16} color="#FFFFFF" />
                ) : (
                  <IconSymbol name={isSchoolCompleted ? "person.crop.circle" : "wrench"} size={16} color="#FFFFFF" />
                )}
                <Text style={styles.actionButtonText}>{isSchoolCompleted ? 'Update Profile' : 'Complete Setup'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.resendButton]}
                onPress={() => handleResendInstructions(item)}
                disabled={processing === item.id}
              >
                {processing === item.id ? (
                  <LoadingSpinner size={16} color="#FFFFFF" />
                ) : (
                  <IconSymbol name="mail" size={16} color="#FFFFFF" />
                )}
                <Text style={styles.actionButtonText}>Resend Instructions</Text>
              </TouchableOpacity>
            </View>

            {/* Dangerous Operations - Second Row */}
            <View style={[styles.actionButtons, { marginTop: 8 }]}>
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={() => handleDeleteSchool(item)}
                disabled={processing === item.id}
              >
                {processing === item.id ? (
                  <LoadingSpinner size={16} color="#FFFFFF" />
                ) : (
                  <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
                )}
                <Text style={styles.actionButtonText}>🚨 Delete School</Text>
              </TouchableOpacity>
              
              {/* Only show Delete Request button if school setup is NOT completed */}
              {!isSchoolCompleted && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteRequest(item)}
                  disabled={processing === item.id}
                >
                  {processing === item.id ? (
                    <LoadingSpinner size={16} color="#FFFFFF" />
                  ) : (
                    <IconSymbol name="trash" size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.actionButtonText}>Delete Request</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })()}

      {item.status === 'rejected' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRequest(item)}
            disabled={processing === item.id}
          >
            {processing === item.id ? (
              <LoadingSpinner size={16} color="#FFFFFF" />
            ) : (
              <IconSymbol name="trash" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>Delete Request</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="small" color={palette.primary} message="Loading onboarding requests..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }] }>
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.outline }] }>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: palette.text }]}>🏫 School Onboarding Requests</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <IconSymbol name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create School</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        key={`requests-${requests.length}`}
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]}
        refreshing={loading}
        onRefresh={fetchRequests}
        extraData={requests}
        removeClippedSubviews={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="document" size={48} color={palette.textSecondary} />
            <Text style={[styles.emptyText, { color: palette.text }]}>No onboarding requests found</Text>
            <Text style={[styles.emptySubtext, { color: palette.textSecondary }]}>New school requests will appear here</Text>
          </View>
        }
      />

      {/* Create School Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: palette.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: palette.outline }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <IconSymbol name="x" size={24} color={palette.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Create New School</Text>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: palette.text } ]}>School Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: palette.outline, backgroundColor: palette.surface, color: palette.text }]}
                value={schoolName}
                onChangeText={setSchoolName}
                placeholder="Enter school name"
                placeholderTextColor={palette.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: palette.text } ]}>Admin Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: palette.outline, backgroundColor: palette.surface, color: palette.text }]}
                value={adminName}
                onChangeText={setAdminName}
                placeholder="Enter admin full name"
                placeholderTextColor={palette.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: palette.text } ]}>Admin Email *</Text>
              <TextInput
                style={[styles.input, { borderColor: palette.outline, backgroundColor: palette.surface, color: palette.text }]}
                value={adminEmail}
                onChangeText={setAdminEmail}
                placeholder="Enter admin email"
                placeholderTextColor={palette.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: palette.text }]}>Subscription Plan</Text>
              <View style={styles.planSelector}>
                {['trial', 'basic', 'premium'].map((plan) => (
                  <TouchableOpacity
                    key={plan}
                    style={[
                      styles.planOption,
                      { borderColor: palette.outline },
                      subscriptionPlan === plan && [styles.planOptionSelected, { backgroundColor: palette.surfaceVariant, borderColor: palette.primary }]
                    ]}
                    onPress={() => setSubscriptionPlan(plan)}
                  >
                    <Text style={[
                      styles.planText,
                      { color: palette.textSecondary },
                      subscriptionPlan === plan && [styles.planTextSelected, { color: palette.primary }]
                    ]}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, processing === 'create' && styles.submitButtonDisabled]}
              onPress={handleCreateSchool}
              disabled={processing === 'create'}
            >
              {processing === 'create' ? (
                <LoadingSpinner size={20} color="#FFFFFF" />
              ) : (
                <IconSymbol name="plus.app" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.submitButtonText}>Create School</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Request Details Modal */}
      <Modal
        visible={!!selectedRequest}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedRequest && (
          <View style={[styles.modalContainer, { backgroundColor: palette.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: palette.outline }]}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedRequest(null)}
              >
                <IconSymbol name="x" size={24} color={palette.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Request Details</Text>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>School Information</Text>
                <Text style={styles.detailValue}>{selectedRequest.preschool_name}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Administrator</Text>
                <Text style={styles.detailValue}>{selectedRequest.admin_name}</Text>
                <Text style={styles.detailSubValue}>{selectedRequest.admin_email}</Text>
                {selectedRequest.phone && (
                  <Text style={styles.detailSubValue}>{selectedRequest.phone}</Text>
                )}
              </View>

              {selectedRequest.address && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{selectedRequest.address}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Expected Numbers</Text>
                {selectedRequest.number_of_students && (
                  <Text style={styles.detailValue}>Students: {selectedRequest.number_of_students}</Text>
                )}
                {selectedRequest.number_of_teachers && (
                  <Text style={styles.detailValue}>Teachers: {selectedRequest.number_of_teachers}</Text>
                )}
              </View>

              {selectedRequest.message && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Message</Text>
                  <Text style={styles.detailValue}>{selectedRequest.message}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Request Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRequest.status) }]}>
                  <IconSymbol
                    name={getStatusIcon(selectedRequest.status) as any}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.statusText}>{selectedRequest.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.detailSubValue}>
                  Submitted: {new Date(selectedRequest.created_at).toLocaleString()}
                </Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'column',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100, // Extra padding to prevent last element from being hidden behind navbar
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  adminName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  requestEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  resendButton: {
    backgroundColor: '#3B82F6',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  dangerButton: {
    backgroundColor: '#7F1D1D',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    position: 'absolute',
    left: 20,
    padding: 8,
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  planSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  planOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  planOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3F4F6',
  },
  planText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  planTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
});

export default OnboardingRequestManager;
