import { IconSymbol } from '@/components/ui/IconSymbol';
import type { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { InvitationService } from '@/lib/services/invitationService';
import { TeacherService } from '@/lib/services/teacherService';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Define teacher type based on the service response
type TeacherWithClasses = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preschool_id: string;
  is_active: boolean;
  auth_user_id: string | null;
  created_at: string;
  classes: {
    id: string;
    name: string;
    room_number: string;
    current_enrollment: number;
    max_capacity: number;
  }[];
  status?: 'active' | 'inactive' | 'pending';
};

interface TeachersScreenProps {
  userProfile: UserProfile;
}

function TeachersScreen({ userProfile }: TeachersScreenProps) {
  const [teachers, setTeachers] = useState<TeacherWithClasses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userProfile?.preschool_id) return;

      const result = await TeacherService.getTeachersByPreschool(userProfile.preschool_id);
      
      if (result.data && !result.error) {
        // Add status field to each teacher based on their state
        const teachersWithStatus = result.data.map(teacher => ({
          ...teacher,
          status: teacher.auth_user_id === null 
            ? 'pending' as const
            : teacher.is_active 
              ? 'active' as const 
              : 'inactive' as const
        }));
        setTeachers(teachersWithStatus);
      } else {
        setError(result.error ? String(result.error) : 'Failed to load teachers');
      }
    } catch (err) {
      console.error('Error loading teachers:', err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim() || !newTeacherEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!userProfile?.preschool_id) {
      Alert.alert('Error', 'No preschool selected');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create invitation using the invitation service
      const invitationCode = await InvitationService.createInvitation({
        email: newTeacherEmail.trim(),
        role: 'teacher',
        preschool_id: userProfile.preschool_id,
      });

      Alert.alert(
        'Invitation Sent!', 
        `Teacher invitation has been sent to ${newTeacherEmail.trim()}.\nInvitation Code: ${invitationCode}\n\nThey can use this code to sign up for the app.`
      );
      
      setNewTeacherName('');
      setNewTeacherEmail('');
      setShowAddModal(false);
      loadTeachers(); // Refresh the list
    } catch (err) {
      console.error('Error sending teacher invitation:', err);
      Alert.alert('Error', 'Failed to send teacher invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [userProfile?.preschool_id]);

  const renderTeacherItem = ({ item }: { item: TeacherWithClasses }) => (
    <View style={styles.teacherCard}>
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>{item.name}</Text>
        <Text style={styles.teacherEmail}>{item.email}</Text>
        {item.status === 'pending' && (
          <Text style={styles.pendingText}>Invitation pending</Text>
        )}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: item.status === 'active' 
                ? '#10B981' 
                : item.status === 'pending'
                  ? '#F59E0B'
                  : '#6B7280' 
            }
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.teacherActions}>
        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol name="pencil" size={16} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="person.2" size={48} color="#9CA3AF" />
      <Text style={styles.emptyStateTitle}>No Teachers Found</Text>
      <Text style={styles.emptyStateDescription}>
        {userProfile?.role === 'preschool_admin' 
          ? 'Start by adding your first teacher to the system'
          : 'No teachers are currently available'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading teachers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTeachers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Teachers</Text>
          <Text style={styles.headerSubtitle}>
            {teachers.length} {teachers.length === 1 ? 'teacher' : 'teachers'}
          </Text>
        </View>
        {userProfile?.role === 'preschool_admin' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={teachers}
        renderItem={renderTeacherItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={teachers.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTeachers}
          />
        }
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
            >
              <IconSymbol name="xmark" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invite New Teacher</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Add a new teacher to your preschool. They will appear as "pending" until they create their account and join.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={newTeacherName}
                onChangeText={setNewTeacherName}
                placeholder="Enter teacher's full name"
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                value={newTeacherEmail}
                onChangeText={setNewTeacherEmail}
                placeholder="Enter teacher's email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleAddTeacher}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Invite Teacher</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  teacherActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Main component wrapper with AuthConsumer
export default function TeachersScreenWrapper() {
  return (
    <AuthConsumer>
      {({ profile }) => {
        if (!profile) {
          return (
            <SafeAreaView style={styles.container}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            </SafeAreaView>
          );
        }

        return <TeachersScreen userProfile={profile} />;
      }}
    </AuthConsumer>
  );
}
