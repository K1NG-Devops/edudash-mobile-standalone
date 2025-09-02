 
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { HomeworkService } from '@/lib/services/homeworkService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface HomeworkAIAssistantProps {
  studentId: string;
  studentName: string;
  studentAge: number;
  currentAssignments: any[];
  onClose: () => void;
  visible: boolean;
}

interface AIHelpResponse {
  explanation: string;
  hints: string[];
  examples: string[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  assignmentTitle?: string;
}

export const HomeworkAIAssistant: React.FC<HomeworkAIAssistantProps> = ({
  studentId,
  studentName,
  studentAge,
  currentAssignments,
  onClose,
  visible
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const { profile, user } = useAuth();
  const { language } = useLanguage();
  const parentName = (profile as any)?.name || (user as any)?.user_metadata?.name || (user as any)?.email || undefined;
  
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickHelp, setShowQuickHelp] = useState(true);
  const [hintsOnly, setHintsOnly] = useState(false);
  const { aiUsage } = useSubscription();

  // Initialize with welcome message
  useEffect(() => {
    if (visible && chatMessages.length === 0) {
      setChatMessages([{
        id: '1',
        type: 'ai',
        content: `Hi! I'm your AI homework assistant. I'm here to help ${studentName} with their assignments. Select a homework assignment or ask me any question about their schoolwork!`,
        timestamp: new Date()
      }]);
    }
  }, [visible, studentName]);

  const quickHelpPrompts = [
    "How do I help my child with counting exercises?",
    "What's the best way to practice letter writing?",
    "How can I make reading more fun?",
    "Tips for helping with art projects",
    "How to encourage my child when they're struggling?"
  ];

  const handleQuickHelp = (prompt: string) => {
    setUserQuestion(prompt);
    setShowQuickHelp(false);
  };

  const handleSendMessage = async () => {
    if (!userQuestion.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userQuestion.trim(),
      timestamp: new Date(),
      assignmentTitle: selectedAssignment?.title
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserQuestion('');
    setIsLoading(true);
    setShowQuickHelp(false);

    try {
      let aiResponse: AIHelpResponse;
      
      if (selectedAssignment) {
        // Get specific homework help
        aiResponse = await HomeworkService.getHomeworkHelp(
          selectedAssignment.title,
          userMessage.content,
          `${studentAge} years old`,
          studentId,
          studentName,
          parentName,
          language,
          hintsOnly
        );
      } else {
        // Get general educational guidance
        aiResponse = await HomeworkService.getHomeworkHelp(
          'General Learning Support',
          userMessage.content,
          `${studentAge} years old`,
          studentId,
          studentName,
          parentName,
          language,
          hintsOnly
        );
      }

      // Format AI response for chat
      let responseContent = aiResponse.explanation;
      
      if (aiResponse.hints.length > 0) {
        responseContent += '\n\n💡 **Helpful Hints:**\n';
        aiResponse.hints.forEach((hint, index) => {
          responseContent += `${index + 1}. ${hint}\n`;
        });
      }

      if (aiResponse.examples.length > 0) {
        responseContent += '\n\n📝 **Try These Examples:**\n';
        aiResponse.examples.forEach((example, index) => {
          responseContent += `• ${example}\n`;
        });
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error getting AI help:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I'm having trouble connecting right now. Here are some general tips:\n\n• Break tasks into small steps\n• Use positive encouragement\n• Make learning fun with games\n• Take breaks when needed\n• Celebrate small victories!",
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.type === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      <View style={[
        styles.messageBubble,
        message.type === 'user' 
          ? [styles.userBubble, { backgroundColor: '#3B82F6' }]
          : [styles.aiBubble, { backgroundColor: palette.surface, borderColor: palette.outline }]
      ]}>
        <Text style={[
          styles.messageText,
          { color: message.type === 'user' ? '#FFFFFF' : palette.text }
        ]}>
          {message.content}
        </Text>
        <Text style={[
          styles.messageTime,
          { color: message.type === 'user' ? '#E5E7EB' : palette.textSecondary }
        ]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: palette.outline }]}>
          <View style={styles.headerContent}>
            <IconSymbol name="brain.head.profile" size={24} color="#8B5CF6" />
            <Text style={[styles.headerTitle, { color: palette.text }]}>
              Homework AI Assistant
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Assignment Selection */}
        {currentAssignments.length > 0 && (
          <View style={[styles.assignmentSection, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Select Assignment (Optional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                style={[
                  styles.assignmentChip,
                  !selectedAssignment && styles.assignmentChipActive
                ]}
                onPress={() => setSelectedAssignment(null)}
              >
                <Text style={[
                  styles.assignmentChipText,
                  !selectedAssignment && styles.assignmentChipTextActive
                ]}>
                  General Help
                </Text>
              </TouchableOpacity>
              {currentAssignments.map((assignment) => (
                <TouchableOpacity
                  key={assignment.id}
                  style={[
                    styles.assignmentChip,
                    selectedAssignment?.id === assignment.id && styles.assignmentChipActive
                  ]}
                  onPress={() => setSelectedAssignment(assignment)}
                >
                  <Text style={[
                    styles.assignmentChipText,
                    selectedAssignment?.id === assignment.id && styles.assignmentChipTextActive
                  ]}>
                    {assignment.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Chat Messages */}
        <ScrollView 
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map(renderMessage)}
          
          {isLoading && (
            <View style={styles.loadingMessage}>
              <ActivityIndicator color="#8B5CF6" />
              <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
                AI is thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Help Prompts */}
        {showQuickHelp && chatMessages.length === 1 && (
          <View style={[styles.quickHelpSection, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Quick Help Topics
            </Text>
            <View style={styles.quickHelpGrid}>
              {quickHelpPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickHelpButton, { backgroundColor: palette.background, borderColor: palette.outline }]}
                  onPress={() => handleQuickHelp(prompt)}
                >
                  <Text style={[styles.quickHelpText, { color: palette.text }]}>
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Section */}
        <View style={[styles.inputSection, { backgroundColor: palette.surface, borderTopColor: palette.outline }]}>
          {/* Controls row: Hints-only toggle and AI usage */}
          <View style={styles.controlsRow}>
            <View style={styles.hintsRow}>
              <Switch
                value={hintsOnly}
                onValueChange={setHintsOnly}
                thumbColor={hintsOnly ? '#8B5CF6' : (colorScheme === 'dark' ? '#111827' : '#FFFFFF')}
                trackColor={{ false: colorScheme === 'dark' ? '#374151' : '#E5E7EB', true: '#DDD6FE' }}
              />
              <Text style={[styles.hintsLabel, { color: palette.text }]}>Hints only</Text>
            </View>
            {aiUsage && (
              <Text style={[styles.usageText, { color: palette.textSecondary }]}>
                AI: {aiUsage.monthlyLimit === -1 ? `${aiUsage.currentUsage} used (Unlimited)` : `${aiUsage.currentUsage} / ${aiUsage.monthlyLimit} used`}
              </Text>
            )}
          </View>
          <View style={[styles.inputContainer, { backgroundColor: palette.background, borderColor: palette.outline }]}>
            <TextInput
              style={[styles.textInput, { color: palette.text }]}
              value={userQuestion}
              onChangeText={setUserQuestion}
              placeholder={selectedAssignment ? `Ask about "${selectedAssignment.title}"...` : "Ask me anything about homework..."}
              placeholderTextColor={palette.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, { opacity: userQuestion.trim() ? 1 : 0.5 }]}
              onPress={handleSendMessage}
              disabled={!userQuestion.trim() || isLoading}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.sendGradient}>
                <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  assignmentSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  assignmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assignmentChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  assignmentChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  assignmentChipTextActive: {
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  quickHelpSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickHelpButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  quickHelpText: {
    fontSize: 12,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hintsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintsLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  usageText: {
    fontSize: 12,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    marginLeft: 12,
  },
  sendGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
