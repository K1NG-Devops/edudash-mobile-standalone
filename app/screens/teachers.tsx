import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TeacherManagement } from '@/components/admin/TeacherManagement';

interface TeacherRow { id: string; name: string; email?: string | null; }

export default function TeachersScreen() {
  const { profile } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<TeacherRow[]>([]);
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showInvite, setShowInvite] = useState(false);

  const load = async () => {
    if (!profile?.preschool_id) {
      console.log('❌ No preschool_id found in profile');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Loading teachers for preschool:', profile.preschool_id);
      
      let query = supabase
        .from('users')
        .select('id, name, email, role, preschool_id, is_active')
        .eq('preschool_id', profile.preschool_id)
        .eq('role', 'teacher')
        .order('name');
      
      if (status !== 'all') query = query.eq('is_active', status === 'active');
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Teachers query error:', error);
        console.log('Query details:', {
          table: 'users',
          filters: { preschool_id: profile.preschool_id, role: 'teacher', status }
        });
      } else {
        console.log('✅ Teachers loaded successfully:', data?.length || 0, 'records');
        if (data && data.length > 0) {
          console.log('📋 Matching teachers:', data);
        } else {
          console.log('🔍 No teachers found for preschool_id:', profile.preschool_id);
        }
      }
      
      const rows = (data || []).map((t: any) => ({ id: t.id, name: t.name, email: t.email, is_active: t.is_active }));
      setItems(rows);
    } catch (err) {
      console.error('❌ Exception in teachers load function:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [profile?.preschool_id, status]);

  const filtered = items.filter(t => (t.name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
      <View style={[styles.header, { backgroundColor: isDark ? '#0F172A' : 'transparent' }]}>
        <View style={[styles.filtersRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
            <TouchableOpacity 
              style={[styles.filterBtn, { 
                backgroundColor: isDark ? '#374151' : '#E5E7EB' 
              }, status==='all' && { 
                backgroundColor: isDark ? '#10B981' : '#065F46', 
                borderWidth: 1, 
                borderColor: isDark ? '#34D399' : '#10B981' 
              }]} 
              onPress={()=>setStatus('all')}
            >
              <Text style={[styles.filterText, { color: isDark ? '#E5E7EB' : '#374151' }, status==='all' && { color: '#FFFFFF' }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterBtn, { 
                backgroundColor: isDark ? '#374151' : '#E5E7EB' 
              }, status==='active' && { 
                backgroundColor: isDark ? '#10B981' : '#065F46', 
                borderWidth: 1, 
                borderColor: isDark ? '#34D399' : '#10B981' 
              }]} 
              onPress={()=>setStatus('active')}
            >
              <Text style={[styles.filterText, { color: isDark ? '#E5E7EB' : '#374151' }, status==='active' && { color: '#FFFFFF' }]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterBtn, { 
                backgroundColor: isDark ? '#374151' : '#E5E7EB' 
              }, status==='inactive' && { 
                backgroundColor: isDark ? '#10B981' : '#065F46', 
                borderWidth: 1, 
                borderColor: isDark ? '#34D399' : '#10B981' 
              }]} 
              onPress={()=>setStatus('inactive')}
            >
              <Text style={[styles.filterText, { color: isDark ? '#E5E7EB' : '#374151' }, status==='inactive' && { color: '#FFFFFF' }]}>Inactive</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.inviteBtn, { 
              backgroundColor: isDark ? '#1F2937' : '#ECFDF5', 
              borderColor: isDark ? '#34D399' : '#A7F3D0' 
            }]} 
            onPress={() => setShowInvite(true)}
          >
            <IconSymbol name="plus.circle.fill" size={18} color={isDark ? '#6EE7B7' : '#10B981'} />
            <Text style={[styles.inviteText, { color: isDark ? '#6EE7B7' : '#065F46' }]}>Invite</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>Teachers</Text>
        <TextInput 
          placeholder="Search teachers" 
          placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
          value={q} 
          onChangeText={setQ} 
          style={[styles.search, { 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
            borderColor: isDark ? '#475569' : '#E5E7EB',
            color: isDark ? '#FFFFFF' : '#111827'
          }]} 
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <IconSymbol name="person.slash" size={28} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <Text style={[styles.emptyText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>No teachers found</Text>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
              <Text style={[styles.avatarText, { color: isDark ? '#34D399' : '#059669' }]}>
                {(item.name || '?').charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: isDark ? '#FFFFFF' : '#111827' }]}>{item.name}</Text>
              <Text style={[styles.sub, { color: isDark ? '#E5E7EB' : '#6B7280' }]}>{item.email || '—'}</Text>
            </View>
            <TouchableOpacity style={styles.action} onPress={()=>router.push({ pathname: '/screens/teacher-view', params: { id: item.id } } as any)}>
              <IconSymbol name="chevron.right" size={16} color={isDark ? '#E5E7EB' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        )}
      />
      {showInvite && (
        <TeacherManagement
          preschoolId={String(profile?.preschool_id || '')}
          principalId={String(profile?.id || '')}
          visible={showInvite}
          onClose={() => setShowInvite(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16 },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  inviteText: { color: '#065F46', fontWeight: '700' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  filterText: { fontSize: 12, fontWeight: '600' },
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
