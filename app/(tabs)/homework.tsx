import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { HomeworkService } from '@/lib/services/homeworkService';
import HomeworkCard from '@/components/ui/HomeworkCard';
import { HomeworkAssignment } from '@/types/homework-types';

interface HomeworkScreenState {
  assignments: HomeworkAssignment[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

class HomeworkScreen extends React.Component<{}, HomeworkScreenState> {
  state: HomeworkScreenState = {
    assignments: [],
    loading: true,
    refreshing: false,
    error: null,
  };

  async componentDidMount() {
    await this.fetchAssignments();
  }

  fetchAssignments = async () => {
    try {
      this.setState({ loading: true, error: null });
      const assignments = await HomeworkService.getAssignments();
      this.setState({ assignments });
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  onRefresh = () => {
    this.setState({ refreshing: true }, async () => {
      await this.fetchAssignments();
      this.setState({ refreshing: false });
    });
  };

  handleAssignmentPress = (assignment: HomeworkAssignment) => {
    Alert.alert(
      'Assignment Details',
      `Title: ${assignment.title}\nDescription: ${assignment.description || 'N/A'}`,
      [
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  renderAssignment = ({ item }: { item: HomeworkAssignment }) => (
    <HomeworkCard 
      assignment={item} 
      onPress={() => this.handleAssignmentPress(item)} 
    />
  );

  renderContent = (profile: any) => {
    const { assignments, loading, refreshing, error } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Homework</Text>
              <Text style={styles.headerSubtitle}>
                {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <IconSymbol name="doc.text.fill" size={32} color="white" />
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading assignments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        ) : assignments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Assignments Yet</Text>
            <Text style={styles.emptyText}>
              No homework assignments available currently.
            </Text>
          </View>
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={(item) => item.id}
            renderItem={this.renderAssignment}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorMessage: {
    fontSize: 16,
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    padding: 24,
    paddingBottom: 100,
  },
});

export default HomeworkScreen;

