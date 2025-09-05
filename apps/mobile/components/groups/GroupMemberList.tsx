import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { GroupMember, GroupMemberRole, GroupMemberListProps } from '@/types/groups';

const ROLE_COLORS: Record<GroupMemberRole, string> = {
  admin: '#DC2626',
  moderator: '#F59E0B',
  member: '#10B981',
};

const ROLE_ICONS: Record<GroupMemberRole, string> = {
  admin: 'crown.fill',
  moderator: 'shield.fill',
  member: 'person.fill',
};

export const GroupMemberList: React.FC<GroupMemberListProps> = ({
  members,
  currentUserRole,
  onRemoveMember,
  onChangeRole,
  onInviteMembers,
  canManageMembers = false,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.user?.name} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveMember?.(member)
        }
      ]
    );
  };

  const handleChangeRole = (member: GroupMember) => {
    const roles: GroupMemberRole[] = ['member', 'moderator', 'admin'];
    const roleOptions = roles
      .filter(role => role !== member.role_in_group)
      .map(role => ({
        text: role.charAt(0).toUpperCase() + role.slice(1),
        onPress: () => onChangeRole?.(member, role)
      }));

    Alert.alert(
      'Change Role',
      `Select a new role for ${member.user?.name}:`,
      [
        ...roleOptions,
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const canModifyMember = (member: GroupMember) => {
    if (!canManageMembers) return false;
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'moderator' && member.role_in_group === 'member') return true;
    return false;
  };

  const renderMemberItem = ({ item: member }: { item: GroupMember }) => {
    const canModify = canModifyMember(member);
    const isActive = member.status === 'active';
    const isPending = member.status === 'pending';

    return (
      <View
        style={[
          styles.memberItem,
          {
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderColor: isDark ? '#334155' : '#E5E7EB',
            opacity: isActive ? 1 : 0.7,
          }
        ]}
      >
        <View style={styles.memberInfo}>
          <View style={styles.avatar}>
            {member.user?.avatar_url ? (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {member.user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: isDark ? '#475569' : '#CBD5E1' }
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { color: isDark ? '#E2E8F0' : '#475569' }
                  ]}
                >
                  {member.user?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.memberDetails}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.memberName,
                  { color: isDark ? '#F8FAFC' : '#111827' }
                ]}
                numberOfLines={1}
              >
                {member.user?.name || 'Unknown User'}
              </Text>
              {isPending && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              )}
            </View>
            
            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.memberEmail,
                  { color: isDark ? '#94A3B8' : '#6B7280' }
                ]}
                numberOfLines={1}
              >
                {member.user?.email}
              </Text>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: ROLE_COLORS[member.role_in_group] }
                ]}
              >
                <IconSymbol
                  name={ROLE_ICONS[member.role_in_group]}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.roleText}>
                  {member.role_in_group.charAt(0).toUpperCase() + member.role_in_group.slice(1)}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.joinedDate,
                { color: isDark ? '#64748B' : '#9CA3AF' }
              ]}
            >
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {canModify && isActive && (
          <View style={styles.memberActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6366F1' }]}
              onPress={() => handleChangeRole(member)}
            >
              <IconSymbol name="person.badge.key" size={14} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => handleRemoveMember(member)}
            >
              <IconSymbol name="xmark" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: isDark ? '#F8FAFC' : '#111827' }
          ]}
        >
          Members ({members.length})
        </Text>
        
        {canManageMembers && onInviteMembers && (
          <TouchableOpacity
            style={[styles.inviteBtn, { backgroundColor: '#3B82F6' }]}
            onPress={onInviteMembers}
          >
            <IconSymbol name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol
              name="person.3"
              size={32}
              color={isDark ? '#64748B' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? '#64748B' : '#9CA3AF' }
              ]}
            >
              No members yet
            </Text>
            {canManageMembers && onInviteMembers && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: '#3B82F6' }]}
                onPress={onInviteMembers}
              >
                <Text style={styles.emptyBtnText}>Invite Members</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  inviteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  memberDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  pendingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  joinedDate: {
    fontSize: 12,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
