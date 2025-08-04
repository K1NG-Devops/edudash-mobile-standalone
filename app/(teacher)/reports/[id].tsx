import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { ReportsService, ClassroomReport } from '@/lib/services/reportsService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils/dateUtils';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ReportDetailScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<ClassroomReport | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedReport, setEditedReport] = useState<Partial<ClassroomReport>>({});
  const [acknowledgmentModal, setAcknowledgmentModal] = useState(false);
  const [acknowledgmentText, setAcknowledgmentText] = useState('');
  const { id } = useLocalSearchParams();

  useEffect(() => {
    if (user) {
      loadReport();
    }
  }, [user]);

  const loadReport = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      const { data, error } = await ReportsService.getReportById(id);

      if (error) {
        throw new Error('Failed to fetch report');
      }

      setReport(data);
      setEditedReport(data);
      if (data?.parent_acknowledgment) {
        setAcknowledgmentText(data.parent_acknowledgment);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      Alert.alert('Error', 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report || !editedReport) return;

    try {
      setSaving(true);
      const { error } = await ReportsService.updateReport(report.id, editedReport);

      if (error) {
        throw new Error('Failed to save report');
      }

      setReport({ ...report, ...editedReport });
      setEditMode(false);
      Alert.alert('Success', 'Report saved successfully');
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert('Error', 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToParents = async () => {
    if (!report) return;

    Alert.alert(
      'Send Report',
      'Send this report to parents?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setSending(true);
              const { error } = await ReportsService.sendReportToParents(report.id);

              if (error) {
                throw new Error('Failed to send report');
              }

              setReport({ ...report, is_sent_to_parents: true, sent_at: new Date().toISOString() });
              Alert.alert('Success', 'Report sent to parents successfully');
            } catch (error) {
              console.error('Error sending report:', error);
              Alert.alert('Error', 'Failed to send report to parents');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const handleAcknowledgment = async () => {
    if (!report || !acknowledgmentText.trim()) return;

    try {
      const { error } = await ReportsService.addParentAcknowledgment(report.id, acknowledgmentText);

      if (error) {
        throw new Error('Failed to add acknowledgment');
      }

      setReport({ ...report, parent_acknowledgment: acknowledgmentText });
      setAcknowledgmentModal(false);
      Alert.alert('Success', 'Acknowledgment added successfully');
    } catch (error) {
      console.error('Error adding acknowledgment:', error);
      Alert.alert('Error', 'Failed to add acknowledgment');
    }
  };

  const updateEditedField = (field: keyof ClassroomReport, value: any) => {
    setEditedReport(prev => ({ ...prev, [field]: value }));
  };

  const isTeacher = () => {
    return user?.role === 'teacher' || user?.role === 'superadmin';
  };

  const isParent = () => {
    return user?.role === 'parent';
  };

  const renderEditableField = (label: string, field: keyof ClassroomReport, multiline = false) => {
    const value = editMode ? (editedReport[field] as string) || '' : (report[field] as string) || 'Not recorded';
    
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {editMode ? (
          <TextInput
            style={[styles.textInput, multiline && styles.multilineInput]}
            value={value}
            onChangeText={(text) => updateEditedField(field, text)}
            multiline={multiline}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <Text style={styles.fieldValue}>{value}</Text>
        )}
      </View>
    );
  };

  const renderMoodRating = () => {
    const rating = editMode ? editedReport.mood_rating || 3 : report.mood_rating || 3;
    
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Mood Rating</Text>
        <View style={styles.moodContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => editMode && updateEditedField('mood_rating', star)}
              disabled={!editMode}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={24}
                color={star <= rating ? '#FFD700' : '#DDD'}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
          <Text style={styles.moodText}>{rating}/5</Text>
        </View>
      </View>
    );
  };

  if (loading || !report) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{report.student?.first_name} {report.student?.last_name}</Text>
          <Text style={styles.date}>{formatDate(report.report_date)}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Learning Highlights</Text>
          <Text style={styles.sectionContent}>{report.learning_highlights}</Text>
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={() => {}}>
          <Text style={styles.sendButtonText}>Send to Parents</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionContent: {
    fontSize: 16,
    color: '#555',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

