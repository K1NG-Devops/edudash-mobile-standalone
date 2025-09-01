import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useEventUpdates } from '@/lib/hooks/useEnhancedEvents';
import { MediaService } from '@/lib/services/mediaService';
import EditEventModal from '@/components/events/EditEventModal';

const PostUpdateModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onPost: (content: string, attachments: { uri: string; mimeType: string; name: string }[]) => Promise<void>;
}> = ({ visible, onClose, onPost }) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [content, setContent] = React.useState('');
  const [attachments, setAttachments] = React.useState<{ uri: string; mimeType: string; name: string }[]>([]);
  if (!visible) return null;
  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalCard, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }] }>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: isDark ? '#F8FAFC' : '#111827' }]}>Post Update</Text>
          <TouchableOpacity onPress={onClose}><IconSymbol name="xmark" size={20} color={isDark ? '#CBD5E1' : '#6B7280'} /></TouchableOpacity>
        </View>
        <View style={{ borderWidth: 1, borderColor: isDark ? '#334155' : '#E5E7EB', borderRadius: 10, padding: 10, minHeight: 100 }}>
          <TextInput
            multiline
            placeholder="Write an update..."
            placeholderTextColor={isDark ? '#94A3B8' : '#9CA3AF'}
            style={{ color: isDark ? '#E5E7EB' : '#111827', minHeight: 80 }}
            value={content}
            onChangeText={(t) => setContent(String(t))}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#10B981' }]} onPress={async () => {
            const picked = await MediaService.pickImage('gallery'); if (!picked) return; const name = `upd_${Date.now()}.jpg`; setAttachments((p) => [...p, { uri: picked.uri, mimeType: 'image/jpeg', name }]);
          }}>
            <IconSymbol name="photo" size={16} color="#FFFFFF" />
            <Text style={styles.smallBtnText}>Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#F59E0B' }]} onPress={async () => {
            const picked = await MediaService.pickVideo('gallery'); if (!picked) return; const name = `upd_${Date.now()}.mp4`; setAttachments((p) => [...p, { uri: picked.uri, mimeType: 'video/mp4', name }]);
          }}>
            <IconSymbol name="video" size={16} color="#FFFFFF" />
            <Text style={styles.smallBtnText}>Video</Text>
          </TouchableOpacity>
        </View>
        {attachments.map((a) => (
          <View key={a.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <IconSymbol name={a.mimeType.startsWith('image/') ? 'photo' : 'video'} size={14} color={isDark ? '#E5E7EB' : '#111827'} />
            <Text style={{ color: isDark ? '#E5E7EB' : '#111827', flex: 1 }} numberOfLines={1}>{a.name}</Text>
            <TouchableOpacity onPress={() => setAttachments((p) => p.filter(x => x.name !== a.name))}><IconSymbol name="xmark.circle.fill" size={16} color="#EF4444" /></TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#3B82F6', marginTop: 12 }]} onPress={async () => { await onPost(content, attachments); setContent(''); setAttachments([]); onClose(); }}>
          <Text style={styles.primaryBtnText}>Post Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function EventDetailScreen() {
  const params = useLocalSearchParams();
  const eventId = String(params.id || '');
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const eventQuery = useQuery({
    queryKey: ['event-detail', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { updates, loading: updatesLoading, postUpdate, refresh } = useEventUpdates(eventId, !!eventId);

  const [showPost, setShowPost] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handlePost = async (content: string, attachments: { uri: string; mimeType: string; name: string }[]) => {
    const upd = await postUpdate({ event_id: eventId, content });
    for (const file of attachments) {
      try {
        await MediaService.uploadEventMedia(file.uri, file.name, file.mimeType, 'self', String(eventQuery.data?.created_by || ''), eventId, { updateId: upd.id });
      } catch {}
    }
    await refresh();
  };

  if (eventQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const event = eventQuery.data as any;
  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.textSecondary }}>Event not found.</Text>
      </View>
    );
  }

  const handleBack = () => {
    try {
      // @ts-ignore - router.canGoBack may not exist in older versions
      if (router.canGoBack && router.canGoBack()) {
        router.back();
        return;
      }
    } catch {}
    try {
      if (typeof window !== 'undefined' && (window.history?.length || 0) > 1) {
        window.history.back();
        return;
      }
    } catch {}
    try {
      router.replace('/screens/principal-dashboard');
    } catch {
      try { router.push('/screens/principal-dashboard'); } catch {}
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top','left','right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={handleBack} style={{ marginBottom: 12 }}>
          <IconSymbol name="chevron.backward" size={18} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>{event.title}</Text>
        <Text style={{ color: palette.textSecondary, marginBottom: 8 }}>{new Date(event.start_date).toLocaleString()}</Text>
        {event.description && <Text style={{ color: palette.textSecondary, marginBottom: 16 }}>{event.description}</Text>}

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#3B82F6', flex: 1 }]} onPress={() => setShowPost(true)}>
            <Text style={styles.primaryBtnText}>Post Update</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#10B981', flex: 1 }]} onPress={() => setShowEdit(true)}>
            <Text style={styles.primaryBtnText}>Edit Event</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: palette.text }]}>Updates</Text>
        {updatesLoading ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : updates.length > 0 ? (
          updates.map((u) => (
            <View key={u.id} style={[styles.updateCard, { borderColor: palette.outline, backgroundColor: palette.surface }]}>
              <Text style={{ color: palette.text, fontWeight: '600', marginBottom: 6 }}>{u.title || 'Update'}</Text>
              <Text style={{ color: palette.textSecondary, marginBottom: 8 }}>{u.content}</Text>
              {u.media && u.media.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {u.media.map((m) => (
                    <Image key={m.id} source={{ uri: m.thumbnail_url || m.file_url }} style={{ width: 96, height: 96, borderRadius: 8 }} />
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={{ color: palette.textSecondary }}>No updates yet.</Text>
        )}
      </ScrollView>
      <PostUpdateModal visible={showPost} onClose={() => setShowPost(false)} onPost={handlePost} />
      <EditEventModal
        visible={showEdit}
        event={{ id: eventId, preschool_id: String(event.preschool_id || ''), ...event }}
        onClose={() => setShowEdit(false)}
        onSaved={() => {
          try { (async () => { await eventQuery.refetch(); })(); } catch {}
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  updateCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  primaryBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
});
