import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    Appearance,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface SettingsScreenProps {
  profile?: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ profile }) => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    biometricAuth: false,
    autoBackup: true,
    soundEffects: true,
    hapticFeedback: true,
    autoLock: false,
    dataUsage: 'wifi',
    cacheSize: '128MB',
    language: 'English',
  });

  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    buildNumber: '100',
    lastUpdate: new Date().toISOString(),
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  };

  const updateSetting = (key: string, value: any) => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    rightElement?: React.ReactNode,
    isDangerous?: boolean
  ) => (
    <TouchableOpacity 
      style={[
        styles(theme).settingItem,
        isDangerous && styles(theme).dangerousItem
      ]} 
      onPress={() => {
        if (settings.hapticFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
    >
      <View style={[styles(theme).settingIcon, isDangerous && styles(theme).dangerousIcon]}>
        <IconSymbol 
          name={icon as any} 
          size={20} 
          color={isDangerous ? '#EF4444' : '#3B82F6'} 
        />
      </View>
      <View style={styles(theme).settingContent}>
        <Text style={[styles(theme).settingTitle, isDangerous && styles(theme).dangerousText]}>
          {title}
        </Text>
        <Text style={styles(theme).settingSubtitle}>{subtitle}</Text>
      </View>
      {rightElement || <IconSymbol name="chevron.right" size={16} color={theme.colors.textSecondary} />}
    </TouchableOpacity>
  );

  const renderSwitchItem = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    settingKey?: string
  ) => (
    <View style={styles(theme).settingItem}>
      <View style={styles(theme).settingIcon}>
        <IconSymbol name={icon as any} size={20} color="#3B82F6" />
      </View>
      <View style={styles(theme).settingContent}>
        <Text style={styles(theme).settingTitle}>{title}</Text>
        <Text style={styles(theme).settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => {
          onValueChange(newValue);
          if (settingKey) {
            updateSetting(settingKey, newValue);
          }
        }}
        trackColor={{ 
          false: theme.isDark ? '#374151' : '#F3F4F6', 
          true: theme.isDark ? '#1E40AF' : '#DBEAFE' 
        }}
        thumbColor={value ? '#3B82F6' : (theme.isDark ? '#6B7280' : '#9CA3AF')}
        ios_backgroundColor={theme.isDark ? '#374151' : '#F3F4F6'}
      />
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <Text style={styles(theme).sectionHeader}>{title}</Text>
  );

  const renderValueItem = (
    title: string,
    subtitle: string,
    icon: string,
    value: string,
    onPress: () => void
  ) => (
    <TouchableOpacity 
      style={styles(theme).settingItem} 
      onPress={() => {
        if (settings.hapticFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
    >
      <View style={styles(theme).settingIcon}>
        <IconSymbol name={icon as any} size={20} color="#3B82F6" />
      </View>
      <View style={styles(theme).settingContent}>
        <Text style={styles(theme).settingTitle}>{title}</Text>
        <Text style={styles(theme).settingSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles(theme).valueContainer}>
        <Text style={styles(theme).valueText}>{value}</Text>
        <IconSymbol name="chevron.right" size={16} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const handleProfilePress = () => {
    router.push('/screens/profile' as any);
  };

  const handleNotificationsPress = () => {
    Alert.alert('Notifications', 'Advanced notification settings coming soon!');
  };

  const handlePrivacyPress = () => {
    router.push('/legal/privacy-policy' as any);
  };

  const handleTermsPress = () => {
    router.push('/legal/terms-of-service' as any);
  };

  const handleSecurityPress = () => {
    Alert.alert('Security', 'Password change coming soon!');
  };

  const handleLanguagePress = () => {
    Alert.alert(
      'Language',
      'Choose your preferred language',
      [
        { text: 'English', onPress: () => updateSetting('language', 'English') },
        { text: 'Spanish', onPress: () => updateSetting('language', 'Spanish') },
        { text: 'French', onPress: () => updateSetting('language', 'French') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDataUsagePress = () => {
    Alert.alert(
      'Data Usage',
      'Choose when to download content',
      [
        { text: 'Wi-Fi Only', onPress: () => updateSetting('dataUsage', 'wifi') },
        { text: 'Wi-Fi + Cellular', onPress: () => updateSetting('dataUsage', 'both') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleClearCachePress = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and may improve app performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Cache', 
          onPress: () => {
            // Simulate cache clearing
            setTimeout(() => {
              setAppInfo({ ...appInfo });
              Alert.alert('Success', 'Cache cleared successfully!');
            }, 1000);
          }
        },
      ]
    );
  };

  const handleHelpPress = () => {
    Linking.openURL('mailto:support@edudash.com?subject=EduDash%20Support');
  };

  const handleAboutPress = () => {
    const roleCapabilities = getRoleSpecificCapabilities(profile?.role);
    Alert.alert(
      'About EduDash Pro',
      `Version: ${appInfo.version} (${appInfo.buildNumber})\n\nRole: ${profile?.role?.toUpperCase() || 'USER'}\nCapabilities: ${roleCapabilities.join(', ')}\n\nEducational management platform for modern schools.`,
      [{ text: 'OK' }]
    );
  };

  const handleSignOutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            if (settings.hapticFeedback) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
            // Handle sign out logic here
            router.replace('/auth/login' as any);
          }
        },
      ]
    );
  };

  const getRoleSpecificCapabilities = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'principal':
        return ['School Management', 'Analytics', 'Staff Oversight', 'Student Records'];
      case 'teacher':
        return ['Lesson Planning', 'Student Grading', 'Class Management', 'AI Assistant'];
      case 'parent':
        return ['Child Progress', 'Communication', 'Activities', 'Scheduling'];
      default:
        return ['Basic Access'];
    }
  };

  const getRoleSpecificSettings = () => {
    const role = profile?.role?.toLowerCase();
    const roleSettings = [];

    if (role === 'teacher') {
      roleSettings.push(
        renderSettingItem(
          'AI Lesson Assistant',
          'Configure AI-powered lesson generation',
          'lightbulb',
          () => router.push('/screens/ai/settings' as any)
        ),
        renderSettingItem(
          'Grading Preferences',
          'Set up automated grading options',
          'doc.badge.plus',
          () => Alert.alert('Grading', 'Grading preferences coming soon!')
        )
      );
    }

    if (role === 'principal') {
      roleSettings.push(
        renderSettingItem(
          'School Analytics',
          'Configure reporting and analytics',
          'chart.bar',
          () => router.push('/screens/analytics/settings' as any)
        ),
        renderSettingItem(
          'Staff Management',
          'Manage staff permissions and roles',
          'person.2',
          () => router.push('/screens/staff/settings' as any)
        )
      );
    }

    if (role === 'parent') {
      roleSettings.push(
        renderSettingItem(
          'Child Safety',
          'Configure child safety and privacy settings',
          'shield',
          () => Alert.alert('Safety', 'Child safety settings coming soon!')
        ),
        renderSettingItem(
          'Communication Preferences',
          'Set how you receive updates about your child',
          'message',
          () => Alert.alert('Communication', 'Communication preferences coming soon!')
        )
      );
    }

    return roleSettings;
  };

  const roleSpecificSettings = getRoleSpecificSettings();

  return (
    <SafeAreaView style={styles(theme).container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles(theme).profileSection}>
          <TouchableOpacity style={styles(theme).profileCard} onPress={handleProfilePress}>
            <View style={styles(theme).profileAvatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles(theme).avatarImage} />
              ) : (
                <IconSymbol name="person.circle.fill" size={60} color="#3B82F6" />
              )}
            </View>
            <View style={styles(theme).profileInfo}>
              <Text style={styles(theme).profileName}>{profile?.name || 'User Name'}</Text>
              <Text style={styles(theme).profileEmail}>{profile?.email || 'user@example.com'}</Text>
              <Text style={styles(theme).profileRole}>{profile?.role?.toUpperCase() || 'USER'}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Role-Specific Settings */}
        {roleSpecificSettings.length > 0 && (
          <>
            {renderSectionHeader(`${profile?.role?.charAt(0)?.toUpperCase() + profile?.role?.slice(1)} Settings`)}
            <View style={styles(theme).settingsGroup}>
              {roleSpecificSettings}
            </View>
          </>
        )}

        {/* Account Settings */}
        {renderSectionHeader('Account')}
        <View style={styles(theme).settingsGroup}>
          {renderSettingItem(
            'Edit Profile',
            'Update your personal information',
            'person.circle',
            handleProfilePress
          )}
          {renderSettingItem(
            'Notification Settings',
            'Manage your notification preferences',
            'bell',
            handleNotificationsPress
          )}
          {renderSettingItem(
            'Privacy Settings',
            'Control your privacy and data sharing',
            'lock.shield',
            handlePrivacyPress
          )}
        </View>

        {/* App Preferences */}
        {renderSectionHeader('Preferences')}
        <View style={styles(theme).settingsGroup}>
          {renderSwitchItem(
            'Push Notifications',
            'Receive notifications on your device',
            'bell.badge',
            settings.notifications,
            (value) => updateSetting('notifications', value),
            'notifications'
          )}
          {renderSwitchItem(
            'Email Alerts',
            'Receive important updates via email',
            'envelope',
            settings.emailAlerts,
            (value) => updateSetting('emailAlerts', value),
            'emailAlerts'
          )}
          {renderSwitchItem(
            'Dark Mode',
            'Use dark theme throughout the app',
            theme.isDark ? 'sun.max' : 'moon',
            theme.isDark,
            () => toggleTheme()
          )}
          {renderValueItem(
            'Language',
            'Choose your preferred language',
            'globe',
            settings.language,
            handleLanguagePress
          )}
          {renderSwitchItem(
            'Sound Effects',
            'Play sounds for interactions',
            'speaker.2',
            settings.soundEffects,
            (value) => updateSetting('soundEffects', value),
            'soundEffects'
          )}
          {renderSwitchItem(
            'Haptic Feedback',
            'Feel vibrations for interactions',
            'hand.tap',
            settings.hapticFeedback,
            (value) => updateSetting('hapticFeedback', value),
            'hapticFeedback'
          )}
        </View>

        {/* Security */}
        {renderSectionHeader('Security')}
        <View style={styles(theme).settingsGroup}>
          {renderSwitchItem(
            'Biometric Authentication',
            'Use fingerprint or face ID to unlock',
            'faceid',
            settings.biometricAuth,
            (value) => updateSetting('biometricAuth', value),
            'biometricAuth'
          )}
          {renderSettingItem(
            'Change Password',
            'Update your account password',
            'key',
            handleSecurityPress
          )}
          {renderSwitchItem(
            'Auto Lock',
            'Automatically lock the app when inactive',
            'lock',
            settings.autoLock,
            (value) => updateSetting('autoLock', value),
            'autoLock'
          )}
          {renderSwitchItem(
            'Auto Backup',
            'Automatically backup your data',
            'icloud',
            settings.autoBackup,
            (value) => updateSetting('autoBackup', value),
            'autoBackup'
          )}
        </View>

        {/* Data & Storage */}
        {renderSectionHeader('Data & Storage')}
        <View style={styles(theme).settingsGroup}>
          {renderValueItem(
            'Data Usage',
            'Control when to download content',
            'antenna.radiowaves.left.and.right',
            settings.dataUsage === 'wifi' ? 'Wi-Fi Only' : 'Wi-Fi + Cellular',
            handleDataUsagePress
          )}
          {renderSettingItem(
            'Clear Cache',
            `Free up space (${settings.cacheSize} used)`,
            'trash',
            handleClearCachePress
          )}
        </View>

        {/* Support */}
        {renderSectionHeader('Support')}
        <View style={styles(theme).settingsGroup}>
          {renderSettingItem(
            'Help & Support',
            'Get help and contact support',
            'questionmark.circle',
            handleHelpPress
          )}
          {renderSettingItem(
            'Terms of Service',
            'Read our terms and conditions',
            'doc.text',
            handleTermsPress
          )}
          {renderSettingItem(
            'Privacy Policy',
            'Read our privacy policy',
            'shield.checkered',
            handlePrivacyPress
          )}
          {renderSettingItem(
            'About EduDash Pro',
            `Version ${appInfo.version} (${appInfo.buildNumber})`,
            'info.circle',
            handleAboutPress
          )}
        </View>

        {/* Sign Out */}
        <View style={styles(theme).signOutSection}>
          {renderSettingItem(
            'Sign Out',
            'Sign out of your account',
            'power',
            handleSignOutPress,
            undefined,
            true
          )}
        </View>

        <View style={styles(theme).bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? '#374151' : '#F3F4F6',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    backgroundColor: theme.isDark ? '#1E40AF' : '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  settingsGroup: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.isDark ? '#374151' : '#F3F4F6',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.isDark ? '#1E40AF' : '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  signOutSection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dangerousItem: {
    backgroundColor: theme.isDark ? '#7F1D1D' : '#FEF2F2',
  },
  dangerousIcon: {
    backgroundColor: theme.isDark ? '#DC2626' : '#FEE2E2',
  },
  dangerousText: {
    color: '#EF4444',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
