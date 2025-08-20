/* eslint-disable */
// @ts-nocheck
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { claudeService } from '@/lib/ai/claudeService';
import { format } from 'date-fns';

interface ParentDashboardProps {
  profile: any;
}

interface Child {
  id: string;
  full_name: string;
  age: number;
  grade_level: string;
  class_name: string;
  teacher_name: string;
  attendance_rate: number;
  avatar_url?: string;
  enrollment_date: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  child_id: string;
  child_name: string;
  score: number;
  completed_at: string;
  activity_type: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue' | 'submitted';
  child_id: string;
  child_name: string;
  subject: string;
  completion_date?: string;
}

interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  event_type: 'meeting' | 'trip' | 'event' | 'conference';
  location?: string;
  is_mandatory: boolean;
}

interface Message {
  id: string;
  sender_name: string;
  sender_role: string;
  subject: string;
  preview: string;
  sent_at: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface ParentDashboardState {
  loading: boolean;
  error: string | null;
  children: Child[];
  recentActivities: Activity[];
  assignments: Assignment[];
  events: SchoolEvent[];
  messages: Message[];
  aiInsights: {
    childrenSummary: string;
    upcomingTasks: string[];
    recommendations: string[];
  } | null;
}

export default class ParentDashboard extends React.Component<ParentDashboardProps, ParentDashboardState> {
  constructor(props: ParentDashboardProps) {
    super(props);
    this.state = {
      loading: false,
      error: null,
      children: [],
      recentActivities: [],
      assignments: [],
      events: [],
      messages: [],
      aiInsights: null,
    };
  }

  componentDidMount() {
    this.loadParentData();
  }

  loadParentData = async () => {
    this.setState({ loading: true, error: null });
    
    try {
      const parentId = this.props.profile?.id;
      if (!parentId) {
        throw new Error('Parent ID not found');
      }

      // Load children enrolled by this parent
      const { data: childrenData, error: childrenError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          age,
          avatar_url,
          student_enrollments!inner(
            enrollment_date,
            classes!inner(
              name,
              grade_level,
              teacher:profiles!classes_teacher_id_fkey(
                full_name
              )
            )
          ),
          attendance_records(
            attendance_rate
          )
        `)
        .eq('parent_id', parentId)
        .eq('student_enrollments.is_active', true);

      if (childrenError) throw childrenError;

      // Format children data
      const children: Child[] = (childrenData || []).map(child => {
        const enrollment = child.student_enrollments?.[0];
        const classInfo = enrollment?.classes;
        const attendanceRecord = child.attendance_records?.[0];
        
        return {
          id: child.id,
          full_name: child.full_name,
          age: child.age,
          grade_level: classInfo?.grade_level || 'Unknown',
          class_name: classInfo?.name || 'Unknown',
          teacher_name: classInfo?.teacher?.full_name || 'Unknown',
          attendance_rate: attendanceRecord?.attendance_rate || 0,
          avatar_url: child.avatar_url,
          enrollment_date: enrollment?.enrollment_date || '',
        };
      });

      const childIds = children.map(child => child.id);

      // Load recent activities for children
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('learning_activities')
        .select(`
          id,
          title,
          description,
          activity_type,
          completed_at,
          activity_progress(
            student_id,
            score,
            students(
              full_name
            )
          )
        `)
        .in('activity_progress.student_id', childIds)
        .not('activity_progress.completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      // Format activities data
      const recentActivities: Activity[] = (activitiesData || [])
        .filter(activity => activity.activity_progress?.[0])
        .map(activity => {
          const progress = activity.activity_progress[0];
          return {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            child_id: progress.student_id,
            child_name: progress.students?.full_name || 'Unknown',
            score: progress.score || 0,
            completed_at: activity.completed_at,
            activity_type: activity.activity_type,
          };
        });

      // Load assignments for children
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          subject,
          assignment_submissions(
            student_id,
            status,
            submitted_at,
            students(
              full_name
            )
          )
        `)
        .in('assignment_submissions.student_id', childIds)
        .order('due_date', { ascending: true })
        .limit(10);

      if (assignmentsError) throw assignmentsError;

      // Format assignments data
      const assignments: Assignment[] = (assignmentsData || [])
        .filter(assignment => assignment.assignment_submissions?.[0])
        .map(assignment => {
          const submission = assignment.assignment_submissions[0];
          const now = new Date();
          const dueDate = new Date(assignment.due_date);
          
          let status: Assignment['status'] = submission.status as Assignment['status'];
          if (status === 'pending' && dueDate < now) {
            status = 'overdue';
          }
          
          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            due_date: assignment.due_date,
            status,
            child_id: submission.student_id,
            child_name: submission.students?.full_name || 'Unknown',
            subject: assignment.subject,
            completion_date: submission.submitted_at,
          };
        });

      // Load school events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          event_date,
          event_time,
          event_type,
          location,
          is_mandatory
        `)
        .gte('event_date', new Date().toISOString())
        .eq('is_active', true)
        .order('event_date', { ascending: true })
        .limit(5);

      if (eventsError) throw eventsError;

      const events: SchoolEvent[] = eventsData || [];

      // Load messages for the parent
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          subject,
          preview,
          sent_at,
          is_read,
          priority,
          sender:profiles!messages_sender_id_fkey(
            full_name,
            role
          )
        `)
        .eq('recipient_id', parentId)
        .order('sent_at', { ascending: false })
        .limit(5);

      if (messagesError) throw messagesError;

      // Format messages data
      const messages: Message[] = (messagesData || []).map(message => ({
        id: message.id,
        sender_name: message.sender?.full_name || 'Unknown',
        sender_role: message.sender?.role || 'unknown',
        subject: message.subject,
        preview: message.preview,
        sent_at: message.sent_at,
        is_read: message.is_read,
        priority: message.priority,
      }));

      // Generate AI insights
      let aiInsights = null;
      try {
        if (process.env.EXPO_PUBLIC_AI_ENABLED === 'true') {
          const childrenSummaryData = children.map(child => ({
            name: child.full_name,
            age: child.age,
            class: child.class_name,
            teacher: child.teacher_name,
            attendance: child.attendance_rate,
          }));

          const recentScores = recentActivities.slice(0, 5).map(activity => ({
            child: activity.child_name,
            activity: activity.title,
            score: activity.score,
            date: activity.completed_at,
          }));

          const upcomingAssignments = assignments
            .filter(a => a.status === 'pending')
            .slice(0, 3)
            .map(a => `${a.title} (${a.child_name}) - Due: ${format(new Date(a.due_date), 'MMM dd')}`);

          const prompt = `
            As a family education AI assistant, analyze this parent's children's data and provide insights:
            
            Children Overview: ${JSON.stringify(childrenSummaryData, null, 2)}
            Recent Activity Scores: ${JSON.stringify(recentScores, null, 2)}
            Upcoming Assignments: ${upcomingAssignments.join(', ')}
            Upcoming Events: ${events.slice(0, 3).map(e => e.title).join(', ')}
            
            Please provide:
            1. A brief summary of children's progress (2-3 sentences)
            2. 3 priority tasks for the parent
            3. 3 specific recommendations for supporting children's learning
            
            Format as JSON: {
              "childrenSummary": "summary",
              "upcomingTasks": ["task1", "task2", "task3"],
              "recommendations": ["rec1", "rec2", "rec3"]
            }
          `;

          const response = await claudeService.generateContent({
            prompt,
            type: 'analysis',
            context: { role: 'parent', dashboard: true },
          });

          if (response.success && response.content) {
            try {
              aiInsights = JSON.parse(response.content);
            } catch {
              // Fallback if JSON parsing fails
              aiInsights = {
                childrenSummary: response.content.slice(0, 200) + '...',
                upcomingTasks: ['Review upcoming assignments', 'Check attendance reports', 'Schedule parent-teacher meeting'],
                recommendations: ['Establish daily reading time', 'Create a homework routine', 'Communicate regularly with teachers'],
              };
            }
          }
        }
      } catch (aiError) {
        // Removed debug statement: console.warn('AI insights generation failed:', aiError);
      }

      this.setState({
        children,
        recentActivities,
        assignments,
        events,
        messages,
        aiInsights,
      });

    } catch (error) {
      // Removed debug statement: console.error('Error loading parent data:', error);
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      });
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      this.setState({ loading: false });
    }
  };

  renderChildCard = (child: Child) => (
    <TouchableOpacity
      key={child.id}
      style={styles.childCard}
      onPress={() => router.push(`/screens/students?childId=${child.id}` as any)}
    >
      <View style={styles.childHeader}>
        <View style={styles.childAvatar}>
          {child.avatar_url ? (
            <Image source={{ uri: child.avatar_url }} style={styles.avatarImage} />
          ) : (
            <IconSymbol name="person.circle" size={40} color="#3B82F6" />
          )}
        </View>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.full_name}</Text>
          <Text style={styles.childClass}>{child.class_name}</Text>
          <Text style={styles.childTeacher}>Teacher: {child.teacher_name}</Text>
          <Text style={styles.childAge}>Age: {child.age} years</Text>
        </View>
        <View style={styles.childStats}>
          <Text style={styles.attendanceLabel}>Attendance</Text>
          <Text style={styles.attendanceValue}>{Math.round(child.attendance_rate)}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  renderActivityCard = (activity: Activity) => (
    <TouchableOpacity 
      key={activity.id} 
      style={styles.activityCard}
      onPress={() => router.push(`/screens/activities?activityId=${activity.id}` as any)}
    >
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityScore}>{Math.round(activity.score)}%</Text>
      </View>
      <Text style={styles.activityChild}>{activity.child_name}</Text>
      <Text style={styles.activityType}>Type: {activity.activity_type}</Text>
      <Text style={styles.activityDate}>{format(new Date(activity.completed_at), 'MMM dd, yyyy')}</Text>
    </TouchableOpacity>
  );

  renderAssignmentCard = (assignment: Assignment) => {
    const statusColors = {
      completed: { bg: '#D1FAE5', text: '#059669' },
      submitted: { bg: '#DBEAFE', text: '#1D4ED8' },
      pending: { bg: '#FEF3C7', text: '#D97706' },
      overdue: { bg: '#FEE2E2', text: '#DC2626' },
    };
    const colors = statusColors[assignment.status];
    
    return (
      <TouchableOpacity 
        key={assignment.id} 
        style={styles.assignmentCard}
        onPress={() => router.push(`/screens/assignments?assignmentId=${assignment.id}` as any)}
      >
        <View style={styles.assignmentHeader}>
          <Text style={styles.assignmentTitle}>{assignment.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {assignment.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.assignmentChild}>Child: {assignment.child_name}</Text>
        <Text style={styles.assignmentSubject}>Subject: {assignment.subject}</Text>
        <Text style={[styles.assignmentDue, assignment.status === 'overdue' && styles.overdue]}>
          Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
        </Text>
        {assignment.completion_date && (
          <Text style={styles.completionDate}>
            Completed: {format(new Date(assignment.completion_date), 'MMM dd, yyyy')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  renderEventCard = (event: SchoolEvent) => {
    const getEventIcon = (type: string) => {
      switch (type) {
        case 'meeting':
        case 'conference':
          return 'person.2';
        case 'trip':
          return 'bus';
        default:
          return 'calendar';
      }
    };
    
    return (
      <TouchableOpacity 
        key={event.id} 
        style={[
          styles.eventCard,
          event.is_mandatory && styles.mandatoryEvent
        ]}
        onPress={() => router.push(`/screens/events?eventId=${event.id}` as any)}
      >
        <View style={styles.eventIcon}>
          <IconSymbol 
            name={getEventIcon(event.event_type)} 
            size={20} 
            color="#3B82F6" 
          />
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>
            {event.is_mandatory && '★ '}{event.title}
          </Text>
          <Text style={styles.eventDateTime}>
            {format(new Date(event.event_date), 'MMM dd, yyyy')} at {event.event_time}
          </Text>
          {event.location && (
            <Text style={styles.eventLocation}>Location: {event.location}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  renderMessageCard = (message: Message) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return '#DC2626';
        case 'medium': return '#D97706';
        default: return '#6B7280';
      }
    };
    
    const formatTimeAgo = (dateString: string) => {
      const now = new Date();
      const messageDate = new Date(dateString);
      const diffHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffHours < 48) return '1 day ago';
      return `${Math.floor(diffHours / 24)} days ago`;
    };
    
    return (
      <TouchableOpacity 
        key={message.id} 
        style={[
          styles.messageCard,
          !message.is_read && styles.unreadMessage
        ]}
        onPress={() => router.push(`/screens/messages?messageId=${message.id}` as any)}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.messageFrom}>
            {message.sender_name} ({message.sender_role})
          </Text>
          <Text style={styles.messageTime}>{formatTimeAgo(message.sent_at)}</Text>
        </View>
        <Text style={[styles.messageSubject, !message.is_read && styles.messageUnread]}>
          {message.subject}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {message.preview}
        </Text>
        <View style={styles.messageFooter}>
          <View style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(message.priority) }
          ]} />
          {!message.is_read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  renderQuickAction = (title: string, icon: string, onPress: () => void, color: string) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <IconSymbol name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  render() {
    const { profile } = this.props;
    const { loading, error, children, recentActivities, assignments, events, messages, aiInsights } = this.state;

    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={this.loadParentData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <MobileHeader 
          user={{
            name: profile?.name || 'Parent',
            role: profile?.role || 'parent',
            avatar: profile?.avatar_url,
          }}
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* AI Insights */}
          {aiInsights && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Family Insights</Text>
              <View style={styles.aiInsightsCard}>
                <Text style={styles.aiInsightsTitle}>Children's Progress Summary</Text>
                <Text style={styles.aiInsightsText}>{aiInsights.childrenSummary}</Text>
                
                {aiInsights.upcomingTasks.length > 0 && (
                  <View style={styles.aiSection}>
                    <Text style={styles.aiSectionTitle}>Priority Tasks</Text>
                    {aiInsights.upcomingTasks.map((task, index) => (
                      <Text key={index} style={styles.aiTaskText}>• {task}</Text>
                    ))}
                  </View>
                )}
                
                {aiInsights.recommendations.length > 0 && (
                  <View style={styles.aiSection}>
                    <Text style={styles.aiSectionTitle}>Recommendations</Text>
                    {aiInsights.recommendations.map((rec, index) => (
                      <Text key={index} style={styles.aiRecommendationText}>• {rec}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome back, {profile?.name || 'Parent'}!</Text>
            <Text style={styles.welcomeSubtitle}>Here's what's happening with your children</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {this.renderQuickAction(
                'View Progress',
                'chart.line.uptrend.xyaxis',
                () => router.push('/screens/analytics' as any),
                '#3B82F6'
              )}
              {this.renderQuickAction(
                'AI Study Helper',
                'lightbulb',
                () => router.push('/screens/ai/study-helper' as any),
                '#10B981'
              )}
              {this.renderQuickAction(
                'Schedule Meeting',
                'calendar.badge.plus',
                () => router.push('/screens/meetings' as any),
                '#F59E0B'
              )}
              {this.renderQuickAction(
                'View Activities',
                'gamecontroller',
                () => router.push('/(tabs)/activities' as any),
                '#8B5CF6'
              )}
            </View>
          </View>

          {/* My Children */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Children</Text>
            {children.map(this.renderChildCard)}
          </View>

          {/* Recent Activities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            {recentActivities.slice(0, 3).map(this.renderActivityCard)}
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/activities')}
            >
              <Text style={styles.viewAllText}>View All Activities</Text>
              <IconSymbol name="chevron.right" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Assignments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignments</Text>
            {assignments.slice(0, 3).map(this.renderAssignmentCard)}
          </View>

          {/* Upcoming Events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {events.slice(0, 3).map(this.renderEventCard)}
          </View>

          {/* Recent Messages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Messages</Text>
            {messages.map(this.renderMessageCard)}
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => Alert.alert('Feature', 'Full messaging coming soon!')}
            >
              <Text style={styles.viewAllText}>View All Messages</Text>
              <IconSymbol name="chevron.right" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  childClass: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  childTeacher: {
    fontSize: 14,
    color: '#6B7280',
  },
  childStats: {
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  attendanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  activityScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  activityChild: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusOverdue: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  assignmentChild: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  assignmentDue: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventDateTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageSubject: {
    fontSize: 16,
    color: '#374151',
  },
  messageUnread: {
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginRight: 4,
  },
  bottomPadding: {
    height: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiInsightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  aiInsightsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  aiSection: {
    marginTop: 12,
  },
  aiSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  aiTaskText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
    paddingLeft: 8,
  },
  aiRecommendationText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
    paddingLeft: 8,
  },
  childAge: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
  },
  activityType: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    marginBottom: 4,
  },
  assignmentSubject: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    marginBottom: 4,
  },
  overdue: {
    color: '#DC2626',
    fontWeight: '600',
  },
  completionDate: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 4,
  },
  mandatoryEvent: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  eventLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  unreadMessage: {
    backgroundColor: '#F0F9FF',
  },
  messagePreview: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityIndicator: {
    width: 12,
    height: 4,
    borderRadius: 2,
  },
});
