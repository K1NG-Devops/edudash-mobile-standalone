import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { SchoolManagementService, InvitationResult } from '@/lib/services/schoolManagementService';
import { supabase } from '@/lib/supabase';

interface InvitationManagementProps {
  schoolId: string;
  userId: string;
  userProfile: {
    name: string;
    role: string;
    avatar?: string | null;
  };
  onNavigate?: (route: string) => void;
  onSignOut: () => Promise<void>;
}

interface InvitationCode {
  id: string;
  code: string;
  invitation_type: string | null;
  invited_email: string | null;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number | null;
  created_at: string | null;
  is_active: boolean | null;
}

const { width: screenWidth } = Dimensions.get('window');

const InvitationManagementScreen: React.FC<InvitationManagementProps> = ({
  schoolId,
  userId,
  userProfile,
  onNavigate,
  onSignOut,
}) => {
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'teacher' | 'parent'>('teacher');
  
  // Teacher invitation form
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  
  // Parent invitation settings
  const [parentCodeUses, setParentCodeUses] = useState('50');

  useEffect(() => {
    fetchInvitations();
  }, [schoolId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('school_invitation_codes')
        .select('*')
        .eq('preschool_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      Alert.alert('Error', 'Failed to load invitation codes');
    } finally {
      setLoading(false);
    }
  };

  const createTeacherInvitation = async () => {
    if (!teacherName.trim() || !teacherEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(teacherEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setCreating(true);
    try {
      const result = await SchoolManagementService.createTeacherInvitation(
        schoolId,
        teacherEmail.toLowerCase().trim(),
        teacherName.trim(),
        userId
      );

      if (result.success) {
        Alert.alert(
          'Invitation Created! 🎉',
          `Teacher invitation sent to ${teacherEmail}.\nInvitation Code: ${result.invitation_code}`,
          [
            {
              text: 'Share Code',
              onPress: () => shareInvitationCode(result.invitation_code!, teacherEmail, 'teacher'),
            },
            { text: 'OK', style: 'default' },
          ]
        );

        setTeacherName('');
        setTeacherEmail('');
        fetchInvitations();
      } else {
        Alert.alert('Error', result.error || 'Failed to create teacher invitation');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  const createParentInvitationCode = async () => {
    const maxUses = parseInt(parentCodeUses);
    if (isNaN(maxUses) || maxUses < 1 || maxUses > 200) {
      Alert.alert('Error', 'Please enter a valid number of uses (1-200)');
      return;
    }

    setCreating(true);
    try {
      const result = await SchoolManagementService.createParentInvitationCode(
        schoolId,
        userId,
        maxUses
      );

      if (result.success) {
        Alert.alert(
          'Parent Code Created! 🎉',
          `Parent invitation code created.\nCode: ${result.invitation_code}\nMax Uses: ${maxUses}`,
          [
            {
              text: 'Share Code',
              onPress: () => shareInvitationCode(result.invitation_code!, '', 'parent'),
            },
            { text: 'OK', style: 'default' },
          ]
        );

        setParentCodeUses('50');
        fetchInvitations();
      } else {
        Alert.alert('Error', result.error || 'Failed to create parent invitation code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  const shareInvitationCode = async (code: string, email: string, type: string) => {
    const message = type === 'teacher' 
      ? `Hi! You've been invited to join our school as a teacher on EduDash Pro.\n\nInvitation Code: ${code}\n\nDownload the EduDash Pro app and use this code to create your account.`
      : `Join our school on EduDash Pro as a parent!\n\nInvitation Code: ${code}\n\nDownload the EduDash Pro app and use this code to create your account and connect with your child's education.`;

    try {
      await Share.share({
        message,
        title: `EduDash Pro ${type.charAt(0).toUpperCase() + type.slice(1)} Invitation`,
      });
    } catch (error) {
      console.error('Error sharing invitation:', error);
    }
  };

  const deactivateInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('school_invitation_codes')
        .update({ is_active: false })
        .eq('id', invitationId);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Invitation code deactivated');
      fetchInvitations();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to deactivate invitation code');
    }
  };

  const renderInvitationCard = ({ item }: { item: InvitationCode }) => {
    const isExpired = item.expires_at ? new Date(item.expires_at) < new Date() : false;
    const isExhausted = (item.current_uses || 0) >= (item.max_uses || 1);
    const isActive = item.is_active && !isExpired && !isExhausted;

    return (
      <View style={[styles.invitationCard, !isActive && styles.invitationCardInactive]}>
        <View style={styles.invitationHeader}>
          <View style={styles.invitationInfo}>
            <Text style={styles.invitationCode}>{item.code}</Text>
            <Text style={styles.invitationType}>
              {item.invitation_type?.toUpperCase()} INVITATION
            </Text>
          </View>
          
          <View style={styles.invitationActions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => shareInvitationCode(item.code, item.invited_email || '', item.invitation_type || 'user')}
            >
              <IconSymbol name="square.and.arrow.up" size={16} color="#3B82F6" />
            </TouchableOpacity>
            
            {isActive && (
              <TouchableOpacity
                style={styles.deactivateButton}
                onPress={() => {
                  Alert.alert(
                    'Deactivate Invitation',
                    'Are you sure you want to deactivate this invitation code?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Deactivate', style: 'destructive', onPress: () => deactivateInvitation(item.id) },
                    ]
                  );
                }}
              >
                <IconSymbol name="xmark.circle" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {item.invited_email && (
          <Text style={styles.invitedEmail}>👤 {item.invited_email}</Text>
        )}

        <View style={styles.invitationDetails}>
          <Text style={styles.usageText}>
            Uses: {item.current_uses || 0} / {item.max_uses || 1}
          </Text>
          <Text style={styles.expiryText}>
            Expires: {item.expires_at ? new Date(item.expires_at).toLocaleDateString() : '—'}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#10B981' : '#6B7280' }]}>
          <Text style={styles.statusText}>
            {isExpired ? 'EXPIRED' : isExhausted ? 'EXHAUSTED' : !item.is_active ? 'DEACTIVATED' : 'ACTIVE'}
          </Text>
        </View>
      </View>
    );
  };

  const renderTeacherTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>👨‍🏫 Invite Teachers</Text>
      <Text style={styles.tabSubtitle}>
        Send invitations to teachers to join your school
      </Text>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Teacher Name *</Text>
          <TextInput
            style={styles.textInput}
            value={teacherName}
            onChangeText={setTeacherName}
            placeholder="e.g. Sarah Johnson"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Teacher Email *</Text>
          <TextInput
            style={styles.textInput}
            value={teacherEmail}
            onChangeText={setTeacherEmail}
            placeholder="sarah@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, (!teacherName.trim() || !teacherEmail.trim() || creating) && styles.createButtonDisabled]}
          onPress={createTeacherInvitation}
          disabled={!teacherName.trim() || !teacherEmail.trim() || creating}
        >
          <Text style={styles.createButtonText}>
            {creating ? 'Creating...' : 'Send Teacher Invitation'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderParentTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>👨‍👩‍👧‍👦 Create Parent Code</Text>
      <Text style={styles.tabSubtitle}>
        Generate reusable invitation codes for parents
      </Text>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Maximum Uses</Text>
          <TextInput
            style={styles.textInput}
            value={parentCodeUses}
            onChangeText={setParentCodeUses}
            placeholder="50"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
          <Text style={styles.inputHelp}>
            Number of parents who can use this code (1-200)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={createParentInvitationCode}
          disabled={creating}
        >
          <Text style={styles.createButtonText}>
            {creating ? 'Creating...' : 'Generate Parent Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const teacherInvitations = invitations.filter(inv => inv.invitation_type === 'teacher');
  const parentInvitations = invitations.filter(inv => inv.invitation_type === 'parent');
  const currentInvitations = selectedTab === 'teacher' ? teacherInvitations : parentInvitations;

  if (loading) {
    return (
      <View style={styles.container}>
        <MobileHeader
          user={{ ...userProfile, avatar: userProfile.avatar || undefined }}
          schoolName="Invitation Management"
          onNotificationsPress={() => {}}
          onSignOut={onSignOut}
          onNavigate={onNavigate}
          notificationCount={0}
        />
        <LoadingSpinner message="Loading invitations..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobileHeader
        user={{ ...userProfile, avatar: userProfile.avatar || undefined }}
        schoolName="Invitation Management"
        onNotificationsPress={() => {}}
        onSignOut={onSignOut}
        onNavigate={onNavigate}
        notificationCount={0}
      />

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'teacher' && styles.tabActive]}
          onPress={() => setSelectedTab('teacher')}
        >
          <Text style={[styles.tabText, selectedTab === 'teacher' && styles.tabTextActive]}>
            Teachers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'parent' && styles.tabActive]}
          onPress={() => setSelectedTab('parent')}
        >
          <Text style={[styles.tabText, selectedTab === 'parent' && styles.tabTextActive]}>
            Parents
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlashList
        style={styles.content}
        ListHeaderComponent={
          <View>
            {selectedTab === 'teacher' ? renderTeacherTab() : renderParentTab()}
            
            <View style={styles.existingSection}>
              <Text style={styles.sectionTitle}>
                Existing {selectedTab === 'teacher' ? 'Teacher' : 'Parent'} Invitations
              </Text>
              {currentInvitations.length === 0 && (
                <Text style={styles.emptyText}>
                  No {selectedTab} invitations created yet
                </Text>
              )}
            </View>
          </View>
        }
        data={currentInvitations}
        renderItem={renderInvitationCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={180}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  tabContent: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  inputHelp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  existingSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 40,
  },
  invitationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  invitationCardInactive: {
    opacity: 0.6,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  invitationType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitedEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  invitationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expiryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
});

export default InvitationManagementScreen;
