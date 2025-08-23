 
// @ts-nocheck
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getRoleColors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  route?: string;
  action?: () => void;
  badge?: number;
  color?: string;
  divider?: boolean;
}

interface MobileSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  userProfile: any;
  onSignOut: () => void;
  onNavigate?: (route: string) => void;
}

interface MobileSidebarState {
  colorScheme: 'light' | 'dark';
  slideAnimation: Animated.Value;
}

export class MobileSidebar extends React.Component<MobileSidebarProps, MobileSidebarState> {
  constructor(props: MobileSidebarProps) {
    super(props);
    this.state = {
      colorScheme: 'light',
      slideAnimation: new Animated.Value(-screenWidth),
    };
  }

  componentDidUpdate(prevProps: MobileSidebarProps) {
    if (prevProps.isVisible !== this.props.isVisible) {
      this.animateSlider();
    }
  }

  private animateSlider = () => {
    Animated.timing(this.state.slideAnimation, {
      toValue: this.props.isVisible ? 0 : -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  private getMenuItems = (role?: string): MenuItem[] => {
    // Removed debug statement: console.log('🔍 [MobileSidebar] Getting menu items for role:', role);

    const commonItems: MenuItem[] = [
      {
        id: 'profile',
        title: 'Profile Settings',
        subtitle: 'Manage your account',
        icon: 'person.circle.fill',
        route: '/screens/profile',
        color: '#6366F1',
      },
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Manage alerts & updates',
        icon: 'bell.fill',
        route: '/screens/notifications',
        badge: 5,
        color: '#8B5CF6',
      },
    ];

    switch (role) {
      case 'superadmin':
        return [
          {
            id: 'dashboard',
            title: 'Super Admin Dashboard',
            subtitle: 'Platform overview & management',
            icon: 'rectangle.3.group.fill',
            route: 'screens/super-admin-dashboard',
            color: '#DC2626',
          },
          {
            id: 'analytics',
            title: 'Platform Analytics',
            subtitle: 'Growth metrics & insights',
            icon: 'chart.bar.fill',
            route: 'screens/super-admin-dashboard?tab=analytics',
            color: '#DC2626',
          },
          {
            id: 'onboarding',
            title: 'School Onboarding',
            subtitle: 'Approve pending schools',
            icon: 'plus.app',
            route: 'screens/super-admin-dashboard?tab=onboarding',
            color: '#DC2626',
          },
          {
            id: 'users',
            title: 'User Management',
            subtitle: 'Manage all platform users',
            icon: 'person.3.fill',
            route: 'screens/super-admin-dashboard?tab=users',
            color: '#DC2626',
          },
          {
            id: 'schools',
            title: 'School Management',
            subtitle: 'Monitor all schools',
            icon: 'building.2.fill',
            route: 'screens/super-admin-dashboard?tab=schools',
            color: '#DC2626',
          },
          {
            id: 'billing',
            title: 'Billing & Subscriptions',
            subtitle: 'Revenue & payment tracking',
            icon: 'creditcard.fill',
            route: 'screens/super-admin-dashboard?tab=billing',
            color: '#DC2626',
          },
          {
            id: 'ai-usage',
            title: 'AI Usage Monitoring',
            subtitle: 'Track AI costs & limits',
            icon: 'brain.head.profile',
            route: 'screens/super-admin-dashboard?tab=ai-usage',
            color: '#DC2626',
          },
          {
            id: 'content-moderation',
            title: 'Content Moderation',
            subtitle: 'Review flagged content',
            icon: 'flag',
            route: 'screens/super-admin-dashboard?tab=moderation',
            color: '#DC2626',
          },
          {
            id: 'system',
            title: 'System Health',
            subtitle: 'Platform monitoring',
            icon: 'gear',
            route: 'screens/super-admin-dashboard?tab=system',
            color: '#DC2626',
          },
          {
            id: 'reports',
            title: 'Platform Reports',
            subtitle: 'Export & compliance',
            icon: 'doc.text.fill',
            route: 'screens/super-admin-dashboard?tab=reports',
            color: '#DC2626',
          },
          {
            id: 'settings',
            title: 'Platform Settings',
            subtitle: 'Global configuration',
            icon: 'gearshape.fill',
            route: '/screens/settings',
            color: '#DC2626',
          },
          {
            id: 'announcements',
            title: 'Platform Announcements',
            subtitle: 'Broadcast to all schools',
            icon: 'megaphone',
            route: 'screens/super-admin-dashboard?tab=announcements',
            color: '#DC2626',
          },
          { id: 'divider1', title: '', divider: true },
          ...commonItems,
          { id: 'divider2', title: '', divider: true },
        ];

      case 'preschool_admin':
        return [
          {
            id: 'teachers',
            title: 'Teacher Management',
            subtitle: 'Manage teaching staff',
            icon: 'person.2.fill',
            route: '/screens/teachers',
            color: '#059669',
          },
          {
            id: 'students',
            title: 'Student Directory',
            subtitle: 'All student information',
            icon: 'graduationcap.fill',
            route: '/screens/students',
            color: '#059669',
          },
          {
            id: 'parents',
            title: 'Parent Communications',
            subtitle: 'Parent engagement tools',
            icon: 'person.3.fill',
            route: '/screens/parents',
            badge: 8,
            color: '#059669',
          },
          {
            id: 'reports',
            title: 'School Reports',
            subtitle: 'Performance analytics',
            icon: 'doc.text.fill',
            route: '/screens/principal-reports',
            color: '#059669',
          },
          {
            id: 'calendar',
            title: 'School Calendar',
            subtitle: 'Events & schedules',
            icon: 'calendar',
            route: '/(tabs)/lessons',
            color: '#059669',
          },
          {
            id: 'activities',
            title: 'School Reports',
            subtitle: 'Academic reports & analytics',
            icon: 'figure.run',
            route: '/(tabs)/activities',
            color: '#059669',
          },
          {
            id: 'settings',
            title: 'School Settings',
            subtitle: 'Configure school',
            icon: 'gearshape.fill',
            route: '/screens/settings',
            color: '#059669',
          },
          { id: 'divider1', title: '', divider: true },
          ...commonItems,
          { id: 'divider2', title: '', divider: true },
        ];

      case 'principal':
        return [
          {
            id: 'teachers',
            title: 'Teacher Management',
            subtitle: 'Manage teaching staff',
            icon: 'person.2.fill',
            route: '/screens/teachers',
            color: '#059669',
          },
          {
            id: 'students',
            title: 'Student Directory',
            subtitle: 'All student information',
            icon: 'graduationcap.fill',
            route: '/screens/students',
            color: '#059669',
          },
          {
            id: 'parents',
            title: 'Parent Communications',
            subtitle: 'Parent engagement tools',
            icon: 'person.3.fill',
            route: '/screens/parents',
            badge: 8,
            color: '#059669',
          },
          {
            id: 'reports',
            title: 'School Reports',
            subtitle: 'Performance analytics',
            icon: 'doc.text.fill',
            route: '/screens/principal-reports',
            color: '#059669',
          },
          {
            id: 'calendar',
            title: 'School Calendar',
            subtitle: 'Events & schedules',
            icon: 'calendar',
            route: '/(tabs)/lessons',
            color: '#059669',
          },
          {
            id: 'activities',
            title: 'School Reports',
            subtitle: 'Academic reports & analytics',
            icon: 'figure.run',
            route: '/(tabs)/activities',
            color: '#059669',
          },
          {
            id: 'settings',
            title: 'School Settings',
            subtitle: 'Configure school',
            icon: 'gearshape.fill',
            route: '/screens/settings',
            color: '#059669',
          },
          { id: 'divider1', title: '', divider: true },
          ...commonItems,
          { id: 'divider2', title: '', divider: true },
        ];

      case 'teacher':
        return [
          {
            id: 'students',
            title: 'My Students',
            subtitle: 'Class roster & details',
            icon: 'graduationcap.fill',
            route: '/students',
            color: '#7C3AED',
          },
          {
            id: 'assignments',
            title: 'Assignments',
            subtitle: 'Create & manage tasks',
            icon: 'doc.text.fill',
            route: '/assignments',
            badge: 12,
            color: '#7C3AED',
          },
          {
            id: 'gradebook',
            title: 'Grade Book',
            subtitle: 'Student progress tracking',
            icon: 'chart.bar.fill',
            route: '/gradebook',
            color: '#7C3AED',
          },
          {
            id: 'resources',
            title: 'Teaching Resources',
            subtitle: 'Lesson materials & tools',
            icon: 'folder.fill',
            route: '/resources',
            color: '#7C3AED',
          },
          {
            id: 'calendar',
            title: 'Class Schedule',
            subtitle: 'Daily teaching schedule',
            icon: 'calendar',
            route: '/schedule',
            color: '#7C3AED',
          },
          {
            id: 'activities',
            title: 'Activities & Events',
            subtitle: 'Class activities & programs',
            icon: 'figure.run',
            route: '/(tabs)/activities',
            color: '#7C3AED',
          },
          { id: 'divider1', title: '', divider: true },
          {
            id: 'settings',
            title: 'Settings',
            subtitle: 'App preferences & config',
            icon: 'gearshape.fill',
            route: '/screens/settings',
            color: '#6366F1',
          },
          ...commonItems,
          { id: 'divider2', title: '', divider: true },
        ];

      case 'parent':
        return [
          {
            id: 'homework',
            title: 'Homework & Tasks',
            subtitle: 'View & submit assignments',
            icon: 'doc.text.fill',
            route: '/homework',
            badge: 3,
            color: '#2563EB',
          },
          {
            id: 'progress',
            title: 'Progress Reports',
            subtitle: 'Academic progress tracking',
            icon: 'chart.line.uptrend.xyaxis',
            route: '/progress',
            color: '#2563EB',
          },
          {
            id: 'attendance',
            title: 'Attendance',
            subtitle: 'Daily attendance records',
            icon: 'checkmark.circle.fill',
            route: '/attendance',
            color: '#2563EB',
          },
          {
            id: 'calendar',
            title: 'School Calendar',
            subtitle: 'Events & important dates',
            icon: 'calendar',
            route: '/calendar',
            color: '#2563EB',
          },
          {
            id: 'payments',
            title: 'Payments & Fees',
            subtitle: 'School billing & payments',
            icon: 'creditcard.fill',
            route: '/payments',
            color: '#2563EB',
          },
          {
            id: 'videocalls',
            title: 'Video Calls',
            subtitle: 'Schedule & join meetings',
            icon: 'video.fill',
            route: '/(tabs)/videocalls',
            color: '#2563EB',
          },
          {
            id: 'activities',
            title: 'Activities & Events',
            subtitle: 'Extracurricular programs',
            icon: 'figure.run',
            route: '/activities',
            color: '#2563EB',
          },
          { id: 'divider1', title: '', divider: true },
          {
            id: 'settings',
            title: 'Settings',
            subtitle: 'App preferences & config',
            icon: 'gearshape.fill',
            route: '/screens/settings',
            color: '#6366F1',
          },
          ...commonItems,
          { id: 'divider2', title: '', divider: true },
        ];

      default:
        return [
          ...commonItems,
        ];
    }
  };

  private handleItemPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.route && this.props.onNavigate) {
      this.props.onNavigate(item.route);
    }
    this.props.onClose();
  };

  private renderMenuItem = (item: MenuItem) => {
    if (item.divider) {
      return <View key={item.id} style={styles.divider} />;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={() => this.handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
          <IconSymbol name={item.icon as any} size={22} color={item.color || '#6B7280'} />
        </View>
        <View style={styles.menuContent}>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            )}
          </View>
          <View style={styles.menuAction}>
            {item.badge && item.badge > 0 && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>
                  {item.badge > 99 ? '99+' : item.badge.toString()}
                </Text>
              </View>
            )}
            <IconSymbol name="chevron.right" size={14} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  private renderHeader = () => {
    const { userProfile } = this.props;
    const roleColors = getRoleColors(userProfile?.role || 'default', this.state.colorScheme);

    return (
      <LinearGradient
        colors={roleColors.gradient}
        style={styles.sidebarHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.closeButton} onPress={this.props.onClose}>
          <IconSymbol name="xmark" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Image
              source={{ uri: userProfile?.avatar || 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=User' }}
              style={styles.avatarImage}
            />
          </View>
          <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
          <Text style={styles.userRole}>
            {userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'User'}
          </Text>
        </View>
      </LinearGradient>
    );
  };

  render() {
    if (!this.props.isVisible) return null;

    const menuItems = this.getMenuItems(this.props.userProfile?.role);

    // Removed debug statement: console.log('🔍 [MobileSidebar] Final menu items count:', menuItems.length);
    // Removed debug statement: console.log('🔍 [MobileSidebar] User profile role:', this.props.userProfile?.role);

    return (
      <Modal
        visible={this.props.isVisible}
        transparent={true}
        animationType="none"
        onRequestClose={this.props.onClose}
      >
        <View style={styles.overlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />

          {/* Backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={this.props.onClose}
          />

          {/* Sidebar */}
          <Animated.View
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: this.state.slideAnimation }],
              },
            ]}
          >
            {this.renderHeader()}

            <ScrollView
              style={styles.menuScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuContainer}
            >
              {menuItems.map(this.renderMenuItem)}
            </ScrollView>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={this.props.onSignOut}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FEE2E2', '#FECACA']}
                style={styles.signOutGradient}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#EF444420' }]}>
                  <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#DC2626" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: '#DC2626', fontWeight: '700' }]}>Sign Out</Text>
                  <Text style={[styles.menuSubtitle, { color: '#991B1B' }]}>Exit your account</Text>
                </View>
                <View style={styles.signOutArrow}>
                  <IconSymbol name="chevron.right" size={16} color="#DC2626" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Math.min(320, screenWidth * 0.78), // Cap at 320px or 78% of screen width
    height: screenHeight,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 20,
  },
  sidebarHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuScrollView: {
    flex: 1,
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 140, // More space so the sticky Sign Out is not hidden
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginLeft: 60,
  },
  signOutButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 30,
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderTopWidth: 2,
    borderTopColor: '#FCA5A5',
  },
  signOutArrow: {
    marginLeft: 8,
  },
});
