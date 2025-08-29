import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { PrincipalService } from '@/lib/services/principalService';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function PrincipalReportsScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    attendanceRate: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    activeClasses: 0,
    newEnrollments: 0,
  });

  const load = async () => {
    if (!profile?.preschool_id) return;
    try {
      setError(null);
      setLoading(true);
      const s = await PrincipalService.getPrincipalStats(profile.preschool_id);
      if (s.data) setStats(s.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [profile?.preschool_id]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>School Reports</Text>
        <Text style={styles.subtitle}>Key metrics for your school</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          <ReportCard icon="graduationcap.fill" label="Total Students" value={stats.totalStudents} />
          <ReportCard icon="person.2.fill" label="Teachers" value={stats.totalTeachers} />
          <ReportCard icon="person.3.fill" label="Parents" value={stats.totalParents} />
          <ReportCard icon="chart.bar.fill" label="Attendance" value={`${stats.attendanceRate}%`} />
          <ReportCard icon="creditcard.fill" label="Monthly Revenue" value={`R${(stats.monthlyRevenue/1000).toFixed(0)}k`} />
          <ReportCard icon="exclamationmark.triangle.fill" label="Pending Payments" value={stats.pendingPayments} />
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function ReportCard({ icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <View style={styles.card}>
      <IconSymbol name={icon} size={22} color="#059669" />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  errorBox: { margin: 20, padding: 14, backgroundColor: '#FEF2F2', borderRadius: 10, flexDirection: 'row', gap: 10, alignItems: 'center' },
  errorText: { color: '#991B1B' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  card: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  value: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 8 },
  label: { fontSize: 12, color: '#6B7280', marginTop: 2, textAlign: 'center' },
});

