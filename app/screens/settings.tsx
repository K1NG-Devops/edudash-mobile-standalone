import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
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
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: true,
    dark_mode: false,
    language: 'en'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

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

  return (
    <SafeAreaView style={styles.container}>
      <MobileHeader
        user={{ name: user?.email || 'User', role: 'user' }}
        schoolName="Settings"
        onNotificationsPress={() => handleNavigate('/screens/notifications')}
        onSignOut={handleSignOut}
        onNavigate={handleNavigate}
        notificationCount={0}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your app experience</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="bell" size={20} color="#6B7280" />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications about important updates
                </Text>
              </View>
            </View>
            <Switch
              value={settings.push_notifications}
              onValueChange={(value) => updateSetting('push_notifications', value)}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor="#FFFFFF"
              disabled={saving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="envelope" size={20} color="#6B7280" />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive email notifications for important events
                </Text>
              </View>
            </View>
            <Switch
              value={settings.email_notifications}
              onValueChange={(value) => updateSetting('email_notifications', value)}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor="#FFFFFF"
              disabled={saving}
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="moon.fill" size={20} color="#6B7280" />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Use dark theme for better visibility in low light
                </Text>
              </View>
            </View>
            <Switch
              value={settings.dark_mode}
              onValueChange={(value) => updateSetting('dark_mode', value)}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor="#FFFFFF"
              disabled={saving}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigate('/screens/profile')}>
            <IconSymbol name="person.circle" size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>View Profile</Text>
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
            <IconSymbol name="trash" size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Privacy Policy', 'Privacy policy would be shown here')}>
            <IconSymbol name="lock.shield" size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Terms of Service', 'Terms of service would be shown here')}>
            <IconSymbol name="doc.text" size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Terms of Service</Text>
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Help', 'Help documentation would be shown here')}>
            <IconSymbol name="questionmark.circle" size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Help & FAQ</Text>
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Contact', 'Contact support form would be shown here')}>
            <IconSymbol name="envelope" size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Contact Support</Text>
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleSignOut}>
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
