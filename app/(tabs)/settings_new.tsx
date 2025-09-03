import React, { useState, useEffect, useMemo } from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { useToast } from '@/components/ui/Toast';
import * as Localization from 'expo-localization';
import { toSupportedLang, LanguageCode } from '@/src/i18n/languages';

export default function SettingsNewScreen() {
  const { colorScheme, setColorScheme } = useTheme();
  const { user, signOut, profile } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    darkMode: colorScheme === 'dark',
  });

  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  // Themed dynamic styles to avoid inline color objects
  const themed = useMemo(() => StyleSheet.create({
    text: { color: palette.text },
    textSecondary: { color: palette.textSecondary },
    borderBottomOutline: { borderBottomColor: palette.outline },
    bgOutline: { backgroundColor: palette.outline },
  }), [palette]);

  const { language, setLanguage, languages, getLabel } = useLanguage();
  const { t } = useT();
  const [langOpen, setLangOpen] = useState(false);
  const toast = useToast();

  // Sync dark mode setting when theme changes
  useEffect(() => {
    setSettings(prev => ({ ...prev, darkMode: isDark }));
  }, [isDark]);

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Helper to change language and show confirmation toast
  const applyLanguage = async (code: LanguageCode) => {
    await setLanguage(code);
    toast.success(t('settings.languageChanged', { language: getLabel(code) }));
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
          <Text style={[styles.pageTitle, { color: palette.text }]}>{t('settings.title')}</Text>
          <Text style={[styles.pageSubtitle, { color: palette.textSecondary }]}> 
            {t('settings.formats.sectionTitle')}
          </Text>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('settings.notifications')}</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: palette.outline }]}>
            <View style={styles.settingInfo}>
              <IconSymbol name="bell" size={20} color={palette.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: palette.text }]}> 
                  {t('settings.pushNotifications')}
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

          <View style={[styles.settingItem, styles.borderBottomTransparent]}>
            <View style={styles.settingInfo}>
              <IconSymbol name="envelope" size={20} color={palette.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: palette.text }]}> 
                  {t('settings.emailNotifications')}
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

        {/* Language Section */}
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('settings.language')}</Text>

          {/* Dropdown-style selector */}
          <TouchableOpacity
            style={[styles.settingItem]}
            onPress={() => setLangOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <IconSymbol name="globe" size={20} color={palette.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: palette.text }]}> 
                  {getLabel(language)}
                </Text>
                <Text style={[themed.textSecondary, styles.mt2]}>
                  {t('settings.selectLanguage')}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.down" size={18} color={palette.textSecondary} />
          </TouchableOpacity>

          {/* Use device language row */}
          <TouchableOpacity
            style={[styles.settingItem, styles.borderBottomTransparent]}
            onPress={async () => {
              const locales = Localization.getLocales();
              const deviceLocaleTag = (locales && locales.length > 0) ? (locales[0].languageTag || 'en-ZA') : 'en-ZA';
              const deviceLang = toSupportedLang(deviceLocaleTag);
              await applyLanguage(deviceLang);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <IconSymbol name="globe" size={20} color={palette.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: palette.text }]}>
                  {t('settings.useDeviceLanguage')}
                </Text>
                <Text style={[themed.textSecondary, styles.mt2]}>
                  {/* Show the detected device language label */}
                  {(() => {
                    try {
                      const locales = Localization.getLocales();
                      const deviceLocaleTag = (locales && locales.length > 0) ? (locales[0].languageTag || 'en-ZA') : 'en-ZA';
                      const deviceLang = toSupportedLang(deviceLocaleTag);
                      return getLabel(deviceLang);
                    } catch {
                      return getLabel('en' as LanguageCode);
                    }
                  })()}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Language Picker Bottom Sheet */}
        <BottomSheetModal visible={langOpen} onClose={() => setLangOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, themed.text]}>
              {t('settings.selectLanguage')}
            </Text>
            <View style={styles.mt4}>
              {languages.map((lang) => {
                const supported = lang.code === 'en' || lang.code === 'af' || lang.code === 'zu';
                const isActive = language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langRow,
                      themed.borderBottomOutline,
                      !supported && styles.opacityDim,
                    ]}
                    disabled={!supported}
                    onPress={async () => {
                      if (!supported) return;
                      await applyLanguage(lang.code as any);
                      setLangOpen(false);
                    }}
                    activeOpacity={supported ? 0.7 : 1}
                  >
                    <View style={styles.langRowLeft}>
                      <View style={styles.mr12}>
                        <IconSymbol name="globe" size={18} color={palette.textSecondary} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={[styles.langName, themed.text]}>{getLabel(lang.code as any)}</Text>
                        <Text style={[styles.langDisplayName, themed.textSecondary]}>{lang.displayName}</Text>
                      </View>
                    </View>
                    {supported ? (
                      isActive ? (
                        <IconSymbol name="checkmark.circle.fill" size={20} color={palette.primary} />
                      ) : (
                        <IconSymbol name="circle" size={20} color={palette.outline} />
                      )
                    ) : (
                      <View style={[styles.unsupportedBadge, themed.bgOutline]}>
                        <Text style={[styles.unsupportedBadgeText, themed.text]}>
                          {t('common.comingSoon')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </BottomSheetModal>

        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('settings.appearance')}</Text>
          
          <View style={[styles.settingItem, styles.borderBottomTransparent]}>
            <View style={styles.settingInfo}>
              <IconSymbol name={isDark ? 'sun.max' : 'moon'} size={20} color={palette.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: palette.text }]}> 
                  {t('settings.darkMode')}
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
        {(profile?.role === 'preschool_admin' || profile?.role === 'superadmin') && (
          <View style={[styles.section, { backgroundColor: palette.surface }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('settings.admin')}</Text>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: palette.surface }]}
              onPress={() => router.push('/screens/school-settings')}
            >
              <IconSymbol name="gearshape.fill" size={20} color={palette.primary} />
              <Text style={[styles.actionButtonText, { color: palette.text }]}> 
                {t('settings.schoolSettings')}
              </Text>
              <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: palette.surface }]}
              onPress={handleSendTestNotification}
            >
              <IconSymbol name="paperplane" size={20} color={palette.success} />
              <Text style={[styles.actionButtonText, { color: palette.text }]}> 
                {t('settings.sendTestNotification')}
              </Text>
              <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: palette.surface }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('settings.accountSubscription')}</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: palette.surface }]}
            onPress={() => router.push('/pricing')}
          >
            <IconSymbol name="crown.fill" size={20} color={palette.primary} />
            <Text style={[styles.actionButtonText, { color: palette.text }]}>{t('settings.viewPlansUpgrade')}</Text>
            <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: palette.surface }]}
            onPress={() => router.push('/screens/subscription-management')}
          >
            <IconSymbol name="chart.bar.fill" size={20} color={palette.success} />
            <Text style={[styles.actionButtonText, { color: palette.text }]}>{t('settings.usageBilling')}</Text>
            <IconSymbol name="chevron.right" size={16} color={palette.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: palette.surface }]}
            onPress={handleSignOut}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={palette.error} />
            <Text style={[styles.actionButtonText, { color: palette.error }]}>{t('auth.signOut')}</Text>
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
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  borderBottomTransparent: { borderBottomColor: 'transparent' },
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
  // Language dropdown modal styles
  modalContent: { paddingVertical: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  langRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opacityDim: { opacity: 0.6 },
  langRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  mr12: { marginRight: 12 },
  flex1: { flex: 1 },
  langName: { fontSize: 16 },
  langDisplayName: { fontSize: 12, marginTop: 2 },
  unsupportedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  unsupportedBadgeText: { fontSize: 12 },
});
