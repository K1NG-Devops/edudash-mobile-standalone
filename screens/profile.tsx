/* eslint-disable */
// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthConsumer, AuthContextType } from '@/contexts/NoHooksAuthContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

class ProfileScreen extends React.Component {
  getProfileSections = () => {
    return [
      {
        title: 'Account',
        items: [
          { label: 'Personal Information', icon: 'person.circle', route: '/profile/personal' },
          { label: 'Notifications', icon: 'bell', route: '/profile/notifications' },
          { label: 'Privacy & Security', icon: 'lock.shield', route: '/profile/security' },
        ]
      },
      {
        title: 'Support',
        items: [
          { label: 'Help Center', icon: 'questionmark.circle', route: '/help' },
          { label: 'Contact Support', icon: 'message', route: '/support' },
          { label: 'Report an Issue', icon: 'exclamationmark.triangle', route: '/report' },
        ]
      },
      {
        title: 'About',
        items: [
          { label: 'Terms of Service', icon: 'doc.text', route: '/terms' },
          { label: 'Privacy Policy', icon: 'hand.raised', route: '/privacy' },
          { label: 'App Version', icon: 'info.circle', value: '1.0.0' },
        ]
      }
    ];
  };

  renderContent = (auth: AuthContextType) => {
    const { profile, signOut } = auth;
    const profileSections = this.getProfileSections();

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            <Text style={styles.name}>{profile?.name || 'User'}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.role}>{profile?.role?.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>

          {/* Address Info */}
          {(profile?.address || profile?.home_address) && (
            <View style={styles.schoolInfo}>
              <View style={styles.schoolIcon}>
                <IconSymbol name="house.fill" size={24} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.schoolName}>Address</Text>
                <Text style={styles.schoolCode}>{profile.address || profile.home_address}</Text>
              </View>
            </View>
          )}

          {/* Profile Sections */}
          {profileSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity 
                    key={itemIndex} 
                    style={[
                      styles.sectionItem,
                      itemIndex === section.items.length - 1 && styles.lastItem
                    ]}
                  >
                    <View style={styles.itemIcon}>
                      <IconSymbol name={item.icon as any} size={20} color="#6B7280" />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.value ? (
                      <Text style={styles.itemValue}>{item.value}</Text>
                    ) : (
                      <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  roleContainer: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  role: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  schoolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  schoolCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  itemValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});
