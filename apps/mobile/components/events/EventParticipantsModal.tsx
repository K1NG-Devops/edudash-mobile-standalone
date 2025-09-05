import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import { EventParticipant } from '@/types/events';
import { useT } from '@/i18n';
import Avatar from '@/components/ui/Avatar';

interface EventParticipantsModalProps {
  visible: boolean;
  eventId: string;
  onClose: () => void;
}

const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({ visible, eventId, onClose }) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const { t } = useT();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);

  const normalize = useCallback((p: any): EventParticipant => ({
    id: p.id,
    event_id: p.event_id,
    user_id: p.user_id,
    student_id: p.student_id || undefined,
    participation_type: p.participation_type,
    status: p.status,
    registered_at: p.registered_at,
    checked_in_at: p.checked_in_at || undefined,
    checked_out_at: p.checked_out_at || undefined,
    notes: p.notes || undefined,
    metadata: p.metadata || {},
    created_at: p.created_at,
    updated_at: p.updated_at,
    user: p.user ? {
      id: p.user.id,
      name: p.user.name,
      avatar_url: p.user.avatar_url || undefined,
      role: p.user.role,
    } : undefined,
    student: p.student ? {
      id: p.student.id,
      name: [p.student.first_name, p.student.last_name].filter(Boolean).join(' '),
      avatar_url: p.student.avatar_url || undefined,
    } : undefined,
  }), []);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:users(id, name, role, avatar_url),
          student:students(id, first_name, last_name, avatar_url)
        `)
        .eq('event_id', eventId)
        .order('registered_at', { ascending: true });

      if (error) throw error;

      setParticipants((data || []).map(normalize));
    } catch (e: any) {
      setError(e?.message || 'Failed to load participants');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, normalize]);

  useEffect(() => {
    if (visible) {
      load();
    }
  }, [visible, load]);

  const renderItem = ({ item }: { item: EventParticipant }) => {
    const name = item.user?.name || item.student?.name || t('common.unknown') || 'Unknown';
    const subtitle = item.user?.role ? (item.participation_type ? `${item.user.role} • ${item.participation_type}` : item.user.role) : (item.participation_type || '');
    const statusColor = item.status === 'registered' ? palette.primary : item.status === 'attended' ? '#10B981' : item.status === 'cancelled' ? '#EF4444' : palette.textSecondary;

    return (
      <View style={[styles.row, { borderBottomColor: palette.outline }]}> 
        <Avatar size={36} name={name} imageUri={item.user?.avatar_url || item.student?.avatar_url || null} />
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>{name}</Text>
          {!!subtitle && (
            <Text style={[styles.rowSubtitle, { color: palette.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}15` }]}> 
          <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: palette.surface }]}> 
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: palette.outline }]}> 
            <Text style={[styles.title, { color: palette.text }]}>
              {t('events.participantsTitle')}
            </Text>
            <View style={styles.headerActions}>
              <View style={[styles.countPill, { backgroundColor: palette.background }]}> 
                <IconSymbol name="person.2" size={14} color={palette.textSecondary} />
                <Text style={[styles.countText, { color: palette.textSecondary }]}>{participants.length}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.iconBtn, { borderColor: palette.outline }]}>
                <IconSymbol name="xmark" size={18} color={palette.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.center}> 
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={{ color: palette.textSecondary, marginTop: 8 }}>{t('common.loading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.center}> 
              <IconSymbol name="exclamationmark.triangle" size={32} color="#EF4444" />
              <Text style={[styles.errorText, { color: palette.text }]}>{error}</Text>
              <TouchableOpacity onPress={load} style={[styles.retryBtn, { borderColor: palette.outline }]}> 
                <Text style={{ color: palette.text }}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : participants.length === 0 ? (
            <View style={styles.center}> 
              <IconSymbol name="person.2" size={40} color={palette.textSecondary} />
              <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{t('events.noParticipants')}</Text>
            </View>
          ) : (
            <FlatList
              data={participants}
              keyExtractor={(p) => p.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
              style={styles.list}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: palette.outline }]}> 
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: palette.background }]}> 
              <Text style={{ color: palette.text }}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyText: {
    marginTop: 8,
  },
  list: {
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  footer: {
    borderTopWidth: 1,
    padding: 12,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
});

export default EventParticipantsModal;

