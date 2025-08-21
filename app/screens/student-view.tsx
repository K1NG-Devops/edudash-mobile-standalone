import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function StudentView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, class_id, classes(name)')
        .eq('id', id)
        .single();
      setData(data || null);
    })();
  }, [id]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{data ? `${data.first_name} ${data.last_name}` : 'Student'}</Text>
      <Text style={styles.sub}>Class: {data?.classes?.name || 'Unassigned'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  sub: { fontSize: 14, color: '#374151', marginBottom: 6 },
});

