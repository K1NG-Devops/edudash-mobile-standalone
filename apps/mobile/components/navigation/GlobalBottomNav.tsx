 
// @ts-nocheck
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shadow } from '@/lib/ui/shadow';
import { useT } from '@/i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TabItem {
  key: string;
  label: string;
  icon: string;
  onPress?: () => void;
}

export default function GlobalBottomNav() {
  // Always call hooks unconditionally to preserve hook order across renders
  const pathname = usePathname();
  const { profile, loading } = useAuth();
  const { t } = useT();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Track unread count for Messages tab
  const [unread, setUnread] = useState<number>(0);
  // Track unread announcements count for Activities tab
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<number>(0);
  const meIdRef = useRef<string | null>(null);
  const channelRef = useRef<any>(null);
  const announcementChannelRef = useRef<any>(null);
  
  useEffect(() => {
    let timer: any;
    const setup = async () => {
      if (!profile?.auth_user_id) return;
      // Resolve internal user id once
      try {
        const { data: me } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', profile.auth_user_id)
          .single();
        meIdRef.current = me?.id || null;
      } catch {}

      const refreshUnread = async () => {
        try {
          const { data } = await (supabase as any).rpc('get_total_unread_counts');
          const row = Array.isArray(data) ? data[0] : data;
          const total = row?.total ?? row?.dm_unread ?? 0; // fallback to dm_unread if total missing
          setUnread(typeof total === 'number' ? total : 0);
        } catch {
          // fallback: count only direct messages via message_recipients (excluding announcements)
          if (!meIdRef.current) return;
          const { count } = await supabase
            .from('message_recipients')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', meIdRef.current)
            .eq('is_read', false)
            .eq('is_archived', false);
          setUnread(count || 0);
        }
      };

      const refreshAnnouncementUnread = async () => {
        try {
          if (!meIdRef.current) return;
          // Count unread announcements specifically
          const { data: recips } = await supabase
            .from('message_recipients')
            .select('message_id, read_at')
            .eq('recipient_id', meIdRef.current)
            .eq('is_read', false)
            .eq('is_archived', false);
          
          if (!recips || recips.length === 0) {
            setUnreadAnnouncements(0);
            return;
          }
          
          const messageIds = recips.map(r => r.message_id);
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('id', messageIds)
            .eq('message_type', 'announcement');
          
          setUnreadAnnouncements(count || 0);
        } catch {
          setUnreadAnnouncements(0);
        }
      };

      await refreshUnread();
      await refreshAnnouncementUnread();
      timer = setInterval(() => {
        refreshUnread();
        refreshAnnouncementUnread();
      }, 15000);

      // Realtime listener for new direct deliveries to current user
      if (meIdRef.current) {
        try {
          channelRef.current = (supabase as any)
            .channel(`nav_badge_mr_${meIdRef.current}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_recipients', filter: `recipient_id=eq.${meIdRef.current}` }, async () => {
              await refreshUnread();
              await refreshAnnouncementUnread();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'message_recipients', filter: `recipient_id=eq.${meIdRef.current}` }, async () => {
              await refreshUnread();
              await refreshAnnouncementUnread();
            })
            .subscribe();
        } catch {}
      }
    };

    setup();

    return () => {
      if (timer) clearInterval(timer);
      try { 
        if (channelRef.current) (supabase as any).removeChannel(channelRef.current);
        if (announcementChannelRef.current) (supabase as any).removeChannel(announcementChannelRef.current);
      } catch {}
    };
  }, [profile?.auth_user_id]);

  // Hide the global nav on welcome and auth screens
  const hide = pathname === '/' || pathname.startsWith('/(auth)');
  if (hide || loading || !profile) return null;

  // Role-aware tabs
  const normalizedRole = String(profile.role) === 'principal' ? 'preschool_admin' : String(profile.role || '');

  const adminTabs: TabItem[] = [
    { key: 'overview', label: t('nav.dashboard'), icon: 'chart.bar', onPress: () => router.push('/(tabs)/dashboard' as any) },
    { key: 'teachers', label: t('nav.teachers'), icon: 'person.2.fill', onPress: () => router.push('/screens/teachers' as any) },
    { key: 'students', label: t('nav.students'), icon: 'graduationcap.fill', onPress: () => router.push('/screens/students' as any) },
{ key: 'messages', label: t('nav.messages'), icon: 'message.fill', onPress: () => router.push('/messages' as any) },
    { key: 'settings', label: t('nav.settings'), icon: 'gear', onPress: () => router.push('/(tabs)/settings_new' as any) },
  ];

  const teacherTabs: TabItem[] = [
    // Route teacher overview to the main dashboard tab to avoid cross-stack redirects
    { key: 'overview', label: t('nav.dashboard'), icon: 'rectangle.3.group', onPress: () => router.push('/(tabs)/dashboard' as any) },
    { key: 'students', label: t('nav.students'), icon: 'graduationcap.fill', onPress: () => router.push('/screens/students' as any) },
    { key: 'activities', label: t('dashboard.upcomingEvents'), icon: 'figure.run', onPress: () => router.push('/(tabs)/activities' as any) },
{ key: 'messages', label: t('nav.messages'), icon: 'message.fill', onPress: () => router.push('/messages' as any) },
    { key: 'manage', label: 'Billing', icon: 'creditcard.fill', onPress: () => router.push('/screens/subscription-management' as any) },
  ];

  const parentTabs: TabItem[] = [
    { key: 'overview', label: t('nav.dashboard'), icon: 'rectangle.3.group', onPress: () => router.push('/(tabs)/dashboard' as any) },
    { key: 'activities', label: t('dashboard.upcomingEvents'), icon: 'figure.run', onPress: () => router.push('/(tabs)/activities' as any) },
    { key: 'messages', label: t('nav.messages'), icon: 'message.fill', onPress: () => router.push('/messages' as any) },
    { key: 'manage', label: 'Billing', icon: 'creditcard.fill', onPress: () => router.push('/screens/subscription-management' as any) },
    { key: 'settings', label: t('nav.settings'), icon: 'gear', onPress: () => router.push('/(tabs)/settings_new' as any) },
  ];

  const tabs: TabItem[] = normalizedRole === 'teacher' 
    ? teacherTabs 
    : normalizedRole === 'parent'
      ? parentTabs
      : adminTabs;

  // Determine active tab based on pathname
  const getActiveTab = (pathname: string) => {
    if (pathname.includes('/dashboard')) return 'overview';
    if (pathname.includes('/activities')) return 'activities';
    if (pathname.includes('/messages')) return 'messages';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/teachers')) return 'teachers';
    if (pathname.includes('/students')) return 'students';
    if (pathname.includes('/screens/subscription-management') || pathname.includes('/account/billing') || pathname.includes('/pricing')) return 'manage';
    return '';
  };

  const activeTab = getActiveTab(pathname);
  const iconColorActive = isDark ? '#6EE7B7' : '#059669';
  const iconColorInactive = isDark ? '#9CA3AF' : '#9CA3AF';
  const textColorActive = isDark ? '#E5E7EB' : '#374151';
  const textColorInactive = isDark ? '#9CA3AF' : '#6B7280';
  const backgroundColor = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? '#475569' : '#E5E7EB';
  const wrapperStyle = Platform.OS === 'web' 
    ? [styles.wrapper, { position: 'fixed' as any }] 
    : [styles.wrapper];

  return (
    <View style={[...wrapperStyle, { pointerEvents: 'box-none' as any }]}> 
      <SafeAreaView edges={['bottom','left','right']} style={{ backgroundColor }}>
        <View style={[styles.tabNavigationBottom, shadow(0), {
          backgroundColor,
          borderTopWidth: 0,
          borderTopColor: backgroundColor,
        }]}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.tabButton} onPress={tab.onPress}>
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSymbol 
                    name={tab.icon as any} 
                    size={16} 
                    color={isActive ? iconColorActive : iconColorInactive} 
                  />
                  {tab.key === 'messages' && unread > 0 && (
                    <View style={[styles.badge, { backgroundColor: '#EF4444', borderColor: backgroundColor }]}>
                      <Text style={styles.badgeText}>{unread > 99 ? '99+' : String(unread)}</Text>
                    </View>
                  )}
                  {tab.key === 'activities' && unreadAnnouncements > 0 && (
                    <View style={[styles.badge, { backgroundColor: '#F59E0B', borderColor: backgroundColor }]}>
                      <Text style={styles.badgeText}>{unreadAnnouncements > 99 ? '99+' : String(unreadAnnouncements)}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, { 
                  color: isActive ? textColorActive : textColorInactive,
                  fontWeight: isActive ? '600' : '500'
                }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
    zIndex: 1000,
    elevation: 1000,
  },
  tabNavigationBottom: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: 12,
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
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});

