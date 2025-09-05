import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useGroups } from '@/lib/hooks/useGroups';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { GroupManagementDashboard } from '@/components/groups/GroupManagementDashboard';
import { ProtectedComponent, AdminOnly } from '@/components/auth/ProtectedComponent';
import { PERMISSIONS } from '@/lib/utils/permissions';
import { CreateGroupRequest, PrincipalGroup } from '@/types/groups';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Groups Management Screen
 * 
 * This screen demonstrates the full integration of:
 * - Group management components
 * - Permission-based access control
 * - Real-time data synchronization with Supabase
 * - Activity logging
 * 
 * Features:
 * - View all groups in the preschool
 * - Create new groups (principals only)
 * - Join/leave groups
 * - Manage group members (admins/moderators only)
 * - Real-time updates via Supabase subscriptions
 */
export default function GroupsScreen() {
  const { profile } = useAuth();
  const { colorScheme } = useTheme();
  const { canCreateGroup } = usePermissions();
  const isDark = colorScheme === 'dark';

  // Get the user's preschool ID
  const preschoolId = profile?.preschool_id || '';
  const userId = profile?.id || '';

  // Use the groups hook for data management
  const {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
  } = useGroups(preschoolId);

  // Handle group creation
  const handleCreateGroup = async (groupData: CreateGroupRequest): Promise<PrincipalGroup> => {
    try {
      const newGroup = await createGroup(groupData);
      return newGroup;
    } catch (error: any) {
      console.error('Failed to create group:', error);
      throw error;
    }
  };

  // Handle group updates
  const handleUpdateGroup = async (id: string, updates: Partial<PrincipalGroup>) => {
    try {
      await updateGroup(id, updates);
    } catch (error: any) {
      console.error('Failed to update group:', error);
      throw error;
    }
  };

  // Handle group deletion
  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteGroup(id);
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  };

  // Handle join group
  const handleJoinGroup = async (id: string) => {
    try {
      await joinGroup(id);
    } catch (error: any) {
      console.error('Failed to join group:', error);
      throw error;
    }
  };

  // Handle leave group
  const handleLeaveGroup = async (id: string) => {
    try {
      await leaveGroup(id);
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  };

  // Handle member invitation
  const handleInviteMember = async (groupId: string, userId: string, message?: string) => {
    // This would be implemented in the group members hook
    console.log('Inviting member:', { groupId, userId, message });
  };

  // Handle member removal
  const handleRemoveMember = async (groupId: string, userId: string) => {
    // This would be implemented in the group members hook
    console.log('Removing member:', { groupId, userId });
  };

  // Handle member role update
  const handleUpdateMemberRole = async (groupId: string, userId: string, role: any) => {
    // This would be implemented in the group members hook
    console.log('Updating member role:', { groupId, userId, role });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* 
        Wrap the entire dashboard in a permission check.
        For principals, show full management capabilities.
        For others, show read-only view or limited features.
      */}
      <ProtectedComponent
        permissions={[PERMISSIONS.CREATE_GROUP]}
        fallback={
          // Non-principals see a limited view
          <GroupManagementDashboard
            preschoolId={preschoolId}
            currentUserId={userId}
            onJoinGroup={handleJoinGroup}
            onLeaveGroup={handleLeaveGroup}
          />
        }
      >
        {/* Full management dashboard for principals */}
        <GroupManagementDashboard
          preschoolId={preschoolId}
          currentUserId={userId}
          onCreateGroup={handleCreateGroup}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
          onJoinGroup={handleJoinGroup}
          onLeaveGroup={handleLeaveGroup}
          onInviteMember={handleInviteMember}
          onRemoveMember={handleRemoveMember}
          onUpdateMemberRole={handleUpdateMemberRole}
        />
      </ProtectedComponent>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
