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
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { lessonGenerator, LESSON_TEMPLATES, LessonTemplate } from '@/lib/ai/lessonGenerator';
import { claudeAI } from '@/lib/ai/claudeService';
import { useFeatureAccess } from '@/contexts/SubscriptionContext';
import { CLAUDE_MODELS } from '@/lib/utils/aiCostCalculator';
import { LessonContent , isAIAvailable } from '@/lib/ai/claudeService';
import { 
  SUBJECTS, 
  AGE_GROUPS, 
  getSubjectTopics, 
  searchTopics, 
  COMMON_OBJECTIVES,
  CurriculumTopic 
} from '@/lib/data/curriculumData';
import { useTheme } from '@/contexts/ThemeContext';
import { getTopicsBySubject as getLibTopicsBySubject } from '@/lib/constants/topicLibrary';
import { Colors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface LessonGeneratorProps {
  userId: string;
  preschoolId: string;
  onLessonGenerated: (lesson: LessonContent) => void;
  onClose: () => void;
  audience?: 'teacher' | 'parent';
}

interface GenerationStep {
  id: number;
  title: string;
  completed: boolean;
  active: boolean;
}

type ResolvedLesson = NonNullable<LessonContent>;

export const LessonGenerator: React.FC<LessonGeneratorProps> = ({
  userId,
  preschoolId,
  onLessonGenerated,
  onClose,
  audience = 'teacher',
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const [customMode, setCustomMode] = useState(false);
  
  // Subscription-tier aware model selection
  const { currentTier } = useFeatureAccess('ai_lesson_generator');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Enhanced form data with smart defaults
  const [topic, setTopic] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState('3-4');
  const [duration, setDuration] = useState(30);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'challenging'>('medium');
  const [liveUpdates, setLiveUpdates] = useState<boolean>(false);
  
  // Smart dropdown states
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showObjectivesModal, setShowObjectivesModal] = useState(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [availableTopics, setAvailableTopics] = useState<CurriculumTopic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<CurriculumTopic[]>([]);
  const [suggestedObjectives, setSuggestedObjectives] = useState<string[]>([]);
  
  // Generated content
  const [generatedLesson, setGeneratedLesson] = useState<LessonContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastGenAt, setLastGenAt] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [lastQuotaCharged, setLastQuotaCharged] = useState<boolean | null>(null);
  
  // Fine-grained generating progress
  const [genProgress, setGenProgress] = useState<{
    analyzing: 'idle' | 'active' | 'done';
    activities: 'idle' | 'active' | 'done';
    assessment: 'idle' | 'active' | 'done';
    home: 'idle' | 'active' | 'done';
  }>({ analyzing: 'idle', activities: 'idle', assessment: 'idle', home: 'idle' });
  const genTimers = React.useRef<number[]>([]);

  // Live streaming state
  const [streamingText, setStreamingText] = useState<string>("");

  function resetGenProgress() {
    setGenProgress({ analyzing: 'idle', activities: 'idle', assessment: 'idle', home: 'idle' });
    // clear timers
    genTimers.current.forEach((t) => clearTimeout(t));
    genTimers.current = [];
    setStreamingText("");
  }

  function startGenProgress() {
    resetGenProgress();
    setGenProgress({ analyzing: 'active', activities: 'idle', assessment: 'idle', home: 'idle' });
    // Stagger progress for better UX while waiting for server
    genTimers.current.push(setTimeout(() => setGenProgress((p) => ({ ...p, analyzing: 'done', activities: 'active' })), 900) as unknown as number);
    genTimers.current.push(setTimeout(() => setGenProgress((p) => ({ ...p, activities: 'done', assessment: 'active' })), 1800) as unknown as number);
    genTimers.current.push(setTimeout(() => setGenProgress((p) => ({ ...p, assessment: 'done', home: 'active' })), 2700) as unknown as number);
  }

  function finishGenProgress(success: boolean) {
    // Mark all as done on success; on failure, leave current states
    setGenProgress((p) => success ? { analyzing: 'done', activities: 'done', assessment: 'done', home: 'done' } : p);
    genTimers.current.forEach((t) => clearTimeout(t));
    genTimers.current = [];
  }
  
  // Update available topics when subjects or age group changes
  useEffect(() => {
    updateAvailableTopics();
  }, [subjects, ageGroup]);
  
  // Update filtered topics when search query changes
  useEffect(() => {
    // Normalize age group: allow either keys like '3-4' or labels like '3-4 years'
    const ageKey = Object.entries(AGE_GROUPS).find(([, label]) => label === ageGroup)?.[0] || ageGroup;
    if (topicSearchQuery.trim()) {
      const searchResults = searchTopics(topicSearchQuery, subjects[0], ageKey);
      // Apply audience tailoring to search results as well
      const tailored = (audience === 'parent')
        ? searchResults.filter(t => t.difficulty <= 3 && t.estimatedDuration <= 40)
        : searchResults;
      setFilteredTopics(tailored);
    } else {
      setFilteredTopics(availableTopics);
    }
  }, [topicSearchQuery, availableTopics, ageGroup, subjects]);
  
  const updateAvailableTopics = () => {
    // Normalize age group to internal key used by curriculum database
    const ageKey = Object.entries(AGE_GROUPS).find(([, label]) => label === ageGroup)?.[0] || ageGroup;

    // Helper: tailor topic list by audience
    const filterForAudience = (list: CurriculumTopic[]): CurriculumTopic[] => {
      if (audience === 'parent') {
        // Parents: prefer easy/medium and shorter activities for home
        return list
          .filter(t => (t.difficulty <= 3) && (t.estimatedDuration <= 40))
          .sort((a, b) => a.difficulty - b.difficulty || a.estimatedDuration - b.estimatedDuration);
      }
      // Teachers: keep full list but sort by age-appropriate duration then difficulty
      return [...list].sort((a, b) => a.estimatedDuration - b.estimatedDuration || a.difficulty - b.difficulty);
    };

    if (subjects.length === 0) {
      // If no subject chosen yet, show a helpful cross-subject topic list for the selected age
      const allTopicsForAge: CurriculumTopic[] = Object.keys(SUBJECTS).flatMap((subj) => {
        try {
          return getSubjectTopics(subj, ageKey);
        } catch {
          return [] as CurriculumTopic[];
        }
      });
      const tailored = filterForAudience(allTopicsForAge);
      setAvailableTopics(tailored);
      setFilteredTopics(tailored);
      return;
    }
    
    // Get topics for the primary subject and age group from curriculum DB
    const core = getSubjectTopics(subjects[0], ageKey);

    // Supplement with curated topic library, mapped to curriculum shape
    const curatedRaw = getLibTopicsBySubject(subjects[0]);
    const curatedMapped: CurriculumTopic[] = curatedRaw
      .filter(t => t.ageGroups.includes(AGE_GROUPS[ageKey as keyof typeof AGE_GROUPS] || ageGroup))
      .map(t => ({
        id: `lib-${t.id}`,
        name: t.name,
        description: t.description,
        objectives: t.learningObjectives,
        keywords: [],
        difficulty: t.difficulty === 'easy' ? 2 : t.difficulty === 'medium' ? 3 : 4,
        estimatedDuration: t.duration,
        materials: [],
      } as unknown as CurriculumTopic));

    // Merge, de-duplicate by name
    const merged = [...core, ...curatedMapped].reduce<CurriculumTopic[]>((acc, item) => {
      if (!acc.find(x => x.name.toLowerCase() === item.name.toLowerCase())) acc.push(item);
      return acc;
    }, []);

    const topics = filterForAudience(merged);
    setAvailableTopics(topics);
    setFilteredTopics(topics);
    
    // Clear selected topic if it's not available for current subject/age
    if (selectedTopicId && !topics.find(t => t.id === selectedTopicId)) {
      setSelectedTopicId(null);
      setTopic('');
      setLearningObjectives([]);
    }
  };
  
  const handleTopicSelect = (selectedTopic: CurriculumTopic) => {
    setSelectedTopicId(selectedTopic.id);
    setTopic(selectedTopic.name);
    setDuration(selectedTopic.estimatedDuration);
    setLearningObjectives([...selectedTopic.objectives]);
    setSuggestedObjectives(selectedTopic.objectives);
    setShowTopicDropdown(false);
    setTopicSearchQuery('');
  };
  
  const handleSubjectToggle = (subject: string) => {
    setSubjects(prev => {
      let newSubjects;
      if (prev.includes(subject)) {
        // Remove subject
        newSubjects = prev.filter(s => s !== subject);
      } else {
        // Add subject (replace previous selection for single-subject mode)
        newSubjects = [subject];
      }
      
      // Clear topic-related state when subjects change
      if (newSubjects.length !== prev.length || newSubjects[0] !== prev[0]) {
        setTopic('');
        setSelectedTopicId(null);
        setLearningObjectives([]);
      }
      
      return newSubjects;
    });
  };
  
  const addCustomObjective = () => {
    setLearningObjectives(prev => [...prev, '']);
  };
  
  const toggleCommonObjective = (objective: string) => {
    setLearningObjectives(prev => {
      if (prev.includes(objective)) {
        return prev.filter(obj => obj !== objective);
      } else {
        return [...prev, objective];
      }
    });
  };

  const steps: GenerationStep[] = [
    { id: 0, title: 'Choose Template', completed: false, active: true },
    { id: 1, title: 'Set Parameters', completed: false, active: false },
    { id: 2, title: 'Generate Content', completed: false, active: false },
    { id: 3, title: 'Review & Save', completed: false, active: false },
  ];

  const [stepStates, setStepStates] = useState(steps);

  useEffect(() => {
    // Check AI availability
    if (!isAIAvailable()) {
      Alert.alert(
        'AI Not Available',
        'AI lesson generation requires an Anthropic API key. Please configure your environment.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  }, []);

  const updateSteps = (completedStep: number) => {
    setStepStates(prev => prev.map(step => ({
      ...step,
      completed: step.id < completedStep,
      active: step.id === completedStep
    })));
  };

  const handleTemplateSelect = (template: LessonTemplate) => {
    setSelectedTemplate(template);
    setSubjects(template.subjects);
    setDuration(template.duration);
    setCurrentStep(1);
    updateSteps(1);
  };

  const handleCustomMode = () => {
    setCustomMode(true);
    setSelectedTemplate(null);
    setSubjects(['Science']);
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
      try { Alert.alert('Missing Topic', msg); } catch {}
      return false;
    }

if (customMode && subjects.length === 0) {
      const msg = 'Please select at least one subject.';
      setFormError(msg);
      try { Alert.alert('Missing Subjects', msg); } catch {}
      return false;
    }

    const validObjectives = learningObjectives.filter(obj => obj.trim().length > 0);
if (validObjectives.length === 0) {
      const msg = 'Please add at least one learning objective.';
      setFormError(msg);
      try { Alert.alert('Missing Objectives', msg); } catch {}
      return false;
    }

setFormError(null);
    return true;
  };

  const allowedModels = (() => {
    // Always allow Haiku; allow Sonnet for premium/enterprise; optionally Opus for enterprise
    const ids = new Set<string>();
    ids.add('claude-3-haiku-20240307');
    if (currentTier === 'premium' || currentTier === 'enterprise') ids.add('claude-3-5-sonnet-20241022');
    if (currentTier === 'enterprise') ids.add('claude-3-opus-20240229');
    return CLAUDE_MODELS.filter(m => ids.has(m.identifier));
  })();

  // Lightweight JSON extractor for streaming final payloads
  function extractJsonLoose(raw: string): any | null {
    try { return JSON.parse(raw); } catch {}
    if (!raw) return null;
    const text = String(raw);
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence && fence[1]) {
      const inside = fence[1].replace(/[\u0000-\u001F]/g, '');
      try { return JSON.parse(inside); } catch {}
      try { return JSON.parse(inside.replace(/,\s*([}\]])/g, '$1')); } catch {}
    }
    const first = text.indexOf('{');
    if (first !== -1) {
      let depth = 0;
      for (let i = first; i < text.length; i++) {
        const ch = text[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            const candidate = text.slice(first, i + 1).replace(/[\u0000-\u001F]/g, '');
            try { return JSON.parse(candidate); } catch {}
            try { return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1')); } catch {}
            break;
          }
        }
      }
    }
    return null;
  }

  const generateLesson = async () => {
    // Basic client-side rate limit: 1 request every 2 seconds
    const now = Date.now();
if (now - lastGenAt < 2000) {
      try { Alert.alert('Please wait', 'You are generating too quickly. Try again in a moment.'); } catch {}
      return;
    }
    setLastGenAt(now);
if (!validateForm()) return;

    setFormError(null);
    setGenError(null);
    setLastQuotaCharged(null);
    setIsGenerating(true);
    setCurrentStep(2);
    updateSteps(2);
    startGenProgress();

    try {
      // Streaming path (optional toggle)
      if (liveUpdates) {
        const validObjectives = learningObjectives.filter(obj => obj.trim().length > 0);
        setStreamingText("");
        await claudeAI.streamLessonContent({
          topic,
          ageGroup,
          duration,
          learningObjectives: validObjectives,
          modelIdentifier: selectedModel || undefined,
        }, {
          onProgress: (stage) => {
            setGenError(null);
            setIsGenerating(true);
            setCurrentStep(2);
            updateSteps(2);
            // Map stages to UI progress
            setGenProgress(prev => {
              if (stage === 'analyzing') {
                return { analyzing: 'active', activities: 'idle', assessment: 'idle', home: 'idle' };
              }
              if (stage === 'activities') {
                return { analyzing: 'done', activities: 'active', assessment: 'idle', home: 'idle' };
              }
              if (stage === 'assessment') {
                return { analyzing: 'done', activities: 'done', assessment: 'active', home: 'idle' };
              }
              return prev;
            });
          },
          onDelta: (chunk) => {
            setStreamingText((prev) => prev + chunk);
          },
          onFinal: (payload) => {
            try {
              const raw = String(payload?.content || streamingText || '');
              const parsed = extractJsonLoose(raw);
              if (!parsed) throw new Error('Unexpected AI response format');
              setGeneratedLesson(parsed);
              setLastQuotaCharged(payload?.quota_charged === true);
              finishGenProgress(true);
              setCurrentStep(3);
              updateSteps(3);
            } catch (e:any) {
              setGenError(e?.message || 'Failed to parse AI response');
              finishGenProgress(false);
            } finally {
              setIsGenerating(false);
              setStreamingText("");
            }
          },
          onError: (err) => {
            setGenError(err?.message || 'Streaming error');
            setLastQuotaCharged(false);
            setIsGenerating(false);
            finishGenProgress(false);
            setStreamingText("");
          }
        });
        return;
      }
      const validObjectives = learningObjectives.filter(obj => obj.trim().length > 0);

      let result: any;
      if (selectedTemplate && !customMode) {
        result = await lessonGenerator.generateLessonFromTemplate({
          templateId: selectedTemplate.id,
          topic,
          ageGroup,
          customObjectives: validObjectives,
          userId,
          preschoolId,
          modelIdentifier: selectedModel || undefined,
        });
      } else {
        result = await lessonGenerator.generateCustomLesson({
          topic,
          ageGroup,
          duration,
          subjects,
          learningObjectives: validObjectives,
          difficulty,
          userId,
          preschoolId,
          modelIdentifier: selectedModel || undefined,
        });
      }

      if (result.success && result.lesson) {
        setGeneratedLesson(result.lesson);
        setLastQuotaCharged(result.quota_charged === true);
        finishGenProgress(true);
        setCurrentStep(3);
        updateSteps(3);
      } else {
        const msg = result.error || 'Failed to generate lesson';
        setGenError(msg);
        setLastQuotaCharged(!!result.quota_charged);
        const isQuotaProtected = !result.quota_charged || /not counted against your quota|not count towards your quota/i.test(msg);
        const title = isQuotaProtected ? 'Request Failed - No Charges Applied' : 'Generation Failed';
        const message = isQuotaProtected ? `${msg}\n\n✅ This failed request has not been counted against your AI usage quota.` : msg;
        try {
          Alert.alert(title, message, [
            { text: 'OK' }
          ]);
        } catch {}
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to generate lesson. Please try again.';
      setGenError(msg);
      setLastQuotaCharged(false);
      finishGenProgress(false);
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
            // In a real implementation, this would generate a PDF worksheet
            Alert.alert('Worksheet Generated', 'A printable worksheet has been created and is ready for download.');
          }
        }
      ]
    );
  };

  const findEducationalVideos = (lesson: ResolvedLesson) => {
    const videoSuggestions = [
      `https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.title + ' preschool educational video')}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' kids learning video')}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(ageGroup + ' ' + topic + ' educational content')}`
    ];
    
    Alert.alert(
      'Educational Videos',
      'Here are some suggested video searches for your lesson:',
      [
        { text: 'YouTube Search 1', onPress: () => {
          // In a web environment, you could open these URLs
          console.log('Opening:', videoSuggestions[0]);
        }},
        { text: 'YouTube Search 2', onPress: () => {
          console.log('Opening:', videoSuggestions[1]);
        }},
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

  const renderTemplateSelection = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <Text style={styles.stepTitle}>Choose a Lesson Template</Text>
      <Text style={styles.stepDescription}>
        Select a pre-designed template or create a custom lesson from scratch.
      </Text>

      <TouchableOpacity style={styles.customModeButton} onPress={handleCustomMode}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.customModeGradient}>
          <IconSymbol name="wand.and.stars" size={24} color="#FFFFFF" />
          <Text style={styles.customModeText}>Create Custom Lesson</Text>
          <Text style={styles.customModeSubtext}>Full control over content</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.templatesTitle}>Or choose a template:</Text>
      
      {LESSON_TEMPLATES.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={styles.templateCard}
          onPress={() => handleTemplateSelect(template)}
        >
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateDuration}>{template.duration} min</Text>
          </View>
          <Text style={styles.templateDescription}>{template.description}</Text>
          <View style={styles.templateMeta}>
            <Text style={styles.templateSubjects}>{template.subjects.join(', ')}</Text>
            <Text style={styles.templateComplexity}>{template.complexity}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
  const renderParameterSetting = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <Text style={styles.stepTitle}>Lesson Parameters</Text>
      
      {customMode && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Subject *</Text>
          <View style={styles.subjectGrid}>
            {Object.entries(SUBJECTS).map(([key, subject]) => {
              const isSelected = subjects.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.subjectCard,
                    isSelected && [styles.subjectCardActive, { borderColor: subject.color }]
                  ]}
                  onPress={() => handleSubjectToggle(key)}
                >
                  <View style={[styles.subjectIcon, { backgroundColor: isSelected ? subject.color : '#F3F4F6' }]}>
                    <IconSymbol name={subject.icon} size={20} color={isSelected ? '#FFFFFF' : subject.color} />
                  </View>
                  <Text style={[
                    styles.subjectName,
                    isSelected && [styles.subjectNameActive, { color: subject.color }]
                  ]}>
                    {subject.name}
                  </Text>
                  <Text style={styles.subjectDescription}>{subject.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Topic *</Text>
        <TouchableOpacity 
          style={[
            styles.dropdownButton, 
            { 
              borderColor: topic ? '#10B981' : '#D1D5DB',
              opacity: subjects.length === 0 ? 0.6 : 1
            }
          ]}
          onPress={() => subjects.length > 0 && setShowTopicDropdown(true)}
          disabled={subjects.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Choose a topic from suggestions"
        >
          <Text style={[
            styles.dropdownButtonText, 
            { color: topic ? '#111827' : '#9CA3AF' }
          ]}>
            {topic || (subjects[0] ? `Select a ${subjects[0]} topic...` : 'Choose a subject to see topic ideas')}
          </Text>
          <IconSymbol name="chevron.down" size={16} color="#6B7280" />
        </TouchableOpacity>
        {subjects.length === 0 && (
          <Text style={styles.helperText}>Choose a subject to see topic ideas</Text>
        )}
        {subjects.length > 0 && availableTopics.length > 0 && (
          <Text style={styles.helperText}>
            {availableTopics.length} {audience === 'parent' ? 'home‑friendly' : 'curriculum‑aligned'} topics {subjects[0] ? `for ${subjects[0]}` : ''}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Or enter custom topic</Text>
        <TextInput
          style={[styles.textInput, { borderColor: topic && !selectedTopicId ? '#8B5CF6' : '#D1D5DB' }]}
          value={topic}
          onChangeText={(text) => { setTopic(text); setSelectedTopicId(null); }}
          placeholder={subjects[0] ? `e.g., "Colors in Nature" for ${subjects[0]}` : 'e.g., Colors in Nature'}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Age Group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
          {['2-3 years', '3-4 years', '4-5 years', '5-7 years', '8-10 years', '11-13 years', '14-18 years'].map((age) => (
            <TouchableOpacity
              key={age}
              style={[styles.segmentButton, ageGroup === age && styles.segmentButtonActive, { marginRight: 8 }]}
              onPress={() => setAgeGroup(age)}
            >
              <Text style={[styles.segmentText, ageGroup === age && styles.segmentTextActive]}>
                {age}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Model selection (optional override) */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>AI Model</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
          {allowedModels.map((m) => (
            <TouchableOpacity
              key={m.identifier}
              style={[styles.segmentButton, selectedModel === m.identifier && styles.segmentButtonActive, { marginRight: 8 }]}
              onPress={() => setSelectedModel(prev => prev === m.identifier ? null : m.identifier)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${m.name}`}
            >
              <Text style={[styles.segmentText, selectedModel === m.identifier && styles.segmentTextActive]}>
                {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.helperText}>
          {selectedModel ? `Using ${CLAUDE_MODELS.find(x => x.identifier === selectedModel)?.name}` : 'Using default model for your subscription tier'}
        </Text>
      </View>

      {/* Live updates (beta) */}
      <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
        <View>
          <Text style={styles.inputLabel}>Live updates (beta)</Text>
          <Text style={styles.helperText}>See in-flight progress via streaming</Text>
        </View>
        <TouchableOpacity
          onPress={() => setLiveUpdates(v => !v)}
          accessibilityRole="switch"
          accessibilityLabel="Toggle live updates"
          style={[styles.segmentButton, liveUpdates && styles.segmentButtonActive, { paddingHorizontal: 14 }]}>
          <Text style={[styles.segmentText, liveUpdates && styles.segmentTextActive]}>{liveUpdates ? 'On' : 'Off'}</Text>
        </TouchableOpacity>
      </View>

      {customMode && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={String(duration)}
              onChangeText={(text) => setDuration(parseInt(text) || 30)}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor="#9CA3AF"
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
        </>
      )}

      <View style={styles.inputGroup}>
        <View style={styles.objectivesHeader}>
          <Text style={styles.inputLabel}>Learning Objectives *</Text>
          <TouchableOpacity 
            style={styles.suggestButton}
            onPress={() => setShowObjectivesModal(true)}
          >
            <IconSymbol name="lightbulb" size={16} color="#F59E0B" />
            <Text style={styles.suggestButtonText}>Suggestions</Text>
          </TouchableOpacity>
        </View>
        
        {learningObjectives.map((objective, index) => (
          <View key={index} style={styles.objectiveRow}>
            <TextInput
              style={[styles.textInput, styles.objectiveInput]}
              value={objective}
              onChangeText={(text) => updateObjective(index, text)}
              placeholder="What should children learn?"
              placeholderTextColor="#9CA3AF"
              multiline
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
        
        <View style={styles.objectiveActions}>
          <TouchableOpacity style={styles.addButton} onPress={addCustomObjective}>
            <IconSymbol name="plus.circle" size={18} color="#3B82F6" />
            <Text style={styles.addButtonText}>Add Custom Objective</Text>
          </TouchableOpacity>
        </View>
        
        {learningObjectives.length === 0 && (
          <Text style={styles.errorText}>Please add at least one learning objective.</Text>
        )}
      </View>

      {formError && (
        <Text style={styles.errorText}>{formError}</Text>
      )}

      {(() => {
        const canGenerate = topic.trim().length > 0 && learningObjectives.some(obj => obj.trim().length > 0);
        return (
          <TouchableOpacity style={[styles.generateButton, !canGenerate && { opacity: 0.6 }]} onPress={generateLesson} disabled={!canGenerate}>
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
        {renderGenItem('Analyzing age-appropriate content', genProgress.analyzing)}
        {renderGenItem('Creating engaging activities', genProgress.activities)}
        {renderGenItem('Generating assessment questions', genProgress.assessment)}
        {renderGenItem('Adding home extension ideas', genProgress.home)}
      </View>
      {liveUpdates && streamingText.length > 0 && (
        <View style={styles.streamingPreviewBox}>
          <Text style={styles.previewSectionTitle}>Live preview (raw JSON)</Text>
          <ScrollView style={{ maxHeight: 200 }}>
            <Text style={styles.streamingPreviewText}>
              {streamingText}
            </Text>
          </ScrollView>
          <Text style={styles.helperText}>This will convert to the formatted preview once the stream completes.</Text>
        </View>
      )}
    </View>
  );

  const renderGenItem = (label: string, state: 'idle' | 'active' | 'done') => {
    const color = state === 'done' ? '#10B981' : state === 'active' ? '#3B82F6' : '#6B7280';
    const prefix = state === 'done' ? 'checkmark.circle.fill' : state === 'active' ? 'clock' : 'circle';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }} key={label}>
        <IconSymbol name={prefix as any} size={16} color={color} />
        <Text style={[styles.generatingStep, { color, marginLeft: 8 }]}>• {label}</Text>
      </View>
    );
  };

  const renderGenerationError = () => (
    <View style={styles.generatingContainer}>
      <IconSymbol name="exclamationmark.triangle" size={28} color="#EF4444" />
      <Text style={[styles.generatingTitle, { color: '#EF4444' }]}>Generation failed</Text>
      <Text style={styles.generatingDescription}>{genError || 'Something went wrong. Please try again.'}</Text>
      {lastQuotaCharged !== null && (
        <Text style={{ marginTop: 4, fontSize: 12, color: lastQuotaCharged ? '#DC2626' : '#059669' }}>
          AI usage: {lastQuotaCharged ? 'Charged for last request' : 'Not charged for last request'}
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, alignSelf: 'stretch' }}>
        <TouchableOpacity onPress={generateLesson} style={styles.retryNowButton}>
          <Text style={styles.retryNowButtonText}>Retry now</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setCurrentStep(1); setGenError(null); }} style={[styles.previewButton, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.previewButtonText, { color: '#111827' }]}>Back to parameters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPreview = () => {
    if (!generatedLesson) return null;

    return (
      <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
        <Text style={styles.stepTitle}>Lesson Preview</Text>
        
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>{generatedLesson.title}</Text>
          <Text style={styles.previewDescription}>{generatedLesson.description}</Text>
          
          <View style={styles.previewSection}>
            <Text style={styles.previewSectionTitle}>Content</Text>
            <Text style={styles.previewText}>{(typeof generatedLesson.content === 'string' ? generatedLesson.content : JSON.stringify(generatedLesson.content ?? '')).slice(0, 300)}...</Text>
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
        {lastQuotaCharged !== null && (
          <Text style={styles.quotaNote}>AI usage: {lastQuotaCharged ? 'Charged' : 'Not charged'} for last request</Text>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Lesson Generator</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderStepIndicator()}

        {currentStep === 0 && renderTemplateSelection()}
        {currentStep === 1 && renderParameterSetting()}
        {currentStep === 2 && (isGenerating ? renderGenerating() : (generatedLesson ? renderPreview() : renderGenerationError()))}
        {currentStep === 3 && renderPreview()}
      </View>

      {/* Full Preview Modal */}
      <Modal visible={showPreview} animationType="slide">
        <View style={styles.fullPreviewContainer}>
          <View style={styles.fullPreviewHeader}>
            <TouchableOpacity 
              onPress={() => setShowPreview(false)} 
              style={{ padding: 8 }} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
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
              <Text style={styles.fullSectionText}>{typeof generatedLesson.content === 'string' ? generatedLesson.content : JSON.stringify(generatedLesson.content ?? '')}</Text>
              
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
      
      {/* Topic Selection Modal */}
      <Modal visible={showTopicDropdown} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: palette.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: palette.outline }]}>
            <TouchableOpacity onPress={() => setShowTopicDropdown(false)}>
              <IconSymbol name="xmark" size={20} color={palette.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Choose Topic</Text>
            <View style={{ width: 20 }} />
          </View>
          
          <View style={styles.searchSection}>
            <View style={[styles.searchInput, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
              <IconSymbol name="magnifyingglass" size={16} color={palette.textSecondary} />
              <TextInput
                style={[styles.searchText, { color: palette.text }]}
                value={topicSearchQuery}
                onChangeText={setTopicSearchQuery}
                placeholder="Search topics..."
                placeholderTextColor={palette.textSecondary}
              />
            </View>
          </View>
          
          <FlatList
            data={filteredTopics}
            keyExtractor={(item) => item.id}
            style={styles.topicList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.topicItem, { backgroundColor: palette.surface, borderColor: palette.outline }]}
                onPress={() => handleTopicSelect(item)}
              >
                <View style={styles.topicContent}>
                  <View style={styles.topicHeader}>
                    <Text style={[styles.topicName, { color: palette.text }]}>{item.name}</Text>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                      <Text style={styles.difficultyText}>Level {item.difficulty}</Text>
                    </View>
                  </View>
                  <Text style={[styles.topicDescription, { color: palette.textSecondary }]}>{item.description}</Text>
                  <View style={styles.topicMeta}>
                    <Text style={[styles.topicDuration, { color: palette.textSecondary }]}>⏱️ {item.estimatedDuration} min</Text>
                    <Text style={[styles.topicObjectiveCount, { color: palette.textSecondary }]}>🎯 {item.objectives.length} objectives</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <IconSymbol name="doc.text" size={48} color={palette.textSecondary} />
                <Text style={[styles.emptyStateText, { color: palette.textSecondary }]}>No topics found</Text>
                <Text style={[styles.emptyStateSubtext, { color: palette.textSecondary }]}>Try adjusting your search or select a different subject</Text>
              </View>
            )}
          />
        </View>
      </Modal>
      
      {/* Learning Objectives Suggestions Modal */}
      <Modal visible={showObjectivesModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: palette.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: palette.outline }]}>
            <TouchableOpacity onPress={() => setShowObjectivesModal(false)}>
              <IconSymbol name="xmark" size={20} color={palette.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Suggested Objectives</Text>
            <View style={{ width: 20 }} />
          </View>
          
          <ScrollView style={styles.objectivesContent}>
            {/* Topic-specific objectives */}
            {suggestedObjectives.length > 0 && (
              <View style={styles.objectiveCategory}>
                <Text style={[styles.categoryTitle, { color: palette.text }]}>From Selected Topic</Text>
                {suggestedObjectives.map((objective, index) => (
                  <TouchableOpacity
                    key={`topic-${index}`}
                    style={[
                      styles.objectiveSuggestion,
                      { backgroundColor: palette.surface, borderColor: palette.outline },
                      learningObjectives.includes(objective) && styles.objectiveSuggestionSelected
                    ]}
                    onPress={() => toggleCommonObjective(objective)}
                  >
                    <Text style={[styles.objectiveSuggestionText, { color: palette.text }]}>{objective}</Text>
                    {learningObjectives.includes(objective) && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Common objectives by category */}
            {Object.entries(COMMON_OBJECTIVES).map(([category, objectives]) => (
              <View key={category} style={styles.objectiveCategory}>
                <Text style={[styles.categoryTitle, { color: palette.text }]}>{category}</Text>
                {objectives.map((objective, index) => (
                  <TouchableOpacity
                    key={`${category}-${index}`}
                    style={[
                      styles.objectiveSuggestion,
                      { backgroundColor: palette.surface, borderColor: palette.outline },
                      learningObjectives.includes(objective) && styles.objectiveSuggestionSelected
                    ]}
                    onPress={() => toggleCommonObjective(objective)}
                  >
                    <Text style={[styles.objectiveSuggestionText, { color: palette.text }]}>{objective}</Text>
                    {learningObjectives.includes(objective) && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
};

// Helper function for difficulty colors
const getDifficultyColor = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return '#10B981'; // Easy - Green
    case 2: return '#3B82F6'; // Medium-Easy - Blue  
    case 3: return '#F59E0B'; // Medium - Orange
    case 4: return '#EF4444'; // Hard - Red
    case 5: return '#8B5CF6'; // Very Hard - Purple
    default: return '#6B7280'; // Default - Gray
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
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
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  stepConnectorCompleted: {
    backgroundColor: '#10B981',
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepContentContainer: {
    paddingBottom: 160,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  customModeButton: {
    marginBottom: 32,
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
  },
  templatesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  templateDuration: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateSubjects: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  templateComplexity: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
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
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  generatingDescription: {
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  activityItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: '#6B7280',
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
  streamingPreviewBox: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignSelf: 'stretch',
  },
  streamingPreviewText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as any,
    fontSize: 12,
    color: '#111827',
    lineHeight: 18,
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
    backgroundColor: '#F3F4F6',
  },
  previewButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  retryNowButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryNowButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quotaNote: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
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
    backgroundColor: '#F9FAFB',
  },
  fullPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  fullPreviewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginLeft: -24, // Compensate for back button
  },
  fullPreviewContent: {
    flex: 1,
    padding: 20,
  },
  fullLessonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  fullLessonDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  fullSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 12,
  },
  fullSectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  fullActivityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fullActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  fullActivityDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  fullActivityInstructions: {
    fontSize: 14,
    color: '#4B5563',
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
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  fullExtensionText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  subjectChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  subjectChipText: {
    color: '#111827',
  },
  subjectChipTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#EF4444',
    marginTop: 8,
    marginBottom: 8,
  },
  resourceSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resourceSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  resourceButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resourceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    textAlign: 'center',
  },
  
  // Enhanced Subject Selection Styles
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectCard: {
    width: (screenWidth - 64) / 2, // Two columns with margins
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  subjectCardActive: {
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  subjectNameActive: {
    fontWeight: '700',
  },
  subjectDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonText: {
    fontSize: 16,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Search Styles
  searchSection: {
    padding: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  
  // Topic List Styles
  topicList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topicItem: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topicContent: {
    padding: 16,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topicDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  topicMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  topicDuration: {
    fontSize: 12,
  },
  topicObjectiveCount: {
    fontSize: 12,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Enhanced Objectives Styles
  objectivesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
  },
  suggestButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
    marginLeft: 4,
  },
  objectiveActions: {
    marginTop: 8,
  },
  
  // Objectives Modal Styles
  objectivesContent: {
    flex: 1,
    padding: 16,
  },
  objectiveCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  objectiveSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  objectiveSuggestionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  objectiveSuggestionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
