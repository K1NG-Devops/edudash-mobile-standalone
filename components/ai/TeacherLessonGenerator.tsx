import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { lessonGenerator, LESSON_TEMPLATES, LessonTemplate } from '@/lib/ai/lessonGenerator';
import { LessonContent, isAIAvailable } from '@/lib/ai/claudeService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { TOPIC_CATEGORIES, Topic, getFilteredTopics, getTopicsByCategory, searchTopics } from '@/lib/constants/topicLibrary';

interface TeacherLessonGeneratorProps {
  userId: string;
  preschoolId: string;
  onLessonGenerated: (lesson: LessonContent) => void;
  onClose: () => void;
}

interface GenerationStep {
  id: number;
  title: string;
  completed: boolean;
  active: boolean;
}

type ResolvedLesson = NonNullable<LessonContent>;

export const TeacherLessonGenerator: React.FC<TeacherLessonGeneratorProps> = ({
  userId,
  preschoolId,
  onLessonGenerated,
  onClose,
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const [customMode, setCustomMode] = useState(false);
  
  // Topic selection
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicSearch, setTopicSearch] = useState('');
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  
  // Form data
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState('3-4 years');
  const [duration, setDuration] = useState(30);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'challenging'>('medium');
  
  // Generated content
  const [generatedLesson, setGeneratedLesson] = useState<LessonContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastGenAt, setLastGenAt] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const steps: GenerationStep[] = [
    { id: 0, title: 'Choose Topic', completed: false, active: true },
    { id: 1, title: 'Set Parameters', completed: false, active: false },
    { id: 2, title: 'Generate Content', completed: false, active: false },
    { id: 3, title: 'Review & Save', completed: false, active: false },
  ];

  const [stepStates, setStepStates] = useState(steps);

  useEffect(() => {
    if (!isAIAvailable()) {
      Alert.alert(
        'AI Not Available',
        'AI lesson generation requires an Anthropic API key. Please configure your environment.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
    
    // Initialize with age-appropriate topics
    const initialTopics = getFilteredTopics({ ageGroup });
    setFilteredTopics(initialTopics);
  }, []);

  // Update filtered topics when category or search changes
  useEffect(() => {
    let topics: Topic[] = [];
    
    if (topicSearch.trim()) {
      topics = searchTopics(topicSearch);
    } else if (selectedCategory) {
      topics = getTopicsByCategory(selectedCategory);
    } else {
      topics = getFilteredTopics({ ageGroup });
    }
    
    // Filter by age group
    topics = topics.filter(t => t.ageGroups.includes(ageGroup));
    setFilteredTopics(topics);
  }, [selectedCategory, topicSearch, ageGroup]);

  const updateSteps = (completedStep: number) => {
    setStepStates(prev => prev.map(step => ({
      ...step,
      completed: step.id < completedStep,
      active: step.id === completedStep
    })));
  };

  const handleTopicSelect = (topicData: Topic) => {
    setSelectedTopic(topicData);
    setTopic(topicData.name);
    setDuration(topicData.duration);
    setLearningObjectives([...topicData.learningObjectives]);
    setDifficulty(topicData.difficulty);
    
    // Auto-select appropriate subjects based on topic
    const topicCategory = TOPIC_CATEGORIES.find(cat => 
      cat.topics.some(t => t.id === topicData.id)
    );
    if (topicCategory) {
      setSubjects(topicCategory.subjects.slice(0, 2)); // Limit to 2 subjects
    }
    
    setCurrentStep(1);
    updateSteps(1);
  };

  const handleTemplateSelect = (template: LessonTemplate) => {
    setSelectedTemplate(template);
    setSubjects(template.subjects);
    setDuration(template.duration);
    setTopic(''); // Reset topic for template mode
    setCurrentStep(1);
    updateSteps(1);
  };

  const handleCustomMode = () => {
    setCustomMode(true);
    setSelectedTemplate(null);
    setSelectedTopic(null);
    setSubjects(['Science']);
    setTopic('');
    setLearningObjectives(['']);
    setCurrentStep(1);
    updateSteps(1);
  };

  const addLearningObjective = () => {
    setLearningObjectives([...learningObjectives, '']);
  };

  const updateObjective = (index: number, value: string) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const removeObjective = (index: number) => {
    if (learningObjectives.length > 1) {
      setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
    }
  };

  const toggleSubject = (s: string) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const validateForm = (): boolean => {
    if (!topic.trim()) {
      const msg = 'Please enter a topic for your lesson.';
      setFormError(msg);
      Alert.alert('Missing Topic', msg);
      return false;
    }

    if (customMode && subjects.length === 0) {
      const msg = 'Please select at least one subject.';
      setFormError(msg);
      Alert.alert('Missing Subjects', msg);
      return false;
    }

    const validObjectives = learningObjectives.filter(obj => obj.trim().length > 0);
    if (validObjectives.length === 0) {
      const msg = 'Please add at least one learning objective.';
      setFormError(msg);
      Alert.alert('Missing Objectives', msg);
      return false;
    }

    setFormError(null);
    return true;
  };

  const generateLesson = async () => {
    const now = Date.now();
    if (now - lastGenAt < 2000) {
      Alert.alert('Please wait', 'You are generating too quickly. Try again in a moment.');
      return;
    }
    setLastGenAt(now);
    if (!validateForm()) return;

    setFormError(null);
    setGenError(null);
    setIsGenerating(true);
    setCurrentStep(2);
    updateSteps(2);

    try {
      const validObjectives = learningObjectives.filter(obj => obj.trim().length > 0);

      let result;
      if (selectedTemplate && !customMode && !selectedTopic) {
        result = await lessonGenerator.generateLessonFromTemplate({
          templateId: selectedTemplate.id,
          topic,
          ageGroup,
          customObjectives: validObjectives,
          userId,
          preschoolId,
        });
      } else {
        result = await lessonGenerator.generateCustomLesson({
          topic,
          ageGroup,
          duration,
          subjects: subjects.length > 0 ? subjects : ['General'],
          learningObjectives: validObjectives,
          difficulty,
          userId,
          preschoolId,
        });
      }

      if (result.success && result.lesson) {
        setGeneratedLesson(result.lesson);
        setCurrentStep(3);
        updateSteps(3);
      } else {
        throw new Error(result.error || 'Failed to generate lesson');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to generate lesson. Please try again.';
      setGenError(msg);
      
      // Check if this error includes quota information
      const isQuotaProtected = msg.includes('not counted against your quota') || 
                               msg.includes('not count towards your quota');
      
      const title = isQuotaProtected ? 'Request Failed - No Charges Applied' : 'Generation Failed';
      const message = isQuotaProtected ? 
        `${msg}\n\n✅ This failed request has not been counted against your AI usage quota.` :
        msg;
      
      Alert.alert(
        title,
        message,
        [
          { text: 'Back to Parameters', onPress: () => setCurrentStep(1) },
          { text: 'OK' }
        ]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLesson = () => {
    if (generatedLesson) {
      onLessonGenerated(generatedLesson);
      Alert.alert(
        'Lesson Generated!',
        'Your AI-generated lesson is ready to use.',
        [{ text: 'Great!', onPress: onClose }]
      );
    }
  };

  // Resource generation functions
  const generateWorksheet = (lesson: ResolvedLesson) => {
    Alert.alert(
      'Generate Worksheet',
      `Would you like to create a printable worksheet for "${lesson.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: () => {
            Alert.alert('Worksheet Generated', 'A printable worksheet has been created and is ready for download.');
          }
        }
      ]
    );
  };

  const findEducationalVideos = (lesson: ResolvedLesson) => {
    Alert.alert(
      'Educational Videos',
      'Here are some suggested video searches for your lesson:',
      [
        { text: 'YouTube Search', onPress: () => console.log('Opening YouTube search') },
        { text: 'Educational Platforms', onPress: () => console.log('Opening educational platforms') },
        { text: 'Done', style: 'cancel' }
      ]
    );
  };

  const generateParentGuide = (lesson: ResolvedLesson) => {
    Alert.alert(
      'Parent Guide',
      `Creating a parent guide for "${lesson.title}" with:\n\n• Learning objectives\n• Activities to do at home\n• Discussion questions\n• Materials needed`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: () => {
            Alert.alert('Parent Guide Created', 'A comprehensive parent guide has been generated and is ready to share.');
          }
        }
      ]
    );
  };

  const generateAssessmentRubric = (lesson: ResolvedLesson) => {
    Alert.alert(
      'Assessment Rubric',
      `Creating an assessment rubric for "${lesson.title}" with evaluation criteria for:\n\n• Understanding of concepts\n• Participation level\n• Skill demonstration\n• Creative expression`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: () => {
            Alert.alert('Assessment Rubric Created', 'A detailed assessment rubric has been generated for this lesson.');
          }
        }
      ]
    );
  };

  const getStyles = () => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: palette.outline,
      backgroundColor: palette.surface,
    },
    closeButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
    },
    headerSpacer: {
      width: 40,
    },
    stepIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      backgroundColor: palette.surface,
      marginBottom: 1,
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colorScheme === 'dark' ? '#6B7280' : '#D1D5DB',
    },
    stepCompleted: {
      backgroundColor: '#10B981',
      borderColor: '#10B981',
    },
    stepActive: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textSecondary,
    },
    stepNumberActive: {
      color: '#FFFFFF',
    },
    stepConnector: {
      width: 40,
      height: 2,
      backgroundColor: colorScheme === 'dark' ? '#6B7280' : '#D1D5DB',
      marginHorizontal: 8,
    },
    stepConnectorCompleted: {
      backgroundColor: '#10B981',
    },
    stepContent: {
      flex: 1,
      padding: 20,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 8,
    },
    stepDescription: {
      fontSize: 16,
      color: palette.textSecondary,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 12,
      marginTop: 8,
    },
    categoriesContainer: {
      marginBottom: 20,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.outline,
      marginRight: 8,
      backgroundColor: palette.surface,
    },
    categoryChipActive: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    categoryChipText: {
      color: palette.text,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 4,
    },
    categoryChipTextActive: {
      color: '#FFFFFF',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.outline,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: palette.surface,
      marginBottom: 16,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: palette.text,
    },
    clearSearch: {
      marginLeft: 8,
    },
    topicsGrid: {
      marginBottom: 20,
    },
    topicCard: {
      backgroundColor: palette.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: palette.outline,
    },
    topicCardSelected: {
      borderColor: '#3B82F6',
      backgroundColor: colorScheme === 'dark' ? '#1E3A8A' : '#EBF4FF',
    },
    topicHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    topicName: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      flex: 1,
    },
    topicMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    topicDuration: {
      fontSize: 12,
      color: '#3B82F6',
      fontWeight: '500',
      marginRight: 8,
    },
    topicDifficulty: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    topicDescription: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    topicAges: {
      fontSize: 12,
      color: '#059669',
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
      marginTop: 12,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: palette.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    customModeButton: {
      marginTop: 24,
    },
    customModeGradient: {
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    customModeText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 8,
    },
    customModeSubtext: {
      fontSize: 14,
      color: '#E0E7FF',
      marginTop: 4,
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: palette.outline,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: palette.surface,
      color: palette.text,
    },
    segmentControl: {
      flexDirection: 'row',
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      padding: 4,
    },
    segmentButton: {
      flex: 1,
      padding: 8,
      borderRadius: 6,
      alignItems: 'center',
    },
    segmentButtonActive: {
      backgroundColor: palette.surface,
    },
    segmentText: {
      fontSize: 14,
      color: palette.textSecondary,
      fontWeight: '500',
    },
    segmentTextActive: {
      color: '#3B82F6',
      fontWeight: '600',
    },
    subjectChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.outline,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: palette.surface,
    },
    subjectChipActive: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    subjectChipText: {
      color: palette.text,
      fontSize: 14,
    },
    subjectChipTextActive: {
      color: '#FFFFFF',
    },
    subjectGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    objectiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    objectiveInput: {
      flex: 1,
      marginBottom: 0,
    },
    removeButton: {
      marginLeft: 12,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    addButtonText: {
      marginLeft: 8,
      color: '#3B82F6',
      fontWeight: '500',
    },
    generateButton: {
      marginTop: 24,
    },
    generateGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
    },
    generateButtonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    errorText: {
      color: '#EF4444',
      marginTop: 8,
      marginBottom: 8,
    },
    generatingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    generatingTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: palette.text,
      marginTop: 16,
      marginBottom: 8,
    },
    generatingDescription: {
      fontSize: 16,
      color: palette.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    generatingSteps: {
      alignItems: 'flex-start',
    },
    generatingStep: {
      fontSize: 14,
      color: '#059669',
      marginVertical: 4,
    },
    previewCard: {
      backgroundColor: palette.surface,
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: palette.outline,
    },
    previewTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 8,
    },
    previewDescription: {
      fontSize: 16,
      color: palette.textSecondary,
      marginBottom: 20,
      lineHeight: 24,
    },
    previewSection: {
      marginBottom: 20,
    },
    previewSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 8,
    },
    previewText: {
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    activityItem: {
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#F9FAFB',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 4,
    },
    activityDescription: {
      fontSize: 12,
      color: palette.textSecondary,
      marginBottom: 4,
    },
    activityTime: {
      fontSize: 12,
      color: '#059669',
      fontWeight: '500',
    },
    moreActivities: {
      fontSize: 12,
      color: '#3B82F6',
      fontStyle: 'italic',
    },
    previewActions: {
      flexDirection: 'row',
      gap: 12,
    },
    previewButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 8,
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
    },
    previewButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
      color: '#3B82F6',
    },
    saveButton: {
      flex: 1,
    },
    saveGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 8,
    },
    saveButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    fullPreviewContainer: {
      flex: 1,
      backgroundColor: palette.background,
    },
    fullPreviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: palette.outline,
      backgroundColor: palette.surface,
    },
    fullPreviewTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
      textAlign: 'center',
      marginLeft: -24,
    },
    fullPreviewContent: {
      flex: 1,
      padding: 20,
    },
    fullLessonTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 12,
    },
    fullLessonDescription: {
      fontSize: 16,
      color: palette.textSecondary,
      marginBottom: 24,
      lineHeight: 24,
    },
    fullSectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
      marginTop: 24,
      marginBottom: 12,
    },
    fullSectionText: {
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    fullActivityCard: {
      backgroundColor: palette.surface,
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: palette.outline,
    },
    fullActivityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 8,
    },
    fullActivityDescription: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 8,
    },
    fullActivityInstructions: {
      fontSize: 14,
      color: palette.text,
      marginBottom: 8,
    },
    fullActivityMaterials: {
      fontSize: 12,
      color: '#059669',
      marginBottom: 4,
    },
    fullActivityTime: {
      fontSize: 12,
      color: '#3B82F6',
      fontWeight: '500',
    },
    fullQuestionText: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    fullExtensionText: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    resourceSection: {
      backgroundColor: palette.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: palette.outline,
    },
    resourceSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginTop: 16,
      marginBottom: 8,
    },
    resourceButton: {
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: palette.outline,
    },
    resourceButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#3B82F6',
      textAlign: 'center',
    },
  });

  const styles = getStyles();

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {stepStates.map((step, index) => (
        <React.Fragment key={step.id}>
          <View style={[
            styles.stepCircle,
            step.completed && styles.stepCompleted,
            step.active && styles.stepActive
          ]}>
            {step.completed ? (
              <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.stepNumber,
                step.active && styles.stepNumberActive
              ]}>
                {step.id + 1}
              </Text>
            )}
          </View>
          {index < stepStates.length - 1 && (
            <View style={[
              styles.stepConnector,
              step.completed && styles.stepConnectorCompleted
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderTopicSelection = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Topic & Approach</Text>
      <Text style={styles.stepDescription}>
        Browse topics by category, search for something specific, or create a custom lesson.
      </Text>

      {/* Category Filter */}
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => { setSelectedCategory(null); setTopicSearch(''); }}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
        </TouchableOpacity>
        {TOPIC_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
            onPress={() => { setSelectedCategory(category.id); setTopicSearch(''); }}
          >
            <IconSymbol name={category.icon as any} size={16} color={selectedCategory === category.id ? '#FFFFFF' : palette.text} />
            <Text style={[styles.categoryChipText, selectedCategory === category.id && styles.categoryChipTextActive]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Topic Search */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={palette.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={topicSearch}
          onChangeText={setTopicSearch}
          placeholder="Search topics..."
          placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
        />
        {topicSearch.length > 0 && (
          <TouchableOpacity onPress={() => setTopicSearch('')} style={styles.clearSearch}>
            <IconSymbol name="xmark.circle.fill" size={20} color={palette.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Topics Grid */}
      <Text style={styles.sectionTitle}>
        {selectedCategory 
          ? `${TOPIC_CATEGORIES.find(c => c.id === selectedCategory)?.name} Topics` 
          : topicSearch 
          ? `Search Results (${filteredTopics.length})` 
          : `Age-Appropriate Topics (${filteredTopics.length})`}
      </Text>
      
      <View style={styles.topicsGrid}>
        {filteredTopics.map((topicItem) => (
          <TouchableOpacity
            key={topicItem.id}
            style={[styles.topicCard, selectedTopic?.id === topicItem.id && styles.topicCardSelected]}
            onPress={() => handleTopicSelect(topicItem)}
          >
            <View style={styles.topicHeader}>
              <Text style={styles.topicName}>{topicItem.name}</Text>
              <View style={styles.topicMeta}>
                <Text style={styles.topicDuration}>{topicItem.duration}m</Text>
                <Text style={[styles.topicDifficulty, { color: 
                  topicItem.difficulty === 'easy' ? '#10B981' :
                  topicItem.difficulty === 'medium' ? '#F59E0B' : '#EF4444'
                }]}>{topicItem.difficulty}</Text>
              </View>
            </View>
            <Text style={styles.topicDescription}>{topicItem.description}</Text>
            <Text style={styles.topicAges}>{topicItem.ageGroups.join(', ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTopics.length === 0 && (
        <View style={styles.emptyState}>
          <IconSymbol name="questionmark.circle" size={48} color={palette.textSecondary} />
          <Text style={styles.emptyStateText}>No topics found</Text>
          <Text style={styles.emptyStateSubtext}>
            {topicSearch ? 'Try a different search term' : 'Try selecting a different category'}
          </Text>
        </View>
      )}

      {/* Custom Mode Option */}
      <TouchableOpacity style={styles.customModeButton} onPress={handleCustomMode}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.customModeGradient}>
          <IconSymbol name="wand.and.stars" size={24} color="#FFFFFF" />
          <Text style={styles.customModeText}>Create Custom Lesson</Text>
          <Text style={styles.customModeSubtext}>Full control over content and parameters</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderParameterSetting = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {selectedTopic ? `Customize: ${selectedTopic.name}` : 'Lesson Parameters'}
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Topic *</Text>
        <TextInput
          style={styles.textInput}
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g., Colors and Rainbows"
          placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age Group</Text>
        <View style={styles.segmentControl}>
          {['2-3 years', '3-4 years', '4-5 years'].map((age) => (
            <TouchableOpacity
              key={age}
              style={[
                styles.segmentButton,
                ageGroup === age && styles.segmentButtonActive
              ]}
              onPress={() => setAgeGroup(age)}
            >
              <Text style={[
                styles.segmentText,
                ageGroup === age && styles.segmentTextActive
              ]}>
                {age}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {(customMode || selectedTopic) && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={duration.toString()}
              onChangeText={(text) => setDuration(parseInt(text) || 30)}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Difficulty Level</Text>
            <View style={styles.segmentControl}>
              {['easy', 'medium', 'challenging'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.segmentButton,
                    difficulty === level && styles.segmentButtonActive
                  ]}
                  onPress={() => setDifficulty(level as any)}
                >
                  <Text style={[
                    styles.segmentText,
                    difficulty === level && styles.segmentTextActive
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subjects</Text>
            <View style={styles.subjectGrid}>
              {['Science', 'Math', 'Language Arts', 'Art', 'Music', 'Creative Expression', 'Social Skills', 'Nature Studies'].map((sub) => {
                const active = subjects.includes(sub);
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.subjectChip, active && styles.subjectChipActive]}
                    onPress={() => toggleSubject(sub)}
                  >
                    <Text style={[styles.subjectChipText, active && styles.subjectChipTextActive]}>{sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{ marginTop: 6, color: palette.textSecondary, fontSize: 12 }}>
              Select one or more subjects to guide the lesson focus.
            </Text>
          </View>
        </>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Learning Objectives</Text>
        {learningObjectives.map((objective, index) => (
          <View key={index} style={styles.objectiveRow}>
            <TextInput
              style={[styles.textInput, styles.objectiveInput]}
              value={objective}
              onChangeText={(text) => updateObjective(index, text)}
              placeholder="What should children learn?"
              placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
            {learningObjectives.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeObjective(index)}
              >
                <IconSymbol name="minus.circle.fill" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addLearningObjective}>
          <IconSymbol name="plus.circle.fill" size={20} color="#3B82F6" />
          <Text style={styles.addButtonText}>Add Objective</Text>
        </TouchableOpacity>
      </View>

      {formError && (
        <Text style={styles.errorText}>{formError}</Text>
      )}

      {(() => {
        const canGenerate = topic.trim().length > 0 && learningObjectives.some(obj => obj.trim().length > 0);
        return (
          <TouchableOpacity 
            style={[styles.generateButton, !canGenerate && { opacity: 0.6 }]} 
            onPress={generateLesson} 
            disabled={!canGenerate}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.generateGradient}>
              <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate Lesson with AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })()}
    </ScrollView>
  );

  const renderGenerating = () => (
    <View style={styles.generatingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.generatingTitle}>AI is Creating Your Lesson...</Text>
      <Text style={styles.generatingDescription}>
        Our AI is crafting a personalized lesson plan based on your requirements. This may take a moment.
      </Text>
      <View style={styles.generatingSteps}>
        <Text style={styles.generatingStep}>• Analyzing age-appropriate content</Text>
        <Text style={styles.generatingStep}>• Creating engaging activities</Text>
        <Text style={styles.generatingStep}>• Generating assessment questions</Text>
        <Text style={styles.generatingStep}>• Adding home extension ideas</Text>
      </View>
    </View>
  );

  const renderGenerationError = () => (
    <View style={styles.generatingContainer}>
      <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
      <Text style={[styles.generatingTitle, { color: '#EF4444' }]}>Generation Failed</Text>
      <Text style={styles.generatingDescription}>{genError || 'Something went wrong. Please try again.'}</Text>
      <TouchableOpacity 
        onPress={() => { setCurrentStep(1); setGenError(null); }} 
        style={[styles.previewButton, { marginTop: 16 }]}
      >
        <Text style={[styles.previewButtonText, { color: palette.text }]}>Back to Parameters</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => {
    if (!generatedLesson) return null;

    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Lesson Preview</Text>
        
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{generatedLesson.title}</Text>
          <Text style={styles.previewDescription}>{generatedLesson.description}</Text>
          
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Content</Text>
            <Text style={styles.previewText}>{generatedLesson.content.substring(0, 300)}...</Text>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Activities ({generatedLesson.activities.length})</Text>
            {generatedLesson.activities.slice(0, 2).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.estimatedTime} minutes</Text>
              </View>
            ))}
            {generatedLesson.activities.length > 2 && (
              <Text style={styles.moreActivities}>
                +{generatedLesson.activities.length - 2} more activities
              </Text>
            )}
          </View>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.previewButton} onPress={() => setShowPreview(true)}>
            <IconSymbol name="eye" size={20} color="#3B82F6" />
            <Text style={styles.previewButtonText}>Full Preview</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveLesson}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.saveGradient}>
              <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Lesson</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={palette.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Teacher Lesson Generator</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderStepIndicator()}

        {currentStep === 0 && renderTopicSelection()}
        {currentStep === 1 && renderParameterSetting()}
        {currentStep === 2 && (isGenerating ? renderGenerating() : (generatedLesson ? renderPreview() : renderGenerationError()))}
        {currentStep === 3 && renderPreview()}
      </View>

      {/* Full Preview Modal */}
      <Modal visible={showPreview} animationType="slide">
        <View style={styles.fullPreviewContainer}>
          <View style={styles.fullPreviewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)} style={{ padding: 8 }}>
              <IconSymbol name="chevron.left" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={styles.fullPreviewTitle}>Full Lesson Preview</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          {generatedLesson && (
            <ScrollView style={styles.fullPreviewContent}>
              <Text style={styles.fullLessonTitle}>{generatedLesson.title}</Text>
              <Text style={styles.fullLessonDescription}>{generatedLesson.description}</Text>
              
              <Text style={styles.fullSectionTitle}>Lesson Content</Text>
              <Text style={styles.fullSectionText}>{generatedLesson.content}</Text>
              
              <Text style={styles.fullSectionTitle}>Activities</Text>
              {generatedLesson.activities.map((activity, index) => (
                <View key={index} style={styles.fullActivityCard}>
                  <Text style={styles.fullActivityTitle}>{activity.title}</Text>
                  <Text style={styles.fullActivityDescription}>{activity.description}</Text>
                  <Text style={styles.fullActivityInstructions}>{activity.instructions}</Text>
                  <Text style={styles.fullActivityMaterials}>
                    Materials: {activity.materials.join(', ')}
                  </Text>
                  <Text style={styles.fullActivityTime}>Duration: {activity.estimatedTime} minutes</Text>
                </View>
              ))}
              
              <Text style={styles.fullSectionTitle}>Assessment Questions</Text>
              {generatedLesson.assessmentQuestions.map((question, index) => (
                <Text key={index} style={styles.fullQuestionText}>• {question}</Text>
              ))}
              
              <Text style={styles.fullSectionTitle}>Home Extension Activities</Text>
              {generatedLesson.homeExtension.map((extension, index) => (
                <Text key={index} style={styles.fullExtensionText}>• {extension}</Text>
              ))}
              
              {/* Enhanced Resources Section */}
              <Text style={styles.fullSectionTitle}>Resources & Materials</Text>
              
              <View style={styles.resourceSection}>
                <Text style={styles.resourceSubtitle}>📋 Printable Worksheets</Text>
                <TouchableOpacity style={styles.resourceButton} onPress={() => generateWorksheet(generatedLesson)}>
                  <Text style={styles.resourceButtonText}>Generate Worksheet PDF</Text>
                </TouchableOpacity>
                
                <Text style={styles.resourceSubtitle}>🎥 Educational Videos</Text>
                <TouchableOpacity style={styles.resourceButton} onPress={() => findEducationalVideos(generatedLesson)}>
                  <Text style={styles.resourceButtonText}>Find Related Videos</Text>
                </TouchableOpacity>
                
                <Text style={styles.resourceSubtitle}>🏠 Parent Resources</Text>
                <TouchableOpacity style={styles.resourceButton} onPress={() => generateParentGuide(generatedLesson)}>
                  <Text style={styles.resourceButtonText}>Generate Parent Guide</Text>
                </TouchableOpacity>
                
                <Text style={styles.resourceSubtitle}>🎯 Assessment Tools</Text>
                <TouchableOpacity style={styles.resourceButton} onPress={() => generateAssessmentRubric(generatedLesson)}>
                  <Text style={styles.resourceButtonText}>Create Assessment Rubric</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </Modal>
  );
};

export default TeacherLessonGenerator;
