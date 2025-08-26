/**
 * Standardized Navigation System for EduDash Pro
 * 
 * This component ensures consistent navigation across all screens and roles.
 * It handles role-based styling, unified sidebar menu, and standardized header.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getRoleColors } from '@/constants/Colors';
import { MobileSidebar } from './MobileSidebar';

const { width: screenWidth } = Dimensions.get('window');

interface StandardizedNavigationProps {
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
  schoolName?: string;
  title?: string; // Optional custom title
  onNavigate?: (route: string) => void;
  onSignOut?: () => void;
  notificationCount?: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function StandardizedNavigation({
  user,
  schoolName,
  title,
  onNavigate,
  onSignOut,
  notificationCount = 0,
  showBackButton = false,
  onBackPress,
}: StandardizedNavigationProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const roleColors = getRoleColors(user?.role || 'default', 'light');

  const getDisplayTitle = () => {
    if (title) return title;
    
    switch (user?.role) {
      case 'superadmin':
        return 'EduDash Pro Platform';
      case 'preschool_admin':
      case 'principal':
        return schoolName || 'School Dashboard';
      case 'teacher':
        return schoolName || 'Teacher Dashboard';
      case 'parent':
        return schoolName || 'Parent Dashboard';
      default:
        return 'EduDash Pro';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Platform Admin';
      case 'preschool_admin':
      case 'principal':
        return 'Principal';
      case 'teacher':
        return 'Teacher';
      case 'parent':
        return 'Parent';
      default:
        return 'User';
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleNotifications = () => {
    onNavigate?.('/notifications');
  };

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
          {/* Glass morphism overlay */}
          <View style={styles.glassOverlay} />
          
          <View style={styles.headerContent}>
            {/* Left Section */}
            <View style={styles.leftSection}>
              {showBackButton ? (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBackPress}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.avatarButton}
                  onPress={toggleSidebar}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {firstName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.statusIndicator} />
                </TouchableOpacity>
              )}
              
              <View style={styles.titleSection}>
                <Text style={styles.appTitle}>{getDisplayTitle()}</Text>
                <View style={styles.userInfoRow}>
                  <Text style={styles.userName}>{firstName}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{getRoleDisplayName(user?.role)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Section */}
            <View style={styles.rightSection}>
              {/* Notifications */}
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleNotifications}
                activeOpacity={0.7}
              >
                <IconSymbol name="bell.fill" size={22} color="#FFFFFF" />
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      {/* Sidebar */}
      <MobileSidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        userProfile={user}
        onSignOut={onSignOut || (() => {})}
        onNavigate={onNavigate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 1000,
  },
  header: {
    height: 120,
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarButton: {
    position: 'relative',
    marginRight: 12,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleSection: {
    flex: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
