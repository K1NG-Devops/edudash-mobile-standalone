import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { TeacherService } from '@/lib/services/teacherService';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TeacherManagement } from '@/components/admin/TeacherManagement';

interface TeacherRow { id: string; name: string; email?: string | null; avatar_url?: string | null; is_active?: boolean; }

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
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(null);
  const schoolId = profile?.preschool_id || resolvedSchoolId || null;

  useEffect(() => {
    const inferSchoolId = async () => {
      if (profile?.preschool_id || !profile?.id) return;
      try {
        const { data: tInvite } = await supabase
          .from('teacher_invitations')
          .select('preschool_id, created_at')
          .eq('invited_by', profile.id)
          .not('preschool_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (tInvite?.preschool_id) { setResolvedSchoolId(tInvite.preschool_id as string); return; }
        const { data: inviteCode } = await supabase
          .from('invitation_codes')
          .select('preschool_id, created_at, is_active')
          .eq('invited_by', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (inviteCode?.preschool_id) { setResolvedSchoolId(inviteCode.preschool_id as string); return; }
        const { data: schoolCode } = await supabase
          .from('school_invitation_codes')
          .select('preschool_id, created_at, is_active')
          .eq('invited_by', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (schoolCode?.preschool_id) { setResolvedSchoolId(schoolCode.preschool_id as string); return; }
      } catch {}
    };
    inferSchoolId();
  }, [profile?.preschool_id, profile?.id]);

  const load = async () => {
    if (!schoolId) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);

      // Use service for consistent fallbacks (invited teachers by email)
      const result = await TeacherService.getTeachersByPreschool(schoolId);
      let data = result.data || [];

      // Apply status filter client-side (service always returns all teacher rows for school)
      if (status !== 'all') {
        data = data.filter((t: any) => Boolean(t.is_active) === (status === 'active'));
      }

      const rows = (data || []).map((t: any) => ({ id: t.id, name: t.name, email: t.email, avatar_url: (t as any).avatar_url || null, is_active: t.is_active }));
      setItems(rows);
    } catch (err) {
      console.error('❌ Exception in teachers load function:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [schoolId, status]);

  const filtered = items.filter(t => (t.name || '').toLowerCase().includes(q.toLowerCase()));

  const viewerSchoolId = profile?.preschool_id || null;
  const mismatch = Boolean(viewerSchoolId && schoolId && viewerSchoolId !== schoolId);

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

      {/* Context banner */}
      {(schoolId || viewerSchoolId) && (
        <View 
          style={[
            styles.contextBar,
            mismatch
              ? { backgroundColor: isDark ? '#451a0a' : '#FEF2F2', borderColor: isDark ? '#9a3412' : '#FECACA' }
              : { backgroundColor: isDark ? '#0F172A' : '#EFF6FF', borderColor: isDark ? '#334155' : '#BFDBFE' }
          ]}
        >
          <IconSymbol name="info.circle" size={16} color={mismatch ? (isDark ? '#FDBA74' : '#DC2626') : (isDark ? '#93C5FD' : '#3B82F6')} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contextText, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>Current school: {schoolId || '—'}</Text>
            <Text style={[styles.contextText, { color: isDark ? '#CBD5E1' : '#374151' }]}>Your profile: {viewerSchoolId || '—'}</Text>
            {mismatch && (
              <Text style={[styles.contextText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>Mismatch detected – link your profile to access full data.</Text>
            )}
          </View>
          {mismatch && schoolId && (
            <TouchableOpacity
              style={[styles.contextBtn, { borderColor: isDark ? '#334155' : '#D1D5DB' }]}
              onPress={async () => {
                try {
                  await supabase.from('users').update({ preschool_id: schoolId }).eq('id', profile!.id);
                  setRefreshing(true);
                  await load();
                } catch {}
                setRefreshing(false);
              }}
            >
              <IconSymbol name="link" size={14} color={isDark ? '#FFFFFF' : '#111827'} />
              <Text style={[styles.contextBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Link</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {/* Notices when no school link */}
      {!schoolId && (
        <View style={[styles.notice, { backgroundColor: isDark ? '#0F172A' : '#FEF3C7', borderColor: isDark ? '#334155' : '#FDE68A' }]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={16} color={isDark ? '#FCD34D' : '#CA8A04'} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.noticeText, { color: isDark ? '#E5E7EB' : '#7C2D12' }]}>Your profile isn’t linked to a school. Link it to view teachers.</Text>
          </View>
        </View>
      )}

      <FlashList
        data={filtered}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={styles.list}
        estimatedItemSize={72}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <IconSymbol name="person.slash" size={28} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <Text style={[styles.emptyText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>No teachers found</Text>
            {schoolId && (
              <>
                {!profile?.preschool_id && (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: isDark ? '#334155' : '#D1D5DB', marginTop: 10 }]}
                    onPress={async () => {
                      try {
                        await supabase.from('users').update({ preschool_id: schoolId }).eq('id', profile!.id);
                        setRefreshing(true);
                        await load();
                      } catch (e: any) {
                        // ignore
                      } finally {
                        setRefreshing(false);
                      }
                    }}
                  >
                    <IconSymbol name="link" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
                    <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Link profile to school</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: isDark ? '#334155' : '#D1D5DB', marginTop: 10 }]}
                  onPress={() => setShowInvite(true)}
                >
                  <IconSymbol name="person.badge.plus" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
                  <Text style={[styles.secondaryBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>Invite teachers</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                <Text style={[styles.avatarText, { color: isDark ? '#34D399' : '#059669' }]}>
                  {(item.name || '?').charAt(0)}
                </Text>
              </View>
            )}
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
  avatarImage: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  avatarText: { color: '#059669', fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280' },
  action: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 8, color: '#9CA3AF' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginHorizontal: 16, marginBottom: 8 },
  noticeText: { fontSize: 12 },
  secondaryBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'center' },
  secondaryBtnText: { fontWeight: '700' },
  contextBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1, borderRadius: 8, marginHorizontal: 16, marginBottom: 8 },
  contextText: { fontSize: 12 },
  contextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  contextBtnText: { fontSize: 12, fontWeight: '700' },
});
