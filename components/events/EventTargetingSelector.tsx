import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { EventTargetingConfig, EventAudienceType, EventTargetingSelectorProps, PrincipalGroup } from '@/types/groups';
import { GroupCard } from '../groups/GroupCard';

const AUDIENCE_TYPES: Array<{
  value: EventAudienceType;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    value: 'everyone',
    label: 'Everyone',
    icon: 'globe',
    description: 'All users in the preschool can see and join'
  },
  {
    value: 'principals',
    label: 'Principals Only',
    icon: 'person.badge.key.fill',
    description: 'Only principals can see and participate'
  },
  {
    value: 'teachers',
    label: 'Teachers Only',
    icon: 'person.2.fill',
    description: 'Only teachers can see and participate'
  },
  {
    value: 'parents',
    label: 'Parents Only',
    icon: 'figure.2.and.child.holdinghands',
    description: 'Only parents can see and participate'
  },
  {
    value: 'specific_groups',
    label: 'Specific Groups',
    icon: 'person.3.fill',
    description: 'Select which groups can participate'
  },
  {
    value: 'specific_users',
    label: 'Specific Users',
    icon: 'person.crop.circle.badge.plus',
    description: 'Invite specific users manually'
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: 'public' as const,
    label: 'Public',
    icon: 'eye',
    description: 'Event is visible to everyone eligible'
  },
  {
    value: 'private' as const,
    label: 'Private',
    icon: 'eye.slash',
    description: 'Event is only visible to invited users'
  },
  {
    value: 'restricted' as const,
    label: 'Restricted',
    icon: 'lock',
    description: 'Event requires approval to join'
  },
];

export const EventTargetingSelector: React.FC<EventTargetingSelectorProps> = ({
  value,
  onChange,
  availableGroups,
  availableUsers,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [expandedSections, setExpandedSections] = useState({
    audience: true,
    groups: false,
    users: false,
    settings: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateConfig = (updates: Partial<EventTargetingConfig>) => {
    onChange({ ...value, ...updates });
  };

  const updateAudienceConfig = (updates: Partial<EventTargetingConfig['audience_config']>) => {
    updateConfig({
      audience_config: { ...value.audience_config, ...updates }
    });
  };

  const handleAudienceTypeChange = (audienceType: EventAudienceType) => {
    const newConfig: EventTargetingConfig = {
      ...value,
      audience_type: audienceType,
      audience_config: {
        group_ids: [],
        user_ids: [],
        role_filters: audienceType === 'everyone' ? [] : [audienceType.replace('s', '').replace('specific_', '')],
        custom_criteria: {}
      }
    };

    // Auto-expand relevant sections
    if (audienceType === 'specific_groups') {
      setExpandedSections(prev => ({ ...prev, groups: true }));
    } else if (audienceType === 'specific_users') {
      setExpandedSections(prev => ({ ...prev, users: true }));
    }

    onChange(newConfig);
  };

  const toggleGroupSelection = (groupId: string) => {
    const currentGroupIds = value.audience_config.group_ids || [];
    const newGroupIds = currentGroupIds.includes(groupId)
      ? currentGroupIds.filter(id => id !== groupId)
      : [...currentGroupIds, groupId];

    updateAudienceConfig({ group_ids: newGroupIds });
  };

  const toggleUserSelection = (userId: string) => {
    const currentUserIds = value.audience_config.user_ids || [];
    const newUserIds = currentUserIds.includes(userId)
      ? currentUserIds.filter(id => id !== userId)
      : [...currentUserIds, userId];

    updateAudienceConfig({ user_ids: newUserIds });
  };

  const selectedGroups = availableGroups.filter(group => 
    value.audience_config.group_ids?.includes(group.id)
  );

  const selectedUsers = availableUsers.filter(user => 
    value.audience_config.user_ids?.includes(user.id)
  );

  const renderSectionHeader = (
    title: string,
    sectionKey: keyof typeof expandedSections,
    subtitle?: string,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[
        styles.sectionHeader,
        {
          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
          borderColor: isDark ? '#334155' : '#E5E7EB',
        }
      ]}
      onPress={() => toggleSection(sectionKey)}
    >
      <View style={styles.sectionHeaderLeft}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#F8FAFC' : '#111827' }
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.sectionSubtitle,
              { color: isDark ? '#94A3B8' : '#6B7280' }
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.sectionHeaderRight}>
        {rightElement}
        <IconSymbol
          name={expandedSections[sectionKey] ? "chevron.up" : "chevron.down"}
          size={16}
          color={isDark ? '#CBD5E1' : '#6B7280'}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Audience Type Selection */}
      <View style={styles.section}>
        {renderSectionHeader("Event Audience", "audience")}
        
        {expandedSections.audience && (
          <View style={styles.sectionContent}>
            {AUDIENCE_TYPES.map((option) => {
              const isSelected = value.audience_type === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.audienceOption,
                    {
                      borderColor: isSelected ? '#3B82F6' : (isDark ? '#374151' : '#D1D5DB'),
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
                        : (isDark ? '#0F172A' : '#FFFFFF'),
                    }
                  ]}
                  onPress={() => handleAudienceTypeChange(option.value)}
                >
                  <View style={styles.audienceOptionLeft}>
                    <IconSymbol
                      name={option.icon}
                      size={20}
                      color={isSelected ? '#3B82F6' : (isDark ? '#CBD5E1' : '#6B7280')}
                    />
                    <View style={styles.audienceOptionText}>
                      <Text
                        style={[
                          styles.audienceLabel,
                          {
                            color: isSelected ? '#3B82F6' : (isDark ? '#F8FAFC' : '#111827'),
                            fontWeight: isSelected ? '600' : '500'
                          }
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.audienceDescription,
                          { color: isDark ? '#94A3B8' : '#6B7280' }
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Group Selection */}
      {value.audience_type === 'specific_groups' && (
        <View style={styles.section}>
          {renderSectionHeader(
            "Selected Groups",
            "groups",
            selectedGroups.length > 0 ? `${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''} selected` : "No groups selected",
            selectedGroups.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selectedGroups.length}</Text>
              </View>
            ) : undefined
          )}
          
          {expandedSections.groups && (
            <View style={styles.sectionContent}>
              {availableGroups.length === 0 ? (
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
                    No groups available
                  </Text>
                </View>
              ) : (
                availableGroups.map((group) => {
                  const isSelected = value.audience_config.group_ids?.includes(group.id) || false;
                  return (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.selectableItem,
                        {
                          borderColor: isSelected ? '#10B981' : (isDark ? '#374151' : '#E5E7EB'),
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)')
                            : 'transparent',
                        }
                      ]}
                      onPress={() => toggleGroupSelection(group.id)}
                    >
                      <GroupCard
                        group={group}
                        compact
                        showActions={false}
                      />
                      {isSelected && (
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={20}
                          color="#10B981"
                          style={styles.selectionIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>
      )}

      {/* User Selection */}
      {value.audience_type === 'specific_users' && (
        <View style={styles.section}>
          {renderSectionHeader(
            "Selected Users",
            "users",
            selectedUsers.length > 0 ? `${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} selected` : "No users selected",
            selectedUsers.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selectedUsers.length}</Text>
              </View>
            ) : undefined
          )}
          
          {expandedSections.users && (
            <View style={styles.sectionContent}>
              {availableUsers.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    name="person"
                    size={32}
                    color={isDark ? '#64748B' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDark ? '#64748B' : '#9CA3AF' }
                    ]}
                  >
                    No users available
                  </Text>
                </View>
              ) : (
                availableUsers.map((user) => {
                  const isSelected = value.audience_config.user_ids?.includes(user.id) || false;
                  return (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.userItem,
                        {
                          borderColor: isSelected ? '#10B981' : (isDark ? '#374151' : '#E5E7EB'),
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)')
                            : (isDark ? '#1E293B' : '#FFFFFF'),
                        }
                      ]}
                      onPress={() => toggleUserSelection(user.id)}
                    >
                      <View style={styles.userInfo}>
                        <View
                          style={[
                            styles.userAvatar,
                            { backgroundColor: isDark ? '#475569' : '#CBD5E1' }
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarText,
                              { color: isDark ? '#E2E8F0' : '#475569' }
                            ]}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.userDetails}>
                          <Text
                            style={[
                              styles.userName,
                              { color: isDark ? '#F8FAFC' : '#111827' }
                            ]}
                          >
                            {user.name}
                          </Text>
                          <Text
                            style={[
                              styles.userRole,
                              { color: isDark ? '#94A3B8' : '#6B7280' }
                            ]}
                          >
                            {user.role}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>
      )}

      {/* Event Settings */}
      <View style={styles.section}>
        {renderSectionHeader("Event Settings", "settings")}
        
        {expandedSections.settings && (
          <View style={styles.sectionContent}>
            {/* Visibility */}
            <View style={styles.settingGroup}>
              <Text
                style={[
                  styles.settingLabel,
                  { color: isDark ? '#E5E7EB' : '#374151' }
                ]}
              >
                Event Visibility
              </Text>
              <View style={styles.visibilityOptions}>
                {VISIBILITY_OPTIONS.map((option) => {
                  const isSelected = value.visibility === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.visibilityOption,
                        {
                          borderColor: isSelected ? '#6366F1' : (isDark ? '#374151' : '#D1D5DB'),
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)')
                            : 'transparent',
                        }
                      ]}
                      onPress={() => updateConfig({ visibility: option.value })}
                    >
                      <IconSymbol
                        name={option.icon}
                        size={18}
                        color={isSelected ? '#6366F1' : (isDark ? '#CBD5E1' : '#6B7280')}
                      />
                      <View style={styles.visibilityOptionText}>
                        <Text
                          style={[
                            styles.visibilityLabel,
                            {
                              color: isSelected ? '#6366F1' : (isDark ? '#F8FAFC' : '#111827'),
                              fontWeight: isSelected ? '600' : '500'
                            }
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.visibilityDescription,
                            { color: isDark ? '#94A3B8' : '#6B7280' }
                          ]}
                        >
                          {option.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#6366F1" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Approval Settings */}
            <View style={styles.settingGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => updateConfig({ requires_approval: !value.requires_approval })}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: value.requires_approval ? '#F59E0B' : 'transparent',
                      borderColor: value.requires_approval ? '#F59E0B' : (isDark ? '#374151' : '#D1D5DB'),
                    }
                  ]}
                >
                  {value.requires_approval && (
                    <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.checkboxContent}>
                  <Text
                    style={[
                      styles.checkboxLabel,
                      { color: isDark ? '#F8FAFC' : '#111827' }
                    ]}
                  >
                    Require approval to join
                  </Text>
                  <Text
                    style={[
                      styles.checkboxDescription,
                      { color: isDark ? '#94A3B8' : '#6B7280' }
                    ]}
                  >
                    Users must request approval before they can participate
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContent: {
    gap: 8,
  },
  audienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
  },
  audienceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audienceOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  audienceLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  audienceDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  selectableItem: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    position: 'relative',
  },
  selectionIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  settingGroup: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  visibilityOptions: {
    gap: 8,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  visibilityOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  visibilityLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  visibilityDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
});
