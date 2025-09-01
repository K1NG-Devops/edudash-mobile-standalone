// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MediaService } from '@/lib/services/mediaService';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { EventTargetingSelector } from './EventTargetingSelector';
import { EventTargetingConfig, PrincipalGroup } from '@/types/groups';

interface CreateEventModalProps {
  visible: boolean;
  preschoolId: string;
  createdByUserId: string; // users.id (internal profile id)
  onClose: () => void;
  onCreated?: (eventId: string) => void;
  availableGroups?: PrincipalGroup[];
  availableUsers?: Array<{
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  }>;
}

const EVENT_TYPES = [
  'general',
  'field_trip',
  'performance',
  'celebration',
  'workshop',
  'sports',
  'arts',
  'academic',
] as const;

type EventType = typeof EVENT_TYPES[number];

const toIsoLocal = (d: Date) => {
  // YYYY-MM-DDTHH:mm (no timezone suffix)
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${mi}`;
};

const CreateEventModal: React.FC<CreateEventModalProps> = ({ 
  visible, 
  preschoolId, 
  createdByUserId, 
  onClose, 
  onCreated,
  availableGroups = [],
  availableUsers = [],
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return toIsoLocal(d);
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState<string>('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<EventType>('general');
  const [posting, setPosting] = useState(false);
  const [attachments, setAttachments] = useState<{ uri: string; mimeType: string; name: string }[]>([]);
  const [targeting, setTargeting] = useState<EventTargetingConfig>({
    audience_type: 'everyone',
    audience_config: {
      group_ids: [],
      user_ids: [],
      role_filters: [],
      custom_criteria: {},
    },
    requires_approval: false,
    auto_accept_roles: ['principal'],
    visibility: 'public',
  });
  const [showTargeting, setShowTargeting] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setStartDate(defaultStart);
    setEndDate('');
    setLocation('');
    setEventType('general');
    setTargeting({
      audience_type: 'everyone',
      audience_config: {
        group_ids: [],
        user_ids: [],
        role_filters: [],
        custom_criteria: {},
      },
      requires_approval: false,
      auto_accept_roles: ['principal'],
      visibility: 'public',
    });
    setShowTargeting(false);
  };

  const addImage = async () => {
    try {
      const picked = await MediaService.pickImage('gallery');
      if (!picked) return;
      const name = `img_${Date.now()}.jpg`;
      setAttachments((prev) => [...prev, { uri: picked.uri, mimeType: 'image/jpeg', name }]);
    } catch (e: any) {
      Alert.alert('Image error', e?.message || 'Failed to pick image');
    }
  };

  const addVideo = async () => {
    try {
      const picked = await MediaService.pickVideo('gallery');
      if (!picked) return;
      const name = `vid_${Date.now()}.mp4`;
      setAttachments((prev) => [...prev, { uri: picked.uri, mimeType: 'video/mp4', name }]);
    } catch (e: any) {
      Alert.alert('Video error', e?.message || 'Failed to pick video');
    }
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  const createEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for the event.');
      return;
    }
    if (!startDate) {
      Alert.alert('Missing date', 'Please provide a start date/time.');
      return;
    }

    try {
      setPosting(true);

      const { data, error } = await supabase
        .from('events')
        .insert({
          preschool_id: preschoolId,
          title: title.trim(),
          description: description.trim() || null,
          start_date: new Date(startDate).toISOString(),
          end_date: endDate ? new Date(endDate).toISOString() : null,
          location: location.trim() || null,
          event_type: eventType,
          status: 'upcoming',
          is_featured: false,
          tags: [],
          metadata: {
            targeting,
            requires_approval: targeting.requires_approval,
            visibility: targeting.visibility,
          } as any,
          created_by: createdByUserId,
        })
        .select('id')
        .single();

      if (error) throw error;

      const newId = data?.id as string;

      // Create event audience records
      if (targeting.audience_type === 'specific_groups' && targeting.audience_config.group_ids?.length) {
        const audienceRecords = targeting.audience_config.group_ids.map(groupId => ({
          event_id: newId,
          audience_type: 'group' as const,
          target_id: groupId,
          target_value: null,
        }));
        
        await supabase.from<any>('event_audiences' as any).insert(audienceRecords as any);
      }

      if (targeting.audience_type === 'specific_users' && targeting.audience_config.user_ids?.length) {
        const audienceRecords = targeting.audience_config.user_ids.map(userId => ({
          event_id: newId,
          audience_type: 'user' as const,
          target_id: userId,
          target_value: null,
        }));
        
        await supabase.from<any>('event_audiences' as any).insert(audienceRecords as any);
      }

      // Create role-based audience records
      if (targeting.audience_config.role_filters?.length) {
        const roleRecords = targeting.audience_config.role_filters.map(role => ({
          event_id: newId,
          audience_type: 'role' as const,
          target_id: null,
          target_value: role,
        }));
        
        await supabase.from<any>('event_audiences' as any).insert(roleRecords as any);
      }

      // Upload attachments if any
      for (const file of attachments) {
        try {
          await MediaService.uploadEventMedia(
            file.uri,
            file.name,
            file.mimeType,
            createdByUserId,
            preschoolId,
            newId
          );
        } catch {}
      }

      reset();
      setAttachments([]);
      onClose();
      onCreated?.(newId);
      if (Platform.OS !== 'web') {
        Alert.alert('Event created', 'Your event has been scheduled.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create event');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#111827' }]}>Create Event</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color={isDark ? '#CBD5E1' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            {/* Basic Event Info */}
            <TextInput
              placeholder="Event title"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              style={[styles.input, { color: isDark ? '#E5E7EB' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }]}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              style={[styles.textarea, { color: isDark ? '#E5E7EB' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={[styles.label, { color: isDark ? '#E5E7EB' : '#111827' }]}>Date & time</Text>
            <View style={styles.row}>
              <TextInput
                placeholder="Start (YYYY-MM-DDTHH:mm)"
                placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                style={[styles.input, styles.inputHalf, { color: isDark ? '#E5E7EB' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }]}
                value={startDate}
                onChangeText={setStartDate}
                autoCapitalize="none"
              />
              <TextInput
                placeholder="End (optional)"
                placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                style={[styles.input, styles.inputHalf, { color: isDark ? '#E5E7EB' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }]}
                value={endDate}
                onChangeText={setEndDate}
                autoCapitalize="none"
              />
            </View>

            <TextInput
              placeholder="Location (optional)"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              style={[styles.input, { color: isDark ? '#E5E7EB' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }]}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={[styles.label, { color: isDark ? '#E5E7EB' : '#111827' }]}>Event type</Text>
            <View style={styles.typeRow}>
              {EVENT_TYPES.map((t) => {
                const active = eventType === t;
                return (
                  <TouchableOpacity key={t} onPress={() => setEventType(t)} style={[styles.typeChip, { borderColor: active ? '#3B82F6' : (isDark ? '#334155' : '#E5E7EB'), backgroundColor: active ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : 'transparent' }]}>
                    <Text style={{ color: active ? '#3B82F6' : (isDark ? '#CBD5E1' : '#6B7280'), fontWeight: active ? '700' : '500' }}>{t.replace('_',' ')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Event Audience & Targeting */}
            <View style={styles.targetingSection}>
              <TouchableOpacity
                style={[styles.targetingHeader, { borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#F9FAFB' }]}
                onPress={() => setShowTargeting(!showTargeting)}
              >
                <View style={styles.targetingHeaderLeft}>
                  <IconSymbol
                    name="person.3.fill"
                    size={20}
                    color={isDark ? '#3B82F6' : '#3B82F6'}
                  />
                  <View>
                    <Text style={[styles.targetingTitle, { color: isDark ? '#E5E7EB' : '#111827' }]}>
                      Event Audience
                    </Text>
                    <Text style={[styles.targetingSubtitle, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
                      {targeting.audience_type === 'everyone' ? 'Everyone can join' :
                       targeting.audience_type === 'specific_groups' ? `${targeting.audience_config.group_ids?.length || 0} groups selected` :
                       targeting.audience_type === 'specific_users' ? `${targeting.audience_config.user_ids?.length || 0} users selected` :
                       `${targeting.audience_type.replace('_', ' ').replace('s', '')} only`}
                    </Text>
                  </View>
                </View>
                <View style={styles.targetingHeaderRight}>
                  {targeting.requires_approval && (
                    <View style={[styles.approvalBadge, { backgroundColor: '#F59E0B' }]}>
                      <IconSymbol name="checkmark.seal" size={12} color="#FFFFFF" />
                      <Text style={styles.approvalText}>Approval</Text>
                    </View>
                  )}
                  <IconSymbol
                    name={showTargeting ? "chevron.up" : "chevron.down"}
                    size={16}
                    color={isDark ? '#CBD5E1' : '#6B7280'}
                  />
                </View>
              </TouchableOpacity>

              {showTargeting && (
                <View style={styles.targetingContent}>
                  <EventTargetingSelector
                    value={targeting}
                    onChange={setTargeting}
                    availableGroups={availableGroups}
                    availableUsers={availableUsers}
                  />
                </View>
              )}
            </View>

            {/* Attachments */}
            <Text style={[styles.label, { color: isDark ? '#E5E7EB' : '#111827' }]}>Attachments (optional)</Text>
            <View style={styles.attachRow}>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#10B981' }]} onPress={addImage}>
                <IconSymbol name="photo" size={16} color="#FFFFFF" />
                <Text style={styles.smallBtnText}>Add Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#F59E0B' }]} onPress={addVideo}>
                <IconSymbol name="video" size={16} color="#FFFFFF" />
                <Text style={styles.smallBtnText}>Add Video</Text>
              </TouchableOpacity>
            </View>
            {attachments.length > 0 && (
              <View style={styles.attachList}>
                {attachments.map((a) => (
                  <View key={a.name} style={[styles.attachItem, { borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
                    <IconSymbol name={a.mimeType.startsWith('image/') ? 'photo' : 'video'} size={14} color={isDark ? '#E5E7EB' : '#1F2937'} />
                    <Text style={{ flex: 1, color: isDark ? '#E5E7EB' : '#1F2937' }} numberOfLines={1}>{a.name}</Text>
                    <TouchableOpacity onPress={() => removeAttachment(a.name)}>
                      <IconSymbol name="xmark.circle.fill" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.postBtn, { backgroundColor: '#3B82F6' }]} onPress={createEvent} disabled={posting}>
            {posting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.postText}>Create Event</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    maxHeight: '88%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    opacity: 0.85,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  inputHalf: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  attachRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  attachList: {
    gap: 6,
    marginBottom: 8,
  },
  attachItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  postBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  postText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  targetingSection: {
    marginBottom: 16,
  },
  targetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  targetingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  targetingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    marginBottom: 2,
  },
  targetingSubtitle: {
    fontSize: 12,
    marginLeft: 12,
  },
  targetingHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  approvalText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  targetingContent: {
    maxHeight: 400,
  },
});

export default CreateEventModal;
