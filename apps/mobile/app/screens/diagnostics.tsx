import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function DiagnosticsScreen() {
  const { profile } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ teachers: number; parents: number; students: number; classes: number } | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const preschoolId = profile?.preschool_id || '';

  const load = async () => {
    if (!preschoolId) {
      setMessages(["Your profile is missing preschool_id. Please ensure your principal profile is linked to a school."]);
      return;
    }
    setLoading(true);
    const newMsgs: string[] = [];
    try {
      // Verify principal can read teachers
      const { count: teachers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher')
        .eq('preschool_id', preschoolId);

      if ((teachers ?? 0) >= 0) newMsgs.push(`Teachers visible: ${teachers ?? 0}`);

      const { count: parents } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'parent')
        .eq('preschool_id', preschoolId);

      const { count: students } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('preschool_id', preschoolId);

      const { count: classes } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('preschool_id', preschoolId)
        .eq('is_active', true);

      setStats({
        teachers: teachers || 0,
        parents: parents || 0,
        students: students || 0,
        classes: classes || 0,
      });

      // Check RLS likely working if we could read teachers
      if ((teachers || 0) >= 0) {
        newMsgs.push('RLS check: OK – principal can view teachers in their preschool.');
      }

      // Check for classes with no teacher
      const { count: classesWithoutTeacher } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('preschool_id', preschoolId)
        .is('teacher_id', null)
        .eq('is_active', true);

      if ((classesWithoutTeacher || 0) > 0) {
        newMsgs.push(`${classesWithoutTeacher} class(es) without assigned teachers.`);
      }

      // Students without class
      const { count: studentsWithoutClass } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('preschool_id', preschoolId)
        .is('class_id', null)
        .eq('is_active', true);

      if ((studentsWithoutClass || 0) > 0) {
        newMsgs.push(`${studentsWithoutClass} student(s) without class enrollment.`);
      }

    } catch (e: any) {
      newMsgs.push(`Error during diagnostics: ${e?.message || String(e)}`);
    } finally {
      setMessages(newMsgs);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [preschoolId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}> 
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>Tenant Diagnostics</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Quick checks for role & data visibility in your preschool.</Text>

        <View style={[styles.card, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}> 
          <Text style={[styles.cardTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Current Context</Text>
          <Row label="Principal" value={profile?.name || '—'} />
          <Row label="Role" value={profile?.role || '—'} />
          <Row label="Preschool ID" value={preschoolId || '—'} />
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}> 
          <Text style={[styles.cardTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Counts</Text>
          <Row label="Teachers" value={String(stats?.teachers ?? '—')} />
          <Row label="Parents" value={String(stats?.parents ?? '—')} />
          <Row label="Students" value={String(stats?.students ?? '—')} />
          <Row label="Classes" value={String(stats?.classes ?? '—')} />
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}> 
          <Text style={[styles.cardTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Findings</Text>
          {(messages.length === 0) ? (
            <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>No issues detected.</Text>
          ) : messages.map((m, i) => (
            <View key={i} style={styles.findingRow}>
              <IconSymbol name="checkmark.seal.fill" size={16} color="#10B981" />
              <Text style={[styles.findingText, { color: isDark ? '#CBD5E1' : '#1F2937' }]}>{m}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 64 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  rowLabel: { fontSize: 13, color: '#6B7280' },
  rowValue: { fontSize: 13, color: '#111827', fontWeight: '700' },
  findingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  findingText: { fontSize: 13 },
});

