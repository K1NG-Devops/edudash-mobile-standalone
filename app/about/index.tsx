import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Building, Users, Shield, BookOpen } from 'lucide-react-native';

export default function AboutScreen() {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const aboutItems = [
    {
      title: 'Company',
      description: 'Learn about our mission and values',
      icon: Building,
      route: '/about/company'
    },
    {
      title: 'Careers',
      description: 'Join our team and grow with us',
      icon: Users,
      route: '/about/careers'
    },
    {
      title: 'Security',
      description: 'How we protect your data',
      icon: Shield,
      route: '/about/security'
    },
    {
      title: 'Blog',
      description: 'Latest updates and insights',
      icon: BookOpen,
      route: '/about/blog'
    }
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: palette.textSecondary,
      lineHeight: 24,
    },
    content: {
      paddingHorizontal: 24,
    },
    itemContainer: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: palette.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 4,
    },
    itemDescription: {
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    chevronContainer: {
      marginLeft: 12,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>About EduDash Pro</Text>
          <Text style={styles.subtitle}>
            Empowering educators and families with AI-powered learning tools designed for South African education.
          </Text>
        </View>
        
        <View style={styles.content}>
          {aboutItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.itemContainer}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <IconComponent
                    size={20}
                    color={palette.primary}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
                <View style={styles.chevronContainer}>
                  <ChevronRight
                    size={16}
                    color={palette.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
