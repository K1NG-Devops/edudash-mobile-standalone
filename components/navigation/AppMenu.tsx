/* eslint-disable */
// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, getRoleColors } from '@/constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  route?: string;
  action?: () => void;
  badge?: number;
  color?: string;
  divider?: boolean;
}

interface AppMenuProps {
  isVisible: boolean;
  onClose: () => void;
  userProfile: any;
  onSignOut: () => void;
}

interface AppMenuState {
  colorScheme: 'light' | 'dark';
}

export class AppMenu extends React.Component<AppMenuProps, AppMenuState> {
  state: AppMenuState = {
    colorScheme: 'light',
  };

  private getMenuItems = (role?: string): MenuItem[] => {
    const baseItems: MenuItem[] = [
      {
        id: 'profile',
        title: 'Profile Settings',
        subtitle: 'Manage your account',
        icon: 'person.circle.fill',
        route: '/profile',
        color: '#6366F1',
      },
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Manage alerts & updates',
        icon: 'bell.fill',
        route: '/notifications',
        badge: 3,
        color: '#8B5CF6',
      },
    ];

    switch (role) {
      case 'superadmin':
        return [
          {
            id: 'dashboard',
            title: 'Analytics Dashboard',
            subtitle: 'Platform insights',
            icon: 'chart.line.uptrend.xyaxis',
            route: '/analytics',
            color: '#DC2626',
          },
          {
            id: 'users',
            title: 'User Management',
            subtitle: 'Manage all users',
            icon: 'person.3.fill',
            route: '/users',
            color: '#DC2626',
          },
          {
            id: 'billing',
            title: 'Billing & Revenue',
            subtitle: 'Financial overview',
            icon: 'creditcard.fill',
            route: '/billing',
            color: '#DC2626',
          },
          {
            id: 'settings',
            title: 'Platform Settings',
            subtitle: 'Global configuration',
            icon: 'gearshape.fill',
            route: '/settings',
            color: '#DC2626',
          },
          { id: 'divider1', title: '', divider: true },
          ...baseItems,
          { id: 'divider2', title: '', divider: true },
          {
            id: 'help',
            title: 'Help & Support',
            subtitle: 'Documentation & guides',
            icon: 'questionmark.circle.fill',
            route: '/help',
            color: '#6B7280',
          },
        ];

      case 'principal':
        return [
          {
            id: 'teachers',
            title: 'Teacher Management',
            subtitle: 'Manage teaching staff',
            icon: 'person.2.fill',
            route: '/teachers',
            color: '#059669',
          },
          {
            id: 'students',
            title: 'Student Overview',
            subtitle: 'Student information',
            icon: 'graduationcap.fill',
            route: '/students',
            color: '#059669',
          },
          {
            id: 'parents',
            title: 'Parent Communications',
            subtitle: 'Parent engagement',
            icon: 'person.3.fill',
            route: '/parents',
            badge: 5,
            color: '#059669',
          },
          {
            id: 'reports',
            title: 'School Reports',
            subtitle: 'Performance analytics',
            icon: 'doc.text.fill',
            route: '/reports',
            color: '#059669',
          },
          {
            id: 'calendar',
            title: 'School Calendar',
            subtitle: 'Events & schedules',
            icon: 'calendar',
            route: '/calendar',
            color: '#059669',
          },
          { id: 'divider1', title: '', divider: true },
          ...baseItems,
          { id: 'divider2', title: '', divider: true },
          {
            id: 'help',
            title: 'Help & Support',
            subtitle: 'Get assistance',
            icon: 'questionmark.circle.fill',
            route: '/help',
            color: '#6B7280',
          },
        ];

      case 'teacher':
        return [
          {
            id: 'students',
            title: 'My Students',
            subtitle: 'Class management',
            icon: 'graduationcap.fill',
            route: '/students',
            color: '#7C3AED',
          },
          {
            id: 'assignments',
            title: 'Assignments',
            subtitle: 'Create & grade work',
            icon: 'doc.text.fill',
            route: '/assignments',
            badge: 12,
            color: '#7C3AED',
          },
          {
            id: 'gradebook',
            title: 'Grade Book',
            subtitle: 'Student progress',
            icon: 'chart.bar.fill',
            route: '/gradebook',
            color: '#7C3AED',
          },
          {
            id: 'resources',
            title: 'Teaching Resources',
            subtitle: 'Lesson materials',
            icon: 'folder.fill',
            route: '/resources',
            color: '#7C3AED',
          },
          {
            id: 'calendar',
            title: 'Class Schedule',
            subtitle: 'Daily schedule',
            icon: 'calendar',
            route: '/schedule',
            color: '#7C3AED',
          },
          { id: 'divider1', title: '', divider: true },
          ...baseItems,
          { id: 'divider2', title: '', divider: true },
          {
            id: 'help',
            title: 'Teaching Help',
            subtitle: 'Resources & tips',
            icon: 'questionmark.circle.fill',
            route: '/help',
            color: '#6B7280',
          },
        ];

      case 'parent':
        return [
          {
            id: 'homework',
            title: 'Homework',
            subtitle: 'Assignments & submissions',
            icon: 'doc.text.fill',
            route: '/homework',
            badge: 2,
            color: '#2563EB',
          },
          {
            id: 'progress',
            title: 'Progress Reports',
            subtitle: 'Academic progress',
            icon: 'chart.line.uptrend.xyaxis',
            route: '/progress',
            color: '#2563EB',
          },
          {
            id: 'attendance',
            title: 'Attendance',
            subtitle: 'Daily attendance',
            icon: 'checkmark.circle.fill',
            route: '/attendance',
            color: '#2563EB',
          },
          {
            id: 'calendar',
            title: 'School Calendar',
            subtitle: 'Events & holidays',
            icon: 'calendar',
            route: '/calendar',
            color: '#2563EB',
          },
          {
            id: 'videocalls',
            title: 'Video Calls',
            subtitle: 'Schedule & join meetings',
            icon: 'video.fill',
            route: '/videocalls',
            color: '#2563EB',
          },
          {
            id: 'payments',
            title: 'Payments',
            subtitle: 'Fees & billing',
            icon: 'creditcard.fill',
            route: '/payments',
            color: '#2563EB',
          },
          { id: 'divider1', title: '', divider: true },
          ...baseItems,
          { id: 'divider2', title: '', divider: true },
          {
            id: 'help',
            title: 'Parent Guide',
            subtitle: 'How to use the app',
            icon: 'questionmark.circle.fill',
            route: '/help',
            color: '#6B7280',
          },
        ];

      default:
        return [
          ...baseItems,
          {
            id: 'help',
            title: 'Help & Support',
            subtitle: 'Get assistance',
            icon: 'questionmark.circle.fill',
            route: '/help',
            color: '#6B7280',
          },
        ];
    }
  };

  private handleItemPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      // Navigate to route

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
        <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
          <IconSymbol name={item.icon as any} size={24} color={item.color || '#6B7280'} />
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
            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
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
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.closeButton} onPress={this.props.onClose}>
            <IconSymbol name="xmark" size={24} color="#FFFFFF" />
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
        </View>
      </LinearGradient>
    );
  };

  render() {
    if (!this.props.isVisible) return null;

    const menuItems = this.getMenuItems(this.props.userProfile?.role);

    return (
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" />
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={this.props.onClose}
        />
        
        <View style={styles.menuContainer}>
          {this.renderHeader()}
          
          <ScrollView style={styles.menuScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.menuList}>
              {menuItems.map(this.renderMenuItem)}
              
              {/* Sign Out Button */}
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={this.props.onSignOut}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#EF444415' }]}>
                  <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#EF4444" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Sign Out</Text>
                  <Text style={styles.menuSubtitle}>Exit your account</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: screenWidth * 0.85,
    height: screenHeight,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    padding: 8,
  },
  userInfo: {
    alignItems: 'center',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuScrollView: {
    flex: 1,
  },
  menuList: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 14,
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
    marginRight: 12,
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginLeft: 64,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});
