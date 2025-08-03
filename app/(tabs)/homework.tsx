import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { StudentHomeworkSubmission } from '@/types/types';

// Minimal student interface for homework display
interface StudentBasic {
  id: string;
  first_name: string;
  last_name: string;
}
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface HomeworkScreenState {
  homework: StudentHomeworkSubmission[];
  children: StudentBasic[];
  loading: boolean;
  refreshing: boolean;
  selectedChild: string | null;
}

class HomeworkScreen extends React.Component<{}, HomeworkScreenState> {
  state: HomeworkScreenState = {
    homework: [],
    children: [],
    loading: true,
    refreshing: false,
    selectedChild: null,
  };

  componentDidMount() {
    this.initializeData();
  }

  initializeData = async (userId?: string) => {
    if (!userId) return;
    
    try {
      this.setState({ loading: true });
      
      // First get the parent's children
      const { data: childrenData, error: childrenError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('parent_id', userId);
      
      if (childrenError) {
        console.error('Error fetching children:', childrenError);
        return;
      }
      
      const children = childrenData || [];
      this.setState({ children });
      
      if (children.length > 0) {
        const childIds = children.map(child => child.id);
        await this.fetchHomework(childIds);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      this.setState({ loading: false });
    }
  };

  fetchHomework = async (childIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('student_homework_submissions')
        .select(`
          *,
          homework_assignment:homework_assignments(
            title,
            description,
            due_date_offset_days,
            lesson:lessons(title)
          ),
          student:students(first_name, last_name)
        `)
        .in('student_id', childIds)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching homework:', error);
      } else {
        this.setState({ homework: data || [] });
      }
    } catch (err) {
      console.error('Unexpected error fetching homework:', err);
    }
  };

  onRefresh = () => {
    this.setState({ refreshing: true });
    setTimeout(() => this.setState({ refreshing: false }), 2000);
  };

  getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'submitted': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'reviewed': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark.circle.fill';
      case 'submitted': return 'paperplane.fill';
      case 'in_progress': return 'clock.fill';
      case 'reviewed': return 'eye.fill';
      default: return 'doc.text';
    }
  };

  handleSubmissionPress = (item: StudentHomeworkSubmission) => {
    Alert.alert(
      'Homework Details',
      `Title: ${item.homework_assignment?.title || 'N/A'}\nStatus: ${item.status}\nStudent: ${item.student?.first_name} ${item.student?.last_name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => this.openHomework(item) }
      ]
    );
  };

  openHomework = (item: StudentHomeworkSubmission) => {
    // TODO: Navigate to homework detail screen
    console.log('Opening homework:', item.id);
  };

  renderHomeworkCard = ({ item }: { item: StudentHomeworkSubmission }) => {
    const statusColor = this.getStatusColor(item.status);
    const statusIcon = this.getStatusIcon(item.status);
    const dueDate = item.homework_assignment?.due_date_offset_days 
      ? new Date(Date.now() + item.homework_assignment.due_date_offset_days * 24 * 60 * 60 * 1000)
      : null;

    return (
      <TouchableOpacity 
        style={styles.homeworkCard}
        onPress={() => this.handleSubmissionPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.homeworkTitle}>
              {item.homework_assignment?.title || 'Homework Assignment'}
            </Text>
            <Text style={styles.studentName}>
              {item.student?.first_name} {item.student?.last_name}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <IconSymbol name={statusIcon as any} size={16} color="white" />
          </View>
        </View>

        {item.homework_assignment?.lesson?.title && (
          <View style={styles.lessonInfo}>
            <IconSymbol name="book.fill" size={14} color="#6B7280" />
            <Text style={styles.lessonTitle}>Lesson: {item.homework_assignment.lesson.title}</Text>
          </View>
        )}

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <IconSymbol name="flag.fill" size={14} color="#6B7280" />
            <Text style={styles.detailText}>Status: {item.status.replace('_', ' ')}</Text>
          </View>
          
          {dueDate && (
            <View style={styles.detailRow}>
              <IconSymbol name="calendar" size={14} color="#6B7280" />
              <Text style={styles.detailText}>Due: {dueDate.toLocaleDateString()}</Text>
            </View>
          )}
          
          {item.submitted_at && (
            <View style={styles.detailRow}>
              <IconSymbol name="paperplane.fill" size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                Submitted: {new Date(item.submitted_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {item.teacher_feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Teacher Feedback:</Text>
            <Text style={styles.feedbackText}>{item.teacher_feedback}</Text>
          </View>
        )}

        {item.grade && (
          <View style={styles.gradeContainer}>
            <Text style={styles.gradeLabel}>Grade: </Text>
            <Text style={styles.gradeText}>{item.grade}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  renderContent = (auth: any) => {
    const { profile } = auth;
    const { homework, children, loading, refreshing } = this.state;

    // Initialize data when profile is available
    if (profile?.id && children.length === 0 && !loading) {
      this.initializeData(profile.id);
    }

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Homework</Text>
              <Text style={styles.headerSubtitle}>
                {homework.length} {homework.length === 1 ? 'assignment' : 'assignments'}
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
            <Text style={styles.loadingText}>Loading homework...</Text>
          </View>
        ) : homework.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Homework Yet</Text>
            <Text style={styles.emptyText}>
              {children.length === 0 
                ? 'No children found in your account.' 
                : 'No homework assignments have been given to your children yet.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={homework}
            keyExtractor={(item) => item.id}
            renderItem={this.renderHomeworkCard}
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
  homeworkCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
  },
  homeworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  feedbackContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#4B5563',
  },
  gradeContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 4,
  },
  gradeText: {
    fontSize: 14,
    color: '#4B5563',
  },
});
export default HomeworkScreen;

