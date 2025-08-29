import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { router } from 'expo-router';

export default function AddChildScreen() {
  const { profile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !dob.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (!profile?.preschool_id || !profile?.id) {
      Alert.alert('Error', 'Your account is not fully set up yet.');
      return;
    }

    // Basic YYYY-MM-DD validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
      Alert.alert('Invalid date', 'Please use the YYYY-MM-DD format for date of birth.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .insert({
          preschool_id: profile.preschool_id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob.trim(),
          is_active: true,
          parent_id: profile.id,
        } as any);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to add child');
        return;
      }

      Alert.alert('Success', 'Child added successfully.');
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Add your child</Text>
        <Text style={styles.subtitle}>Provide basic details to register your child</Text>

        <TextInput placeholder="First Name" value={firstName} onChangeText={setFirstName} style={styles.input} />
        <TextInput placeholder="Last Name" value={lastName} onChangeText={setLastName} style={styles.input} />
        <TextInput placeholder="Date of Birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} style={styles.input} />

        <TouchableOpacity disabled={saving} onPress={handleSave} style={[styles.button, saving && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Add Child'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 12, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#A7F3D0' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 }
});
