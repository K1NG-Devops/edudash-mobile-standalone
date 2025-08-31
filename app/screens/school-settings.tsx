import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useNavigationVisibility } from '@/contexts/NavigationContext';

interface SchoolForm {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function SchoolSettingsScreen() {
  const { profile } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  
  // Hide bottom navigation for this settings screen
  useNavigationVisibility(true);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SchoolForm>({ name: '', email: '', phone: '', address: '' });

  const canEdit = useMemo(() => {
    const role = String(profile?.role || '');
    return role === 'preschool_admin' || role === 'principal' || role === 'superadmin';
  }, [profile?.role]);

  useEffect(() => {
    const load = async () => {
      if (!profile?.preschool_id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('preschools')
          .select('id, name, email, phone, address')
          .eq('id', profile.preschool_id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setForm({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
          });
        }
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to load school info');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.preschool_id]);

  const updateField = (k: keyof SchoolForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!profile?.preschool_id) return;
    if (!canEdit) {
      Alert.alert('Blocked', 'You do not have permission to edit school settings');
      return;
    }
    setLoading(true);
    try {
      const payload: Partial<SchoolForm> = {
        name: form.name?.trim(),
        email: form.email?.trim(),
        phone: form.phone?.trim(),
        address: form.address?.trim(),
      };
      const { error } = await supabase
        .from('preschools')
        .update(payload)
        .eq('id', profile.preschool_id);
      if (error) throw error;
      Alert.alert('Saved', 'School settings updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]} edges={['bottom','left','right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>School Settings</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Update your school's basic information. These details appear across staff and parent experiences.</Text>

        {!canEdit && (
          <View style={[styles.notice, { backgroundColor: isDark ? '#111827' : '#FEF3C7', borderColor: isDark ? '#334155' : '#FDE68A' }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={18} color={isDark ? '#FCD34D' : '#CA8A04'} />
            <Text style={[styles.noticeText, { color: isDark ? '#E5E7EB' : '#7C2D12' }]}>You have read-only access. Contact your principal for edit access.</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E5E7EB' }]}>
          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#374151' }]}>School Name</Text>
          <TextInput
            value={form.name}
            onChangeText={(t) => updateField('name', t)}
            placeholder="e.g. Sunshine Preschool"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}
            editable={canEdit && !loading}
          />

          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#374151' }]}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(t) => updateField('email', t)}
            placeholder="school@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}
            editable={canEdit && !loading}
          />

          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#374151' }]}>Phone</Text>
          <TextInput
            value={form.phone}
            onChangeText={(t) => updateField('phone', t)}
            placeholder="e.g. +1 555 123 4567"
            keyboardType={Platform.select({ ios: 'numbers-and-punctuation', android: 'phone-pad', default: 'default' })}
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}
            editable={canEdit && !loading}
          />

          <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#374151' }]}>Address</Text>
          <TextInput
            value={form.address}
            onChangeText={(t) => updateField('address', t)}
            placeholder="Street, City, ZIP"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            style={[styles.input, styles.multiline, { color: isDark ? '#FFFFFF' : '#111827', borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#0B1220' : '#FFFFFF' }]}
            editable={canEdit && !loading}
            multiline
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, (!canEdit || loading) && styles.primaryBtnDisabled]}
            onPress={save}
            disabled={!canEdit || loading}
          >
            <IconSymbol name="checkmark.seal.fill" size={16} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>{loading ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 64 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12 },
  label: { fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  primaryBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  noticeText: { flex: 1, fontSize: 12 },
});

