import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

class SupportScreen extends React.Component {
  render() {
    return (
      <AuthConsumer>
        {(auth) => (
          <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <LinearGradient
                colors={['#DC2626', '#B91C1C']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Support Center</Text>
                  <Text style={styles.headerSubtitle}>
                    Platform support and user assistance
                  </Text>
                </View>
              </LinearGradient>

              {/* Support Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#EF4444' }]}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>7</Text>
                  <Text style={styles.statLabel}>Open Tickets</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
                    <IconSymbol name="clock.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>2.4h</Text>
                  <Text style={styles.statLabel}>Avg Response</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>98%</Text>
                  <Text style={styles.statLabel}>Resolved</Text>
                </View>
              </View>

              {/* Recent Support Tickets */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Tickets</Text>
                <View style={styles.ticketsList}>
                  <TouchableOpacity style={styles.ticketCard}>
                    <View style={styles.ticketHeader}>
                      <View style={[styles.ticketPriority, styles.priorityHigh]} />
                      <Text style={styles.ticketId}>#T-001</Text>
                      <View style={styles.ticketStatus}>
                        <Text style={styles.ticketStatusText}>Open</Text>
                      </View>
                    </View>
                    <Text style={styles.ticketTitle}>Login issues for Sunrise Academy</Text>
                    <Text style={styles.ticketDescription}>
                      Multiple users unable to access dashboard
                    </Text>
                    <Text style={styles.ticketTime}>2 hours ago</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.ticketCard}>
                    <View style={styles.ticketHeader}>
                      <View style={[styles.ticketPriority, styles.priorityMedium]} />
                      <Text style={styles.ticketId}>#T-002</Text>
                      <View style={[styles.ticketStatus, styles.statusInProgress]}>
                        <Text style={styles.ticketStatusText}>In Progress</Text>
                      </View>
                    </View>
                    <Text style={styles.ticketTitle}>Payment gateway integration</Text>
                    <Text style={styles.ticketDescription}>
                      Need help setting up payment processing
                    </Text>
                    <Text style={styles.ticketTime}>1 day ago</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#3B82F6' }]}>
                    <IconSymbol name="plus.circle.fill" size={32} color="#FFFFFF" />
                    <Text style={styles.actionText}>Create Ticket</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#8B5CF6' }]}>
                    <IconSymbol name="message.fill" size={32} color="#FFFFFF" />
                    <Text style={styles.actionText}>Live Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>
          </SafeAreaView>
        )}
      </AuthConsumer>
    );
  }
}

export default SupportScreen;

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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
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
  ticketsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketPriority: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  priorityHigh: {
    backgroundColor: '#EF4444',
  },
  priorityMedium: {
    backgroundColor: '#F59E0B',
  },
  ticketId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  ticketStatus: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusInProgress: {
    backgroundColor: '#F59E0B',
  },
  ticketStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  ticketTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
