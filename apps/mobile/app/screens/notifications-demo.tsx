// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Configure foreground behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

async function registerForPushAsync(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Expo push token (works in managed/bare with expo installed). For production apps, configure FCM/APNs per platform.
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

async function sendLocalNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Demo notification',
      body: 'This is a local test notification from the app.',
      data: { type: 'demo' },
    },
    trigger: null,
  });
}

export default function NotificationsDemo() {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleRegister = async () => {
    try {
      setLoading(true);
      setStatusText('Requesting permission…');
      const t = await registerForPushAsync();
      if (!t) {
        setStatusText('Permission not granted.');
      } else {
        setToken(t);
        setStatusText('Permission granted.');
      }
    } catch (e: any) {
      setStatusText(e?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleLocal = async () => {
    setStatusText('Sending local notification…');
    await sendLocalNotification();
    setStatusText('Local notification triggered.');
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={[styles.header, { borderBottomColor: palette.outline }]}>
        <View style={styles.headerLeft}>
          <IconSymbol name="bell.fill" size={22} color="#8B5CF6" />
          <Text style={[styles.headerTitle, { color: palette.text }]}>Notifications Demo</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Status</Text>
          <Text style={[styles.value, { color: palette.text }]}>{statusText || '—'}</Text>

          <Text style={[styles.label, { color: palette.textSecondary, marginTop: 12 }]}>Expo Push Token (non-secret)</Text>
          <Text selectable style={[styles.tokenBox, { color: palette.text, borderColor: palette.outline, backgroundColor: palette.background }]}>
            {token || 'Not registered'}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#8B5CF6', opacity: loading ? 0.6 : 1 }]} disabled={loading} onPress={handleRegister}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Request Permission & Token</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]} onPress={handleLocal}>
              <Text style={styles.buttonText}>Send Local Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  content: { padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16 },
  label: { fontSize: 12 },
  value: { fontSize: 14, marginTop: 4 },
  tokenBox: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 4, fontSize: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700' },
});

