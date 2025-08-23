import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ParentRow { id: string; name: string; email?: string | null; phone?: string | null; }

export default function ParentsScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<ParentRow[]>([]);
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const load = useCallback(async () => {
    if (!profile?.preschool_id) return;
    try {
      setLoading(true);
      let query = supabase
        .from('users')
        .select('id, name, email, phone, preschool_id, role, is_active')
        .eq('preschool_id', profile.preschool_id)
        .eq('role', 'parent')
        .order('name');
      if (status !== 'all') query = query.eq('is_active', status === 'active');
      const { data } = await query;
      const rows = (data || []).map((u: any) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, is_active: u.is_active }));
      setItems(rows);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.preschool_id, status]);

  useEffect(() => { load(); }, [profile?.preschool_id, status, load]);

  const filtered = items.filter(p => (p.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.filtersRow}>
          <TouchableOpacity style={[styles.filterBtn, status==='all'&&styles.filterActive]} onPress={()=>setStatus('all')}><Text style={[styles.filterText, status==='all'&&styles.filterTextActive]}>All</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, status==='active'&&styles.filterActive]} onPress={()=>setStatus('active')}><Text style={[styles.filterText, status==='active'&&styles.filterTextActive]}>Active</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, status==='inactive'&&styles.filterActive]} onPress={()=>setStatus('inactive')}><Text style={[styles.filterText, status==='inactive'&&styles.filterTextActive]}>Inactive</Text></TouchableOpacity>
        </View>
        <Text style={styles.title}>Parents</Text>
        <TextInput placeholder="Search parents" value={q} onChangeText={setQ} style={styles.search} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <IconSymbol name="person.slash" size={28} color="#9CA3AF" />
            <Text style={styles.emptyText}>No parents found</Text>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(item.name || '?').charAt(0)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.email || item.phone || '—'}</Text>
            </View>
            <TouchableOpacity style={styles.action} onPress={()=>router.push({ pathname: '/screens/parent-view', params: { id: item.id } } as any)}>
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

