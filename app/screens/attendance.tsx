import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { StudentDataService, EnhancedStudent } from '@/lib/services/studentDataService';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const [children, setChildren] = useState<EnhancedStudent[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ date: string; status: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedChild = useMemo(() => children.find(c => c.id === selectedChildId) || children[0], [children, selectedChildId]);

  const load = async () => {
    if (!profile?.auth_user_id) return;
    setLoading(true);
    try {
      const kids = await StudentDataService.getStudentsForParent(profile.auth_user_id);
      setChildren(kids);
      const childId = selectedChildId || kids[0]?.id || null;
      if (childId) {
        setSelectedChildId(childId);
        const hist = await StudentDataService.getAttendanceHistory(childId);
        setHistory(hist);
      } else {
        setHistory([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [profile?.auth_user_id]);
  const onRefresh = async () => { setRefreshing(true); await load(); };

  const statusColor = (s: string) => {
    const k = (s || '').toLowerCase();
    if (k === 'present') return '#10B981';
    if (k === 'absent') return '#EF4444';
    if (k === 'late' || k === 'tardy') return '#F59E0B';
    return palette.textSecondary;
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={{ padding: 16 }}>
        <Text style={[styles.title, { color: palette.text }]}>Attendance</Text>
        {!!selectedChild && (
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>For {selectedChild.full_name}</Text>
        )}
      </View>

      {/* Child selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {children.map((c) => (
          <TouchableOpacity key={c.id} onPress={async () => { setSelectedChildId(c.id); setRefreshing(true); const hist = await StudentDataService.getAttendanceHistory(c.id); setHistory(hist); setRefreshing(false); }} style={[styles.pill, { borderColor: c.id === (selectedChild?.id) ? '#3B82F6' : palette.outline, backgroundColor: c.id === (selectedChild?.id) ? 'rgba(59,130,246,0.1)' : palette.surface }]}>
            <Text style={{ color: c.id === (selectedChild?.id) ? '#3B82F6' : palette.text }}>{c.first_name || c.full_name?.split(' ')[0]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />}> 
        {(!history || history.length === 0) ? (
          <View style={[styles.center, { padding: 24 }]}>
            <IconSymbol name="calendar" size={48} color="#9CA3AF" />
            <Text style={{ color: palette.textSecondary, marginTop: 8 }}>No attendance records yet.</Text>
          </View>
        ) : (
          history.map((r, idx) => (
            <View key={`${r.date}-${idx}`} style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
              <Text style={[styles.dateText, { color: palette.text }]}>{new Date(r.date).toLocaleDateString()}</Text>
              <Text style={[styles.statusText, { color: statusColor(r.status) }]}>{r.status || 'unknown'}</Text>
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  dateText: { fontSize: 14, fontWeight: '500' },
  statusText: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
});

