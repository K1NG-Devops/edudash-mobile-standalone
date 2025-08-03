import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AuthConsumer, UserProfile } from '@/contexts/SimpleWorkingAuth';

const { width: screenWidth } = Dimensions.get('window');

interface Child {
  id: string;
  name: string;
  age: number;
  class: string;
  teacher: string;
  attendance: number;
  avatar: string;
  recentActivity: string;
  nextEvent: string;
}

interface Notification {
  id: string;
  type: 'message' | 'achievement' | 'homework' | 'reminder';
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface ParentDashboardState {
  selectedChildId: string;
  refreshing: boolean;
  notifications: Notification[];
  children: Child[];
}

class ParentDashboard extends React.Component<{}, ParentDashboardState> {
  state: ParentDashboardState = {
    selectedChildId: '1',
    refreshing: false,
    notifications: [
      {
        id: '1',
        type: 'message',
        title: 'Message from Ms. Johnson',
        message: 'Emma had a wonderful day in art class!',
        time: '30 min ago',
        unread: true,
      },
      {
        id: '2',
        type: 'achievement',
        title: 'New Achievement!',
        message: 'Emma earned the "Color Expert" badge',
        time: '2 hours ago',
        unread: true,
      },
      {
        id: '3',
        type: 'homework',
        title: 'Homework Reminder',
        message: 'Color Recognition Practice due tomorrow',
        time: '4 hours ago',
        unread: false,
      },
    ],
    children: [
      {
        id: '1',
        name: 'Emma Thompson',
        age: 4,
        class: 'Pre-K A',
        teacher: 'Ms. Sarah Johnson',
        attendance: 95,
        avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Emma',
        recentActivity: 'Completed art project with finger painting',
        nextEvent: 'Show and Tell - Tomorrow 10:00 AM',
      },
      {
        id: '2',
        name: 'Alex Thompson',
        age: 3,
        class: 'Toddler B',
        teacher: 'Ms. Lisa Chen',
        attendance: 88,
        avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Alex',
        recentActivity: 'Learned new counting song',
        nextEvent: 'Music Class - Friday 2:00 PM',
      },
    ],
  };

  onRefresh = () => {
    this.setState({ refreshing: true });
    // Simulate data refresh
    setTimeout(() => this.setState({ refreshing: false }), 2000);
  };

  getSelectedChild = () => {
    return this.state.children.find(child => child.id === this.state.selectedChildId) || this.state.children[0];
  };

  getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return 'message.fill';
      case 'achievement':
        return 'trophy.fill';
      case 'homework':
        return 'doc.text.fill';
      case 'reminder':
        return 'bell.fill';
      default:
        return 'bell.fill';
    }
  };

  getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return '#3B82F6';
      case 'achievement':
        return '#F59E0B';
      case 'homework':
        return '#EF4444';
      case 'reminder':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  render() {
    const selectedChild = this.getSelectedChild();
    const unreadNotifications = this.state.notifications.filter(n => n.unread).length;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.greeting}>Good morning! 👋</Text>
                  <Text style={styles.headerSubtitle}>
                    Let's see how {selectedChild?.name} is doing today
                  </Text>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                  <IconSymbol name="bell.fill" size={24} color="#FFFFFF" />
                  {unreadNotifications > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Child Selector */}
          <View style={styles.childSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScrollView}>
              {this.state.children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childCard,
                    child.id === this.state.selectedChildId && styles.childCardSelected,
                  ]}
                  onPress={() => this.setState({ selectedChildId: child.id })}
                >
                  <View style={styles.childAvatar}>
                    <Image source={{ uri: child.avatar }} style={styles.avatarImage} />
                  </View>
                  <Text style={[
                    styles.childName,
                    child.id === this.state.selectedChildId && styles.childNameSelected,
                  ]}>
                    {child.name}
                  </Text>
                  <Text style={styles.childAge}>{child.age} years</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Child Overview Card */}
          <View style={styles.overviewCard}>
            <LinearGradient
              colors={['#FF6B6B', '#4ECDC4']}
              style={styles.overviewGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.overviewContent}>
                <View style={styles.overviewHeader}>
                  <View style={styles.childInfo}>
                    <Text style={styles.childDisplayName}>{selectedChild?.name}</Text>
                    <Text style={styles.childDetails}>
                      {selectedChild?.class} • {selectedChild?.teacher}
                    </Text>
                  </View>
                  <View style={styles.attendanceContainer}>
                    <Text style={styles.attendanceLabel}>Attendance</Text>
                    <Text style={styles.attendanceValue}>{selectedChild?.attendance}%</Text>
                  </View>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <IconSymbol name="heart.fill" size={20} color="#FFFFFF" />
                    <Text style={styles.statLabel}>Mood</Text>
                    <Text style={styles.statValue}>😊 Happy</Text>
                  </View>
                  <View style={styles.statItem}>
                    <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color="#FFFFFF" />
                    <Text style={styles.statLabel}>Progress</Text>
                    <Text style={styles.statValue}>Excellent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <IconSymbol name="trophy.fill" size={20} color="#FFFFFF" />
                    <Text style={styles.statLabel}>Achievements</Text>
                    <Text style={styles.statValue}>5 New</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#3B82F6' }]}>
                <IconSymbol name="message.fill" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Message Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#10B981' }]}>
                <IconSymbol name="doc.text.fill" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Submit Homework</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#F59E0B' }]}>
                <IconSymbol name="calendar" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>View Calendar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#8B5CF6' }]}>
                <IconSymbol name="chart.bar.fill" size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Progress Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Updates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            <View style={styles.updatesContainer}>
              {this.state.notifications.slice(0, 3).map((notification) => (
                <View key={notification.id} style={styles.updateCard}>
                  <View style={[
                    styles.updateIcon,
                    { backgroundColor: this.getNotificationColor(notification.type) }
                  ]}>
                    <IconSymbol
                      name={this.getNotificationIcon(notification.type)}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.updateContent}>
                    <Text style={styles.updateTitle}>{notification.title}</Text>
                    <Text style={styles.updateMessage}>{notification.message}</Text>
                    <Text style={styles.updateTime}>{notification.time}</Text>
                  </View>
                  {notification.unread && <View style={styles.unreadDot} />}
                </View>
              ))}
            </View>
          </View>

          {/* Today's Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Activity</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <IconSymbol name="clock.fill" size={20} color="#667eea" />
                <Text style={styles.activityTitle}>Recent Activity</Text>
              </View>
              <Text style={styles.activityDescription}>
                {selectedChild?.recentActivity}
              </Text>
            </View>
            
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <IconSymbol name="calendar" size={20} color="#667eea" />
                <Text style={styles.activityTitle}>Next Event</Text>
              </View>
              <Text style={styles.activityDescription}>
                {selectedChild?.nextEvent}
              </Text>
            </View>
          </View>

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export default function ParentsScreen() {
  return (
    <AuthConsumer>
      {({ userProfile }) => (
        userProfile?.role === 'parent' ? (
          <ParentDashboard />
        ) : (
          <View style={styles.container}>
            <Text style={styles.title}>Parent Dashboard</Text>
            <Text style={styles.subtitle}>Please log in as a parent to access this feature</Text>
          </View>
        )
      )}
    </AuthConsumer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  childSelector: {
    marginTop: -15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  childScrollView: {
    flexDirection: 'row',
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childCardSelected: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  childNameSelected: {
    color: '#FFFFFF',
  },
  childAge: {
    fontSize: 12,
    color: '#6B7280',
  },
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  overviewGradient: {
    padding: 20,
  },
  overviewContent: {
    flex: 1,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  childInfo: {
    flex: 1,
  },
  childDisplayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 16,
    color: '#E5E7EB',
    opacity: 0.9,
  },
  attendanceContainer: {
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  attendanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (screenWidth - 55) / 2,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  updatesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateCard: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  updateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  updateMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  updateTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 50,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
});
