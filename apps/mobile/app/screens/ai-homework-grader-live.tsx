// @ts-nocheck
import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { HomeworkService } from '@/lib/services/homeworkService';

export default function AIHomeworkGraderLive() {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const [assignmentTitle, setAssignmentTitle] = useState('Counting to 10');
  const [gradeLevel, setGradeLevel] = useState('Age 5');
  const [submissionContent, setSubmissionContent] = useState('I counted 1 2 3 4 6 7 8 10');
  const [isStreaming, setIsStreaming] = useState(false);
  const [jsonBuffer, setJsonBuffer] = useState('');
  const [parsed, setParsed] = useState<null | {
    score: number;
    feedback: string;
    suggestions: string[];
    strengths: string[];
    areasForImprovement: string[];
  }>(null);

  const bufferRef = useRef('');

  const startStreaming = async () => {
    if (!submissionContent.trim()) {
      Alert.alert('Missing submission', 'Please provide the student submission text.');
      return;
    }
    try {
      setIsStreaming(true);
      setJsonBuffer('');
      bufferRef.current = '';
      setParsed(null);

      // Use a temporary submissionId placeholder; DB update will attempt regardless, but we won't rely on it here
      const submissionId = 'temp-local';

      await HomeworkService.streamGradeHomework(
        submissionId,
        submissionContent,
        assignmentTitle || 'Homework',
        gradeLevel || 'Age 5',
        {
          onDelta: (chunk) => {
            bufferRef.current += chunk;
            setJsonBuffer(bufferRef.current);
          },
          onFinal: ({ score, feedback, suggestions, strengths, areasForImprovement }) => {
            setParsed({ score, feedback, suggestions, strengths, areasForImprovement });
            setIsStreaming(false);
          },
          onError: (err) => {
            setIsStreaming(false);
            Alert.alert('Stream error', err.message || 'Unknown error');
          },
        }
      );
    } catch (e: any) {
      setIsStreaming(false);
      Alert.alert('Error', e?.message || 'Failed to start grading stream');
    }
  };

  const ParsedCard = useMemo(() => {
    if (!parsed) return null;
    const scoreColor = parsed.score >= 90 ? '#10B981' : parsed.score >= 80 ? '#3B82F6' : parsed.score >= 70 ? '#F59E0B' : '#EF4444';
    return (
      <View style={[styles.parsedCard, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
        <Text style={[styles.parsedTitle, { color: palette.text }]}>Parsed Summary</Text>
        <Text style={[styles.parsedLabel, { color: palette.textSecondary }]}>Score</Text>
        <Text style={[styles.parsedScore, { color: scoreColor }]}>{parsed.score}</Text>

        <Text style={[styles.parsedLabel, { color: palette.textSecondary }]}>Feedback</Text>
        <Text style={[styles.parsedText, { color: palette.text }]}>{parsed.feedback}</Text>

        {!!parsed.strengths?.length && (
          <>
            <Text style={[styles.parsedLabel, { color: palette.textSecondary }]}>Strengths</Text>
            {parsed.strengths.map((s, i) => (
              <Text key={`st-${i}`} style={[styles.bullet, { color: palette.text }]}>
                • {s}
              </Text>
            ))}
          </>
        )}

        {!!parsed.areasForImprovement?.length && (
          <>
            <Text style={[styles.parsedLabel, { color: palette.textSecondary }]}>Areas for Improvement</Text>
            {parsed.areasForImprovement.map((s, i) => (
              <Text key={`ai-${i}`} style={[styles.bullet, { color: palette.text }]}>
                • {s}
              </Text>
            ))}
          </>
        )}

        {!!parsed.suggestions?.length && (
          <>
            <Text style={[styles.parsedLabel, { color: palette.textSecondary }]}>Next Steps</Text>
            {parsed.suggestions.map((s, i) => (
              <Text key={`ns-${i}`} style={[styles.bullet, { color: palette.text }]}>
                • {s}
              </Text>
            ))}
          </>
        )}
      </View>
    );
  }, [parsed, palette]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: palette.outline }]}>
        <View style={styles.headerLeft}>
          <IconSymbol name="doc.text.below.ecg" size={22} color="#8B5CF6" />
          <Text style={[styles.headerTitle, { color: palette.text }]}>AI Homework Grader (Live)</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Inputs */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Assignment Title</Text>
          <TextInput
            value={assignmentTitle}
            onChangeText={setAssignmentTitle}
            placeholder="e.g., Counting to 10"
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, { color: palette.text, borderColor: palette.outline, backgroundColor: palette.background }]}
          />

          <Text style={[styles.label, { color: palette.textSecondary }]}>Grade Level / Age</Text>
          <TextInput
            value={gradeLevel}
            onChangeText={setGradeLevel}
            placeholder="e.g., Age 5 or Grade R"
            placeholderTextColor={palette.textSecondary}
            style={[styles.input, { color: palette.text, borderColor: palette.outline, backgroundColor: palette.background }]}
          />

          <Text style={[styles.label, { color: palette.textSecondary }]}>Student Submission</Text>
          <TextInput
            value={submissionContent}
            onChangeText={setSubmissionContent}
            placeholder="Paste or type the student's answer"
            placeholderTextColor={palette.textSecondary}
            style={[styles.textArea, { color: palette.text, borderColor: palette.outline, backgroundColor: palette.background }]}
            multiline
          />

          <TouchableOpacity
            onPress={startStreaming}
            disabled={isStreaming}
            style={[styles.primaryButton, { opacity: isStreaming ? 0.6 : 1, backgroundColor: '#8B5CF6' }]}
          >
            {isStreaming ? (
              <View style={styles.inlineRow}>
                <ActivityIndicator color="#FFF" />
                <Text style={styles.primaryButtonText}> Streaming…</Text>
              </View>
            ) : (
              <View style={styles.inlineRow}>
                <IconSymbol name="waveform" size={18} color="#FFF" />
                <Text style={styles.primaryButtonText}> Start Live Grading</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Streamed JSON */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Live JSON Stream</Text>
          <View style={[styles.jsonBox, { borderColor: palette.outline, backgroundColor: palette.background }]}>
            <Text style={[styles.jsonText, { color: palette.text }]} selectable>
              {jsonBuffer || (isStreaming ? 'Waiting for tokens…' : 'No data yet. Press "Start Live Grading".')}
            </Text>
          </View>
        </View>

        {/* Parsed Summary */}
        {ParsedCard}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  content: { padding: 16 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  primaryButton: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFF', fontWeight: '600' },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  jsonBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
  },
  jsonText: { fontFamily: Platform.select({ ios: 'menlo', android: 'monospace' }) as any, fontSize: 12 },
  parsedCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  parsedTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  parsedLabel: { fontSize: 12, marginTop: 8 },
  parsedScore: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  parsedText: { fontSize: 14 },
  bullet: { fontSize: 14, marginTop: 4 },
  bottomSpacing: { height: 24 },
});

