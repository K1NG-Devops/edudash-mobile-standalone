import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { router } from 'expo-router';

interface Contact { id: string; name: string; role: string; email?: string; class_name?: string; avatar_url?: string; }

export default function NewBroadcastScreen() {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const { profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, Contact>>({});
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!profile?.preschool_id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_messaging_contacts', {
          p_include_staff: true,
          p_include_parents: true,
          p_limit: 500,
        });
        if (error) throw error;
        const mapped: Contact[] = (data || []).map((row: any) => ({
          id: row.id, name: row.name || 'Unknown', role: row.role, email: row.email || undefined, class_name: row.class_name || undefined, avatar_url: row.avatar_url || undefined,
        }));
        setContacts(mapped);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.preschool_id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(c => (c.name?.toLowerCase().includes(q)) || (c.email?.toLowerCase().includes(q)));
  }, [contacts, search]);

  const toggle = (c: Contact) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[c.id]) delete next[c.id]; else next[c.id] = c;
      return next;
    });
  };

  const send = async () => {
    const ids = Object.keys(selected);
    if (ids.length === 0) return Alert.alert('Select recipients', 'Choose at least one contact.');
    if (!message.trim()) return Alert.alert('Type a message', 'Enter a message to send.');
    if (!profile) return;

    try {
      setSending(true);
      const tasks = ids.map(async id => {
        const { error } = await supabase.rpc('send_direct_message', {
          p_recipient_user_id: id,
          p_content: message.trim(),
          p_subject: '',
          p_message_type: 'direct',
        });
        if (error) throw error;
      });
      await Promise.allSettled(tasks);
      Alert.alert('Broadcast sent', `Sent to ${ids.length} recipient(s).`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Some messages may have failed');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: Contact }) => {
    const isSelected = !!selected[item.id];
    return (
      <TouchableOpacity
        style={[
          styles.row,
          { borderBottomColor: palette.outline },
          isSelected ? (colorScheme === 'dark' ? styles.rowSelectedDark : styles.rowSelectedLight) : { backgroundColor: palette.surface }
        ]}
        onPress={() => toggle(item)}
      >
        <View style={[styles.avatar, colorScheme === 'dark' ? styles.avatarBgDark : styles.avatarBgLight ]}>
          <Text style={colorScheme === 'dark' ? styles.avatarTextDark : styles.avatarTextLight}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex1}>
          <Text style={[styles.name, { color: palette.text }]}>{item.name}</Text>
          <Text style={[styles.caption, { color: palette.textSecondary }]}>{item.role === 'teacher' ? 'Teacher' : (item.role === 'parent' ? 'Parent' : 'Staff')}{item.class_name ? ` • ${item.class_name}` : ''}</Text>
        </View>
        {isSelected ? <IconSymbol name="checkmark.circle.fill" size={18} color="#10B981" /> : <View style={styles.w18} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top','left','right']}>
      <View style={[styles.header, { borderBottomColor: palette.outline, backgroundColor: palette.surface }] }>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <IconSymbol name="xmark" size={18} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>New broadcast</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.screenPaddingTop}>
        <View style={[styles.searchBar, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <IconSymbol name="magnifyingglass" size={16} color={palette.textSecondary} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search contacts..." placeholderTextColor={palette.textSecondary} style={[styles.flex1Ml8, { color: palette.text }]} />
        </View>
        <Text style={[styles.caption, { color: palette.textSecondary }]}>Selected: {Object.keys(selected).length}</Text>
      </View>

      <View style={styles.flex1}>
        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <FlatList data={filtered} renderItem={renderItem} keyExtractor={(i) => i.id} />
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.footerContainer, { borderTopColor: palette.outline, backgroundColor: palette.surface }]}>
          <TextInput
            style={[styles.messageInput, { borderColor: palette.outline, color: palette.text }]}
            placeholder="Type a message..."
            placeholderTextColor={palette.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: palette.primary }, (Object.keys(selected).length === 0 || !message.trim() || sending) && styles.dimmed]}
            disabled={Object.keys(selected).length === 0 || !message.trim() || sending}
            onPress={send}
          >
            {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.sendBtnText}>Send broadcast</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  headerBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  name: { fontSize: 16, fontWeight: '600' },
  // Utilities & UI
  screenPaddingTop: { paddingHorizontal: 16, paddingTop: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  flex1Ml8: { flex: 1, marginLeft: 8 },
  caption: { fontSize: 12, marginTop: 8 },
  flex1: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footerContainer: { padding: 16, borderTopWidth: 1 },
  messageInput: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  sendBtn: { marginTop: 12, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dimmed: { opacity: 0.6 },
  sendBtnText: { color: '#FFF', fontWeight: '600' },
  rowSelectedDark: { backgroundColor: 'rgba(59,130,246,0.15)' },
  rowSelectedLight: { backgroundColor: '#EBF4FF' },
  avatarBgDark: { backgroundColor: '#334155' },
  avatarBgLight: { backgroundColor: '#E5E7EB' },
  avatarTextDark: { color: '#CBD5E1', fontWeight: '700' },
  avatarTextLight: { color: '#6B7280', fontWeight: '700' },
  w18: { width: 18 },
});
