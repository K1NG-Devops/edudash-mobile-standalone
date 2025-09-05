import { IconSymbol } from '@/components/ui/IconSymbol';
import { getRoleColors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
, AppState , Appearance, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileSidebar } from './MobileSidebar';
import AiLanguageSelector from '@/components/ai/AiLanguageSelector';
import { NotificationService } from '@/lib/services/notificationService';
import { useTheme } from '@/contexts/ThemeContext';
import { useWindowDimensions, ScrollView } from 'react-native';
import { useT } from '@/i18n';

interface MobileHeaderProps {
  user: {
    id?: string; // optional user id for fetching unread count
    name: string;
    role: string;
    avatar?: string;
  };
  schoolName?: string; // Add school name prop
  onNotificationsPress?: () => void;
  onNavigate?: (route: string) => void;
  onSignOut?: () => void;
  notificationCount?: number; // if provided, overrides internal fetch
  onPrimaryAction?: () => void; // optional primary action (e.g., create event for principals)
  actionsPlacement?: 'header' | 'below'; // where to render non-notification action icons
}

interface MobileHeaderState {
  colorScheme: 'light' | 'dark';
  sidebarVisible: boolean;
  internalUnreadCount: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  schoolName,
  onNotificationsPress,
  onNavigate,
  onSignOut,
  notificationCount,
  onPrimaryAction,
  actionsPlacement = 'header',
}) => {
  const { colorScheme, toggle: toggleGlobalTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useT();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [internalUnreadCount, setInternalUnreadCount] = useState(0);

  const getRoleTitle = (role: string): string => {
    // If we have a school name, prioritize showing it for school roles
    if (schoolName && (role === 'preschool_admin' || role === 'principal' || role === 'teacher')) {
      return schoolName;
    }
    
    switch (role) {
      case 'superadmin':
        return t('roles.superadmin');
      case 'preschool_admin':
        return t('roles.principal');
      case 'principal':
        return t('roles.principal');
      case 'teacher':
        return t('roles.teacher');
      case 'parent':
        return schoolName || t('roles.parent');
      default:
        return t('common.appName');
    }
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const handleNavigate = (route: string) => {
    closeSidebar();
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const handleSignOut = () => {
    closeSidebar();
    if (onSignOut) {
      onSignOut();
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const userId = user?.id;
      if (!userId) return;
      const count = await NotificationService.getUnreadCount(userId);
      setInternalUnreadCount(count || 0);
    } catch {
      // silently ignore in UI
    }
  };

  const onAppStateChange = (state: string) => {
    if (state === 'active') {
      fetchUnreadCount();
    }
  };

  useEffect(() => {
    // Initial fetch if we can resolve a user id
    fetchUnreadCount();
    // Poll periodically to keep badge fresh
    const unreadTimer = setInterval(fetchUnreadCount, 15000);

    // Refresh when app becomes active
    let appStateSub: any = null;
    try {
      appStateSub = AppState.addEventListener('change', onAppStateChange);
    } catch {}
    
    // Refresh on window focus (web)
    const handleFocus = () => fetchUnreadCount();
    try {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('focus', handleFocus);
      }
    } catch {}

    // Cleanup
    return () => {
      clearInterval(unreadTimer);
      try { appStateSub?.remove?.(); } catch {}
      try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('focus', handleFocus);
        }
      } catch {}
    };
  }, [user?.id]);

  const badgeCount = typeof notificationCount === 'number' ? notificationCount : internalUnreadCount;
  // Red to blue gradient
  const redBlueGradient = colorScheme === 'light'
    ? ['#DC2626', '#2563EB'] as const  // Red-600 to Blue-600
    : ['#F87171', '#60A5FA'] as const;  // Red-400 to Blue-400
  const firstName = user?.name?.split(' ')[0] || 'User';
  const isPrincipal = user?.role === 'preschool_admin' || user?.role === 'principal';
  const isNarrow = width <= 380; // compact on small phones
  // For superadmin, prefer a short display label over raw email/name
  const displayName = user?.role === 'superadmin'
    ? 'Super Admin'
    : (user?.name?.includes('@')
        ? (user?.name?.split('@')[0] || firstName)
        : firstName);
  const displayInitial = displayName.charAt(0).toUpperCase();

  // Always use light-content for blue gradient
  const computedBarStyle = 'light-content';

    return (
      <>
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']} className="bg-transparent">
          <StatusBar 
            barStyle={computedBarStyle as any}
            translucent={true}
            backgroundColor="transparent"
          />
          <LinearGradient
            colors={[redBlueGradient[0], redBlueGradient[1]]}
            style={[styles.header, { paddingTop: Math.max(0, insets.top - 2) }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {/* Modern glass morphism overlay */}
            <View style={styles.glassOverlay} className="absolute inset-0 bg-white/5" />
            
            <View style={styles.headerContent} className="flex-row items-center justify-between px-0">
              {/* Left side - Avatar & User Info */}
              <View style={styles.leftSection} className="flex-1 flex-row items-center pr-3">
                <TouchableOpacity
                  style={styles.avatarButton}
                  className="relative mr-4"
                  onPress={toggleSidebar}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer} className="h-11 w-11 items-center justify-center rounded-full border-2 border-white/30 bg-white/20">
                    <Text style={styles.avatarText} className="text-[20px] font-bold text-white">
                      {displayInitial}
                    </Text>
                  </View>
                  <View style={styles.statusIndicator} className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </TouchableOpacity>
                
                <View style={styles.greetingSection} className="flex-1">
                  {/* Show EduDash Pro for superadmin, otherwise school name */}
                  {user?.role === 'superadmin' ? (
                    <Text style={styles.brandName} className="mb-1.5 text-[18px] font-bold text-white">EduDash Pro</Text>
                  ) : (
                    <Text style={styles.schoolName} className="mb-1.5 text-[17px] font-bold text-white">
                      {schoolName || 'EduDash Pro'}
                    </Text>
                  )}
                  
                  {/* User info below */}
                  <View style={styles.userInfoRow} className="mt-1 flex-row items-center">
                    <Text style={styles.userName} className="mb-0.5 mr-2 text-[18px] font-semibold text-white">{displayName}</Text>
                    <View style={styles.roleContainer} className="ml-2">
                      <View style={styles.roleBadge} className="self-start rounded-lg bg-white/15 px-2.5 py-[3px]">
                        <Text
                          style={[
                            styles.roleTitle,
                            isNarrow && styles.roleTitleCompact,
                            { maxWidth: isNarrow ? 110 : 160 }
                          ]}
                          className="text-white opacity-90"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {user?.role === 'preschool_admin' ? t('roles.principal') : 
                           user?.role === 'principal' ? t('roles.principal') :
                           user?.role === 'school_admin' ? t('roles.admin') :
                           user?.role === 'teacher' ? t('roles.teacher') :
                           user?.role === 'parent' ? t('roles.parent') :
                           user?.role === 'superadmin' ? (t('roles.superadminShort') || t('roles.superadmin')) : t('roles.admin')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right side - Actions */}
              <View style={[styles.rightSection, (isPrincipal || isNarrow) && styles.rightSectionCompact]} className={isPrincipal || isNarrow ? 'mt-0.5 flex-row items-center gap-1 self-start' : 'mt-0.5 flex-row items-center gap-2 self-start'}>
                {/* Always show theme toggle and notifications in header */}
                <TouchableOpacity
                  style={[styles.modernActionButton, (isPrincipal || isNarrow) && styles.compactActionButton]}
                  className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/20"
                  onPress={toggleGlobalTheme}
                  activeOpacity={0.7}
                >
                  <IconSymbol 
                    name={colorScheme === 'light' ? 'moon.fill' : 'sun.max.fill'} 
                    size={(isPrincipal || isNarrow) ? 16 : 18} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
                
                {onNotificationsPress && (
                  <TouchableOpacity
                    style={[styles.modernActionButton, isPrincipal && styles.compactActionButton]}
                    className={isPrincipal || isNarrow ? 'h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/20' : 'h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/20'}
                    onPress={onNotificationsPress}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="bell" size={(isPrincipal || isNarrow) ? 16 : 18} color="#FFFFFF" />
                    {badgeCount > 0 && (
                      <View style={styles.modernNotificationBadge} className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-md border border-white bg-red-500">
                        <Text style={styles.notificationBadgeText} className="text-center text-[10px] font-bold text-white">
                          {badgeCount > 99 ? '99+' : badgeCount.toString()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                
                {/* If actions are NOT placed below, show all other actions here too */}
                {actionsPlacement !== 'below' && (
                  <>
                    {/* AI Language Selector */}
                    <AiLanguageSelector compact={true} tone="onDark" />

                    {/* Principal Primary Action (e.g., Create Event) */}
                    {isPrincipal && onPrimaryAction && (
                      <TouchableOpacity
                        style={[styles.modernActionButton, styles.compactActionButton]}
                        className="h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/20"
                        onPress={onPrimaryAction}
                        activeOpacity={0.7}
                        accessibilityLabel="Create Event"
                      >
                        <IconSymbol name="calendar" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}

                    {/* Manage Subscription Button */}
                    {onNavigate && (
                      <TouchableOpacity
                        style={[styles.modernActionButton, (isPrincipal || isNarrow) && styles.compactActionButton]}
                        className={isPrincipal || isNarrow ? 'h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/20' : 'h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/20'}
                        onPress={() => onNavigate('/pricing')}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="creditcard.fill" size={(isPrincipal || isNarrow) ? 16 : 18} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          </LinearGradient>
        </SafeAreaView>

        {/* Below-header actions bar (optional) */}
        {actionsPlacement === 'below' && (
          <View style={[
            styles.belowActionsContainer,
            colorScheme === 'dark' ? styles.belowDarkBG : styles.belowLightBG
          ]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.belowActionsRow}
            >
              <AiLanguageSelector compact={true} tone={colorScheme === 'dark' ? 'onDark' : 'onLight'} />

              {isPrincipal && onPrimaryAction && (
                <TouchableOpacity
                  style={[
                    styles.modernActionButton,
                    styles.compactActionButton,
                    colorScheme === 'dark' ? styles.lowContrastButtonDark : styles.lowContrastButtonLight
                  ]}
                  onPress={onPrimaryAction}
                  activeOpacity={0.7}
                  accessibilityLabel="Create Event"
                >
                  <IconSymbol name="calendar" size={16} color={colorScheme === 'light' ? '#111827' : '#F9FAFB'} />
                </TouchableOpacity>
              )}

              {onNavigate && (
                <TouchableOpacity
                  style={[
                    styles.modernActionButton,
                    styles.compactActionButton,
                    colorScheme === 'dark' ? styles.lowContrastButtonDark : styles.lowContrastButtonLight
                  ]}
                  onPress={() => onNavigate('/pricing')}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="creditcard.fill" size={16} color={colorScheme === 'light' ? '#111827' : '#F9FAFB'} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* Mobile Sidebar */}
        <MobileSidebar
          isVisible={sidebarVisible}
          onClose={closeSidebar}
          userProfile={user}
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
        />
      </>
    );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent', // Let gradient fill behind status bar
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 0, // snug under status bar
    paddingBottom: 12,
    minHeight: 72,
    marginTop: 0,
  },
  belowActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  belowDarkBG: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)'
  },
  belowLightBG: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)'
  },
  belowActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  lowContrastButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  lowContrastButtonLight: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  lowContrastButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
    paddingTop: 0,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  greetingSection: {
    flex: 1,
    overflow: 'visible',
    minWidth: 0,
  },
greeting: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    marginRight: 8,
  },
  roleTitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    flexShrink: 0,
  },
  roleTitleCompact: {
    fontSize: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: 0,
    alignSelf: 'flex-start',
    marginTop: 0,
    gap: 10,
  },
  rightSectionCompact: {
    gap: 6,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // New modern styles
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 0,
  },
  avatarButton: {
    position: 'relative',
    marginRight: 16,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  roleContainer: {
    marginTop: 0,
    marginLeft: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  modernActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  compactActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  modernNotificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  // New styles for redesigned header
  schoolName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
    flexShrink: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
    flexShrink: 0,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
    marginTop: 4,
  },
});
