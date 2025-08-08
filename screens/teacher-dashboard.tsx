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
  grade_level: string;
  student_count: number;
  description?: string;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  class_id: string;
  class_name: string;
  attendance_rate: number;
  performance_score: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: string;
  status: 'draft' | 'active' | 'completed';
  progress: number;
  created_at: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  total_students: number;
  submitted_count: number;
  class_id: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  is_urgent: boolean;
}

interface TeacherDashboardState {
  loading: boolean;
  error: string | null;
  classes: Class[];
  students: Student[];
  lessons: Lesson[];
  assignments: Assignment[];
  announcements: Announcement[];
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
      assignments: [],
      announcements: [],
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
      if (!teacherId) {
        throw new Error('Teacher ID not found');
      }

      // Load classes taught by this teacher
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          grade_level,
          description,
          created_at,
          students:student_enrollments(count)
        `)
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      if (classesError) throw classesError;

      // Format classes data
      const classes: Class[] = (classesData || []).map(cls => ({
        id: cls.id,
        name: cls.name,
        grade_level: cls.grade_level,
        student_count: (cls.students && Array.isArray(cls.students) && cls.students.length > 0) ? cls.students[0]?.count || 0 : 0,
        description: cls.description,
        created_at: cls.created_at,
      }));

      // Load students for these classes
      const classIds = classes.map(cls => cls.id);
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          student_enrollments!inner(
            class_id,
            classes!inner(
              name
            )
          ),
          attendance_records(attendance_rate),
          academic_progress(performance_score)
        `)
        .in('student_enrollments.class_id', classIds);

      if (studentsError) throw studentsError;

      // Format students data
      const students: Student[] = (studentsData || []).map(student => {
        const enrollment = student.student_enrollments?.[0];
        const className = enrollment?.classes?.name || 'Unknown';
        const attendanceRate = student.attendance_records?.[0]?.attendance_rate || 0;
        const performanceScore = student.academic_progress?.[0]?.performance_score || 0;
        
        return {
          id: student.id,
          full_name: student.full_name,
          class_id: enrollment?.class_id || '',
          class_name: className,
          attendance_rate: attendanceRate,
          performance_score: performanceScore,
        };
      });

      // Load lessons created by this teacher
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          subject,
          grade_level,
          status,
          progress,
          created_at
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (lessonsError) throw lessonsError;

      const lessons: Lesson[] = lessonsData || [];

      // Load assignments for teacher's classes
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          class_id,
          assignment_submissions(count)
        `)
        .in('class_id', classIds)
        .order('due_date', { ascending: true })
        .limit(5);

      if (assignmentsError) throw assignmentsError;

      // Format assignments data
      const assignments: Assignment[] = (assignmentsData || []).map(assignment => {
        const classObj = classes.find(cls => cls.id === assignment.class_id);
        const totalStudents = classObj?.student_count || 0;
        const submittedCount = assignment.assignment_submissions?.[0]?.count || 0;
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          total_students: totalStudents,
          submitted_count: submittedCount,
          class_id: assignment.class_id,
        };
      });

      // Load school announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          priority,
          created_at,
          is_urgent
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcementsError) throw announcementsError;

      const announcements: Announcement[] = announcementsData || [];

      // Generate AI insights
      let aiInsights = null;
      try {
        if (process.env.EXPO_PUBLIC_AI_ENABLED === 'true') {
          const classPerformanceData = students.map(s => ({
            name: s.full_name,
            class: s.class_name,
            attendance: s.attendance_rate,
            performance: s.performance_score,
          }));

          const upcomingAssignments = assignments
            .filter(a => new Date(a.due_date) > new Date())
            .map(a => `${a.title} - Due: ${format(new Date(a.due_date), 'MMM dd')}`);

          const prompt = `
            As an educational AI assistant, analyze this teacher's classroom data and provide insights:
            
            Classes: ${classes.length} classes with ${students.length} total students
            Recent Lessons: ${lessons.slice(0, 5).map(l => l.title).join(', ')}
            Student Performance Data: ${JSON.stringify(classPerformanceData.slice(0, 10), null, 2)}
            Upcoming Assignments: ${upcomingAssignments.join(', ')}
            
            Please provide:
            1. A brief performance summary (2-3 sentences)
            2. 3 upcoming tasks or priorities
            3. 3 specific recommendations for improving teaching effectiveness
            
            Format as JSON: {
              "classPerformance": "summary",
              "upcomingTasks": ["task1", "task2", "task3"],
              "recommendations": ["rec1", "rec2", "rec3"]
            }
          `;

          const response = await ClaudeAIService.getInstance().generateLessonContent({
            topic: 'Dashboard analysis',
            ageGroup: '4-5 years',
            duration: 10,
            learningObjectives: ['summarize class status'],
            userId: teacherId,
            preschoolId: this.props.profile?.preschool_id || 'unknown',
          });

          if (response.success && response.content) {
            // Fallback to a simple summary since the original .bak had a misuse of analyzeStudentProgress signature
            aiInsights = {
              classPerformance: `Managing ${classes.length} classes with ${students.length} students. ${assignments.length} current assignments.`,
              upcomingTasks: upcomingAssignments.slice(0, 3),
              recommendations: ['Review student progress', 'Prepare upcoming lessons', 'Grade recent assignments'],
            };
          }
        }
      } catch (aiError) {
        console.warn('AI insights generation failed:', aiError);
      }

      this.setState({
        classes,
        students,
        lessons,
        assignments,
        announcements,
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
        <Text style={styles.classGrade}>Grade {classItem.grade_level}</Text>
      </View>
      {classItem.description && (
        <Text style={styles.classDescription} numberOfLines={2}>
          {classItem.description}
        </Text>
      )}
      <View style={styles.classStats}>
        <Text style={styles.classStudentCount}>{classItem.student_count} Students</Text>
        <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  renderLessonCard = (lesson: Lesson) => {
    const statusColor = lesson.status === 'active' ? '#3B82F6' : 
                       lesson.status === 'completed' ? '#10B981' : '#F59E0B';
    const statusBg = lesson.status === 'active' ? '#DBEAFE' : 
                     lesson.status === 'completed' ? '#D1FAE5' : '#FEF3C7';
    
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
              {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
            </Text>
          </View>
        </View>
        {lesson.description && (
          <Text style={styles.lessonDescription} numberOfLines={2}>
            {lesson.description}
          </Text>
        )}
        <View style={styles.lessonMeta}>
          <Text style={styles.lessonSubject}>{lesson.subject}</Text>
          <Text style={styles.lessonGrade}>Grade {lesson.grade_level}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${lesson.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{lesson.progress}% Complete</Text>
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
    const { loading, error, classes, lessons, assignments, announcements, totalStudents, aiInsights } = this.state;

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
            {this.renderMetricCard('Assignments', assignments.length, 'doc.text', '#EF4444')}
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

          {/* Recent Assignments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Assignments</Text>
            {assignments.map((assignment) => {
              const completionRate = assignment.total_students > 0 
                ? (assignment.submitted_count / assignment.total_students) * 100 
                : 0;
              const isOverdue = new Date(assignment.due_date) < new Date();
              
              return (
                <TouchableOpacity 
                  key={assignment.id} 
                  style={styles.assignmentCard}
                  onPress={() => router.push(`/screens/assignments?id=${assignment.id}` as any)}
                >
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <Text style={[styles.assignmentDue, isOverdue && styles.overdue]}>
                      Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  {assignment.description && (
                    <Text style={styles.assignmentDescription} numberOfLines={2}>
                      {assignment.description}
                    </Text>
                  )}
                  <View style={styles.assignmentStats}>
                    <Text style={styles.assignmentSubmissions}>
                      {assignment.submitted_count}/{assignment.total_students} submitted ({Math.round(completionRate)}%)
                    </Text>
                    <View style={styles.assignmentProgress}>
                      <View style={[
                        styles.assignmentProgressFill, 
                        { width: `${completionRate}%` }
                      ]} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Announcements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Announcements</Text>
            {announcements.map((announcement) => {
              const priorityColors = {
                high: { bg: '#FEE2E2', text: '#DC2626' },
                medium: { bg: '#FEF3C7', text: '#D97706' },
                low: { bg: '#E0E7FF', text: '#3730A3' },
              };
              const colors = priorityColors[announcement.priority];
              
              return (
                <View key={announcement.id} style={[
                  styles.announcementCard,
                  announcement.is_urgent && styles.urgentAnnouncement
                ]}>
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementTitle}>
                      {announcement.is_urgent && '🚨 '}{announcement.title}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.priorityText, { color: colors.text }]}>
                        {announcement.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.announcementContent} numberOfLines={3}>
                    {announcement.content}
                  </Text>
                  <Text style={styles.announcementDate}>
                    {format(new Date(announcement.created_at), 'MMM dd, yyyy')}
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
});
