import { IconSymbol } from '@/components/ui/IconSymbol';
import { getRoleColors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { MobileSidebar } from './MobileSidebar';

interface MobileHeaderProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
  schoolName?: string; // Add school name prop
  onNotificationsPress?: () => void;
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
    console.log('🏫 [DEBUG] getRoleTitle called with role:', role);
    console.log('🏫 [DEBUG] schoolName prop:', this.props.schoolName);
    
    // If we have a school name, prioritize showing it for school roles
    if (this.props.schoolName && (role === 'preschool_admin' || role === 'principal' || role === 'teacher')) {
      console.log('🏫 [DEBUG] Returning school name:', this.props.schoolName);
      return this.props.schoolName;
    }
    
    switch (role) {
      case 'superadmin':
        return 'Platform Admin';
      case 'preschool_admin':
        return 'School Principal';
      case 'principal':
        return 'School Principal';
      case 'teacher':
        return 'Teacher';
      case 'parent':
        return this.props.schoolName || 'Parent Dashboard';
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
    const { user, onNotificationsPress, notificationCount } = this.props;
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
            colors={[roleColors.gradient[0], roleColors.gradient[1], 'rgba(0,0,0,0.1)']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Modern glass morphism overlay */}
            <View style={styles.glassOverlay} />
            
            <View style={styles.headerContent}>
              {/* Left side - Avatar & User Info */}
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
                  {/* Show EduDash Pro for superadmin, otherwise school name */}
                  {user?.role === 'superadmin' ? (
                    <Text style={styles.brandName}>EduDash Pro</Text>
                  ) : this.props.schoolName && (
                    <Text style={styles.schoolName}>{this.props.schoolName}</Text>
                  )}
                  
                  {/* User info below */}
                  <View style={styles.userInfoRow}>
                    <Text style={styles.userName}>{firstName}</Text>
                    <View style={styles.roleContainer}>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleTitle}>
                          {user?.role === 'preschool_admin' ? 'Principal' : 
                           user?.role === 'teacher' ? 'Teacher' :
                           user?.role === 'parent' ? 'Parent' :
                           user?.role === 'superadmin' ? 'Platform Admin' : 'User'}
                        </Text>
                      </View>
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
  // New styles for redesigned header
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
