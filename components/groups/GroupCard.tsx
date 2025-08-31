import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PrincipalGroup, GroupCardProps } from '@/types/groups';

const GROUP_TYPE_ICONS: Record<PrincipalGroup['group_type'], string> = {
  custom: 'person.3.fill',
  department: 'building.2.fill',
  grade_level: 'graduationcap.fill',
  committee: 'person.2.badge.key.fill',
};

const GROUP_TYPE_LABELS: Record<PrincipalGroup['group_type'], string> = {
  custom: 'Custom',
  department: 'Department',
  grade_level: 'Grade Level',
  committee: 'Committee',
};

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onPress,
  onJoin,
  onLeave,
  showActions = true,
  compact = false,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const handleMainAction = () => {
    if (onPress) {
      onPress(group);
    }
  };

  const handleJoin = (e: any) => {
    e?.stopPropagation();
    if (onJoin) {
      onJoin(group);
    }
  };

  const handleLeave = (e: any) => {
    e?.stopPropagation();
    if (onLeave) {
      onLeave(group);
    }
  };

  const canJoin = group.user_role === undefined && showActions && onJoin;
  const canLeave = group.user_role !== undefined && showActions && onLeave;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        compact && styles.compactCard,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: isDark ? '#334155' : '#E5E7EB',
        }
      ]}
      onPress={handleMainAction}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBg,
              { backgroundColor: group.color || '#3B82F6' + '20' }
            ]}
          >
            <IconSymbol
              name={group.icon || GROUP_TYPE_ICONS[group.group_type]}
              size={compact ? 18 : 22}
              color={group.color || '#3B82F6'}
            />
          </View>
          <View style={styles.groupInfo}>
            <Text
              style={[
                styles.groupName,
                compact && styles.compactName,
                { color: isDark ? '#F8FAFC' : '#111827' }
              ]}
              numberOfLines={1}
            >
              {group.name}
            </Text>
            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.groupType,
                  { color: isDark ? '#94A3B8' : '#6B7280' }
                ]}
              >
                {GROUP_TYPE_LABELS[group.group_type]}
              </Text>
              {group.member_count !== undefined && (
                <>
                  <Text style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>•</Text>
                  <Text
                    style={[
                      styles.memberCount,
                      { color: isDark ? '#94A3B8' : '#6B7280' }
                    ]}
                  >
                    {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {showActions && (
          <View style={styles.actions}>
            {canJoin && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                onPress={handleJoin}
              >
                <IconSymbol name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.actionText}>Join</Text>
              </TouchableOpacity>
            )}
            
            {canLeave && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                onPress={handleLeave}
              >
                <IconSymbol name="minus" size={14} color="#FFFFFF" />
                <Text style={styles.actionText}>Leave</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {!compact && group.description && (
        <Text
          style={[
            styles.description,
            { color: isDark ? '#CBD5E1' : '#4B5563' }
          ]}
          numberOfLines={2}
        >
          {group.description}
        </Text>
      )}

      {!compact && group.user_role && (
        <View style={styles.footer}>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: group.user_role === 'admin'
                  ? '#DC2626'
                  : group.user_role === 'moderator'
                  ? '#F59E0B'
                  : '#10B981'
              }
            ]}
          >
            <Text style={styles.roleText}>
              {group.user_role.charAt(0).toUpperCase() + group.user_role.slice(1)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  compactCard: {
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactName: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupType: {
    fontSize: 12,
    fontWeight: '500',
  },
  memberCount: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
