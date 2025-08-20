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
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { lessonGenerator, LESSON_TEMPLATES, LessonTemplate } from '@/lib/ai/lessonGenerator';
import { LessonContent } from '@/lib/ai/claudeService';
import { isAIAvailable } from '@/lib/ai/claudeService';

const { width: screenWidth } = Dimensions.get('window');

interface LessonGeneratorProps {
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

export const LessonGenerator: React.FC<LessonGeneratorProps> = ({
  userId,
  preschoolId,
  onLessonGenerated,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const [customMode, setCustomMode] = useState(false);
  
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

  const validateForm = (): boolean => {
    if (!topic.trim()) {
      Alert.alert('Missing Topic', 'Please enter a topic for your lesson.');
      return false;
    }

    if (customMode && subjects.length === 0) {
      Alert.alert('Missing Subjects', 'Please select at least one subject.');
      return false;
    }

    const validObjectives = learningObjectives.filter(obj => obj.trim().length > 0);
    if (validObjectives.length === 0) {
      Alert.alert('Missing Objectives', 'Please add at least one learning objective.');
      return false;
    }

    return true;
  };

  const generateLesson = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    setCurrentStep(2);
    updateSteps(2);

    try {
      const validObjectives = learningObjectives.filter(obj => obj.trim().length > 0);

      let result;
      if (selectedTemplate && !customMode) {
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
          subjects,
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
      // Removed debug statement: console.error('Lesson generation error:', error);
      Alert.alert(
        'Generation Failed',
        error instanceof Error ? error.message : 'Failed to generate lesson. Please try again.',
        [
          { text: 'Retry', onPress: () => setCurrentStep(1) },
          { text: 'Cancel', onPress: onClose }
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
    <ScrollView style={styles.stepContent}>
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
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Lesson Parameters</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Topic *</Text>
        <TextInput
          style={styles.textInput}
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g., Colors and Rainbows"
          placeholderTextColor="#9CA3AF"
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

      {customMode && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              value={duration.toString()}
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
        <Text style={styles.inputLabel}>Learning Objectives</Text>
        {learningObjectives.map((objective, index) => (
          <View key={index} style={styles.objectiveRow}>
            <TextInput
              style={[styles.textInput, styles.objectiveInput]}
              value={objective}
              onChangeText={(text) => updateObjective(index, text)}
              placeholder="What should children learn?"
              placeholderTextColor="#9CA3AF"
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

      <TouchableOpacity style={styles.generateButton} onPress={generateLesson}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.generateGradient}>
          <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Generate Lesson with AI</Text>
        </LinearGradient>
      </TouchableOpacity>
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
            <IconSymbol name="xmark" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Lesson Generator</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderStepIndicator()}

        {currentStep === 0 && renderTemplateSelection()}
        {currentStep === 1 && renderParameterSetting()}
        {currentStep === 2 && (isGenerating ? renderGenerating() : renderPreview())}
        {currentStep === 3 && renderPreview()}
      </View>

      {/* Full Preview Modal */}
      <Modal visible={showPreview} animationType="slide">
        <View style={styles.fullPreviewContainer}>
          <View style={styles.fullPreviewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
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
            </ScrollView>
          )}
        </View>
      </Modal>
    </Modal>
  );
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
});
