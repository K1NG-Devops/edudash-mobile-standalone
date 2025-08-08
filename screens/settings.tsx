import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SettingsScreenProps {
  profile?: any;
}

interface SettingsScreenState {
  notifications: boolean;
  emailAlerts: boolean;
  darkMode: boolean;
  biometricAuth: boolean;
  autoBackup: boolean;
}

export default class SettingsScreen extends React.Component<SettingsScreenProps, SettingsScreenState> {
  constructor(props: SettingsScreenProps) {
    super(props);
    this.state = {
      notifications: true,
      emailAlerts: true,
      darkMode: false,
      biometricAuth: false,
      autoBackup: true,
    };
  }

  renderSettingItem = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <IconSymbol name={icon as any} size={20} color="#3B82F6" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {rightElement || <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  renderSwitchItem = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <IconSymbol name={icon as any} size={20} color="#3B82F6" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#F3F4F6', true: '#DBEAFE' }}
        thumbColor={value ? '#3B82F6' : '#9CA3AF'}
      />
    </View>
  );

  renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  handleProfilePress = () => {
    router.push('/screens/profile' as any);
  };

  handleNotificationsPress = () => {
    Alert.alert('Notifications', 'Notification settings coming soon!');
  };

  handlePrivacyPress = () => {
    Alert.alert('Privacy', 'Privacy settings coming soon!');
  };

  handleSecurityPress = () => {
    Alert.alert('Security', 'Security settings coming soon!');
  };

  handleHelpPress = () => {
    Alert.alert('Help', 'Help & Support coming soon!');
  };

  handleAboutPress = () => {
    Alert.alert('About', 'EduDash Pro Mobile v1.0.0\n\nEducational management platform for preschools and parents.');
  };

  handleSignOutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // Handle sign out logic here
            Alert.alert('Success', 'You have been signed out.');
          }
        },
      ]
    );
  };

  render() {
    const { profile } = this.props;
    const { notifications, emailAlerts, darkMode, biometricAuth, autoBackup } = this.state;

    return (
      <View style={styles.container}>
        <MobileHeader 
          user={{
            name: profile?.name || 'User',
            role: profile?.role || 'user',
            avatar: profile?.avatar_url,
          }}
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.profileCard} onPress={this.handleProfilePress}>
              <View style={styles.profileAvatar}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <IconSymbol name="person.circle.fill" size={60} color="#3B82F6" />
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile?.name || 'User Name'}</Text>
                <Text style={styles.profileEmail}>{profile?.email || 'user@example.com'}</Text>
                <Text style={styles.profileRole}>{profile?.role?.toUpperCase() || 'USER'}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Account Settings */}
          {this.renderSectionHeader('Account')}
          <View style={styles.settingsGroup}>
            {this.renderSettingItem(
              'Edit Profile',
              'Update your personal information',
              'person.circle',
              this.handleProfilePress
            )}
            {this.renderSettingItem(
              'Notification Settings',
              'Manage your notification preferences',
              'bell',
              this.handleNotificationsPress
            )}
            {this.renderSettingItem(
              'Privacy Settings',
              'Control your privacy and data sharing',
              'lock.shield',
              this.handlePrivacyPress
            )}
          </View>

          {/* App Preferences */}
          {this.renderSectionHeader('Preferences')}
          <View style={styles.settingsGroup}>
            {this.renderSwitchItem(
              'Push Notifications',
              'Receive notifications on your device',
              'bell.badge',
              notifications,
              (value) => this.setState({ notifications: value })
            )}
            {this.renderSwitchItem(
              'Email Alerts',
              'Receive important updates via email',
              'envelope',
              emailAlerts,
              (value) => this.setState({ emailAlerts: value })
            )}
            {this.renderSwitchItem(
              'Dark Mode',
              'Use dark theme throughout the app',
              'moon',
              darkMode,
              (value) => this.setState({ darkMode: value })
            )}
          </View>

          {/* Security */}
          {this.renderSectionHeader('Security')}
          <View style={styles.settingsGroup}>
            {this.renderSwitchItem(
              'Biometric Authentication',
              'Use fingerprint or face ID to unlock',
              'faceid',
              biometricAuth,
              (value) => this.setState({ biometricAuth: value })
            )}
            {this.renderSettingItem(
              'Change Password',
              'Update your account password',
              'key',
              this.handleSecurityPress
            )}
            {this.renderSwitchItem(
              'Auto Backup',
              'Automatically backup your data',
              'icloud',
              autoBackup,
              (value) => this.setState({ autoBackup: value })
            )}
          </View>

          {/* Support */}
          {this.renderSectionHeader('Support')}
          <View style={styles.settingsGroup}>
            {this.renderSettingItem(
              'Help & Support',
              'Get help and contact support',
              'questionmark.circle',
              this.handleHelpPress
            )}
            {this.renderSettingItem(
              'Terms of Service',
              'Read our terms and conditions',
              'doc.text',
              () => Alert.alert('Terms', 'Terms of Service coming soon!')
            )}
            {this.renderSettingItem(
              'Privacy Policy',
              'Read our privacy policy',
              'shield.checkered',
              () => Alert.alert('Privacy', 'Privacy Policy coming soon!')
            )}
            {this.renderSettingItem(
              'About EduDash Pro',
              'App version and information',
              'info.circle',
              this.handleAboutPress
            )}
          </View>

          {/* Sign Out */}
          <View style={styles.signOutSection}>
            <TouchableOpacity style={styles.signOutButton} onPress={this.handleSignOutPress}>
              <IconSymbol name="power" size={20} color="#EF4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  signOutSection: {
    padding: 16,
    marginTop: 24,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
