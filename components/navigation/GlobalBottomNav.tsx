 
// @ts-nocheck
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TabItem {
  key: string;
  label: string;
  icon: string;
  onPress?: () => void;
}

export default function GlobalBottomNav() {
  const pathname = usePathname?.() || '/';
  const { profile, loading } = useAuth();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Hide the global nav on welcome and auth screens
  const hide = pathname === '/' || pathname.startsWith('/(auth)');
  if (hide || loading || !profile) return null;

  // Role-aware tabs
  const normalizedRole = String(profile.role) === 'principal' ? 'preschool_admin' : String(profile.role || '');

  const adminTabs: TabItem[] = [
    { key: 'overview', label: 'Overview', icon: 'chart.bar', onPress: () => router.push('/(tabs)/dashboard' as any) },
    { key: 'teachers', label: 'Teachers', icon: 'person.2.fill', onPress: () => router.push('/screens/teachers' as any) },
    { key: 'students', label: 'Students', icon: 'graduationcap.fill', onPress: () => router.push('/screens/students' as any) },
    { key: 'messages', label: 'Messages', icon: 'message.fill', onPress: () => router.push('/(tabs)/messages' as any) },
    { key: 'settings', label: 'Settings', icon: 'gear', onPress: () => router.push('/(tabs)/settings_new' as any) },
  ];

  const teacherTabs: TabItem[] = [
    // Route teacher overview to the main dashboard tab to avoid cross-stack redirects
    { key: 'overview', label: 'Overview', icon: 'rectangle.3.group', onPress: () => router.push('/(tabs)/dashboard' as any) },
    { key: 'students', label: 'Students', icon: 'graduationcap.fill', onPress: () => router.push('/screens/students' as any) },
    { key: 'activities', label: 'Activities', icon: 'figure.run', onPress: () => router.push('/(tabs)/activities' as any) },
    { key: 'messages', label: 'Messages', icon: 'message.fill', onPress: () => router.push('/(tabs)/messages' as any) },
    { key: 'settings', label: 'Settings', icon: 'gear', onPress: () => router.push('/(tabs)/settings_new' as any) },
  ];

  const tabs: TabItem[] = normalizedRole === 'teacher' ? teacherTabs : adminTabs;

  const iconColor = isDark ? '#6EE7B7' : '#059669';
  const textColor = isDark ? '#E5E7EB' : '#6B7280';
  const backgroundColor = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? '#475569' : '#E5E7EB';
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <SafeAreaView edges={['bottom','left','right']}>
        <View style={[styles.tabNavigationBottom, {
          backgroundColor,
          borderTopColor: borderColor,
        }]}
        >
          {tabs.map((tab) => (
            <TouchableOpacity key={tab.key} style={styles.tabButton} onPress={tab.onPress}>
              <IconSymbol name={tab.icon as any} size={16} color={iconColor} />
              <Text style={[styles.tabLabel, { color: textColor }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabNavigationBottom: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});

