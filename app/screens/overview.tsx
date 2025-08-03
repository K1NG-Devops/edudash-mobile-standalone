import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

class OverviewScreen extends React.Component {
  render() {
    return (
      <AuthConsumer>
        {(auth) => (
          <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <LinearGradient
                colors={['#059669', '#047857']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>School Overview</Text>
                  <Text style={styles.headerSubtitle}>
                    Complete insights into your school's performance
                  </Text>
                </View>
              </LinearGradient>

              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#3B82F6' }]}>
                    <IconSymbol name="person.2.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>24</Text>
                  <Text style={styles.statLabel}>Teachers</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
                    <IconSymbol name="graduationcap.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>186</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
                    <IconSymbol name="book.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Classes</Text>
                </View>
              </View>

              {/* Recent Activity */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: '#8B5CF6' }]}>
                      <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>New student enrolled</Text>
                      <Text style={styles.activityTime}>2 hours ago</Text>
                    </View>
                  </View>
                  
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: '#EF4444' }]}>
                      <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Parent message received</Text>
                      <Text style={styles.activityTime}>4 hours ago</Text>
                    </View>
                  </View>
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

export default OverviewScreen;

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
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },
});
