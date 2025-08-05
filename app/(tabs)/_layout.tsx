import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import HapticTab from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';

function TabLayoutContent({ role }: { role: string }) {
  const colorScheme = useColorScheme();

  const tabsConfig = {
    parent: [
      { name: 'dashboard', title: 'Dashboard', icon: 'house' },
      { name: 'lessons', title: 'Lessons', icon: 'book' },
      { name: 'payment', title: 'Payment', icon: 'creditcard' },
      { name: 'activities', title: 'Activities', icon: 'figure.run' },
    ],
    teacher: [
      { name: 'dashboard', title: 'Dashboard', icon: 'house' },
      { name: 'lessons', title: 'Lessons', icon: 'book' },
      { name: 'videocalls', title: 'Video Calls', icon: 'camera' },
    ],
    admin: [
      { name: 'dashboard', title: 'Dashboard', icon: 'house' },
      { name: 'settings', title: 'Settings', icon: 'gear' },
      { name: 'messages', title: 'Messages', icon: 'envelope' },
    ],
  };

  const selectedTabs = tabsConfig[role] || tabsConfig.parent;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            paddingHorizontal: 20,
            paddingBottom: 10,
            height: 88,
          },
          default: {
            paddingHorizontal: 20,
            paddingBottom: 10,
            height: 70,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        }),
      }}>
      {selectedTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={28} name={focused ? `${tab.icon}.fill` : tab.icon} color={color} />
            ),
          }}
        />
      ))}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="videocalls"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <AuthConsumer>
      {({ profile }) => {
        const role = profile?.role || 'parent';
        return <TabLayoutContent role={role} />;
      }}
    </AuthConsumer>
  );
}
