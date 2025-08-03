import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

class LessonsScreen extends React.Component {
  render() {
    return (
      <AuthConsumer>
        {(auth) => (
          <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <LinearGradient
                colors={['#7C3AED', '#6D28D9']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>My Lessons</Text>
                  <Text style={styles.headerSubtitle}>
                    Create and manage your lesson plans
                  </Text>
                </View>
              </LinearGradient>

              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#3B82F6' }]}>
                    <IconSymbol name="book.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Active Lessons</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#10B981' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>8</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
                    <IconSymbol name="clock.fill" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statValue}>3</Text>
                  <Text style={styles.statLabel}>Upcoming</Text>
                </View>
              </View>

              <View style={styles.content}>
                <Text style={styles.comingSoon}>Lesson Management</Text>
                <Text style={styles.comingSoonSubtitle}>AI-powered lesson creation coming soon</Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </AuthConsumer>
    );
  }
}

export default LessonsScreen;

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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});
