import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';

export default function JoinWithCodeScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prefill code if provided via deep link or query param
    const incoming = (params?.code as string) || '';
    if (incoming) setCode(String(incoming));
  }, [params?.code]);

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-invitation', {
        body: { code: code.trim(), name: name.trim(), email: email.trim().toLowerCase(), password }
      });

      if (error) {
        Alert.alert('Invalid code', error.message || 'The invitation code is invalid or expired.');
        return;
      }

      if (!data?.success) {
        Alert.alert('Error', data?.error || 'Unable to redeem invitation code.');
        return;
      }

      const role = data.role as string;
      if (role === 'teacher') {
        Alert.alert('Welcome', 'Your teacher account is ready. Please sign in.');
        router.replace('/');
      } else if (role === 'parent') {
        Alert.alert('Welcome', 'Your parent account is ready. Let’s add your child next.');
        router.replace('/screens/add-child');
      } else {
        Alert.alert('Welcome', 'Your account is ready. Please sign in.');
        router.replace('/');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Join with Code</Text>
        <Text style={styles.subtitle}>Enter your invitation details below</Text>

        <TextInput placeholder="Invitation Code" value={code} onChangeText={setCode} style={styles.input} autoCapitalize="characters" />
        <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

        <TouchableOpacity disabled={loading} onPress={handleSubmit} style={[styles.button, loading && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join'}</Text>
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
  button: { backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#A5B4FC' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 }
});
