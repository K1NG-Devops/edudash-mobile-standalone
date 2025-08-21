import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface StudentItem {
  id: string;
  first_name: string;
  last_name: string;
  class_id?: string | null;
  classes?: { name?: string | null } | null;
}

export default function StudentsScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<StudentItem[]>([]);
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [classFilter, setClassFilter] = useState<string | 'all'>('all');

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const load = async () => {
    if (!profile?.preschool_id) return;
    try {
      setLoading(true);
      // Fetch classes for filter chips
      const { data: classRows } = await supabase
        .from('classes')
        .select('id, name')
        .eq('preschool_id', profile.preschool_id)
        .eq('is_active', true)
        .order('name');
      setClasses(classRows || []);

      // Build query with server-side filters
      let query = supabase
        .from('students')
        .select('id, first_name, last_name, class_id, classes(name)')
        .eq('school_id', profile.preschool_id)
        .order('first_name');
      if (status !== 'all') query = query.eq('is_active', status === 'active');
      if (classFilter !== 'all') query = query.eq('class_id', classFilter);
      const { data } = await query;
      setItems(data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [profile?.preschool_id, status, classFilter]);

  const filtered = items.filter(s => {
    const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return name.includes(q.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.filtersRow}>
          <TouchableOpacity style={[styles.filterBtn, status==='all'&&styles.filterActive]} onPress={()=>setStatus('all')}><Text style={[styles.filterText, status==='all'&&styles.filterTextActive]}>All</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, status==='active'&&styles.filterActive]} onPress={()=>setStatus('active')}><Text style={[styles.filterText, status==='active'&&styles.filterTextActive]}>Active</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, status==='inactive'&&styles.filterActive]} onPress={()=>setStatus('inactive')}><Text style={[styles.filterText, status==='inactive'&&styles.filterTextActive]}>Inactive</Text></TouchableOpacity>
        </View>
        <View style={[styles.filtersRow, { marginTop: 6, flexWrap: 'wrap' }]}>
          <TouchableOpacity style={[styles.filterBtn, classFilter==='all'&&styles.filterActive]} onPress={()=>setClassFilter('all')}><Text style={[styles.filterText, classFilter==='all'&&styles.filterTextActive]}>All classes</Text></TouchableOpacity>
          {classes.map(c => (
            <TouchableOpacity key={c.id} style={[styles.filterBtn, classFilter===c.id&&styles.filterActive]} onPress={()=>setClassFilter(c.id)}>
              <Text style={[styles.filterText, classFilter===c.id&&styles.filterTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.title}>Students</Text>
        <TextInput
          placeholder="Search students"
          value={q}
          onChangeText={setQ}
          style={styles.search}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}> 
            <IconSymbol name="person.slash" size={28} color="#9CA3AF" />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(item.first_name || '?').charAt(0)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.sub}>{item.classes?.name || 'Unassigned'}</Text>
            </View>
            <TouchableOpacity style={styles.action} onPress={()=>router.push({ pathname: '/screens/student-view', params: { id: item.id } } as any)}>
              <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16 },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  filterActive: { backgroundColor: '#05966920', borderWidth: 1, borderColor: '#05966960' },
  filterText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#065F46' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  search: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  list: { padding: 16 },
  row: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#059669', fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280' },
  action: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 8, color: '#9CA3AF' },
});

