import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupMember, GroupMemberRole, UseGroupMembersResult } from '@/types/groups';
import { useAuth } from '@/contexts/SimpleWorkingAuth';

export const useGroupMembers = (groupId: string): UseGroupMembersResult => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMembers = async () => {
    if (!groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users!group_members_user_id_fkey(
            id,
            name,
            email,
            avatar_url,
            role
          ),
          inviter:users!group_members_invited_by_fkey(
            id,
            name
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMembers(data || []);
    } catch (err: any) {
      console.error('Error fetching group members:', err);
      setError(err.message || 'Failed to fetch group members');
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (userId: string, message?: string) => {
    try {
      // Check if user is already a member
      const existingMember = members.find(m => m.user_id === userId);
      if (existingMember) {
        throw new Error('User is already a member of this group');
      }

      // Check if there's already a pending invitation
      const { data: existingInvite } = await supabase
        .from('group_invitations')
        .select('id')
        .eq('group_id', groupId)
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        throw new Error('User already has a pending invitation');
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          inviter_id: user?.id,
          invitee_id: userId,
          message,
        });

      if (inviteError) throw inviteError;

      // Get group info for activity logging
      const { data: groupData } = await supabase
        .from('principal_groups')
        .select('name, preschool_id')
        .eq('id', groupId)
        .single();

      // Log activity
      await supabase
        .from('activity_feed')
        .insert({
          actor_id: user?.id,
          action: 'invited_user',
          target_type: 'group',
          target_id: groupId,
          preschool_id: groupData?.preschool_id,
          metadata: {
            invitee_id: userId,
            group_name: groupData?.name,
          },
          visibility: 'group',
        });

    } catch (err: any) {
      console.error('Error inviting member:', err);
      throw new Error(err.message || 'Failed to invite member');
    }
  };

  const removeMember = async (userId: string) => {
    try {
      const { error: removeError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (removeError) throw removeError;

      // Get group info for activity logging
      const { data: groupData } = await supabase
        .from('principal_groups')
        .select('name, preschool_id')
        .eq('id', groupId)
        .single();

      // Log activity
      await supabase
        .from('activity_feed')
        .insert({
          actor_id: user?.id,
          action: 'left_group',
          target_type: 'group',
          target_id: groupId,
          preschool_id: groupData?.preschool_id,
          metadata: {
            removed_user_id: userId,
            removed_by: user?.id,
          },
          visibility: 'group',
        });

      await fetchMembers();
    } catch (err: any) {
      console.error('Error removing member:', err);
      throw new Error(err.message || 'Failed to remove member');
    }
  };

  const updateMemberRole = async (userId: string, role: GroupMemberRole) => {
    try {
      // Validate role change permissions
      const currentUserMembership = members.find(m => m.user_id === user?.id);
      const targetMembership = members.find(m => m.user_id === userId);

      if (!currentUserMembership || !targetMembership) {
        throw new Error('Member not found');
      }

      // Only admins can change roles
      if (currentUserMembership.role_in_group !== 'admin') {
        throw new Error('Only group admins can change member roles');
      }

      // Cannot change your own role if you're the only admin
      if (userId === user?.id && role !== 'admin') {
        const adminCount = members.filter(m => m.role_in_group === 'admin').length;
        if (adminCount === 1) {
          throw new Error('Cannot demote the only admin');
        }
      }

      const { error: updateError } = await supabase
        .from('group_members')
        .update({ role_in_group: role })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      await fetchMembers();
    } catch (err: any) {
      console.error('Error updating member role:', err);
      throw new Error(err.message || 'Failed to update member role');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!groupId) return;

    fetchMembers();

    // Subscribe to member changes
    const membersSubscription = supabase
      .channel(`group-members:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersSubscription);
    };
  }, [groupId]);

  return {
    members,
    loading,
    error,
    inviteMember,
    removeMember,
    updateMemberRole,
    refresh: fetchMembers,
  };
};
