import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { GroupCard } from './GroupCard';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupMemberList } from './GroupMemberList';
import { PrincipalGroup, GroupMember, CreateGroupRequest, GroupMemberRole } from '@/types/groups';

interface GroupManagementDashboardProps {
  preschoolId: string;
  currentUserId: string;
  onCreateGroup?: (groupData: CreateGroupRequest) => Promise<PrincipalGroup>;
  onUpdateGroup?: (id: string, updates: Partial<PrincipalGroup>) => Promise<void>;
  onDeleteGroup?: (id: string) => Promise<void>;
  onJoinGroup?: (id: string) => Promise<void>;
  onLeaveGroup?: (id: string) => Promise<void>;
  onInviteMember?: (groupId: string, userId: string, message?: string) => Promise<void>;
  onRemoveMember?: (groupId: string, userId: string) => Promise<void>;
  onUpdateMemberRole?: (groupId: string, userId: string, role: GroupMemberRole) => Promise<void>;
}

interface GroupStats {
  totalGroups: number;
  totalMembers: number;
  myGroups: number;
  activeGroups: number;
}

// Mock data - in real app, this would come from hooks/API calls
const MOCK_GROUPS: PrincipalGroup[] = [
  {
    id: '1',
    name: 'Teaching Staff',
    description: 'All teaching staff members for collaboration and updates',
    created_by: 'current-user',
    preschool_id: 'preschool-1',
    group_type: 'department',
    color: '#3B82F6',
    icon: 'person.2.fill',
    is_active: true,
    settings: {},
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    member_count: 12,
    user_role: 'admin',
  },
  {
    id: '2',
    name: 'Parent Committee',
    description: 'Active parent volunteers helping with school events',
    created_by: 'other-user',
    preschool_id: 'preschool-1',
    group_type: 'committee',
    color: '#10B981',
    icon: 'figure.2.and.child.holdinghands',
    is_active: true,
    settings: {},
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    member_count: 8,
    user_role: 'member',
  },
  {
    id: '3',
    name: 'Preschool Age Groups',
    description: 'Teachers and parents of 3-4 year old students',
    created_by: 'current-user',
    preschool_id: 'preschool-1',
    group_type: 'grade_level',
    color: '#F59E0B',
    icon: 'graduationcap.fill',
    is_active: true,
    settings: {},
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    member_count: 15,
    user_role: 'moderator',
  },
];

const MOCK_MEMBERS: GroupMember[] = [
  {
    id: '1',
    group_id: '1',
    user_id: 'user-1',
    role_in_group: 'admin',
    joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    permissions: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      id: 'user-1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar_url: undefined,
      role: 'principal',
    },
  },
  {
    id: '2',
    group_id: '1',
    user_id: 'user-2',
    role_in_group: 'member',
    joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    permissions: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      id: 'user-2',
      name: 'Mike Chen',
      email: 'mike@example.com',
      avatar_url: undefined,
      role: 'teacher',
    },
  },
  {
    id: '3',
    group_id: '1',
    user_id: 'user-3',
    role_in_group: 'member',
    joined_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    permissions: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      id: 'user-3',
      name: 'Emma Davis',
      email: 'emma@example.com',
      avatar_url: undefined,
      role: 'teacher',
    },
  },
];

export const GroupManagementDashboard: React.FC<GroupManagementDashboardProps> = ({
  preschoolId,
  currentUserId,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onJoinGroup,
  onLeaveGroup,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [groups, setGroups] = useState<PrincipalGroup[]>(MOCK_GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<PrincipalGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'members'>('overview');

  useEffect(() => {
    // Load group members when a group is selected
    if (selectedGroup) {
      const members = MOCK_MEMBERS.filter(m => m.group_id === selectedGroup.id);
      setGroupMembers(members);
    }
  }, [selectedGroup]);

  const stats: GroupStats = {
    totalGroups: groups.length,
    totalMembers: groups.reduce((sum, g) => sum + (g.member_count || 0), 0),
    myGroups: groups.filter(g => g.created_by === currentUserId).length,
    activeGroups: groups.filter(g => g.is_active).length,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh data from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCreateGroup = async (groupData: CreateGroupRequest) => {
    if (onCreateGroup) {
      const newGroup = await onCreateGroup(groupData);
      setGroups(prev => [newGroup, ...prev]);
      return newGroup;
    }
    return Promise.resolve({} as PrincipalGroup);
  };

  const handleGroupPress = (group: PrincipalGroup) => {
    setSelectedGroup(group);
    setActiveTab('members');
  };

  const handleJoinGroup = async (group: PrincipalGroup) => {
    if (onJoinGroup) {
      await onJoinGroup(group.id);
      // Update local state
      setGroups(prev => prev.map(g => 
        g.id === group.id 
          ? { ...g, user_role: 'member', member_count: (g.member_count || 0) + 1 }
          : g
      ));
    }
  };

  const handleLeaveGroup = async (group: PrincipalGroup) => {
    if (onLeaveGroup) {
      await onLeaveGroup(group.id);
      // Update local state
      setGroups(prev => prev.map(g => 
        g.id === group.id 
          ? { ...g, user_role: undefined, member_count: Math.max((g.member_count || 1) - 1, 0) }
          : g
      ));
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (onRemoveMember && selectedGroup) {
      await onRemoveMember(selectedGroup.id, member.user_id);
      setGroupMembers(prev => prev.filter(m => m.id !== member.id));
      // Update group member count
      setGroups(prev => prev.map(g => 
        g.id === selectedGroup.id 
          ? { ...g, member_count: Math.max((g.member_count || 1) - 1, 0) }
          : g
      ));
    }
  };

  const handleChangeRole = async (member: GroupMember, newRole: GroupMemberRole) => {
    if (onUpdateMemberRole && selectedGroup) {
      await onUpdateMemberRole(selectedGroup.id, member.user_id, newRole);
      setGroupMembers(prev => prev.map(m => 
        m.id === member.id ? { ...m, role_in_group: newRole } : m
      ));
    }
  };

  const handleInviteMembers = () => {
    Alert.alert('Invite Members', 'Member invitation feature coming soon!');
  };

  const renderOverview = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
          <IconSymbol name="person.3.fill" size={24} color="#3B82F6" />
          <Text style={[styles.statNumber, { color: isDark ? '#F8FAFC' : '#111827' }]}>{stats.totalGroups}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Total Groups</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
          <IconSymbol name="person.2.fill" size={24} color="#10B981" />
          <Text style={[styles.statNumber, { color: isDark ? '#F8FAFC' : '#111827' }]}>{stats.totalMembers}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Total Members</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
          <IconSymbol name="crown.fill" size={24} color="#F59E0B" />
          <Text style={[styles.statNumber, { color: isDark ? '#F8FAFC' : '#111827' }]}>{stats.myGroups}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>My Groups</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
          <IconSymbol name="checkmark.circle.fill" size={24} color="#8B5CF6" />
          <Text style={[styles.statNumber, { color: isDark ? '#F8FAFC' : '#111827' }]}>{stats.activeGroups}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Active Groups</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#111827' }]}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAllBtn, { color: '#3B82F6' }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#10B981' + '20' }]}>
              <IconSymbol name="plus" size={16} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                You created <Text style={styles.activityHighlight}>Teaching Staff</Text> group
              </Text>
              <Text style={[styles.activityTime, { color: isDark ? '#94A3B8' : '#6B7280' }]}>2 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#3B82F6' + '20' }]}>
              <IconSymbol name="person.badge.plus" size={16} color="#3B82F6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                Mike Chen joined <Text style={styles.activityHighlight}>Teaching Staff</Text>
              </Text>
              <Text style={[styles.activityTime, { color: isDark ? '#94A3B8' : '#6B7280' }]}>5 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#F59E0B' + '20' }]}>
              <IconSymbol name="envelope" size={16} color="#F59E0B" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                Invitation sent to <Text style={styles.activityHighlight}>Emma Davis</Text>
              </Text>
              <Text style={[styles.activityTime, { color: isDark ? '#94A3B8' : '#6B7280' }]}>1 day ago</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderGroups = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.groupsHeader}>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: '#3B82F6' }]}
          onPress={() => setShowCreateModal(true)}
        >
          <IconSymbol name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onPress={handleGroupPress}
          onJoin={handleJoinGroup}
          onLeave={handleLeaveGroup}
          showActions={true}
        />
      ))}
    </ScrollView>
  );

  const renderMembers = () => {
    if (!selectedGroup) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="person.3" size={48} color={isDark ? '#64748B' : '#9CA3AF'} />
          <Text style={[styles.emptyText, { color: isDark ? '#64748B' : '#9CA3AF' }]}>
            Select a group to view members
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.membersHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedGroup(null)}
          >
            <IconSymbol name="chevron.left" size={16} color={isDark ? '#CBD5E1' : '#6B7280'} />
            <Text style={[styles.backBtnText, { color: isDark ? '#CBD5E1' : '#6B7280' }]}>Back to Groups</Text>
          </TouchableOpacity>
          
          <Text style={[styles.groupName, { color: isDark ? '#F8FAFC' : '#111827' }]}>
            {selectedGroup.name}
          </Text>
        </View>

        <GroupMemberList
          members={groupMembers}
          currentUserRole={selectedGroup.user_role}
          onRemoveMember={handleRemoveMember}
          onChangeRole={handleChangeRole}
          onInviteMembers={handleInviteMembers}
          canManageMembers={selectedGroup.user_role === 'admin' || selectedGroup.user_role === 'moderator'}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#111827' }]}>
          Group Management
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
        {[
          { key: 'overview', label: 'Overview', icon: 'chart.bar.fill' },
          { key: 'groups', label: 'Groups', icon: 'person.3.fill' },
          { key: 'members', label: 'Members', icon: 'person.2.fill' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                isActive && [styles.activeTabButton, { backgroundColor: isDark ? '#3B82F6' + '20' : '#3B82F6' + '10' }]
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <IconSymbol
                name={tab.icon}
                size={16}
                color={isActive ? '#3B82F6' : (isDark ? '#94A3B8' : '#6B7280')}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color: isActive ? '#3B82F6' : (isDark ? '#94A3B8' : '#6B7280'),
                    fontWeight: isActive ? '600' : '500'
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'groups' && renderGroups()}
      {activeTab === 'members' && renderMembers()}

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTabButton: {
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  activityHighlight: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  activityTime: {
    fontSize: 12,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  membersHeader: {
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
