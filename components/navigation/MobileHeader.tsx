import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, getRoleColors } from '@/constants/Colors';
import { MobileSidebar } from './MobileSidebar';

interface MobileHeaderProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
  onNotificationsPress?: () => void;
  onSearchPress?: () => void;
  onNavigate?: (route: string) => void;
  onSignOut?: () => void;
  notificationCount?: number;
}

interface MobileHeaderState {
  colorScheme: 'light' | 'dark';
  sidebarVisible: boolean;
}

export class MobileHeader extends React.Component<MobileHeaderProps, MobileHeaderState> {
  state: MobileHeaderState = {
    colorScheme: 'light',
    sidebarVisible: false,
  };

  private getRoleTitle = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Platform Admin';
      case 'principal':
        return 'School Principal';
      case 'teacher':
        return 'Teacher';
      case 'parent':
        return 'Parent';
      default:
        return 'EduDash Pro';
    }
  };

  private getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  private toggleSidebar = () => {
    this.setState({ sidebarVisible: !this.state.sidebarVisible });
  };

  private closeSidebar = () => {
    this.setState({ sidebarVisible: false });
  };

  private handleNavigate = (route: string) => {
    this.closeSidebar();
    if (this.props.onNavigate) {
      this.props.onNavigate(route);
    }
  };

  private handleSignOut = () => {
    this.closeSidebar();
    if (this.props.onSignOut) {
      this.props.onSignOut();
    }
  };

  private toggleTheme = () => {
    this.setState({
      colorScheme: this.state.colorScheme === 'light' ? 'dark' : 'light'
    });
  };

  render() {
    const { user, onNotificationsPress, onSearchPress, notificationCount } = this.props;
    const { sidebarVisible } = this.state;
    const roleColors = getRoleColors(user?.role || 'default', this.state.colorScheme);
    const firstName = user?.name?.split(' ')[0] || 'User';

    return (
      <>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: roleColors.gradient[0] }]}>
          <StatusBar 
            barStyle="light-content"
            backgroundColor={roleColors.gradient[0]}
            translucent={false}
          />
          <LinearGradient
            colors={[...roleColors.gradient, 'rgba(0,0,0,0.1)']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Modern glass morphism overlay */}
            <View style={styles.glassOverlay} />
            
            <View style={styles.headerContent}>
              {/* Left side - Avatar & Greeting */}
              <View style={styles.leftSection}>
                <TouchableOpacity
                  style={styles.avatarButton}
                  onPress={this.toggleSidebar}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {firstName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.statusIndicator} />
                </TouchableOpacity>
                
                <View style={styles.greetingSection}>
                  <Text style={styles.userName}>{firstName}</Text>
                  <View style={styles.roleContainer}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleTitle}>{this.getRoleTitle(user?.role)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right side - Actions */}
              <View style={styles.rightSection}>
                {/* Theme Toggle Button */}
                <TouchableOpacity
                  style={styles.modernActionButton}
                  onPress={this.toggleTheme}
                  activeOpacity={0.7}
                >
                  <IconSymbol 
                    name={this.state.colorScheme === 'light' ? 'moon.fill' : 'sun.max.fill'} 
                    size={18} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
                
                {/* Search Button */}
                {onSearchPress && (
                  <TouchableOpacity
                    style={styles.modernActionButton}
                    onPress={onSearchPress}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="magnifyingglass" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}

                {/* Notifications Button */}
                {onNotificationsPress && (
                  <TouchableOpacity
                    style={styles.modernActionButton}
                    onPress={onNotificationsPress}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="bell" size={18} color="#FFFFFF" />
                    {notificationCount && notificationCount > 0 && (
                      <View style={styles.modernNotificationBadge}>
                        <Text style={styles.notificationBadgeText}>
                          {notificationCount > 99 ? '99+' : notificationCount.toString()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </SafeAreaView>

        {/* Mobile Sidebar */}
        <MobileSidebar
          isVisible={sidebarVisible}
          onClose={this.closeSidebar}
          userProfile={user}
          onSignOut={this.handleSignOut}
          onNavigate={this.handleNavigate}
        />
      </>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#6366F1', // Fallback color
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    paddingTop: 32,
    minHeight: 105,
  },
headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
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
    overflow: 'hidden',
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
  },
  roleTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
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
    marginRight: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    marginLeft: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
});
