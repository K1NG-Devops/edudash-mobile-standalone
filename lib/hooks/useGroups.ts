import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PrincipalGroup, CreateGroupRequest, UseGroupsResult } from '@/types/groups';
import { useAuth } from '@/contexts/SimpleWorkingAuth';

export const useGroups = (preschoolId: string): UseGroupsResult => {
  const [groups, setGroups] = useState<PrincipalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all groups for the preschool
      const { data: groupsData, error: groupsError } = await supabase
        .from('principal_groups')
        .select('*')
        .eq('preschool_id', preschoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      if (!groupsData || groupsData.length === 0) {
        setGroups([]);
        return;
      }

      // Get member counts for all groups
      const groupIds = groupsData.map(g => g.id);
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('group_id, user_id, role_in_group, status')
        .in('group_id', groupIds)
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Calculate member counts and user roles
      const memberCountMap = new Map<string, number>();
      const userRoleMap = new Map<string, string>();

      membersData?.forEach(member => {
        // Count members per group
        const count = memberCountMap.get(member.group_id) || 0;
        memberCountMap.set(member.group_id, count + 1);

        // Track current user's role in each group
        if (member.user_id === user?.id) {
          userRoleMap.set(member.group_id, member.role_in_group);
        }
      });

      // Combine data
      const groupsWithCounts = groupsData.map(group => ({
        ...group,
        member_count: memberCountMap.get(group.id) || 0,
        user_role: userRoleMap.get(group.id) as PrincipalGroup['user_role'],
      }));

      setGroups(groupsWithCounts);
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupData: CreateGroupRequest): Promise<PrincipalGroup> => {
    try {
      // Create the group
      const { data: groupResult, error: groupError } = await supabase
        .from('principal_groups')
        .insert({
          ...groupData,
          preschool_id: preschoolId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupResult.id,
          user_id: user?.id,
          role_in_group: 'admin',
          status: 'active',
        });

      if (memberError) throw memberError;

      // Log activity
      await supabase
        .from('activity_feed')
        .insert({
          actor_id: user?.id,
          action: 'created_group',
          target_type: 'group',
          target_id: groupResult.id,
          preschool_id: preschoolId,
          metadata: {
            group_name: groupResult.name,
            group_type: groupResult.group_type,
          },
        });

      await fetchGroups();
      return groupResult;
    } catch (err: any) {
      console.error('Error creating group:', err);
      throw new Error(err.message || 'Failed to create group');
    }
  };

  const updateGroup = async (id: string, updates: Partial<PrincipalGroup>) => {
    try {
      const { error } = await supabase
        .from('principal_groups')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_feed')
        .insert({
          actor_id: user?.id,
          action: 'updated_group',
          target_type: 'group',
          target_id: id,
          preschool_id: preschoolId,
          metadata: { updates },
        });

      await fetchGroups();
    } catch (err: any) {
      console.error('Error updating group:', err);
      throw new Error(err.message || 'Failed to update group');
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('principal_groups')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_feed')
        .insert({
          actor_id: user?.id,
          action: 'deleted_group',
          target_type: 'group',
          target_id: id,
          preschool_id: preschoolId,
        });

      await fetchGroups();
    } catch (err: any) {
      console.error('Error deleting group:', err);
      throw new Error(err.message || 'Failed to delete group');
    }
  };

  const joinGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: id,
          user_id: user?.id,
          role_in_group: 'member',
          status: 'active',
        });

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_feed')
        .insert({
          actor_id: user?.id,
          action: 'joined_group',
          target_type: 'group',
          target_id: id,
          preschool_id: preschoolId,
          visibility: 'group',
        });

      await fetchGroups();
    } catch (err: any) {
      console.error('Error joining group:', err);
      throw new Error(err.message || 'Failed to join group');
    }
  };

  const leaveGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_feed')
        .insert({
          actor_id: user?.id,
          action: 'left_group',
          target_type: 'group',
          target_id: id,
          preschool_id: preschoolId,
          visibility: 'group',
        });

      await fetchGroups();
    } catch (err: any) {
      console.error('Error leaving group:', err);
      throw new Error(err.message || 'Failed to leave group');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!preschoolId) return;

    fetchGroups();

    // Subscribe to group changes
    const groupsSubscription = supabase
      .channel(`groups:${preschoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'principal_groups',
          filter: `preschool_id=eq.${preschoolId}`,
        },
        () => {
          fetchGroups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupsSubscription);
    };
  }, [preschoolId, user?.id]);

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
    refresh: fetchGroups,
  };
};
