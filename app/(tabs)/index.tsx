import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthConsumer, UserProfile } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface HomeScreenState {
  refreshing: boolean;
}

class HomeScreen extends React.Component<{}, HomeScreenState> {
  state: HomeScreenState = {
    refreshing: false,
  };

  onRefresh = () => {
    this.setState({ refreshing: true });
    // Add refresh logic here
    setTimeout(() => this.setState({ refreshing: false }), 2000);
  };

  private getDashboardContent = (profile: UserProfile | null) => {
    const role = profile?.role;
    const firstName = profile?.name?.split(' ')[0] || 'User';
    
    switch (role) {
      case 'superadmin':
        return {
          greeting: `Welcome back, ${firstName}`,
          subtitle: 'Super Admin Dashboard',
          stats: [
            { label: 'Total Schools', value: '127', icon: 'building.2.fill', color: '#3B82F6' },
            { label: 'Active Users', value: '2,847', icon: 'person.3.fill', color: '#10B981' },
            { label: 'Revenue', value: 'R 45K', icon: 'dollarsign.circle.fill', color: '#F59E0B' },
            { label: 'Issues', value: '3', icon: 'exclamationmark.triangle.fill', color: '#EF4444' },
          ],
          actions: [
            { title: 'Manage Schools', icon: 'building.2.fill', route: '/schools' },
            { title: 'User Analytics', icon: 'chart.bar.fill', route: '/analytics' },
            { title: 'Support Tickets', icon: 'message.fill', route: '/support' },
          ]
        };
      
      case 'principal':
        return {
          greeting: `Good morning, ${firstName}`,
          subtitle: `Principal • School`,
          stats: [
            { label: 'Teachers', value: '24', icon: 'person.2.fill', color: '#3B82F6' },
            { label: 'Students', value: '450', icon: 'graduationcap.fill', color: '#10B981' },
            { label: 'Parents', value: '380', icon: 'person.3.fill', color: '#8B5CF6' },
            { label: 'Classes', value: '18', icon: 'book.fill', color: '#F59E0B' },
          ],
          actions: [
            { title: 'Manage Teachers', icon: 'person.2.badge.plus', route: '/teachers' },
            { title: 'Student Reports', icon: 'chart.line.uptrend.xyaxis', route: '/reports' },
            { title: 'Parent Communication', icon: 'message.fill', route: '/messages' },
          ]
        };
      
      case 'teacher':
        return {
          greeting: `Hello, ${firstName}`,
          subtitle: `Teacher • School`,
          stats: [
            { label: 'My Classes', value: '6', icon: 'book.fill', color: '#3B82F6' },
            { label: 'Students', value: '150', icon: 'graduationcap.fill', color: '#10B981' },
            { label: 'Assignments', value: '12', icon: 'doc.text.fill', color: '#F59E0B' },
            { label: 'Pending Reviews', value: '8', icon: 'clock.fill', color: '#EF4444' },
          ],
          actions: [
            { title: 'Create Lesson', icon: 'plus.circle.fill', route: '/lessons/create' },
            { title: 'Grade Homework', icon: 'checkmark.circle.fill', route: '/homework/review' },
            { title: 'AI Assistant', icon: 'brain.head.profile', route: '/ai-assistant' },
          ]
        };
      
      case 'parent':
        return {
          greeting: `Hi, ${firstName}`,
          subtitle: `Parent • School`,
          stats: [
            { label: 'Children', value: '2', icon: 'figure.2.and.child.holdinghands', color: '#3B82F6' },
            { label: 'Assignments', value: '5', icon: 'doc.text.fill', color: '#F59E0B' },
            { label: 'Messages', value: '3', icon: 'message.fill', color: '#10B981' },
            { label: 'Events', value: '2', icon: 'calendar', color: '#8B5CF6' },
          ],
          actions: [
            { title: 'View Progress', icon: 'chart.line.uptrend.xyaxis', route: '/progress' },
            { title: 'Submit Homework', icon: 'plus.circle.fill', route: '/homework/submit' },
            { title: 'Teacher Chat', icon: 'message.fill', route: '/messages' },
          ]
        };
      
      default:
        return {
          greeting: `Welcome, ${firstName}`,
          subtitle: 'EduDash Pro',
          stats: [],
          actions: []
        };
    }
  };

  private renderContent = (auth: any) => {
    const { profile, signOut } = auth;
    const { refreshing } = this.state;
    const content = this.getDashboardContent(profile);

    return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} />}
      >
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{content.greeting}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        {content.stats.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              {content.stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                    <IconSymbol name={stat.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {content.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsList}>
              {content.actions.map((action, index) => (
                <TouchableOpacity key={index} style={styles.actionCard}>
                  <View style={styles.actionIcon}>
                    <IconSymbol name={action.icon} size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>Welcome to EduDash Pro Mobile! 🎉</Text>
            <Text style={styles.activityTime}>Just now</Text>
          </View>
        </View>
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

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signOutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  actionsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  activityContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 100, // Space for tab bar
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
  },
});
