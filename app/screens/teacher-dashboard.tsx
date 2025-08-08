/* eslint-disable */
// @ts-nocheck
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { ClaudeAIService } from '@/lib/ai/claudeService';
import { format } from 'date-fns';

interface TeacherDashboardProps {
  profile: any;
}

interface Class {
  id: string;
  name: string;
  current_enrollment: number;
  max_capacity: number | null;
  room_number: string | null;
  age_group_id: string;
  created_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
  date_of_birth: string;
  is_active: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category_id: string;
  age_group_id: string;
  duration_minutes: number | null;
  difficulty_level: number | null;
  is_public: boolean;
  created_at: string;
}

interface HomeworkAssignment {
  id: string;
  title: string;
  description: string | null;
  due_date_offset_days: number;
  lesson_id: string | null;
  class_id: string | null;
  teacher_id: string;
  created_at: string;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string | null;
  activity_type: string;
  lesson_id: string;
  sequence_order: number | null;
}

interface TeacherDashboardState {
  loading: boolean;
  error: string | null;
  classes: Class[];
  students: Student[];
  lessons: Lesson[];
  homeworkAssignments: HomeworkAssignment[];
  recentActivities: RecentActivity[];
  totalStudents: number;
  aiInsights: {
    classPerformance: string;
    upcomingTasks: string[];
    recommendations: string[];
  } | null;
}

export default class TeacherDashboard extends React.Component<TeacherDashboardProps, TeacherDashboardState> {
  constructor(props: TeacherDashboardProps) {
    super(props);
    this.state = {
      loading: false,
      error: null,
      classes: [],
      students: [],
      lessons: [],
      homeworkAssignments: [],
      recentActivities: [],
      totalStudents: 0,
      aiInsights: null,
    };
  }

  componentDidMount() {
    this.loadTeacherData();
  }

  loadTeacherData = async () => {
    this.setState({ loading: true, error: null });
    
    try {
      const teacherId = this.props.profile?.id;
      const preschoolId = this.props.profile?.preschool_id;
      
      if (!teacherId || !preschoolId) {
        throw new Error('Teacher ID or Preschool ID not found');
      }

      // Load classes taught by this teacher
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          current_enrollment,
          max_capacity,
          room_number,
          age_group_id,
          created_at
        `)
        .eq('teacher_id', teacherId)
        .eq('preschool_id', preschoolId);

      if (classesError) throw classesError;

      const classes: Class[] = classesData || [];

      // Load students for this teacher's classes
      const classIds = classes.map(cls => cls.id);
      let students: Student[] = [];
      
      if (classIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            first_name,
            last_name,
            class_id,
            date_of_birth,
            is_active
          `)
          .in('class_id', classIds)
          .eq('is_active', true);

        if (studentsError) throw studentsError;
        students = studentsData || [];
      }

      // Load recent lessons from the lessons table
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          content,
          category_id,
          age_group_id,
          duration_minutes,
          difficulty_level,
          is_public,
          created_at
        `)
        .eq('preschool_id', preschoolId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (lessonsError) throw lessonsError;
      const lessons: Lesson[] = lessonsData || [];

      // Load homework assignments for teacher's classes
      let homeworkAssignments: HomeworkAssignment[] = [];
      if (classIds.length > 0) {
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework_assignments')
          .select(`
            id,
            title,
            description,
            due_date_offset_days,
            lesson_id,
            class_id,
            teacher_id,
            created_at
          `)
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (homeworkError) throw homeworkError;
        homeworkAssignments = homeworkData || [];
      }

      // Load recent activities from the activities table
      let recentActivities: RecentActivity[] = [];
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          id,
          title,
          description,
          activity_type,
          lesson_id,
          sequence_order
        `)
        .order('sequence_order', { ascending: false })
        .limit(5);

      if (activitiesError) {
        console.warn('Activities query failed:', activitiesError);
      } else {
        recentActivities = (activitiesData || []).map(activity => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          activity_type: activity.activity_type,
          lesson_id: activity.lesson_id,
          sequence_order: activity.sequence_order,
        }));
      }

      // Generate AI insights - simplified for now
      let aiInsights = null;
      try {
        if (process.env.EXPO_PUBLIC_AI_ENABLED === 'true') {
          // Fallback insights without AI service for now
          aiInsights = {
            classPerformance: `Managing ${classes.length} classes with ${students.length} total students. Recent activity includes ${lessons.length} lessons and ${homeworkAssignments.length} homework assignments.`,
            upcomingTasks: [
              'Review student progress',
              'Prepare upcoming lessons', 
              'Grade recent assignments'
            ],
            recommendations: [
              'Focus on struggling students',
              'Incorporate more interactive activities',
              'Provide regular feedback'
            ]
          };
        }
      } catch (aiError) {
        console.warn('AI insights generation failed:', aiError);
      }

      this.setState({
        classes,
        students,
        lessons,
        homeworkAssignments,
        recentActivities,
        totalStudents: students.length,
        aiInsights,
      });

    } catch (error) {
      console.error('Error loading teacher data:', error);
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      });
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      this.setState({ loading: false });
    }
  };

  renderMetricCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.metricCard, { borderTopColor: color }]}>
      <View style={styles.metricHeader}>
        <IconSymbol name={icon as any} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );

  renderClassCard = (classItem: Class) => (
    <TouchableOpacity
      key={classItem.id}
      style={styles.classCard}
      onPress={() => router.push(`/screens/students?classId=${classItem.id}` as any)}
    >
      <View style={styles.classHeader}>
        <Text style={styles.className}>{classItem.name}</Text>
        <Text style={styles.classRoom}>Room {classItem.room_number || 'N/A'}</Text>
      </View>
      <View style={styles.classFooter}>
        <Text style={styles.classStudentCount}>{classItem.current_enrollment || 0} Students</Text>
        <Text style={styles.classCapacity}>Max: {classItem.max_capacity || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  renderLessonCard = (lesson: Lesson) => {
    const isPublic = lesson.is_public;
    const statusColor = isPublic ? '#10B981' : '#F59E0B';
    const statusBg = isPublic ? '#D1FAE5' : '#FEF3C7';
    
    return (
      <TouchableOpacity
        key={lesson.id}
        style={styles.lessonCard}
        onPress={() => router.push(`/screens/lessons?lessonId=${lesson.id}` as any)}
      >
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <View style={[styles.lessonStatus, { backgroundColor: statusBg }]}>
            <Text style={[styles.lessonStatusText, { color: statusColor }]}>
              {isPublic ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>
        {lesson.description && (
          <Text style={styles.lessonDescription} numberOfLines={2}>
            {lesson.description}
          </Text>
        )}
        <View style={styles.lessonMeta}>
          <Text style={styles.lessonDuration}>
            Duration: {lesson.duration_minutes || 'N/A'} min
          </Text>
          <Text style={styles.lessonDifficulty}>
            Level: {lesson.difficulty_level || 'N/A'}
          </Text>
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
    const { loading, error, classes, lessons, homeworkAssignments, recentActivities, totalStudents, aiInsights } = this.state;

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
            onPress={this.loadTeacherData}
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
            name: profile?.name || 'Teacher',
            role: profile?.role || 'teacher',
            avatar: profile?.avatar_url,
          }}
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* AI Insights */}
          {aiInsights && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Insights</Text>
              <View style={styles.aiInsightsCard}>
                <Text style={styles.aiInsightsTitle}>Class Performance Summary</Text>
                <Text style={styles.aiInsightsText}>{aiInsights.classPerformance}</Text>
                
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

          {/* Metrics Overview */}
          <View style={styles.metricsGrid}>
            {this.renderMetricCard('Classes', classes.length, 'book.closed', '#3B82F6')}
            {this.renderMetricCard('Students', totalStudents, 'person.2', '#10B981')}
            {this.renderMetricCard('Lessons', lessons.length, 'graduationcap', '#F59E0B')}
            {this.renderMetricCard('Homework', homeworkAssignments.length, 'doc.text', '#EF4444')}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {this.renderQuickAction(
                'AI Lesson Generator',
                'plus.circle',
                () => router.push('/screens/ai/lesson-generator' as any),
                '#3B82F6'
              )}
              {this.renderQuickAction(
                'Grade Homework',
                'doc.badge.plus',
                () => router.push('/screens/ai/homework-grader' as any),
                '#10B981'
              )}
              {this.renderQuickAction(
                'STEM Activities',
                'lightbulb',
                () => router.push('/screens/ai/stem-activities' as any),
                '#F59E0B'
              )}
              {this.renderQuickAction(
                'Progress Analysis',
                'chart.bar',
                () => router.push('/screens/analytics' as any),
                '#8B5CF6'
              )}
            </View>
          </View>

          {/* My Classes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Classes</Text>
            {classes.map(this.renderClassCard)}
          </View>

          {/* Active Lessons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Lessons</Text>
            {lessons.slice(0, 3).map(this.renderLessonCard)}
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/lessons')}
            >
              <Text style={styles.viewAllText}>View All Lessons</Text>
              <IconSymbol name="chevron.right" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Recent Homework Assignments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Homework Assignments</Text>
            {homeworkAssignments.map((homework) => {
              const dueInDays = homework.due_date_offset_days;
              const isOverdue = dueInDays < 0;
              
              return (
                <TouchableOpacity 
                  key={homework.id} 
                  style={styles.assignmentCard}
                  onPress={() => router.push(`/screens/homework?id=${homework.id}` as any)}
                >
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>{homework.title}</Text>
                    <Text style={[styles.assignmentDue, isOverdue && styles.overdue]}>
                      {dueInDays > 0 ? `Due in ${dueInDays} days` : dueInDays === 0 ? 'Due today' : `Overdue by ${Math.abs(dueInDays)} days`}
                    </Text>
                  </View>
                  {homework.description && (
                    <Text style={styles.assignmentDescription} numberOfLines={2}>
                      {homework.description}
                    </Text>
                  )}
                  <View style={styles.assignmentStats}>
                    <Text style={styles.assignmentSubmissions}>
                      Class: {homework.class_id ? 'Assigned' : 'General'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recent Activities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            {recentActivities.map((activity) => {
              const activityColors = {
                learning: { bg: '#E0E7FF', text: '#3730A3' },
                play: { bg: '#FEF3C7', text: '#D97706' },
                art: { bg: '#FEE2E2', text: '#DC2626' },
                other: { bg: '#F3F4F6', text: '#374151' },
              };
              const colors = activityColors[activity.activity_type as keyof typeof activityColors] || activityColors.other;
              
              return (
                <View key={activity.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementTitle}>
                      {activity.title}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.priorityText, { color: colors.text }]}>
                        {activity.activity_type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {activity.description && (
                    <Text style={styles.announcementContent} numberOfLines={3}>
                      {activity.description}
                    </Text>
                  )}
                  <Text style={styles.announcementDate}>
                    Lesson: {activity.lesson_id} • Order: {activity.sequence_order || 'N/A'}
                  </Text>
                </View>
              );
            })}
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
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
  classCard: {
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
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  classGrade: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classStudentCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  lessonCard: {
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
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  lessonStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DBEAFE',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPlanned: {
    backgroundColor: '#FEF3C7',
  },
  lessonStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
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
  },
  assignmentDue: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  assignmentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignmentSubmissions: {
    fontSize: 14,
    color: '#6B7280',
  },
  assignmentProgress: {
    width: 100,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  assignmentProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  announcementCard: {
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
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  announcementDate: {
    fontSize: 14,
    color: '#6B7280',
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
    borderLeftColor: '#8B5CF6',
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
  classDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  lessonDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lessonSubject: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lessonGrade: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  assignmentDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  overdue: {
    color: '#DC2626',
    fontWeight: '600',
  },
  urgentAnnouncement: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  announcementContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  // Missing styles for the new components
  classRoom: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  classCapacity: {
    fontSize: 12,
    color: '#6B7280',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  lessonDifficulty: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 12,
  },
});
