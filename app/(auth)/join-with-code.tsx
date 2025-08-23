import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function JoinWithCodeScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  // Cross-platform alert helper (Alert on native, window.alert on web)
  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    // Prefill code if provided via deep link or query param
    const incoming = (params?.code as string) || '';
    if (incoming) setCode(String(incoming));
  }, [params?.code]);

  useEffect(() => {
    // Also handle app-wide deep links that include ?code=XYZ
    const subscription = Linking.addEventListener('url', ({ url }) => {
      try {
        const parsed = Linking.parse(url);
        const incomingCode = (parsed.queryParams?.code as string) || '';
        if (incomingCode) setCode(String(incomingCode));
      } catch { }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Detect existing session (common on web if current user is signed in)
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null);
    }).catch(() => setSessionEmail(null));
  }, []);

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim() || !email.trim() || !password.trim()) {
      notify('Missing info', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const emailLower = email.trim().toLowerCase();

      // If a different user is signed in (common on web), sign out first
      if (sessionEmail && sessionEmail.toLowerCase() !== emailLower) {
        await supabase.auth.signOut();
      }

      // Redeem invitation code. Server will create/confirm the auth user and profile
      const { data, error } = await supabase.functions.invoke('redeem-invitation', {
        body: { code: code.trim(), name: name.trim(), email: emailLower, password },
      });

      if (error) {
        // Try to decode JSON error message from Edge Function
        let detail = error.message;
        try {
          const parsed = JSON.parse(detail || '{}');
          detail = parsed?.error || parsed?.message || detail;
        } catch { }
        notify('Invalid code', detail || 'The invitation code is invalid or expired.');
        return;
      }

      if (!data?.success) {
        notify('Error', data?.error || 'Unable to redeem invitation code.');
        return;
      }

      const role = data.role as string;
      if (role === 'teacher') {
        notify('Welcome', 'Your teacher account is ready. Please sign in.');
        router.replace('/' as Href);
      } else if (role === 'parent') {
        notify('Welcome', 'Your parent account is ready. Let’s add your child next.');
        router.replace('/screens/add-child' as Href);
      } else {
        notify('Welcome', 'Your account is ready. Please sign in.');
        router.replace('/' as Href);
      }
    } catch (e: any) {
      notify('Error', e?.message || 'Unexpected error occurred.');
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
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  secondaryButton: { backgroundColor: '#E5E7EB', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  secondaryButtonText: { color: '#111827', fontWeight: '600', fontSize: 14 },
});
