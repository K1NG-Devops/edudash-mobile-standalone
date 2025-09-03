import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView, Switch } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import { MediaService } from '@/lib/services/mediaService';
import { EnhancedEvent } from '@/types/events';

const EVENT_TYPES = [
  'general', 'field_trip', 'performance', 'celebration', 'workshop', 'sports', 'arts', 'academic'
] as const;
const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'] as const;

type EventType = typeof EVENT_TYPES[number];

type Props = {
  visible: boolean;
  event: Partial<EnhancedEvent> & { id: string; preschool_id: string };
  onClose: () => void;
  onSaved?: () => void;
};

export default function EditEventModal({ visible, event, onClose, onSaved }: Props) {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<EventType>('general');
  const [status, setStatus] = useState<EnhancedEvent['status']>('upcoming');
  const [isFeatured, setIsFeatured] = useState(false);
  const [cover, setCover] = useState<{ uri: string; mimeType: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(event.title || '');
    setDescription(event.description || '');
    setStartDate(event.start_date ? new Date(event.start_date).toISOString().slice(0,16) : '');
    setEndDate(event.end_date ? new Date(event.end_date).toISOString().slice(0,16) : '');
    setLocation(event.location || '');
    setEventType((event.event_type as EventType) || 'general');
    setStatus(event.status || 'upcoming');
    setIsFeatured(!!event.is_featured);
    setCover(null);
  }, [visible, event]);

  const pickCover = async () => {
    try {
      const picked = await MediaService.pickImage('gallery');
      if (!picked) return;
      setCover({ uri: picked.uri, mimeType: 'image/jpeg', name: `cover_${event.id}_${Date.now()}.jpg` });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to pick image');
    }
  };

  const getCurrentUserInternalId = async (): Promise<string | null> => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return null;
      const { data } = await supabase.from('users').select('id').eq('auth_user_id', uid).maybeSingle();
      return data?.id || null;
    } catch { return null; }
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return;
    }
    try {
      setSaving(true);
      let coverUrl: string | undefined;

      if (cover) {
        const uploaderId = (await getCurrentUserInternalId()) || (event.created_by as string) || '';
        const uploadRes = await MediaService.uploadMedia(
          cover.uri,
          cover.name,
          cover.mimeType,
          uploaderId,
          event.preschool_id,
          { isBase64: false }
        );
        const uploaded: any = uploadRes?.data;
        if (uploaded?.file_url) {
          coverUrl = uploaded.file_url;
        } else if (uploaded?.url) {
          coverUrl = uploaded.url;
        }
      }

      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        location: location.trim() || null,
        event_type: eventType,
        status,
        is_featured: isFeatured,
      };
      if (coverUrl) payload.cover_image_url = coverUrl;

      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', event.id);
      if (error) throw error;

      onSaved?.();
      onClose();
      if (Platform.OS !== 'web') Alert.alert('Event updated', 'Your changes have been saved.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, isDark ? styles.sheetDark : styles.sheetLight] }>
          <View style={styles.header}>
            <Text style={[styles.title, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Edit Event</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color={isDark ? '#CBD5E1' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.contentPB8}>
            <TextInput
              placeholder="Title"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              placeholder="Description"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              style={[styles.textarea, isDark ? styles.inputDark : styles.inputLight, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={[styles.label, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Date & time</Text>
            <View style={styles.row}>
              <TextInput
                placeholder="Start (YYYY-MM-DDTHH:mm)"
                placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                style={[styles.input, styles.half, isDark ? styles.inputDark : styles.inputLight, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}
                value={startDate}
                onChangeText={setStartDate}
              />
              <TextInput
                placeholder="End (optional)"
                placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
                style={[styles.input, styles.half, isDark ? styles.inputDark : styles.inputLight, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>

            <TextInput
              placeholder="Location (optional)"
              placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={[styles.label, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Event type</Text>
            <View style={styles.typeRow}>
              {EVENT_TYPES.map((t) => {
                const active = eventType === t;
                return (
                  <TouchableOpacity key={t} onPress={() => setEventType(t)} style={[
                    styles.chip,
                    active
                      ? (isDark ? styles.chipActiveBlueDark : styles.chipActiveBlueLight)
                      : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight)
                  ]}>
                    <Text style={[
                      active ? styles.typeTextActiveBlue : (isDark ? styles.typeTextInactiveDark : styles.typeTextInactiveLight),
                      active ? styles.fw700 : styles.fw500,
                    ]}>{t.replace('_',' ')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Status</Text>
            <View style={styles.typeRow}>
              {STATUSES.map((s) => {
                const active = status === s;
                return (
                  <TouchableOpacity key={s} onPress={() => setStatus(s)} style={[
                    styles.chip,
                    active
                      ? (isDark ? styles.statusChipActiveGreenDark : styles.statusChipActiveGreenLight)
                      : (isDark ? styles.chipInactiveDark : styles.chipInactiveLight)
                  ]}>
                    <Text style={[
                      active ? styles.statusTextActiveGreen : (isDark ? styles.typeTextInactiveDark : styles.typeTextInactiveLight),
                      active ? styles.fw700 : styles.fw500,
                    ]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.row, styles.rowAlignCenterMB8] }>
              <Text style={[isDark ? styles.textPrimaryDark : styles.textPrimaryLight, styles.flex1]}>Featured</Text>
              <Switch value={isFeatured} onValueChange={setIsFeatured} />
            </View>

            <View style={[styles.row, styles.gap8] }>
              <TouchableOpacity style={[styles.smallBtn, styles.smallBtnBlue]} onPress={pickCover}>
                <IconSymbol name="photo" size={16} color="#FFFFFF" />
                <Text style={styles.smallBtnText}>{cover ? 'Change Cover' : 'Upload Cover'}</Text>
              </TouchableOpacity>
              {!!event.cover_image_url && !cover && (
                <Text style={[isDark ? styles.textSecondaryDark : styles.textSecondaryLight, styles.flex1]} numberOfLines={1}>Current cover set</Text>
              )}
              {cover && (
                <Text style={[isDark ? styles.textSecondaryDark : styles.textSecondaryLight, styles.flex1]} numberOfLines={1}>{cover.name}</Text>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.saveBtn, styles.saveBtnBlue]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, maxHeight: '88%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, opacity: 0.85, marginBottom: 6, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  half: { flex: 1, marginRight: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  saveBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  // theme + utility variants
  sheetDark: { backgroundColor: '#0F172A', borderColor: '#334155' },
  sheetLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  inputDark: { borderColor: '#334155', backgroundColor: '#0B1220' },
  inputLight: { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  contentPB8: { paddingBottom: 8 },
  textPrimaryDark: { color: '#E5E7EB' },
  textPrimaryLight: { color: '#111827' },
  textSecondaryDark: { color: '#94A3B8' },
  textSecondaryLight: { color: '#6B7280' },
  chipActiveBlueDark: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.15)' },
  chipActiveBlueLight: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
  chipInactiveDark: { borderColor: '#334155', backgroundColor: 'transparent' },
  chipInactiveLight: { borderColor: '#E5E7EB', backgroundColor: 'transparent' },
  typeTextActiveBlue: { color: '#3B82F6' },
  typeTextInactiveDark: { color: '#CBD5E1' },
  typeTextInactiveLight: { color: '#6B7280' },
  statusChipActiveGreenDark: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.15)' },
  statusChipActiveGreenLight: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },
  statusTextActiveGreen: { color: '#10B981' },
  fw700: { fontWeight: '700' },
  fw500: { fontWeight: '500' },
  rowAlignCenterMB8: { alignItems: 'center', marginBottom: 8 },
  gap8: { gap: 8 },
  smallBtnBlue: { backgroundColor: '#3B82F6' },
  saveBtnBlue: { backgroundColor: '#3B82F6' },
  flex1: { flex: 1 },
});
