import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AuthConsumer } from '@/contexts/SimpleWorkingAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PlanStatus } from '../../components/subscription/PlanStatus';
import { UpgradeModal } from '../../components/subscription/UpgradeModal';
import { SubscriptionProvider, useFeatureAccess, useSubscription } from '../../contexts/SubscriptionContext';

interface TeacherDashboardProps {
    profile: any;
}

interface Class {
    id: string;
    name: string;
    current_enrollment: number;
    capacity: number | null;
    room_number: string | null;
    age_group_id: string | null;
    created_at: string | null;
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    class_id: string | null;
    date_of_birth: string | null;
    is_active: boolean | null;
}

interface Lesson {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    category_id: string | null;
    age_group_max: number | null;
    age_group_min: number | null;
    duration_minutes: number | null;
    difficulty_level: string | null;
    is_public: boolean | null;
    created_at: string | null;
}

interface HomeworkAssignment {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    class_id: string | null;
    teacher_id: string | null;
    created_at: string | null;
    is_published: boolean | null;
    points_possible: number | null;
}

export const TeacherDashboardInner: React.FC<TeacherDashboardProps> = ({ profile }) => {
    const { theme } = useTheme();
    const isDark = theme.isDark;
    const { subscription, loading: subscriptionLoading, aiUsage, trackAIUsage } = useSubscription();

    // Pre-compute feature access for all features to avoid calling hooks in event handlers
    const aiLessonAccess = useFeatureAccess('ai_lesson_generator');
    const homeworkGraderAccess = useFeatureAccess('homework_grader');
    const stemActivitiesAccess = useFeatureAccess('stem_activities');
    const progressAnalysisAccess = useFeatureAccess('progress_analysis');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [homeworkAssignments, setHomeworkAssignments] = useState<HomeworkAssignment[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [tenantName, setTenantName] = useState<string | null>(null);
    const [upgradeModal, setUpgradeModal] = useState<{ visible: boolean, featureName: string, description: string }>({
        visible: false,
        featureName: '',
        description: ''
    });

    const colors = {
        background: isDark ? '#0B1220' : '#F9FAFB',
        card: isDark ? '#1E293B' : '#FFFFFF',
        text: isDark ? '#F1F5F9' : '#1F2937',
        textSecondary: isDark ? '#94A3B8' : '#6B7280',
        border: isDark ? '#334155' : '#E5E7EB',
    };

    // Helper function to get feature access data by feature ID
    const getFeatureAccessData = (featureId: string) => {
        switch (featureId) {
            case 'ai_lesson_generator':
                return aiLessonAccess;
            case 'homework_grader':
                return homeworkGraderAccess;
            case 'stem_activities':
                return stemActivitiesAccess;
            case 'progress_analysis':
                return progressAnalysisAccess;
            default:
                return { hasAccess: true, needsUpgrade: false, canUseAI: true, isAIFeature: false };
        }
    };

    useEffect(() => {
        loadTeacherData();
    }, [profile]);

    const loadTeacherData = async () => {
        if (!profile) return;

        try {
            setLoading(true);
            setError(null);

            const preschoolId = profile.preschool_id;
            if (!preschoolId) {
                throw new Error('No preschool assigned to this teacher');
            }

            // Load preschool name
            const { data: preschoolData } = await supabase
                .from('preschools')
                .select('name')
                .eq('id', preschoolId)
                .single();

            if (preschoolData) {
                setTenantName(preschoolData.name);
            }

            // Load classes
            const { data: classesData, error: classesError } = await supabase
                .from('classes')
                .select('*')
                .eq('preschool_id', preschoolId)
                .eq('is_active', true);

            if (classesError) throw classesError;
            setClasses(classesData || []);

            // Load students
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .eq('preschool_id', preschoolId)
                .eq('is_active', true);

            if (studentsError) throw studentsError;
            setStudents(studentsData || []);
            setTotalStudents(studentsData?.length || 0);

            // Load lessons
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*')
                .eq('preschool_id', preschoolId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (lessonsError) throw lessonsError;
            setLessons(lessonsData || []);

            // Load homework assignments
            const { data: homeworkData, error: homeworkError } = await supabase
                .from('homework_assignments')
                .select('*')
                .eq('teacher_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (homeworkError) throw homeworkError;
            setHomeworkAssignments(homeworkData || []);

        } catch (error: any) {
            console.error('Error loading teacher data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderMetricCard = (title: string, value: string | number, icon: string, color: string) => (
        <View style={[styles.metricCard, { backgroundColor: colors.card, borderTopColor: color }]}>
            <View style={styles.metricHeader}>
                <IconSymbol name={icon as any} size={24} color={color} />
                <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
            </View>
            <Text style={[styles.metricValue, { color }]}>{value}</Text>
        </View>
    );

    const renderClassCard = (classItem: Class) => (
        <TouchableOpacity
            key={classItem.id}
            style={[styles.classCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/screens/students?classId=${classItem.id}`)}
        >
            <View style={styles.classHeader}>
                <Text style={[styles.className, { color: colors.text }]}>{classItem.name}</Text>
                <Text style={[styles.classRoom, { color: colors.textSecondary }]}>Room {classItem.room_number || 'N/A'}</Text>
            </View>
            <View style={styles.classFooter}>
                <Text style={[styles.classStudentCount, { color: colors.text }]}>{classItem.current_enrollment || 0} Students</Text>
                <Text style={[styles.classCapacity, { color: colors.textSecondary }]}>Max: {classItem.capacity || 'N/A'}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderLessonCard = (lesson: Lesson) => {
        const isPublic = lesson.is_public;
        const statusColor = isPublic ? '#10B981' : '#F59E0B';
        const statusBg = isPublic ? '#D1FAE5' : '#FEF3C7';

        return (
            <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/screens/lessons?lessonId=${lesson.id}`)}
            >
                <View style={styles.lessonHeader}>
                    <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                    <View style={[styles.lessonStatus, { backgroundColor: statusBg }]}>
                        <Text style={[styles.lessonStatusText, { color: statusColor }]}>
                            {isPublic ? 'Public' : 'Private'}
                        </Text>
                    </View>
                </View>
                {lesson.description && (
                    <Text style={[styles.lessonDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {lesson.description}
                    </Text>
                )}
                <View style={styles.lessonMeta}>
                    <Text style={[styles.lessonDuration, { color: colors.textSecondary }]}>
                        Duration: {lesson.duration_minutes || 'N/A'} min
                    </Text>
                    <Text style={[styles.lessonDifficulty, { color: colors.textSecondary }]}>
                        Level: {lesson.difficulty_level || 'N/A'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const handleFeatureAction = async (
        featureId: string,
        featureName: string,
        description: string,
        fallbackAction: () => void,
        featureAccess: { hasAccess: boolean; needsUpgrade: boolean; canUseAI: boolean; isAIFeature: boolean }
    ) => {
        const { hasAccess, needsUpgrade, canUseAI, isAIFeature } = featureAccess;

        // Check if user has basic access to the feature
        if (!hasAccess) {
            setUpgradeModal({
                visible: true,
                featureName,
                description
            });
            return;
        }

        // If it's an AI feature, check AI usage limits
        if (isAIFeature && !canUseAI) {
            setUpgradeModal({
                visible: true,
                featureName: `${featureName} - AI Limit Reached`,
                description: `You've reached your monthly AI usage limit. Upgrade to Premium for unlimited AI requests.`
            });
            return;
        }

        // If it's an AI feature and user can use it, track the usage
        if (isAIFeature) {
            const success = await trackAIUsage(featureId);
            if (!success) {
                setUpgradeModal({
                    visible: true,
                    featureName: `${featureName} - Usage Error`,
                    description: `Unable to track AI usage. Please try again or contact support.`
                });
                return;
            }
        }

        // Proceed with the action
        fallbackAction();
    };

    const renderQuickAction = (
        title: string,
        icon: string,
        onPress: () => void,
        color: string,
        featureId?: string,
        description?: string
    ) => {
        const featureAccess = featureId ? getFeatureAccessData(featureId) : null;
        const needsUpgrade = featureAccess?.needsUpgrade || false;
        const canUseAI = featureAccess?.canUseAI ?? true;
        const isAIFeature = featureAccess?.isAIFeature || false;
        const isLimited = isAIFeature && !canUseAI;

        return (
            <TouchableOpacity
                style={[
                    styles.quickActionCard,
                    { backgroundColor: colors.card },
                    (needsUpgrade || isLimited) && styles.premiumFeatureCard
                ]}
                onPress={async () => {
                    if (featureId && description && featureAccess) {
                        await handleFeatureAction(featureId, title, description, onPress, featureAccess);
                    } else {
                        onPress();
                    }
                }}
            >
                <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
                    <IconSymbol name={icon as any} size={24} color={isLimited ? '#94A3B8' : color} />
                    {(needsUpgrade || isLimited) && (
                        <View style={styles.premiumBadge}>
                            <IconSymbol
                                name={isLimited ? "exclamationmark.triangle.fill" : "lock.fill"}
                                size={12}
                                color={isLimited ? "#EF4444" : "#F59E0B"}
                            />
                        </View>
                    )}
                </View>
                <Text style={[styles.quickActionTitle, { color: isLimited ? colors.textSecondary : colors.text }]}>
                    {title}
                </Text>
                {needsUpgrade && (
                    <Text style={[styles.premiumText, { color: colors.textSecondary }]}>Premium</Text>
                )}
                {isLimited && !needsUpgrade && (
                    <Text style={[styles.premiumText, { color: '#EF4444' }]}>Limit Reached</Text>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, styles.centered]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, styles.centered]}>
                <Text style={[styles.errorText, { color: colors.text }]}>Error: {error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadTeacherData}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <AuthConsumer>
                {({ signOut }) => (
                    <MobileHeader
                        user={{
                            name: profile?.name || 'Teacher',
                            role: profile?.role || 'teacher',
                            avatar: profile?.avatar_url,
                        }}
                        schoolName={tenantName || undefined}
                        onSignOut={async () => {
                            try { await signOut(); } catch { }
                        }}
                    />
                )}
            </AuthConsumer>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Subscription Status */}
                {!subscriptionLoading && (
                    <PlanStatus
                        subscription={subscription}
                        aiUsage={aiUsage}
                        loading={subscriptionLoading}
                        compact={true}
                        onUpgrade={() => setUpgradeModal({
                            visible: true,
                            featureName: 'Upgrade to Premium',
                            description: 'Unlock unlimited AI features and advanced tools for your classroom.'
                        })}
                    />
                )}

                {/* Metrics Overview */}
                <View style={styles.metricsGrid}>
                    {renderMetricCard('Classes', classes.length, 'book.closed', '#3B82F6')}
                    {renderMetricCard('Students', totalStudents, 'person.2', '#10B981')}
                    {renderMetricCard('Lessons', lessons.length, 'graduationcap', '#F59E0B')}
                    {renderMetricCard('Homework', homeworkAssignments.length, 'doc.text', '#EF4444')}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {renderQuickAction(
                            'AI Lesson Generator',
                            'plus.circle',
                            () => router.push('/screens/lessons'),
                            '#3B82F6',
                            'ai_lesson_generator',
                            'Generate custom lessons using AI technology'
                        )}
                        {renderQuickAction(
                            'Grade Homework',
                            'doc.badge.plus',
                            () => router.push('/screens/analytics'),
                            '#10B981',
                            'homework_grader',
                            'Automatically grade homework assignments with AI'
                        )}
                        {renderQuickAction(
                            'STEM Activities',
                            'lightbulb',
                            () => router.push('/(tabs)/activities'),
                            '#F59E0B',
                            'stem_activities',
                            'Access premium STEM activity library'
                        )}
                        {renderQuickAction(
                            'Progress Analysis',
                            'chart.bar',
                            () => router.push('/screens/analytics'),
                            '#8B5CF6',
                            'progress_analysis',
                            'Advanced analytics and progress tracking'
                        )}
                    </View>
                </View>

                {/* My Classes */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>My Classes</Text>
                    {classes.map(renderClassCard)}
                </View>

                {/* Active Lessons */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Lessons</Text>
                    {lessons.slice(0, 3).map(renderLessonCard)}
                    <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={() => router.push('/screens/lessons')}
                    >
                        <Text style={[styles.viewAllText, { color: colors.text }]}>View All Lessons</Text>
                        <IconSymbol name="chevron.right" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Recent Homework Assignments */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Homework Assignments</Text>
                    {homeworkAssignments.map((homework) => {
                        const dueDate = homework.due_date ? new Date(homework.due_date) : null;
                        const today = new Date();
                        const isOverdue = dueDate ? dueDate < today : false;
                        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                            <TouchableOpacity
                                key={homework.id}
                                style={[styles.assignmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => router.push(`/screens/analytics`)}
                            >
                                <View style={styles.assignmentHeader}>
                                    <Text style={[styles.assignmentTitle, { color: colors.text }]}>{homework.title}</Text>
                                    <Text style={[styles.assignmentDue, isOverdue && styles.overdue, { color: colors.textSecondary }]}>
                                        {daysUntilDue === null ? 'No due date' :
                                            daysUntilDue > 0 ? `Due in ${daysUntilDue} days` :
                                                daysUntilDue === 0 ? 'Due today' :
                                                    `Overdue by ${Math.abs(daysUntilDue)} days`}
                                    </Text>
                                </View>
                                {homework.description && (
                                    <Text style={[styles.assignmentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                                        {homework.description}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Upgrade Modal */}
            <UpgradeModal
                visible={upgradeModal.visible}
                featureName={upgradeModal.featureName}
                featureDescription={upgradeModal.description}
                onClose={() => setUpgradeModal({ visible: false, featureName: '', description: '' })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 16,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    metricCard: {
        borderRadius: 12,
        padding: 16,
        borderTopWidth: 3,
        width: '48%',
        marginBottom: 12,
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
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    quickActionCard: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 6,
        marginBottom: 12,
        minWidth: '45%',
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
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    classCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
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
        fontWeight: 'bold',
    },
    classRoom: {
        fontSize: 12,
    },
    classFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    classStudentCount: {
        fontSize: 14,
    },
    classCapacity: {
        fontSize: 12,
    },
    lessonCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lessonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    lessonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    lessonStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    lessonStatusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    lessonDescription: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    lessonMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    lessonDuration: {
        fontSize: 12,
    },
    lessonDifficulty: {
        fontSize: 12,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    assignmentCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
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
        fontWeight: 'bold',
        flex: 1,
    },
    assignmentDue: {
        fontSize: 12,
    },
    assignmentDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    overdue: {
        color: '#EF4444',
    },
    // Premium feature styles
    premiumFeatureCard: {
        borderWidth: 2,
        borderColor: '#F59E0B',
        borderStyle: 'dashed',
        opacity: 0.8,
    },
    premiumBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FFFBEB',
        borderRadius: 8,
        padding: 2,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    premiumText: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 4,
    },
});

// Wrapper component with SubscriptionProvider
export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ profile }) => {
    return (
        <SubscriptionProvider userId={profile?.id}>
            <TeacherDashboardInner profile={profile} />
        </SubscriptionProvider>
    );
};

// Export the wrapped component as default
export default TeacherDashboard;
