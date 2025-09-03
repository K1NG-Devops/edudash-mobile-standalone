import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ConversationService } from '@/lib/services/conversationService';

export default function NewCommunityScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adminsOnly, setAdminsOnly] = useState(true);
  const [locked, setLocked] = useState(false);
  const [allowMemberPosting, setAllowMemberPosting] = useState(true);
  const [creating, setCreating] = useState(false);

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [preschoolId, setPreschoolId] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || null;
      setAuthUserId(uid);
      if (uid) {
        const { data } = await supabase
          .from('users')
          .select('preschool_id')
          .eq('auth_user_id', uid)
          .maybeSingle();
        if (data?.preschool_id) setPreschoolId(data.preschool_id);
      }
    };
    bootstrap();
  }, []);

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a community name.');
      return;
    }
    if (!authUserId || !preschoolId) {
      Alert.alert('Not ready', 'Please wait while we load your profile.');
      return;
    }

    try {
      setCreating(true);
      const res = await ConversationService.createCommunity({
        authUserId,
        preschoolId,
        name: name.trim(),
        description: description.trim() || undefined,
        adminsOnly,
        locked,
        allowMemberPosting,
      });
      if (res.error) throw new Error(res.error);
      Alert.alert('Community created', 'Your community has been created.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create community');
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Text style={styles.headerBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Community</Text>
        <TouchableOpacity style={[styles.headerBtn, (!name.trim() || creating) && styles.headerBtnDisabled]} onPress={onCreate} disabled={!name.trim() || creating}>
          <Text style={[styles.headerBtnText, (!name.trim() || creating) && styles.headerBtnTextDisabled]}>{creating ? 'Creating...' : 'Create'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Community name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hillside Preschool Community"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the purpose of this community"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Controls</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchTitle}>Only admins can send messages</Text>
            <Text style={styles.switchSub}>Members can read but not post</Text>
          </View>
          <Switch value={adminsOnly} onValueChange={setAdminsOnly} />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchTitle}>Lock conversation</Text>
            <Text style={styles.switchSub}>Temporarily pause all posting</Text>
          </View>
          <Switch value={locked} onValueChange={setLocked} />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchTitle}>Allow member posting</Text>
            <Text style={styles.switchSub}>Let non-admins start conversations</Text>
          </View>
          <Switch value={allowMemberPosting} onValueChange={setAllowMemberPosting} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#334155'
  },
  headerBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1F2937' },
  headerBtnDisabled: { backgroundColor: '#374151' },
  headerBtnText: { color: '#E5E7EB', fontWeight: '600' },
  headerBtnTextDisabled: { color: '#9CA3AF' },
  title: { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  formGroup: { marginBottom: 16 },
  label: { color: '#CBD5E1', fontSize: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#0B1220', borderWidth: 1, borderColor: '#334155', color: '#F1F5F9',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  sectionTitleRow: { marginTop: 12, marginBottom: 8 },
  sectionTitle: { color: '#E5E7EB', fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  switchTextWrap: { flex: 1, paddingRight: 12 },
  switchTitle: { color: '#F1F5F9', fontWeight: '600' },
  switchSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
});

