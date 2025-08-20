/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch
} from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SuperAdminDataService } from '@/lib/services/superAdminDataService';

interface UserManagementScreenProps {
  superAdminUserId: string;
}

const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  superAdminUserId
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  
  // Bulk actions
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  const [schools, setSchools] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, roleFilter, statusFilter, schoolFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await SuperAdminDataService.getRecentUsers();
      setUsers(data);
    } catch (error) {
      // Removed debug statement: console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const data = await SuperAdminDataService.getRecentSchools();
      setSchools(data);
    } catch (error) {
      // Removed debug statement: console.error('Error fetching schools:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.is_active;
        if (statusFilter === 'inactive') return !user.is_active;
        return true;
      });
    }

    // School filter
    if (schoolFilter !== 'all') {
      filtered = filtered.filter(user => user.preschool_id === schoolFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleToggleUserStatus = async (user: any) => {
    const newStatus = !user.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase()}${action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setProcessing(user.id);
              const result = await SuperAdminDataService.toggleUserStatus(
                user.id,
                newStatus,
                `Manual ${action} by super admin`
              );

              if (result.success) {
                Alert.alert('Success', `User ${action}d successfully`);
                await fetchUsers();
              } else {
                Alert.alert('Error', result.error || `Failed to ${action} user`);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || `Failed to ${action} user`);
            } finally {
              setProcessing(null);
            }
          }
        }
      ]
    );
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedUsers.length === 0) {
      Alert.alert('No Selection', 'Please select users first');
      return;
    }

    const newStatus = action === 'activate';
    
    Alert.alert(
      `Bulk ${action.charAt(0).toUpperCase()}${action.slice(1)}`,
      `${action.charAt(0).toUpperCase()}${action.slice(1)} ${selectedUsers.length} selected users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setProcessing('bulk');
              
              const promises = selectedUsers.map(userId =>
                SuperAdminDataService.toggleUserStatus(
                  userId,
                  newStatus,
                  `Bulk ${action} by super admin`
                )
              );

              await Promise.all(promises);
              
              Alert.alert('Success', `Bulk ${action} completed`);
              setSelectedUsers([]);
              setBulkMode(false);
              await fetchUsers();
            } catch (error: any) {
              Alert.alert('Error', error.message || `Bulk ${action} failed`);
            } finally {
              setProcessing(null);
            }
          }
        }
      ]
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return '#8B5CF6';
      case 'preschool_admin': return '#3B82F6';
      case 'teacher': return '#10B981';
      case 'parent': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10B981' : '#EF4444';
  };

  const renderUser = ({ item: user }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        bulkMode && selectedUsers.includes(user.id) && styles.selectedCard
      ]}
      onPress={() => {
        if (bulkMode) {
          toggleUserSelection(user.id);
        } else {
          setSelectedUser(user);
          setShowUserModal(true);
        }
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userSchool}>
            {user.school_name || 'No School Assigned'}
          </Text>
        </View>
        
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
            <Text style={styles.roleText}>{user.role.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.is_active) }]}>
            <Text style={styles.statusText}>{user.is_active ? 'ACTIVE' : 'INACTIVE'}</Text>
          </View>
        </View>
      </View>

      {bulkMode && (
        <View style={styles.checkbox}>
          <View style={[
            styles.checkboxInner,
            selectedUsers.includes(user.id) && styles.checkboxSelected
          ]}>
            {selectedUsers.includes(user.id) && (
              <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </View>
      )}

      {!bulkMode && (
        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleUserStatus(user)}
            disabled={processing === user.id}
          >
            {processing === user.id ? (
              <LoadingSpinner size={16} color="#6B7280" />
            ) : (
              <IconSymbol
                name={user.is_active ? "person.badge.minus" : "person.badge.plus"}
                size={16}
                color="#6B7280"
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Search and Filters */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.bulkButton, bulkMode && styles.bulkButtonActive]}
          onPress={() => {
            setBulkMode(!bulkMode);
            setSelectedUsers([]);
          }}
        >
          <IconSymbol name="checkmark.circle" size={16} color={bulkMode ? "#FFFFFF" : "#6B7280"} />
          <Text style={[styles.bulkButtonText, bulkMode && styles.bulkButtonTextActive]}>
            Bulk
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Row */}
      <ScrollView horizontal style={styles.filtersContainer} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterChip, roleFilter === 'all' && styles.filterChipActive]}
          onPress={() => setRoleFilter('all')}
        >
          <Text style={[styles.filterText, roleFilter === 'all' && styles.filterTextActive]}>
            All Roles
          </Text>
        </TouchableOpacity>
        
        {['superadmin', 'preschool_admin', 'teacher', 'parent'].map(role => (
          <TouchableOpacity
            key={role}
            style={[styles.filterChip, roleFilter === role && styles.filterChipActive]}
            onPress={() => setRoleFilter(role)}
          >
            <Text style={[styles.filterText, roleFilter === role && styles.filterTextActive]}>
              {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'active' && styles.filterChipActive]}
          onPress={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
        >
          <Text style={[styles.filterText, statusFilter === 'active' && styles.filterTextActive]}>
            Active Only
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bulk Actions Bar */}
      {bulkMode && selectedUsers.length > 0 && (
        <View style={styles.bulkActionsBar}>
          <Text style={styles.bulkCountText}>
            {selectedUsers.length} selected
          </Text>
          
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.activateButton]}
              onPress={() => handleBulkAction('activate')}
              disabled={processing === 'bulk'}
            >
              <Text style={styles.bulkActionText}>Activate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.deactivateButton]}
              onPress={() => handleBulkAction('deactivate')}
              disabled={processing === 'bulk'}
            >
              <Text style={styles.bulkActionText}>Deactivate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.slash" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* User Detail Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedUser && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowUserModal(false)}
              >
                <IconSymbol name="xmark" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>User Details</Text>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{selectedUser.name}</Text>
              </View>
              
              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedUser.email}</Text>
              </View>
              
              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>
                  {selectedUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
              
              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>School</Text>
                <Text style={styles.detailValue}>
                  {selectedUser.school_name || 'No School Assigned'}
                </Text>
              </View>
              
              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.detailValue}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </Text>
                  <Switch
                    value={selectedUser.is_active}
                    onValueChange={() => handleToggleUserStatus(selectedUser)}
                    disabled={processing === selectedUser.id}
                  />
                </View>
              </View>
              
              <View style={styles.userDetailCard}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedUser.created_at).toLocaleDateString()}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 6,
  },
  bulkButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  bulkButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  bulkButtonTextActive: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bulkCountText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activateButton: {
    backgroundColor: '#10B981',
  },
  deactivateButton: {
    backgroundColor: '#EF4444',
  },
  bulkActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  userCard: {
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
  selectedCard: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: '#F8FAFF',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userSchool: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  userMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  checkbox: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  userActions: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
    alignItems: 'center',
    paddingVertical: 60,
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
  userDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default UserManagementScreen;
