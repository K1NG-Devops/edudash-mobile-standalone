import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<StudentItem[]>([]);
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [classFilter, setClassFilter] = useState<string | 'all'>('all');

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const load = async () => {
    if (!profile?.preschool_id) {
      console.log('❌ No preschool_id found in profile');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Loading students for preschool:', profile.preschool_id);
      
      // Fetch classes for filter chips
      const { data: classRows, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('preschool_id', profile.preschool_id)
        .eq('is_active', true)
        .order('name');
      
      if (classError) {
        console.log('⚠️ Class query error:', classError);
      }
      setClasses(classRows || []);

      // Build query with server-side filters
      let query = supabase
        .from('students')
        .select('id, first_name, last_name, class_id, classes(name)')
        .eq('preschool_id', profile.preschool_id)
        .order('first_name');
      
      if (status !== 'all') query = query.eq('is_active', status === 'active');
      if (classFilter !== 'all') query = query.eq('class_id', classFilter);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Students query error:', error);
        console.log('Query details:', {
          table: 'students',
          filters: { preschool_id: profile.preschool_id, status, classFilter }
        });
      } else {
        console.log('✅ Students loaded successfully:', data?.length || 0, 'records');
      }
      
      setItems(data || []);
    } catch (err) {
      console.error('❌ Exception in load function:', err);
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
    <View style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
      <View style={[styles.header, { backgroundColor: isDark ? '#0F172A' : 'transparent' }]}>
        <View style={styles.filtersRow}>
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
        <View style={[styles.filtersRow, { marginTop: 6, flexWrap: 'wrap' }]}>
          <TouchableOpacity 
            style={[styles.filterBtn, { 
              backgroundColor: isDark ? '#374151' : '#E5E7EB' 
            }, classFilter==='all' && { 
              backgroundColor: isDark ? '#10B981' : '#065F46', 
              borderWidth: 1, 
              borderColor: isDark ? '#34D399' : '#10B981' 
            }]} 
            onPress={()=>setClassFilter('all')}
          >
            <Text style={[styles.filterText, { color: isDark ? '#E5E7EB' : '#374151' }, classFilter==='all' && { color: '#FFFFFF' }]}>All classes</Text>
          </TouchableOpacity>
          {classes.map(c => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.filterBtn, { 
                backgroundColor: isDark ? '#374151' : '#E5E7EB' 
              }, classFilter===c.id && { 
                backgroundColor: isDark ? '#10B981' : '#065F46', 
                borderWidth: 1, 
                borderColor: isDark ? '#34D399' : '#10B981' 
              }]} 
              onPress={()=>setClassFilter(c.id)}
            >
              <Text style={[styles.filterText, { color: isDark ? '#E5E7EB' : '#374151' }, classFilter===c.id && { color: '#FFFFFF' }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>Students</Text>
        <TextInput
          placeholder="Search students"
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
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}> 
            <IconSymbol name="person.slash" size={28} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <Text style={[styles.emptyText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>No students found</Text>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
              <Text style={[styles.avatarText, { color: isDark ? '#34D399' : '#059669' }]}>
                {(item.first_name || '?').charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={[styles.sub, { color: isDark ? '#E5E7EB' : '#6B7280' }]}>
                {item.classes?.name || 'Unassigned'}
              </Text>
            </View>
            <TouchableOpacity style={styles.action} onPress={()=>router.push({ pathname: '/screens/student-view', params: { id: item.id } } as any)}>
              <IconSymbol name="chevron.right" size={16} color={isDark ? '#E5E7EB' : '#9CA3AF'} />
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

