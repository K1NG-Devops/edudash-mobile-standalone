/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PrincipalService, TeacherInvitation } from '@/lib/services/principalService';
import { TeacherService } from '@/lib/services/teacherService';

const { width: screenWidth } = Dimensions.get('window');

interface TeacherManagementProps {
  preschoolId: string;
  principalId: string;
  onClose: () => void;
  visible: boolean;
}

interface TeacherData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  classes?: Array<{
    id: string;
    name: string;
    room_number: string;
    current_enrollment: number;
    max_capacity: number;
  }>;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  preschoolId,
  principalId,
  onClose,
  visible,
}) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'invitations' | 'invite'>('teachers');
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  // Per-invitation processing state to improve responsiveness feedback
  const [processing, setProcessing] = useState<{ [id: string]: 'resend' | 'revoke' | 'delete' | undefined }>({});

  // Form state for inviting new teacher
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (visible) {
      loadTeachers();
      loadInvitations();
    }
  }, [visible, preschoolId]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const result = await PrincipalService.getSchoolTeachers(preschoolId);
      if (result.data) {
        setTeachers(result.data);
      } else if (result.error) {
        // Removed debug statement: console.error('Error loading teachers:', result.error);
      }
    } catch (error) {
      // Removed debug statement: console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const result = await PrincipalService.getTeacherInvitations(preschoolId);
      if (result.data) {
        setInvitations(result.data);
      } else if (result.error) {
        // Removed debug statement: console.error('Error loading invitations:', result.error);
      }
    } catch (error) {
      // Removed debug statement: console.error('Error loading invitations:', error);
    }
  };

  const handleInviteTeacher = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      Alert.alert('Error', 'Please fill in the required fields (Name and Email)');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const result = await PrincipalService.inviteTeacher(
        inviteForm,
        preschoolId,
        principalId
      );

      if (result.data) {
        Alert.alert(
          'Invitation Sent!',
          `Teacher invitation has been sent to ${inviteForm.email}.\n\nInvitation Code: ${result.data.invitation_code}\n\nThe teacher will have 7 days to accept this invitation.`,
          [{ text: 'OK' }]
        );
        
        // Reset form
        setInviteForm({ name: '', email: '', phone: '' });
        
        // Refresh invitations list
        await loadInvitations();
        
        // Switch to invitations tab to show the new invitation
        setActiveTab('invitations');
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      // Removed debug statement: console.error('Error inviting teacher:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateTeacher = async (teacherId: string, teacherName: string) => {
    Alert.alert(
      'Deactivate Teacher',
      `Are you sure you want to deactivate ${teacherName}? They will lose access to the system.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await TeacherService.deactivateTeacher(teacherId);
              if (result.data) {
                Alert.alert('Success', `${teacherName} has been deactivated.`);
                await loadTeachers();
              } else {
                Alert.alert('Error', 'Failed to deactivate teacher');
              }
            } catch (error) {
              // Removed debug statement: console.error('Error deactivating teacher:', error);
              Alert.alert('Error', 'Failed to deactivate teacher');
            }
          },
        },
      ]
    );
  };

  const handleResendInvitation = async (invitation: TeacherInvitation) => {
    try {
  setProcessing((s) => ({ ...s, [invitation.id]: 'resend' }));
      const result = await PrincipalService.resendTeacherInvitation(
        invitation.id,
        preschoolId
      );

      if (result.success) {
        Alert.alert(
          'Email Resent! 📧',
          `Teacher invitation has been resent to ${invitation.email}.\n\nInvitation Code: ${invitation.invitation_code}\n\nThe teacher will have until ${formatDate(invitation.expires_at)} to accept this invitation.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to resend invitation email');
      }
    } catch (error) {
      // Removed debug statement: console.error('Error resending invitation:', error);
      Alert.alert('Error', 'Failed to resend invitation. Please try again.');
    } finally {
  setProcessing((s) => ({ ...s, [invitation.id]: undefined }));
    }
  };

  const handleRevokeInvitation = async (invitation: TeacherInvitation) => {
    Alert.alert(
      'Revoke Invitation?',
      `Are you sure you want to revoke the invitation for ${invitation.name}?\n\nThis will cancel the invitation but keep the record. The invitation code will no longer work.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing((s) => ({ ...s, [invitation.id]: 'revoke' }));
              const result = await PrincipalService.revokeTeacherInvitation(
                invitation.id,
                preschoolId
              );

              if (result.success) {
                Alert.alert(
                  'Invitation Revoked',
                  `The invitation for ${invitation.name} has been revoked. The invitation code is no longer valid.`,
                  [{ text: 'OK' }]
                );
                await loadInvitations();
              } else {
                Alert.alert('Error', result.error || 'Failed to revoke invitation');
              }
            } catch (error) {
              // Removed debug statement: console.error('Error revoking invitation:', error);
              Alert.alert('Error', 'Failed to revoke invitation. Please try again.');
            } finally {
              setProcessing((s) => ({ ...s, [invitation.id]: undefined }));
            }
          },
        },
      ]
    );
  };

  const handleDeleteInvitation = async (invitation: TeacherInvitation) => {
    Alert.alert(
      'Delete Invitation?',
      `Are you sure you want to permanently delete the invitation for ${invitation.name}?\n\nThis action cannot be undone and will completely remove the invitation record.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing((s) => ({ ...s, [invitation.id]: 'delete' }));
              const result = await PrincipalService.deleteTeacherInvitation(
                invitation.id,
                preschoolId
              );

              if (result.success) {
                Alert.alert(
                  'Invitation Deleted',
                  `The invitation for ${invitation.name} has been permanently deleted.`,
                  [{ text: 'OK' }]
                );
                await loadInvitations();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete invitation');
              }
            } catch (error) {
              // Removed debug statement: console.error('Error deleting invitation:', error);
              Alert.alert('Error', 'Failed to delete invitation. Please try again.');
            } finally {
              setProcessing((s) => ({ ...s, [invitation.id]: undefined }));
            }
          },
        },
      ]
    );
  };

  const handleCleanupExpired = async () => {
    Alert.alert(
      'Clean Up Expired Invitations?',
      'This will permanently delete all expired invitations for your school. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await PrincipalService.cleanupExpiredInvitations(preschoolId);

              if (result.success) {
                if (result.deletedCount > 0) {
                  Alert.alert(
                    'Cleanup Complete! 🧹',
                    `${result.deletedCount} expired invitation${result.deletedCount > 1 ? 's' : ''} removed.`,
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert(
                    'Nothing to Clean Up',
                    'No expired invitations found.',
                    [{ text: 'OK' }]
                  );
                }
                await loadInvitations();
              } else {
                Alert.alert('Error', result.error || 'Failed to clean up expired invitations');
              }
            } catch (error) {
              // Removed debug statement: console.error('Error cleaning up expired invitations:', error);
              Alert.alert('Error', 'Failed to clean up expired invitations. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'accepted':
        return '#10B981';
      case 'expired':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const TabButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  const renderTeachersTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Current Teachers ({teachers.length})</Text>
      
      {teachers.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="person.2" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No teachers found</Text>
          <Text style={styles.emptySubtext}>Invite your first teacher to get started</Text>
        </View>
      ) : (
        teachers.map((teacher) => (
          <View key={teacher.id} style={styles.teacherCard}>
            <View style={styles.teacherHeader}>
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{teacher.name}</Text>
                <Text style={styles.teacherEmail}>{teacher.email}</Text>
                {teacher.phone && (
                  <Text style={styles.teacherPhone}>{teacher.phone}</Text>
                )}
              </View>
              <View style={styles.teacherActions}>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: teacher.is_active ? '#10B981' : '#EF4444' }
                ]}>
                  <Text style={styles.statusText}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            
            {teacher.classes && teacher.classes.length > 0 && (
              <View style={styles.classesSection}>
                <Text style={styles.classesTitle}>Assigned Classes:</Text>
                {teacher.classes.map((cls) => (
                  <Text key={cls.id} style={styles.classItem}>
                    • {cls.name} (Room {cls.room_number}) - {cls.current_enrollment}/{cls.max_capacity} students
                  </Text>
                ))}
              </View>
            )}
            
            <View style={styles.teacherFooter}>
              <Text style={styles.joinedDate}>
                Joined: {formatDate(teacher.created_at)}
              </Text>
              {teacher.is_active && (
                <TouchableOpacity
                  style={styles.deactivateButton}
                  onPress={() => handleDeactivateTeacher(teacher.id, teacher.name)}
                >
                  <Text style={styles.deactivateText}>Deactivate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderInvitationsTab = () => {
    const expiredInvitations = invitations.filter(inv => 
      inv.status === 'pending' && new Date(inv.expires_at) < new Date()
    );

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Teacher Invitations ({invitations.length})</Text>
          {expiredInvitations.length > 0 && (
            <TouchableOpacity
              style={styles.cleanupButton}
              onPress={handleCleanupExpired}
              disabled={loading}
            >
              <IconSymbol name="trash" size={16} color="#EF4444" />
              <Text style={styles.cleanupButtonText}>Clean Up ({expiredInvitations.length})</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {invitations.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="envelope" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No invitations sent</Text>
            <Text style={styles.emptySubtext}>Send your first teacher invitation</Text>
          </View>
        ) : (
          invitations.map((invitation) => (
            <View key={invitation.id} style={styles.invitationCard}>
              <View style={styles.invitationHeader}>
                <View style={styles.invitationInfo}>
                  <Text style={styles.invitationName}>{invitation.name}</Text>
                  <Text style={styles.invitationEmail}>{invitation.email}</Text>
                  {invitation.phone && (
                    <Text style={styles.invitationPhone}>{invitation.phone}</Text>
                  )}
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(invitation.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.invitationDetails}>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Invitation Code:</Text>
                  <Text style={styles.codeText}>{invitation.invitation_code}</Text>
                </View>
                
                <Text style={styles.invitationDate}>
                  Sent: {formatDate(invitation.created_at)}
                </Text>
                <Text style={styles.expiryDate}>
                  Expires: {formatDate(invitation.expires_at)}
                </Text>
                
                {invitation.accepted_at && (
                  <Text style={styles.acceptedDate}>
                    Accepted: {formatDate(invitation.accepted_at)}
                  </Text>
                )}
                
                {invitation.cancelled_at && (
                  <Text style={styles.cancelledDate}>
                    Cancelled: {formatDate(invitation.cancelled_at)}
                  </Text>
                )}
                
                {/* Action buttons */}
                <View style={styles.actionButtonsContainer}>
                  {/* Resend button for pending invitations */}
                  {invitation.status === 'pending' && new Date(invitation.expires_at) > new Date() && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.resendButton,
                        (processing[invitation.id] === 'resend') && styles.disabledButton
                      ]}
                      onPress={() => handleResendInvitation(invitation)}
                      disabled={processing[invitation.id] === 'resend'}
                    >
                      <IconSymbol name="arrow.clockwise" size={14} color="#3B82F6" />
                      <Text style={styles.resendButtonText}>
                        {processing[invitation.id] === 'resend' ? 'Resending...' : 'Resend'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Revoke button for pending invitations */}
                  {invitation.status === 'pending' && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.revokeButton,
                        (processing[invitation.id] === 'revoke') && styles.disabledButton
                      ]}
                      onPress={() => handleRevokeInvitation(invitation)}
                      disabled={processing[invitation.id] === 'revoke'}
                    >
                      <IconSymbol name="xmark.circle" size={14} color="#F59E0B" />
                      <Text style={styles.revokeButtonText}>
                        {processing[invitation.id] === 'revoke' ? 'Revoking...' : 'Revoke'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Delete button for all invitations */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.deleteButton,
                      (processing[invitation.id] === 'delete') && styles.disabledButton
                    ]}
                    onPress={() => handleDeleteInvitation(invitation)}
                    disabled={processing[invitation.id] === 'delete'}
                  >
                    <IconSymbol name="trash" size={14} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>
                      {processing[invitation.id] === 'delete' ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderInviteTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Invite New Teacher</Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Teacher Name *</Text>
          <TextInput
            style={styles.textInput}
            value={inviteForm.name}
            onChangeText={(text) => setInviteForm({ ...inviteForm, name: text })}
            placeholder="Enter teacher's full name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.textInput}
            value={inviteForm.email}
            onChangeText={(text) => setInviteForm({ ...inviteForm, email: text })}
            placeholder="teacher@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={inviteForm.phone}
            onChangeText={(text) => setInviteForm({ ...inviteForm, phone: text })}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.inviteButton, loading && styles.disabledButton]}
          onPress={handleInviteTeacher}
          disabled={loading}
        >
          <IconSymbol name="envelope.fill" size={20} color="#FFFFFF" />
          <Text style={styles.inviteButtonText}>
            {loading ? 'Sending Invitation...' : 'Send Invitation'}
          </Text>
        </TouchableOpacity>

        <View style={styles.inviteInfo}>
          <Text style={styles.infoTitle}>📧 How it works:</Text>
          <Text style={styles.infoText}>
            • An invitation code will be generated and displayed
          </Text>
          <Text style={styles.infoText}>
            • Share the code with the teacher
          </Text>
          <Text style={styles.infoText}>
            • Teacher can use the code to join your school
          </Text>
          <Text style={styles.infoText}>
            • Invitation expires in 7 days
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Teacher Management</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton
            title="Teachers"
            isActive={activeTab === 'teachers'}
            onPress={() => setActiveTab('teachers')}
          />
          <TabButton
            title="Invitations"
            isActive={activeTab === 'invitations'}
            onPress={() => setActiveTab('invitations')}
          />
          <TabButton
            title="Invite New"
            isActive={activeTab === 'invite'}
            onPress={() => setActiveTab('invite')}
          />
        </View>

        {/* Tab Content */}
        {activeTab === 'teachers' && renderTeachersTab()}
        {activeTab === 'invitations' && renderInvitationsTab()}
        {activeTab === 'invite' && renderInviteTab()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
  },
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  teacherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
  teacherEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  teacherPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  teacherActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  classesSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  classesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  classItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  teacherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  joinedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deactivateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deactivateText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  invitationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  invitationEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  invitationPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  invitationDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  invitationDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  acceptedDate: {
    fontSize: 12,
    color: '#10B981',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inviteInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
    marginTop: 12,
  },
  resendButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cleanupButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 4,
  },
  cancelledDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  revokeButton: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FED7AA',
  },
  revokeButtonText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 4,
  },
});
