import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface CreateEventModalProps {
  visible: boolean;
  preschoolId: string;
  createdByUserId: string; // users.id (internal profile id)
  onClose: () => void;
  onCreated?: (eventId: string) => void;
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

const CreateEventModal: React.FC<CreateEventModalProps> = ({ visible, preschoolId, createdByUserId, onClose, onCreated }) => {
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

  const reset = () => {
    setTitle('');
    setDescription('');
    setStartDate(defaultStart);
    setEndDate('');
    setLocation('');
    setEventType('general');
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
          metadata: {},
          created_by: createdByUserId,
        })
        .select('id')
        .single();

      if (error) throw error;

      const newId = data?.id as string;
      reset();
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
});

export default CreateEventModal;
