import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { router } from 'expo-router';

export default function SettingsNewScreen() {
  const { colorScheme, setColorScheme } = useTheme();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    darkMode: colorScheme === 'dark',
  });

  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  // Sync dark mode setting when theme changes
  useEffect(() => {
    setSettings(prev => ({ ...prev, darkMode: isDark }));
  }, [isDark]);

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
  };

  const handleSendTestNotification = () => {
    Alert.alert('Test Notification', 'This is a test notification!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'left', 'right']}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Settings Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: palette.text }]}>Settings</Text>
          <Text style={[styles.pageSubtitle, { color: palette.textSecondary }]}>
            Customize your app experience
          </Text>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Notifications</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: palette.outline }]}>
            <View style={styles.settingInfo}>
              <IconSymbol name="bell" size={20} color={palette.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: palette.text }]}>
                  Receive notifications about important updates
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: palette.outline, true: palette.primary }}
              thumbColor={palette.background}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: 'transparent' }]}>
            <View style={styles.settingInfo}>
              <IconSymbol name="envelope" size={20} color={palette.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: palette.text }]}>
                  Receive email notifications for important events
                </Text>
              </View>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={(value) => updateSetting('emailNotifications', value)}
              trackColor={{ false: palette.outline, true: palette.primary }}
              thumbColor={palette.background}
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Appearance</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: 'transparent' }]}>
            <View style={styles.settingInfo}>
              <IconSymbol name={isDark ? 'sun.max' : 'moon'} size={20} color={palette.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: palette.text }]}>
                  Use dark theme for better visibility in low light
                </Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => {
                updateSetting('darkMode', value);
                setColorScheme(value ? 'dark' : 'light');
              }}
              trackColor={{ false: palette.outline, true: palette.primary }}
              thumbColor={palette.background}
            />
          </View>
        </View>

        {/* Admin Section */}
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Admin</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: palette.surface }]}
            onPress={handleSendTestNotification}
          >
            <IconSymbol name="paperplane" size={20} color={palette.success} />
            <Text style={[styles.actionButtonText, { color: palette.text }]}>
              Send test notification
            </Text>
            <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Account</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: palette.surface }]}
            onPress={handleSignOut}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={palette.error} />
            <Text style={[styles.actionButtonText, { color: palette.error }]}>
              Sign Out
            </Text>
            <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for safe area */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
});
