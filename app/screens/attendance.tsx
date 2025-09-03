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

  // Themed styles to avoid inline objects for common colors/backgrounds
  const themed = useMemo(() => StyleSheet.create({
    screenBg: { backgroundColor: palette.background },
    text: { color: palette.text },
    textSecondary: { color: palette.textSecondary },
    surfaceRow: { backgroundColor: palette.surface, borderColor: palette.outline },
    pillActive: { borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
    pillInactive: { borderColor: palette.outline, backgroundColor: palette.surface },
    pillTextActive: { color: '#3B82F6' },
    pillTextInactive: { color: palette.text },
  }), [palette]);

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
    <View style={[styles.screen, themed.screenBg]} className="flex-1 bg-background">
      <View style={styles.pad16}>
        <Text style={[styles.title, themed.text]}>Attendance</Text>
        {!!selectedChild && (
          <Text style={[styles.subtitle, themed.textSecondary]}>For {selectedChild.full_name}</Text>
        )}
      </View>

      {/* Child selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.px16Gap8}>
        {children.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={async () => {
              setSelectedChildId(c.id);
              setRefreshing(true);
              const hist = await StudentDataService.getAttendanceHistory(c.id);
              setHistory(hist);
              setRefreshing(false);
            }}
            style={[
              styles.pill,
              c.id === (selectedChild?.id) ? themed.pillActive : themed.pillInactive,
            ]}
          >
            <Text style={c.id === (selectedChild?.id) ? themed.pillTextActive : themed.pillTextInactive}>
              {c.first_name || c.full_name?.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.flex1} contentContainerStyle={styles.pad16} refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />}> 
        {(!history || history.length === 0) ? (
          <View style={[styles.center, styles.pad24]}>
            <IconSymbol name="calendar" size={48} color="#9CA3AF" />
            <Text style={[styles.mt8, themed.textSecondary]}>No attendance records yet.</Text>
          </View>
        ) : (
          history.map((r, idx) => (
            <View key={`${r.date}-${idx}`} style={[styles.row, themed.surfaceRow]}>
              <Text style={[styles.dateText, themed.text]}>{new Date(r.date).toLocaleDateString()}</Text>
              <Text style={[styles.statusText, { color: statusColor(r.status) }]}>{r.status || 'unknown'}</Text>
            </View>
          ))
        )}
        <View style={styles.h24} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex1: { flex: 1 },
  pad16: { padding: 16 },
  pad24: { padding: 24 },
  px16Gap8: { paddingHorizontal: 16, gap: 8 },
  h24: { height: 24 },
  mt8: { marginTop: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  dateText: { fontSize: 14, fontWeight: '500' },
  statusText: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
});

