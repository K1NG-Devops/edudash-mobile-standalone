import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { ReportsService, ClassroomReport } from '@/lib/services/reportsService';
import { AssessmentsService, Assessment, AssessmentSummary } from '@/lib/services/assessmentsService';
import { StudentsService } from '@/lib/services/studentsService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils/dateUtils';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export default function TeacherReportsScreen() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<ClassroomReport[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [reportsSummary, setReportsSummary] = useState({
    daily_reports_today: 0,
    weekly_reports_this_week: 0,
    pending_reports: 0,
  });
  const [assessmentsSummary, setAssessmentsSummary] = useState<AssessmentSummary>({
    total_assessments: 0,
    completed_today: 0,
    pending_assessments: 0,
    average_score: 0,
    assessments_by_type: {
      cognitive: 0,
      social: 0,
      physical: 0,
      emotional: 0,
      language: 0,
    },
  });
  const [selectedTab, setSelectedTab] = useState<'reports' | 'assessments'>('reports');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'daily' | 'weekly'>('all');
  const [selectedAssessmentFilter, setSelectedAssessmentFilter] = useState<'all' | 'cognitive' | 'social' | 'physical' | 'emotional' | 'language'>('all');

  useEffect(() => {
    if (user && profile) {
      loadData();
    } else {
      // If no user or profile after 3 seconds, show empty state
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [user, profile, loading]);

  const loadData = async () => {
    if (!user || !profile?.preschool_id) {
      // If no user or profile, load mock data to prevent loading state
      setStudents([]);
      setReportsSummary(ReportsService.getMockReportsSummary());
      setAssessmentsSummary(AssessmentsService.getMockAssessmentSummary());
      setReports(ReportsService.getMockReports());
      setAssessments(AssessmentsService.getMockAssessments());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load students, reports summary, assessments summary, recent reports, and recent assessments in parallel
      const [studentsResult, reportsSummaryResult, assessmentsSummaryResult, reportsResult, assessmentsResult] = await Promise.all([
        StudentsService.getStudentsByTeacher(user.id, profile.preschool_id),
        ReportsService.getTeacherReportsSummary(user.id, profile.preschool_id),
        AssessmentsService.getTeacherAssessmentsSummary(user.id, profile.preschool_id),
        getRecentReports(),
        getRecentAssessments()
      ]);

      // Set data with fallbacks
      setStudents(studentsResult.data || []);
      setReportsSummary(reportsSummaryResult.data || ReportsService.getMockReportsSummary());
      setAssessmentsSummary(assessmentsSummaryResult.data || AssessmentsService.getMockAssessmentSummary());
      setReports(reportsResult.data || ReportsService.getMockReports());
      setAssessments(assessmentsResult.data || AssessmentsService.getMockAssessments());
      
    } catch (error) {
      console.error('Error loading teacher reports data:', error);
      // Set mock data on error to prevent infinite loading
      setStudents([]);
      setReportsSummary(ReportsService.getMockReportsSummary());
      setAssessmentsSummary(AssessmentsService.getMockAssessmentSummary());
      setReports(ReportsService.getMockReports());
      setAssessments(AssessmentsService.getMockAssessments());
      Alert.alert('Info', 'Using sample data for demonstration.');
    } finally {
      setLoading(false);
    }
  };

  const getRecentReports = async () => {
    if (!user || !profile?.preschool_id) return { data: null, error: null };
    
    try {
      // Get recent reports for all students taught by this teacher
      const { data, error } = await supabase
        .from('classroom_reports')
        .select(`
          *,
          teacher:users!classroom_reports_teacher_id_fkey(name, avatar_url),
          student:students!classroom_reports_student_id_fkey(first_name, last_name)
        `)
        .eq('teacher_id', user.id)
        .eq('preschool_id', profile.preschool_id)
        .order('report_date', { ascending: false })
        .limit(20);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getRecentAssessments = async () => {
    if (!user || !profile?.preschool_id) return { data: null, error: null };
    
    try {
      return await AssessmentsService.getRecentAssessments(user.id, profile.preschool_id, 20);
    } catch (error) {
      return { data: null, error };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const createDailyReports = async () => {
    if (!user || !profile?.preschool_id || students.length === 0) return;

    try {
      const studentIds = students.map(s => s.id);
      const result = await ReportsService.createDailyReportTemplate(
        user.id,
        profile.preschool_id,
        studentIds
      );

      if (result.error) {
        Alert.alert('Error', 'Failed to create daily reports');
        return;
      }

      Alert.alert(
        'Success',
        `Created daily report templates for ${studentIds.length} students`,
        [
          {
            text: 'OK',
            onPress: () => loadData()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating daily reports:', error);
      Alert.alert('Error', 'Failed to create daily reports');
    }
  };

  const filteredReports = reports.filter(report => {
    if (selectedFilter === 'all') return true;
    return report.report_type === selectedFilter;
  });

  const filteredAssessments = assessments.filter(assessment => {
    if (selectedAssessmentFilter === 'all') return true;
    return assessment.assessment_type === selectedAssessmentFilter;
  });

  const renderAssessmentCard = (assessment: Assessment) => (
    <TouchableOpacity
      key={assessment.id}
      style={styles.reportCard}
      onPress={() => router.push(`/(teacher)/reports/${assessment.id}`)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.studentName}>
            {assessment.student?.first_name} {assessment.student?.last_name}
          </Text>
          <Text style={styles.reportDate}>
            {formatDate(assessment.assessment_date)}
          </Text>
        </View>
        <View style={[styles.reportTypeBadge, { backgroundColor: '#E8F5E8' }]}>
          <Text style={[styles.reportTypeText, { color: '#4CAF50' }]}>
            {assessment.assessment_type}
          </Text>
        </View>
      </View>

      <View style={styles.reportContent}>
        <Text style={styles.reportHighlight} numberOfLines={2}>
          📊 {assessment.title}
        </Text>
        {assessment.score !== null && (
          <View style={styles.moodContainer}>
            <Text style={styles.moodLabel}>Score: </Text>
            <Text style={styles.moodLabel}>{assessment.score}/{assessment.max_score}</Text>
            {assessment.grade && (
              <Text style={[styles.moodLabel, { color: '#4CAF50', marginLeft: 8 }]}>({assessment.grade})</Text>
            )}
          </View>
        )}
        {!assessment.is_completed && (
          <View style={styles.moodContainer}>
            <Text style={[styles.moodLabel, { color: '#FF9800' }]}>Pending completion</Text>
          </View>
        )}
      </View>

      <View style={styles.reportFooter}>
        <View style={styles.statusContainer}>
          {assessment.is_completed ? (
            <View style={styles.sentBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.sentText}>Completed</Text>
            </View>
          ) : (
            <View style={styles.draftBadge}>
              <Ionicons name="time-outline" size={16} color="#FF9800" />
              <Text style={styles.draftText}>Pending</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderReportCard = (report: ClassroomReport) => (
    <TouchableOpacity
      key={report.id}
      style={styles.reportCard}
      onPress={() => router.push(`/(teacher)/reports/${report.id}`)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.studentName}>
            {report.student?.first_name} {report.student?.last_name}
          </Text>
          <Text style={styles.reportDate}>
            {formatDate(report.report_date)}
          </Text>
        </View>
        <View style={[
          styles.reportTypeBadge,
          { backgroundColor: report.report_type === 'daily' ? '#E3F2FD' : '#F3E5F5' }
        ]}>
          <Text style={[
            styles.reportTypeText,
            { color: report.report_type === 'daily' ? '#1976D2' : '#7B1FA2' }
          ]}>
            {report.report_type}
          </Text>
        </View>
      </View>

      <View style={styles.reportContent}>
        {report.learning_highlights && (
          <Text style={styles.reportHighlight} numberOfLines={2}>
            🎯 {report.learning_highlights}
          </Text>
        )}
        {report.mood_rating && (
          <View style={styles.moodContainer}>
            <Text style={styles.moodLabel}>Mood: </Text>
            <View style={styles.moodStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= report.mood_rating! ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.reportFooter}>
        <View style={styles.statusContainer}>
          {report.is_sent_to_parents ? (
            <View style={styles.sentBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.sentText}>Sent</Text>
            </View>
          ) : (
            <View style={styles.draftBadge}>
              <Ionicons name="create-outline" size={16} color="#FF9800" />
              <Text style={styles.draftText}>Draft</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Child Evaluations</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={createDailyReports}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{reportsSummary.daily_reports_today}</Text>
            <Text style={styles.summaryLabel}>Daily Reports Today</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{reportsSummary.weekly_reports_this_week}</Text>
            <Text style={styles.summaryLabel}>Weekly Reports</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{reportsSummary.pending_reports}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'daily', 'weekly'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter as any)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilterText
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reports List */}
        <View style={styles.reportsContainer}>
          {filteredReports.length > 0 ? (
            filteredReports.map(renderReportCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No reports found</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to create daily reports for your students
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#2196F3',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeFilterTab: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  reportsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  reportTypeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  reportTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportContent: {
    marginBottom: 12,
  },
  reportHighlight: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 14,
    color: '#666',
  },
  moodStars: {
    flexDirection: 'row',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sentText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  draftText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
