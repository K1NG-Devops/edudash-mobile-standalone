import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { StudentDataService, EnhancedStudent } from '@/lib/services/studentDataService';
import { HomeworkService } from '@/lib/services/homeworkService';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocalSearchParams, router } from 'expo-router';
import { HomeworkAIAssistant } from '@/components/parent/HomeworkAIAssistant';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeworkScreen() {
  const { profile } = useAuth();
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const [children, setChildren] = useState<EnhancedStudent[]>([]);
  const params = useLocalSearchParams<{ childId?: string }>();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'completed'>('all');

  const selectedChild = useMemo(() => children.find(c => c.id === selectedChildId) || children[0], [children, selectedChildId]);
  
  const homeworkStats = useMemo(() => {
    const total = submissions.length;
    const completed = submissions.filter(s => ['completed', 'reviewed'].includes(s.status)).length;
    const pending = submissions.filter(s => ['assigned', 'in_progress'].includes(s.status)).length;
    const submitted = submissions.filter(s => s.status === 'submitted').length;
    
    return {
      total,
      completed,
      pending,
      submitted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [submissions]);
  
  const filteredSubmissions = useMemo(() => {
    switch (activeTab) {
      case 'todo':
        return submissions.filter(s => ['assigned', 'in_progress'].includes(s.status));
      case 'completed':
        return submissions.filter(s => ['completed', 'reviewed'].includes(s.status));
      default:
        return submissions;
    }
  }, [submissions, activeTab]);

  const load = async () => {
    if (!profile?.auth_user_id) return;
    setLoading(true);
    try {
      const kids = await StudentDataService.getStudentsForParent(profile.auth_user_id);
      setChildren(kids);
      const prefer = (params?.childId as string | undefined) || selectedChildId || undefined;
      const childId = (prefer && kids.find(k => k.id === prefer)?.id) || kids[0]?.id || null;
      if (childId) {
        setSelectedChildId(childId);
        const subs = await HomeworkService.getSubmissions(childId);
        setSubmissions(subs);
      } else {
        setSubmissions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [profile?.auth_user_id]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  const statuses: Array<{ key: string; label: string }> = [
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'completed', label: 'Completed' },
  ];
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const filtered = activeStatus ? submissions.filter(s => (s.status || '').toLowerCase() === activeStatus) : submissions;

  const statusMeta = (s: string | null | undefined) => {
    const k = (s || '').toLowerCase();
    switch (k) {
      case 'in_progress': return { color: '#F59E0B', icon: 'hourglass' };
      case 'submitted': return { color: '#3B82F6', icon: 'paperplane.fill' };
      case 'reviewed': return { color: '#10B981', icon: 'checkmark.seal.fill' };
      case 'completed': return { color: '#22C55E', icon: 'checkmark.circle.fill' };
      default: return { color: '#9CA3AF', icon: 'doc.text' };
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      {/* Modern Header */}
      <View style={[styles.modernHeader, { backgroundColor: palette.background }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={20} color={palette.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Homework</Text>
          {selectedChild && (
            <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
              {selectedChild.full_name || selectedChild.first_name}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.aiButton, { backgroundColor: '#8B5CF6' }]}
          onPress={() => setShowAIAssistant(true)}
        >
          <IconSymbol name="brain.head.profile" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Child Selector - Modern Pills */}
      {children.length > 1 && (
        <View style={styles.childSelectorSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.childSelectorContent}
          >
            {children.map((child) => (
              <TouchableOpacity 
                key={child.id} 
                style={[
                  styles.childPill,
                  { backgroundColor: child.id === selectedChild?.id ? '#8B5CF6' : palette.surface }
                ]}
                onPress={async () => {
                  setSelectedChildId(child.id);
                  setRefreshing(true);
                  const subs = await HomeworkService.getSubmissions(child.id);
                  setSubmissions(subs);
                  setRefreshing(false);
                }}
              >
                <View style={[
                  styles.childAvatar,
                  { backgroundColor: child.id === selectedChild?.id ? '#FFFFFF' : '#8B5CF6' }
                ]}>
                  <Text style={[
                    styles.childAvatarText,
                    { color: child.id === selectedChild?.id ? '#8B5CF6' : '#FFFFFF' }
                  ]}>
                    {(child.first_name || child.full_name || '?')[0]}
                  </Text>
                </View>
                <Text style={[
                  styles.childName,
                  { color: child.id === selectedChild?.id ? '#FFFFFF' : palette.text }
                ]}>
                  {child.first_name || child.full_name?.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Progress Overview Card */}
      {selectedChild && (
        <View style={[styles.progressCard, { backgroundColor: palette.surface }]}>
          <LinearGradient
            colors={['#8B5CF6', '#A855F7']}
            style={styles.progressGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>📚 Homework Progress</Text>
              <Text style={styles.progressSubtitle}>Keep up the great work!</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{homeworkStats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{homeworkStats.completed}</Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{homeworkStats.pending}</Text>
                <Text style={styles.statLabel}>To Do</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{homeworkStats.completionRate}%</Text>
                <Text style={styles.statLabel}>Success</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
      
      {/* Modern Tab Navigation */}
      <View style={[styles.tabNavigation, { backgroundColor: palette.surface }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'all' ? '#8B5CF6' : palette.textSecondary }
          ]}>All ({submissions.length})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'todo' && styles.tabButtonActive]}
          onPress={() => setActiveTab('todo')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'todo' ? '#F59E0B' : palette.textSecondary }
          ]}>To Do ({homeworkStats.pending})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'completed' ? '#10B981' : palette.textSecondary }
          ]}>Done ({homeworkStats.completed})</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView 
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Loading homework...</Text>
          </View>
        ) : filteredSubmissions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.surface }]}>
              <IconSymbol name="doc.text" size={48} color={palette.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>No homework yet</Text>
            <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
              {activeTab === 'todo' 
                ? 'All caught up! Check back later for new assignments.'
                : activeTab === 'completed'
                ? 'No completed homework yet. Keep working!'
                : 'Your homework assignments will appear here.'
              }
            </Text>
            
            {activeTab === 'all' && (
              <TouchableOpacity 
                style={[styles.aiHelpButton, { backgroundColor: '#8B5CF6' }]}
                onPress={() => setShowAIAssistant(true)}
              >
                <IconSymbol name="brain.head.profile" size={16} color="#FFFFFF" />
                <Text style={styles.aiHelpText}>Get AI Help</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.homeworkGrid}>
            {filteredSubmissions.map((submission) => {
              const assignment = submission.homework_assignment || {};
              const meta = statusMeta(submission.status);
              const isOverdue = checkIfOverdue(submission);
              
              return (
                <TouchableOpacity 
                  key={submission.id} 
                  style={[
                    styles.modernCard,
                    { backgroundColor: palette.surface, borderColor: meta.color }
                  ]}
                  onPress={() => handleHomeworkPress(submission)}
                  activeOpacity={0.7}
                >
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: meta.color }]}>
                    <IconSymbol name={meta.icon} size={12} color="#FFFFFF" />
                  </View>
                  
                  {/* Content */}
                  <View style={styles.cardContent}>
                    <View style={[styles.subjectIcon, { backgroundColor: meta.color + '15' }]}>
                      <IconSymbol name={getSubjectIcon(assignment.title)} size={24} color={meta.color} />
                    </View>
                    
                    <Text style={[styles.assignmentTitle, { color: palette.text }]} numberOfLines={2}>
                      {assignment.title || 'Homework Assignment'}
                    </Text>
                    
                    {assignment.description && (
                      <Text style={[styles.assignmentDescription, { color: palette.textSecondary }]} numberOfLines={2}>
                        {assignment.description}
                      </Text>
                    )}
                    
                    <View style={styles.cardFooter}>
                      <View style={[styles.statusChip, { backgroundColor: meta.color + '15' }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {formatStatus(submission.status)}
                        </Text>
                      </View>
                      
                      {isOverdue && (
                        <View style={styles.overdueChip}>
                          <Text style={styles.overdueText}>Overdue</Text>
                        </View>
                      )}
                    </View>
                    
                    {submission.grade && (
                      <View style={styles.gradeSection}>
                        <Text style={[styles.gradeLabel, { color: palette.textSecondary }]}>Grade:</Text>
                        <Text style={[styles.gradeValue, { color: getGradeColor(submission.grade) }]}>
                          {submission.grade}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {/* AI Assistant FAB for non-empty states */}
        {filteredSubmissions.length > 0 && (
          <TouchableOpacity 
            style={[styles.floatingAIButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => setShowAIAssistant(true)}
          >
            <IconSymbol name="brain.head.profile" size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>AI Help</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* AI Assistant Modal */}
      {selectedChild && (
        <HomeworkAIAssistant
          visible={showAIAssistant}
          studentId={selectedChild.id}
          studentName={selectedChild.full_name || selectedChild.first_name || 'Student'}
          studentAge={selectedChild.age || 4}
          currentAssignments={submissions.map(s => s.homework_assignment).filter(Boolean)}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
    </SafeAreaView>
  );
}

// Helper functions
const getSubjectIcon = (title: string): string => {
  const titleLower = (title || '').toLowerCase();
  if (titleLower.includes('math') || titleLower.includes('number') || titleLower.includes('count')) return 'function';
  if (titleLower.includes('read') || titleLower.includes('story') || titleLower.includes('letter')) return 'book.fill';
  if (titleLower.includes('art') || titleLower.includes('draw') || titleLower.includes('paint')) return 'paintbrush.fill';
  if (titleLower.includes('science') || titleLower.includes('nature') || titleLower.includes('plant')) return 'flask.fill';
  if (titleLower.includes('music') || titleLower.includes('song')) return 'music.note';
  return 'doc.text.fill';
};

const formatStatus = (status: string): string => {
  return (status || 'assigned').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getGradeColor = (grade: string): string => {
  const gradeNum = parseInt(grade);
  if (gradeNum >= 90) return '#10B981';
  if (gradeNum >= 80) return '#3B82F6';
  if (gradeNum >= 70) return '#F59E0B';
  return '#EF4444';
};

const checkIfOverdue = (submission: any): boolean => {
  if (!submission.homework_assignment?.due_date) return false;
  return new Date() > new Date(submission.homework_assignment.due_date);
};

const handleHomeworkPress = (submission: any) => {
  // Navigate to homework detail or submission page
  console.log('Navigate to homework detail:', submission.id);
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childSelectorSection: {
    paddingVertical: 12,
  },
  childSelectorContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  childPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  childAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    fontSize: 11,
    fontWeight: '600',
  },
  childName: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  progressGradient: {
    padding: 20,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabNavigation: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#F8FAFC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  aiHelpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  aiHelpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  homeworkGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modernCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    marginTop: 8,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  assignmentDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overdueChip: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overdueText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gradeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  gradeLabel: {
    fontSize: 12,
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  floatingAIButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});

