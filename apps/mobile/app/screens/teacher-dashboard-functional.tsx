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
    View,
    Dimensions
} from 'react-native';
import PlanStatus from '@/components/subscription/PlanStatus';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { SubscriptionProvider, useFeatureAccess, useSubscription } from '@/contexts/SubscriptionContext';
import { shadow } from '@/lib/ui/shadow';
import { PageHeader, EmptyState, Button } from '@/src/design-system/components';
import { useT } from '@/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdZone from '@/components/ui/AdZone';

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
    const { t } = useT();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = Dimensions.get('window');
    const isSmallScreen = screenWidth < 375;
    const isVerySmallScreen = screenWidth < 320;
    
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
    const [tenantSlug, setTenantSlug] = useState<string | null>(null);
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

    const isPolicyRecursionError = (err: any) => {
        if (!err) return false;
        const msg = String(err.message || err?.toString?.() || '').toLowerCase();
        const code = String((err.code || '')).toUpperCase();
        return code === '42P17' || msg.includes('infinite recursion') || msg.includes('policy') || msg.includes('recursion');
    };

    const safeSelect = async <T,>(fn: () => Promise<{ data: T | null; error: any }>): Promise<T | null> => {
        try {
            const { data, error } = await fn();
            if (error) throw error;
            return data;
        } catch (e: any) {
            if (isPolicyRecursionError(e)) {
                // Graceful fallback: return null so UI renders empty states without crashing
                return null;
            }
            throw e;
        }
    };

    const loadTeacherData = async () => {
        if (!profile) return;

        try {
            setLoading(true);
            setError(null);

            const preschoolId = profile.preschool_id;
            if (!preschoolId) {
                throw new Error('No preschool assigned to this teacher');
            }

            // Load preschool name (safe)
            const preschoolData = await safeSelect(async () => (
                await supabase
                    .from('preschools')
                    .select('name, id')
                    .eq('id', preschoolId)
                    .single()
            ));
            if (preschoolData) {
                const t: any = preschoolData as any;
                setTenantName(t.name);
                const slug = t.id || (t.name ? String(t.name).toLowerCase().replace(/\s+/g, '-') : null) || 'unknown';
                setTenantSlug(slug);
            }

            // Load classes (safe; return [] on recursion)
            const classesData = await safeSelect(async () => (
                await supabase
                    .from('classes')
                    .select('*')
                    .eq('preschool_id', preschoolId)
                    .eq('is_active', true)
            ));
            setClasses((classesData as any[]) || []);

            // Load students (safe)
            const studentsData = await safeSelect(async () => (
                await supabase
                    .from('students')
                    .select('*')
                    .eq('preschool_id', preschoolId)
                    .eq('is_active', true)
            ));
            setStudents((studentsData as any[]) || []);
            setTotalStudents(((studentsData as any[]) || []).length);

            // Load lessons (safe)
            const lessonsData = await safeSelect(async () => (
                await supabase
                    .from('lessons')
                    .select('*')
                    .eq('preschool_id', preschoolId)
                    .order('created_at', { ascending: false })
                    .limit(10)
            ));
            setLessons((lessonsData as any[]) || []);

            // Load homework assignments (safe)
            const homeworkData = await safeSelect(async () => (
                await supabase
                    .from('homework_assignments')
                    .select('*')
                    .eq('teacher_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(5)
            ));
            setHomeworkAssignments((homeworkData as any[]) || []);

        } catch (error: any) {
            console.error('Error loading teacher data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderMetricCard = (title: string, value: string | number, icon: string, color: string) => (
        <View style={[styles.metricCard, shadow(2), { backgroundColor: colors.card, borderTopColor: color }]}>
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
            style={[styles.classCard, shadow(2), { backgroundColor: colors.card, borderColor: colors.border }]}
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
                style={[styles.lessonCard, shadow(2), { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/screens/lessons?lessonId=${lesson.id}`)}
            >
                <View style={styles.lessonHeader}>
                    <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                    <View style={[styles.lessonStatus, { backgroundColor: statusBg }]}>
                        <Text style={[styles.lessonStatusText, { color: statusColor }]}>
{isPublic ? t('dashboard.lesson.public') : t('dashboard.lesson.private')}
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
{t('dashboard.lesson.durationMinutes', { minutes: lesson.duration_minutes || 'N/A' })}
                    </Text>
                    <Text style={[styles.lessonDifficulty, { color: colors.textSecondary }]}> 
{t('dashboard.lesson.level', { level: lesson.difficulty_level || 'N/A' })}
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
                // Non-blocking: do not force upgrade if client-side tracking fails.
                // Server-side ai-proxy will enforce real limits.
                console.warn('AI usage tracking failed on client; proceeding to feature.');
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

        // Compute remaining counter for AI quick actions
        const remainingText = (featureId === 'ai_lesson_generator' && isAIFeature && aiUsage)
          ? (aiUsage.monthlyLimit === -1 ? '∞ left' : `${Math.max(0, aiUsage.monthlyLimit - aiUsage.currentUsage)} left`)
          : null;

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
                {remainingText && !needsUpgrade && !isLimited && (
                    <Text style={[styles.remainingText, { color: colors.textSecondary }]}>{remainingText}</Text>
                )}
                {needsUpgrade && (
                    <Text style={[styles.premiumText, { color: colors.textSecondary }]}>Premium</Text>
                )}
                {isLimited && !needsUpgrade && (
                    <Text style={[styles.premiumText, { color: colors.textSecondary }]}>Limit Reached</Text>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, styles.centered]} className="flex-1 bg-background">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard...</Text>
          {/* Banner placement for dashboard */}
          <AdZone>
            <View />
          </AdZone>
        </View>
    );
}

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, styles.centered]} className="flex-1 bg-background">
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
        <View style={[styles.container, { backgroundColor: colors.background }]} className="flex-1 bg-background">
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
                        onNavigate={(route: string) => {
                            if (route.startsWith('/')) {
                                router.push(route as any);
                            } else {
                                router.push(`/screens/${route}` as any);
                            }
                        }}
                    />
                )}
            </AuthConsumer>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Modern Responsive Header Section (Google-style) */}
                <View style={[
                    styles.modernHeaderSection,
                    { 
                        paddingLeft: Math.max(12, insets.left + (isSmallScreen ? 12 : 16)),
                        paddingRight: Math.max(12, insets.right + (isSmallScreen ? 12 : 16))
                    }
                ]}>
                    <View style={styles.titleSection}>
                        <Text style={[
                            styles.modernTitle,
                            (isVerySmallScreen ? styles.modernTitleVerySmall : (isSmallScreen ? styles.modernTitleSmall : styles.modernTitleDefault)),
                            { color: colors.text }
                        ]}>
{(() => { const h = new Date().getHours(); return h < 12 ? t('dashboard.goodMorning') : h < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening'); })()} 👋</Text>
                        <Text style={[
                            styles.modernSubtitle,
                            (isSmallScreen ? styles.modernSubtitleSmall : styles.modernSubtitleDefault),
                            { color: colors.textSecondary }
                        ]}>
{tenantName ? t('dashboard.teachingAt', { name: tenantName }) : t('dashboard.teacherTagline')}
                        </Text>
                        {tenantName && (
                            <View style={[
                                styles.tenantBadge,
                                isDark ? styles.tenantBadgeDark : styles.tenantBadgeLight
                            ]}>
                                <Text style={styles.tenantLabel}>🏫 {tenantName}</Text>
                            </View>
                        )}
                    </View>
                    <View>
<Button text={t('dashboard.actions.createLesson')} onPress={() => router.push('/screens/lessons')} />
                    </View>
                </View>
                {/* Subscription Status */}
                {!subscriptionLoading && (
                    <PlanStatus
                        subscription={subscription}
                        aiUsage={aiUsage}
                        loading={subscriptionLoading}
                        compact={true}
                        onUpgrade={() => setUpgradeModal({
                            visible: true,
                            featureName: t('subscription.upgradeTitle', { defaultValue: 'Upgrade to Quantum Pro' }),
                            description: t('subscription.upgradeDescription', { defaultValue: 'Unlock unlimited AI, homework grading and more.' })
                        })}
                    />
                )}

                {/* Metrics Overview */}
                <View style={styles.metricsGrid}>
{renderMetricCard(t('nav.classes'), classes.length, 'book.closed', '#3B82F6')}
{renderMetricCard(t('nav.students'), totalStudents, 'person.2', '#10B981')}
{renderMetricCard(t('education.lessons'), lessons.length, 'graduationcap', '#F59E0B')}
{renderMetricCard(t('education.homework'), homeworkAssignments.length, 'doc.text', '#EF4444')}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
<Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.quickActions')}</Text>
                    <View style={styles.quickActionsGrid}>
                        {renderQuickAction(
t('dashboard.actions.aiLessonGenerator'),
                            'plus.circle',
                            () => router.push('/screens/ai-lesson-generator'),
                            '#3B82F6',
                            'ai_lesson_generator',
t('dashboard.actions.aiLessonGenerator_description')
                        )}
                        {renderQuickAction(
t('dashboard.actions.gradeHomework'),
                            'doc.badge.plus',
                            () => router.push('/screens/ai-homework-grader-live'),
                            '#10B981',
                            'homework_grader',
t('dashboard.actions.gradeHomework_description')
                        )}
                        {renderQuickAction(
t('dashboard.actions.stemActivities'),
                            'lightbulb',
                            () => router.push('/(tabs)/activities'),
                            '#F59E0B',
                            'stem_activities',
t('dashboard.actions.stemActivities_description')
                        )}
                        {renderQuickAction(
t('dashboard.actions.progressAnalysis'),
                            'chart.bar',
                            () => router.push('/screens/analytics'),
                            '#8B5CF6',
                            'progress_analysis',
t('dashboard.actions.progressAnalysis_description')
                        )}
                    </View>
                </View>

                {/* My Classes */}
                <View style={styles.section}>
<Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.myClasses.title')}</Text>
                    {classes.length === 0 ? (
<EmptyState title={t('dashboard.empty.noClassesTitle')} description={t('dashboard.empty.noClassesDescription')} primaryAction={{ label: t('dashboard.actions.createClass'), onPress: () => router.push('/screens/school-setup') }} />
                    ) : null}
                    {classes.map(renderClassCard)}
                </View>

                {/* Active Lessons */}
                <View style={styles.section}>
<Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.currentLessons')}</Text>
                    {lessons.length === 0 ? (
<EmptyState title={t('dashboard.empty.noLessonsTitle')} description={t('dashboard.empty.noLessonsDescription')} primaryAction={{ label: t('dashboard.actions.browseLessons'), onPress: () => router.push('/screens/lessons') }} />
                    ) : null}
                    {lessons.slice(0, 3).map(renderLessonCard)}
                    {lessons.length > 0 && (
                        <TouchableOpacity
                            style={styles.viewAllButton}
                            onPress={() => router.push('/screens/lessons')}
                        >
<Text style={[styles.viewAllText, { color: colors.text }]}>{t('dashboard.viewAllLessons')}</Text>
                            <IconSymbol name="chevron.right" size={16} color="#3B82F6" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Recent Homework Assignments */}
                <View style={styles.section}>
<Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.recentHomeworkAssignments')}</Text>
                    {homeworkAssignments.length === 0 ? (
<EmptyState title={t('dashboard.empty.noHomeworkTitle')} description={t('dashboard.empty.noHomeworkDescription')} primaryAction={{ label: t('dashboard.actions.createAssignment'), onPress: () => router.push('/screens/analytics') }} />
                    ) : null}
                    {homeworkAssignments.map((homework) => {
                        const dueDate = homework.due_date ? new Date(homework.due_date) : null;
                        const today = new Date();
                        const isOverdue = dueDate ? dueDate < today : false;
                        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                            <TouchableOpacity
                                key={homework.id}
                                style={[styles.assignmentCard, shadow(2), { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => router.push(`/screens/analytics`)}
                            >
                                <View style={styles.assignmentHeader}>
                                    <Text style={[styles.assignmentTitle, { color: colors.text }]}>{homework.title}</Text>
                                    <Text style={[styles.assignmentDue, isOverdue && styles.overdue, { color: colors.textSecondary }]}>
{daysUntilDue === null ? t('dashboard.noDueDate') :
                                            daysUntilDue > 1 ? t('dashboard.dueInDays_other', { count: daysUntilDue }) :
                                            daysUntilDue === 1 ? t('dashboard.dueInDays_one', { count: daysUntilDue }) :
                                            daysUntilDue === 0 ? t('dashboard.dueToday') :
                                            Math.abs(daysUntilDue) === 1 ? t('dashboard.overdueByDays_one', { count: Math.abs(daysUntilDue) }) : t('dashboard.overdueByDays_other', { count: Math.abs(daysUntilDue) })}
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
    remainingText: {
        fontSize: 12,
        marginTop: 2,
        textAlign: 'center',
    },
    // Modern Google-style header section
    modernHeaderSection: {
        paddingHorizontal: 4,
        paddingVertical: 20,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
    },
    titleSection: {
        marginBottom: 12,
        flex: 1,
        paddingRight: 12,
        minWidth: 0,
    },
    modernTitle: {
        fontWeight: '300',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    modernTitleDefault: { fontSize: 32, lineHeight: 40 },
    modernTitleSmall: { fontSize: 28, lineHeight: 34 },
    modernTitleVerySmall: { fontSize: 24, lineHeight: 30 },
    modernSubtitle: {
        opacity: 0.7,
    },
    modernSubtitleDefault: { fontSize: 14, lineHeight: 20 },
    modernSubtitleSmall: { fontSize: 13, lineHeight: 20 },
    tenantBadge: {
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: 12,
        alignSelf: 'flex-start',
        maxWidth: '100%',
    },
    tenantBadgeLight: { backgroundColor: 'rgba(66, 133, 244, 0.1)' },
    tenantBadgeDark: { backgroundColor: 'rgba(66, 133, 244, 0.2)' },
    tenantLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4285F4',
        flexShrink: 1,
        flexWrap: 'wrap',
    },
});

// Wrapper component with SubscriptionProvider
export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ profile }) => {
    return (
        <SubscriptionProvider userId={profile?.auth_user_id}>
            <TeacherDashboardInner profile={profile} />
        </SubscriptionProvider>
    );
};

// Export the wrapped component as default
export default TeacherDashboard;
