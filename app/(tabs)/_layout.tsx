import { Tabs, router } from 'expo-router';
import React from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { AuthConsumer, UserProfile } from '@/contexts/SimpleWorkingAuth';

class TabLayout extends React.Component {
  private checkAuthAndRedirect = (user: any, loading: boolean) => {
    if (!loading && !user) {
      router.replace('/(auth)');
    }
  };

  private getTabsForRole = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return [
          { name: 'index', title: 'Dashboard', icon: 'chart.bar.fill' },
          { name: 'schools', title: 'Schools', icon: 'building.2.fill' },
          { name: 'users', title: 'Users', icon: 'person.3.fill' },
          { name: 'analytics', title: 'Analytics', icon: 'chart.line.uptrend.xyaxis' },
          { name: 'profile', title: 'Profile', icon: 'person.circle.fill' },
        ];
      
      case 'principal':
        return [
          { name: 'index', title: 'Dashboard', icon: 'house.fill' },
          { name: 'teachers', title: 'Teachers', icon: 'person.2.fill' },
          { name: 'students', title: 'Students', icon: 'graduationcap.fill' },
          { name: 'parents', title: 'Parents', icon: 'person.3.fill' },
          { name: 'profile', title: 'Profile', icon: 'person.circle.fill' },
        ];
      
      case 'teacher':
        return [
          { name: 'index', title: 'Dashboard', icon: 'house.fill' },
          { name: 'lessons', title: 'Lessons', icon: 'book.fill' },
          { name: 'students', title: 'Students', icon: 'graduationcap.fill' },
          { name: 'homework', title: 'Homework', icon: 'doc.text.fill' },
          { name: 'profile', title: 'Profile', icon: 'person.circle.fill' },
        ];
      
      case 'parent':
        return [
          { name: 'index', title: 'Home', icon: 'house.fill' },
          { name: 'children', title: 'Children', icon: 'figure.2.and.child.holdinghands' },
          { name: 'homework', title: 'Homework', icon: 'doc.text.fill' },
          { name: 'messages', title: 'Messages', icon: 'message.fill' },
          { name: 'profile', title: 'Profile', icon: 'person.circle.fill' },
        ];
      
      default:
        return [
          { name: 'index', title: 'Home', icon: 'house.fill' },
          { name: 'profile', title: 'Profile', icon: 'person.circle.fill' },
        ];
    }
  };

  private renderContent = (auth: any) => {
    const { user, profile, loading } = auth;
    
    // Check auth and redirect
    this.checkAuthAndRedirect(user, loading);

    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Loading...</Text>
        </View>
      );
    }

    if (!user) {
      return null; // Will redirect to auth
    }

    // Use 'light' as default instead of useColorScheme hook
    const colorScheme = 'light';
    const tabs = this.getTabsForRole(profile?.role);

    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color }) => <IconSymbol size={24} name={tab.icon} color={color} />,
            }}
          />
        ))}
      </Tabs>
    );
  };

  render() {
    return (
      <AuthConsumer>
        {(auth) => this.renderContent(auth)}
      </AuthConsumer>
    );
  }
}

export default TabLayout;
