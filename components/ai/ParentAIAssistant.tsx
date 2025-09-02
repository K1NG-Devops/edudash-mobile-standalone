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
  Switch,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { claudeAI, isAIAvailable } from '@/lib/ai/claudeService';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { TOPIC_CATEGORIES, getFilteredTopics } from '@/lib/constants/topicLibrary';
import * as DocumentPicker from 'expo-document-picker';
import { MediaService } from '@/lib/services/mediaService';
import { supabase } from '@/lib/supabase';

interface ParentAIAssistantProps {
  childName: string;
  childAge: number;
  userId: string; // auth user id
  onClose: () => void;
  // For uploads and context
  studentId?: string;
  preschoolId?: string;
  profileUserId?: string; // users.id (internal)
}

type AssistantFeature = 'homework-help' | 'activity-ideas' | 'developmental-questions' | 'learning-support';

interface AIResponse {
  title: string;
  content: string;
  suggestions?: string[];
  nextSteps?: string[];
}

export const ParentAIAssistant: React.FC<ParentAIAssistantProps> = ({
  childName,
  childAge,
  userId,
  onClose,
  studentId,
  preschoolId,
  profileUserId,
}) => {
  const { profile, user } = useAuth();
  const { language } = useLanguage();
  const parentName = (profile as any)?.name || (user as any)?.user_metadata?.name || (user as any)?.email || undefined;
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const [activeFeature, setActiveFeature] = useState<AssistantFeature | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);
  const [attachments, setAttachments] = useState<Array<{ uri: string; fileName: string; mimeType: string; fileSize?: number }>>([]);
  const [uploading, setUploading] = useState(false);
  const [hintsOnly, setHintsOnly] = useState(false);

  useEffect(() => {
    if (!isAIAvailable()) {
      Alert.alert(
        'AI Not Available',
        'AI assistance requires proper configuration. Please check with your preschool administrator.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  }, []);

  const features = [
    {
      id: 'homework-help' as const,
      title: 'Homework Help',
      description: 'Get AI guidance on helping your child with assignments',
      icon: 'book.pages',
      color: '#3B82F6',
    },
    {
      id: 'activity-ideas' as const,
      title: 'Learning Activities',
      description: 'Discover fun educational activities to do at home',
      icon: 'lightbulb',
      color: '#10B981',
    },
    {
      id: 'developmental-questions' as const,
      title: 'Development Questions',
      description: 'Ask about your child\'s learning and development',
      icon: 'questionmark.circle',
      color: '#8B5CF6',
    },
    {
      id: 'learning-support' as const,
      title: 'Learning Support',
      description: 'Tips for supporting your child\'s education at home',
      icon: 'heart',
      color: '#EF4444',
    },
  ];

  const handleFeatureSelect = (featureId: AssistantFeature) => {
    setActiveFeature(featureId);
    setAiResponse(null);
    setUserInput('');
    
    // Pre-populate with helpful prompts
    const prompts = {
      'homework-help': `Hi! I'd like help with ${childName}'s homework. Please describe the assignment and what you're having trouble with.`,
      'activity-ideas': `What kind of learning activity would you like ideas for? (e.g., science experiment, art project, reading activity)`,
      'developmental-questions': `What would you like to know about ${childName}'s development? I can help with learning milestones, skills, and growth.`,
      'learning-support': `How can I better support ${childName}'s learning at home? What specific area would you like tips on?`,
    };
  };

  const generateAIResponse = async () => {
    if (!userInput.trim()) {
      Alert.alert('Please enter your question', 'Type your question or describe what you need help with.');
      return;
    }

    setIsLoading(true);
    let handled = false;
    
    try {
      switch (activeFeature) {
        case 'homework-help': {
          // Upload attachments (if any) to storage to obtain public URLs
          let internalUserId = profileUserId || '';
          let schoolId = preschoolId || '';
          try {
            if (!internalUserId || !schoolId) {
              const { data: userRow } = await supabase
                .from('users')
                .select('id, preschool_id')
                .eq('auth_user_id', userId)
                .maybeSingle();
              if (userRow) {
                internalUserId = internalUserId || userRow.id;
                schoolId = schoolId || (userRow.preschool_id || '');
              }
            }
          } catch {}

          let uploaded: { url: string; mimeType: string; name?: string }[] = [];
          if (attachments.length > 0 && internalUserId && schoolId) {
            setUploading(true);
            const results = await Promise.all(
              attachments.map(async (a, index) => {
                const res = await MediaService.uploadMedia(
                  a.uri,
                  a.fileName || `ai_helper_${Date.now()}_${index}`,
                  a.mimeType,
                  internalUserId,
                  schoolId,
                  { studentId }
                );
                if ((res as any)?.data?.file_url) {
                  return { url: (res as any).data.file_url as string, mimeType: a.mimeType, name: a.fileName };
                }
                return null;
              })
            );
            uploaded = results.filter(Boolean) as any[];
            setUploading(false);
          }

          const help = await claudeAI.askHomeworkHelp({
            question: userInput,
            childName,
            parentName,
            childAge,
            userId,
            preschoolId: schoolId || 'parent-assistant',
            languageCode: language,
            hintsOnly,
            attachments: uploaded,
          });

          if (help.success && help.answer) {
            const response: AIResponse = {
              title: 'Homework Help',
              content: help.answer,
              suggestions: help.suggestions || [],
            };
            setAiResponse(response);
            setConversationHistory(prev => [
              ...prev,
              { type: 'user', content: userInput, timestamp: new Date() },
              { type: 'ai', content: response.content, timestamp: new Date() }
            ]);
            setUserInput('');
            // Keep attachments list for next turn or clear
            // setAttachments([]);
          } else {
            throw new Error(help.error || 'Failed to get AI response');
          }
          handled = true;
          break;
        }

        case 'activity-ideas':
          break;

        case 'developmental-questions':
          break;

        case 'learning-support':
          break;
      }

      // Default flows for other features (use lesson content generator)
      if (!handled) {
        const result = await claudeAI.generateLessonContent({
          topic: userInput,
          ageGroup: `${childAge} years`,
          duration: 30,
          learningObjectives: ['Provide helpful parent guidance'],
          userId,
          preschoolId: 'parent-assistant',
          languageCode: language,
        });

        if (result.success && result.content) {
        const response: AIResponse = {
          title: result.content.title,
          content: result.content.description + '\n\n' + result.content.content,
          suggestions: result.content.homeExtension,
          nextSteps: result.content.assessmentQuestions
        };
        
        setAiResponse(response);
        
        // Add to conversation history
        setConversationHistory(prev => [
          ...prev,
          { type: 'user', content: userInput, timestamp: new Date() },
          { type: 'ai', content: response.content, timestamp: new Date() }
        ]);
        
        setUserInput('');
      } else {
        throw new Error(result.error || 'Failed to get AI response');
      }
    }
    } catch (error) {
      Alert.alert(
        'Unable to Get Response',
        'There was an issue getting an AI response. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getAgeAppropriateTopics = () => {
    const ageGroup = childAge <= 3 ? '2-3 years' : childAge <= 4 ? '3-4 years' : '4-5 years';
    return getFilteredTopics({ ageGroup });
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled && res.assets && res.assets[0]) {
        const a = res.assets[0];
        setAttachments(prev => [...prev, {
          uri: a.uri,
          fileName: a.name || `doc_${Date.now()}`,
          mimeType: a.mimeType || 'application/octet-stream',
          fileSize: a.size,
        }]);
      }
    } catch (e) {
      Alert.alert('File error', 'Failed to select document');
    }
  };

  const styles = StyleSheet.create({
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
    headerSubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      marginTop: 2,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    welcomeText: {
      fontSize: 16,
      color: palette.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    featureCard: {
      width: '48%',
      backgroundColor: palette.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: palette.outline,
      alignItems: 'center',
    },
    featureIcon: {
      marginBottom: 8,
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 12,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
    chatContainer: {
      flex: 1,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    backButtonText: {
      marginLeft: 6,
      color: palette.text,
      fontSize: 14,
    },
    chatTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 8,
    },
    chatSubtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 16,
    },
    textInput: {
      borderWidth: 1,
      borderColor: palette.outline,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: palette.surface,
      color: palette.text,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    sendButton: {
      marginTop: 12,
    },
    sendGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 8,
    },
    sendButtonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: palette.textSecondary,
    },
    responseCard: {
      backgroundColor: palette.surface,
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: palette.outline,
    },
    responseTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 12,
    },
    responseContent: {
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    suggestionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 8,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    suggestionBullet: {
      color: '#3B82F6',
      fontSize: 14,
      marginRight: 8,
      marginTop: 2,
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
    },
    conversationHistory: {
      marginTop: 20,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 12,
    },
    messageContainer: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 8,
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#F9FAFB',
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#3B82F6',
      maxWidth: '80%',
    },
    aiMessage: {
      alignSelf: 'flex-start',
      maxWidth: '80%',
    },
    messageText: {
      fontSize: 14,
      color: palette.text,
      lineHeight: 18,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    disclaimer: {
      backgroundColor: colorScheme === 'dark' ? '#374151' : '#FEF3C7',
      padding: 12,
      borderRadius: 8,
      marginTop: 20,
    },
    disclaimerText: {
      fontSize: 12,
      color: colorScheme === 'dark' ? '#D1D5DB' : '#92400E',
      textAlign: 'center',
      lineHeight: 16,
    },
  });

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={palette.textSecondary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Parent AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Supporting {childName}'s learning</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content}>
          {!activeFeature ? (
            <>
              <Text style={styles.welcomeText}>
                How can I help you support {childName}'s learning today?
              </Text>
              <Text style={styles.subtitle}>
                Choose an area where you'd like personalized guidance
              </Text>

              <View style={styles.featuresGrid}>
                {features.map((feature) => (
                  <TouchableOpacity
                    key={feature.id}
                    style={styles.featureCard}
                    onPress={() => handleFeatureSelect(feature.id)}
                  >
                    <IconSymbol 
                      name={feature.icon as any} 
                      size={32} 
                      color={feature.color}
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                  💡 This AI assistant provides general educational guidance. For specific concerns about your child's development, please consult with their teachers or pediatrician.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.chatContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveFeature(null)}
              >
                <IconSymbol name="chevron.left" size={16} color={palette.text} />
                <Text style={styles.backButtonText}>Back to Menu</Text>
              </TouchableOpacity>

              <Text style={styles.chatTitle}>
                {features.find(f => f.id === activeFeature)?.title}
              </Text>
              <Text style={styles.chatSubtitle}>
                Ask me anything about supporting {childName}'s learning and development
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={userInput}
                  onChangeText={setUserInput}
                  placeholder="Type your question here..."
                  placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  multiline
                />

                {activeFeature === 'homework-help' && (
                  <View>
                    <TouchableOpacity onPress={pickDocument} style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.outline, borderRadius: 8 }}>
                      <Text style={{ color: palette.text }}>Attach document or photo</Text>
                    </TouchableOpacity>
                    {attachments.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        {attachments.map((a, idx) => (
                          <Text key={`${a.fileName}_${idx}`} style={{ color: palette.textSecondary, fontSize: 12 }}>
                            📎 {a.fileName}
                          </Text>
                        ))}
                        {uploading && (
                          <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 4 }}>Uploading attachments...</Text>
                        )}
                      </View>
                    )}
                    {/* Hints only toggle */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                      <Switch
                        value={hintsOnly}
                        onValueChange={setHintsOnly}
                        thumbColor={hintsOnly ? '#8B5CF6' : (colorScheme === 'dark' ? '#111827' : '#FFFFFF')}
                        trackColor={{ false: colorScheme === 'dark' ? '#374151' : '#E5E7EB', true: '#DDD6FE' }}
                      />
                      <Text style={{ color: palette.text, fontSize: 13, fontWeight: '600' }}>Hints only</Text>
                    </View>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.sendButton} 
                  onPress={generateAIResponse}
                  disabled={isLoading || !userInput.trim()}
                >
                  <LinearGradient 
                    colors={['#3B82F6', '#2563EB']} 
                    style={[styles.sendGradient, (!userInput.trim() || isLoading) && { opacity: 0.6 }]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
                    )}
                    <Text style={styles.sendButtonText}>
                      {isLoading ? 'Getting Answer...' : 'Get AI Guidance'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {aiResponse && (
                <View style={styles.responseCard}>
                  <Text style={styles.responseTitle}>{aiResponse.title}</Text>
                  <Text style={styles.responseContent}>{aiResponse.content}</Text>
                  
                  {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                    <>
                      <Text style={styles.suggestionsTitle}>💡 Try These Ideas:</Text>
                      {aiResponse.suggestions.map((suggestion, index) => (
                        <View key={index} style={styles.suggestionItem}>
                          <Text style={styles.suggestionBullet}>•</Text>
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {aiResponse.nextSteps && aiResponse.nextSteps.length > 0 && (
                    <>
                      <Text style={[styles.suggestionsTitle, { marginTop: 16 }]}>📝 Next Steps:</Text>
                      {aiResponse.nextSteps.map((step, index) => (
                        <View key={index} style={styles.suggestionItem}>
                          <Text style={styles.suggestionBullet}>•</Text>
                          <Text style={styles.suggestionText}>{step}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {conversationHistory.length > 0 && (
                <View style={styles.conversationHistory}>
                  <Text style={styles.historyTitle}>Recent Conversation</Text>
                  {conversationHistory.slice(-6).map((message, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.messageContainer,
                        message.type === 'user' ? styles.userMessage : styles.aiMessage
                      ]}
                    >
                      <Text style={[
                        styles.messageText,
                        message.type === 'user' && styles.userMessageText
                      ]}>
                        {message.content}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ParentAIAssistant;
