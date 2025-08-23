import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function TeacherView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from('users')
        .select('id, name, email, phone, role, is_active')
        .eq('id', id)
        .single();
      setData(data || null);
    })();
  }, [id]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{data?.name || 'Teacher'}</Text>
      <Text style={styles.sub}>Email: {data?.email || '—'}</Text>
      <Text style={styles.sub}>Phone: {data?.phone || '—'}</Text>
      <Text style={styles.sub}>Status: {data?.is_active ? 'Active' : 'Inactive'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  sub: { fontSize: 14, color: '#374151', marginBottom: 6 },
});

