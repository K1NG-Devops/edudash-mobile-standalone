import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PrincipalGroup, CreateGroupRequest } from '@/types/groups';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: CreateGroupRequest) => Promise<PrincipalGroup>;
}

const GROUP_TYPES: Array<{
  value: PrincipalGroup['group_type'];
  label: string;
  icon: string;
  description: string;
}> = [
  {
    value: 'custom',
    label: 'Custom Group',
    icon: 'person.3.fill',
    description: 'Create a custom group for any purpose'
  },
  {
    value: 'department',
    label: 'Department',
    icon: 'building.2.fill',
    description: 'Organize by department or subject area'
  },
  {
    value: 'grade_level',
    label: 'Grade Level',
    icon: 'graduationcap.fill',
    description: 'Group by student grade or age level'
  },
  {
    value: 'committee',
    label: 'Committee',
    icon: 'person.2.badge.key.fill',
    description: 'Special committees or working groups'
  }
];

const GROUP_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

const GROUP_ICONS = [
  'person.3.fill',
  'building.2.fill',
  'graduationcap.fill',
  'person.2.badge.key.fill',
  'star.fill',
  'heart.fill',
  'bolt.fill',
  'leaf.fill',
  'flame.fill',
  'snowflake',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onCreateGroup,
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<PrincipalGroup['group_type']>('custom');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(GROUP_ICONS[0]);
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setGroupType('custom');
    setSelectedColor(GROUP_COLORS[0]);
    setSelectedIcon(GROUP_ICONS[0]);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for the group.');
      return;
    }

    try {
      setCreating(true);

      const groupData: CreateGroupRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        group_type: groupType,
        color: selectedColor,
        icon: selectedIcon,
        settings: {}
      };

      await onCreateGroup(groupData);
      resetForm();
      onClose();
      Alert.alert('Success', 'Group created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (creating) return;
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E5E7EB',
            }
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#F8FAFC' : '#111827' }
              ]}
            >
              Create Group
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              disabled={creating}
            >
              <IconSymbol
                name="xmark"
                size={20}
                color={isDark ? '#CBD5E1' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Basic Info */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#E5E7EB' : '#374151' }
                ]}
              >
                Group Name *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: isDark ? '#E5E7EB' : '#111827',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter group name"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                maxLength={50}
              />
            </View>

            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#E5E7EB' : '#374151' }
                ]}
              >
                Description
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    color: isDark ? '#E5E7EB' : '#111827',
                    borderColor: isDark ? '#374151' : '#D1D5DB',
                    backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
                  }
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the purpose of this group (optional)"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>

            {/* Group Type */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#E5E7EB' : '#374151' }
                ]}
              >
                Group Type
              </Text>
              <View style={styles.typeGrid}>
                {GROUP_TYPES.map((type) => {
                  const isSelected = groupType === type.value;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeOption,
                        {
                          borderColor: isSelected ? '#3B82F6' : (isDark ? '#374151' : '#D1D5DB'),
                          backgroundColor: isSelected 
                            ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
                            : (isDark ? '#1E293B' : '#F9FAFB'),
                        }
                      ]}
                      onPress={() => setGroupType(type.value)}
                    >
                      <IconSymbol
                        name={type.icon}
                        size={20}
                        color={isSelected ? '#3B82F6' : (isDark ? '#CBD5E1' : '#6B7280')}
                      />
                      <Text
                        style={[
                          styles.typeLabel,
                          {
                            color: isSelected ? '#3B82F6' : (isDark ? '#E5E7EB' : '#374151'),
                            fontWeight: isSelected ? '600' : '500'
                          }
                        ]}
                      >
                        {type.label}
                      </Text>
                      <Text
                        style={[
                          styles.typeDescription,
                          { color: isDark ? '#9CA3AF' : '#6B7280' }
                        ]}
                      >
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#E5E7EB' : '#374151' }
                ]}
              >
                Color
              </Text>
              <View style={styles.colorGrid}>
                {GROUP_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColor
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#E5E7EB' : '#374151' }
                ]}
              >
                Icon
              </Text>
              <View style={styles.iconGrid}>
                {GROUP_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      {
                        borderColor: selectedIcon === icon ? selectedColor : (isDark ? '#374151' : '#D1D5DB'),
                        backgroundColor: selectedIcon === icon 
                          ? selectedColor + '20'
                          : (isDark ? '#1E293B' : '#F9FAFB'),
                      }
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <IconSymbol
                      name={icon}
                      size={20}
                      color={selectedIcon === icon ? selectedColor : (isDark ? '#CBD5E1' : '#6B7280')}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  borderColor: isDark ? '#374151' : '#D1D5DB',
                }
              ]}
              onPress={handleClose}
              disabled={creating}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? '#CBD5E1' : '#6B7280' }
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.createButton,
                { backgroundColor: '#3B82F6' }
              ]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Create Group
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  typeGrid: {
    gap: 12,
  },
  typeOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
  },
  createButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
