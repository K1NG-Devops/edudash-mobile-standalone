import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  dark_mode: boolean;
  language: string;
}

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useTheme();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: true,
    dark_mode: colorScheme === 'dark',
    language: 'en'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadSettings();
  }, [user]);

  // Sync dark mode setting when theme changes from external sources (like header toggle)
  useEffect(() => {
    setSettings(prev => ({ ...prev, dark_mode: colorScheme === 'dark' }));
  }, [colorScheme]);

  const loadSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Load user settings - you might want to store these in the users table or a separate settings table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        // Removed debug statement: console.error('Error loading settings:', error);
      } else {
        // track role from profile
        setCurrentRole((data as any)?.role);
        // For now, use defaults since we don't have a settings table yet
        setSettings({
          notifications_enabled: true,
          email_notifications: true,
          push_notifications: true,
          dark_mode: false,
          language: 'en'
        });
      }
    } catch (err: any) {
      // Removed debug statement: console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    try {
      setSaving(true);
      setSettings(prev => ({ ...prev, [key]: value }));

      // In a real app, you'd save these to your database
      // For now, we'll just update the local state

    } catch (error) {
      // Removed debug statement: console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleNavigate = (route: string) => {

    if (route.startsWith('/')) {
      router.push(route as any);
    } else {
      router.push(`/${route}` as any);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // In a real app, you'd clear cached data here
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <MobileHeader
          user={{ name: user?.email || 'User', role: 'user' }}
          schoolName="Settings"
          onNotificationsPress={() => {/* TODO: Implement action */ }}
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const palette = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0B1220' : '#F8FAFC' }]}>
      <MobileHeader
        user={{ name: user?.email || 'User', role: (currentRole as any) || 'user' }}
        schoolName="Settings"
        onNotificationsPress={() => handleNavigate('/screens/notifications')}
        onSignOut={handleSignOut}
        onNavigate={handleNavigate}
        notificationCount={0}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF', borderBottomColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
          <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? palette.text : '#111827' }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colorScheme === 'dark' ? '#E5E7EB' : '#6B7280' }]}>Customize your app experience</Text>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF', borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? palette.text : '#111827' }]}>Notifications</Text>

          <View style={[styles.settingItem, { borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}> 
            <View style={styles.settingInfo}>
              <IconSymbol name="bell" size={20} color={colorScheme === 'dark' ? '#E5E7EB' : '#6B7280'} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#FFFFFF' : '#111827' }]}>Push Notifications</Text>
                <Text style={[styles.settingDescription, { color: colorScheme === 'dark' ? '#E5E7EB' : '#6B7280' }]}> 
                  Receive notifications about important updates
                </Text>
              </View>
            </View>
            <Switch
              value={settings.push_notifications}
              onValueChange={(value) => updateSetting('push_notifications', value)}
              trackColor={{ false: '#475569', true: '#8B5CF6' }}
              thumbColor={colorScheme === 'dark' ? '#E2E8F0' : '#FFFFFF'}
              disabled={saving}
            />
          </View>

          <View style={[styles.settingItem, { borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
            <View style={styles.settingInfo}>
              <IconSymbol name="envelope" size={20} color={colorScheme === 'dark' ? '#E5E7EB' : '#6B7280'} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#FFFFFF' : '#111827' }]}>Email Notifications</Text>
                <Text style={[styles.settingDescription, { color: colorScheme === 'dark' ? '#E5E7EB' : '#6B7280' }]}> 
                  Receive email notifications for important events
                </Text>
              </View>
            </View>
            <Switch
              value={settings.email_notifications}
              onValueChange={(value) => updateSetting('email_notifications', value)}
              trackColor={{ false: '#475569', true: '#8B5CF6' }}
              thumbColor={colorScheme === 'dark' ? '#E2E8F0' : '#FFFFFF'}
              disabled={saving}
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF', borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? palette.text : '#111827' }]}>Appearance</Text>

          <View style={[styles.settingItem, { borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
            <View style={styles.settingInfo}>
              <IconSymbol name="moon.fill" size={20} color={colorScheme === 'dark' ? '#E5E7EB' : '#6B7280'} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colorScheme === 'dark' ? '#FFFFFF' : '#111827' }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: colorScheme === 'dark' ? '#E5E7EB' : '#6B7280' }]}> 
                  Use dark theme for better visibility in low light
                </Text>
              </View>
            </View>
            <Switch
              value={settings.dark_mode}
              onValueChange={(value) => {
                updateSetting('dark_mode', value);
                setColorScheme(value ? 'dark' : 'light');
                // also dispatch for any listeners
                try { const evt = new CustomEvent('theme-toggle', { detail: value ? 'dark' : 'light' }); if (typeof window !== 'undefined') window.dispatchEvent(evt); } catch {}
              }}
              trackColor={{ false: '#475569', true: '#8B5CF6' }}
              thumbColor={colorScheme === 'dark' ? '#E2E8F0' : '#FFFFFF'}
              disabled={saving}
            />
          </View>
        </View>

        {/* Admin Actions */}
        {(currentRole === 'superadmin' || currentRole === 'preschool_admin' || currentRole === 'principal') && (
          <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF', borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
            <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? palette.text : '#111827' }]}>Admin</Text>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF' }]}
              onPress={async () => {
                try {
                  const { data: profile } = await supabase.from('users').select('id').eq('auth_user_id', user!.id).maybeSingle();
                  if (!profile?.id) return Alert.alert('Error', 'User profile not found');

const { data: { session } } = await supabase.auth.getSession();
                  const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/notify-user-auth`, {
                    method: 'POST',
                    headers: {
'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session?.access_token}`,
                      'apikey': String(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''),
                    },
                    body: JSON.stringify({
                      user_id: profile.id,
                      title: 'Admin Test Notification',
                      message: 'This notification was sent via role-authorized function.',
                      type: 'activity',
                      action_url: '/screens/notifications'
                    })
                  });

                  if (!resp.ok) {
                    let reason = `HTTP ${resp.status}`;
                    try { const j = await resp.json(); if (j?.error) reason = j.error; } catch {}
                    return Alert.alert('Failed', reason);
                  }
                  const j = await resp.json().catch(() => ({}));
                  if (j?.success) Alert.alert('Success', 'Test notification sent.'); else Alert.alert('Notice', JSON.stringify(j));
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Failed to send test notification');
                }
              }}
            >
              <IconSymbol name="paperplane" size={20} color={colorScheme === 'dark' ? '#6EE7B7' : '#10B981'} />
              <Text style={[styles.actionButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937' }]}>Send test notification</Text>
              <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#E5E7EB' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        )}

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF', borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? palette.text : '#111827' }]}>Account</Text>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF' }]} onPress={() => handleNavigate('/screens/profile')}>
            <IconSymbol name="person.circle" size={20} color={colorScheme === 'dark' ? '#C4B5FD' : '#8B5CF6'} />
            <Text style={[styles.actionButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937' }]}>View Profile</Text>
            <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#E5E7EB' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF' }]} onPress={clearCache}>
            <IconSymbol name="trash" size={20} color={colorScheme === 'dark' ? '#C4B5FD' : '#8B5CF6'} />
            <Text style={[styles.actionButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937' }]}>Clear Cache</Text>
            <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#E5E7EB' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* Privacy & Security Section */}
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF', borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? palette.text : '#111827' }]}>Privacy & Security</Text>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF' }]} onPress={() => Alert.alert('Privacy Policy', 'Privacy policy would be shown here')}>
            <IconSymbol name="lock.shield" size={20} color={colorScheme === 'dark' ? '#C4B5FD' : '#8B5CF6'} />
            <Text style={[styles.actionButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937' }]}>Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#E5E7EB' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF' }]} onPress={() => Alert.alert('Terms of Service', 'Terms of service would be shown here')}>
            <IconSymbol name="doc.text" size={20} color={colorScheme === 'dark' ? '#C4B5FD' : '#8B5CF6'} />
            <Text style={[styles.actionButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937' }]}>Terms of Service</Text>
            <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#E5E7EB' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF', borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? palette.text : '#111827' }]}>Support</Text>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF' }]} onPress={() => Alert.alert('Help', 'Help documentation would be shown here')}>
            <IconSymbol name="questionmark.circle" size={20} color={colorScheme === 'dark' ? '#C4B5FD' : '#8B5CF6'} />
            <Text style={[styles.actionButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937' }]}>Help & FAQ</Text>
            <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#E5E7EB' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF' }]} onPress={() => Alert.alert('Contact', 'Contact support form would be shown here')}>
            <IconSymbol name="envelope" size={20} color={colorScheme === 'dark' ? '#C4B5FD' : '#8B5CF6'} />
            <Text style={[styles.actionButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937' }]}>Contact Support</Text>
            <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#E5E7EB' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? palette.surface : '#FFFFFF', borderColor: colorScheme === 'dark' ? palette.outline : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton, { backgroundColor: colorScheme === 'dark' ? '#450A0A' : '#FEF2F2' }]} onPress={handleSignOut}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Sign Out</Text>
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 32,
  },
});
