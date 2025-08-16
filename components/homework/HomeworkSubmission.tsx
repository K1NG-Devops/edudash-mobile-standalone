import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
import { IconSymbol } from '@/components/ui/IconSymbol';
import { HomeworkAssignment } from '@/types/homework-types';
import { HomeworkService } from '@/lib/services/homeworkService';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface HomeworkSubmissionProps {
  visible: boolean;
  assignment: HomeworkAssignment | null;
  studentId: string;
  onClose: () => void;
  onSubmit: () => void;
}

export const HomeworkSubmission: React.FC<HomeworkSubmissionProps> = ({
  visible,
  assignment,
  studentId,
  onClose,
  onSubmit,
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [attachments, setAttachments] = useState<Array<{
    uri: string;
    fileName: string;
    mimeType: string;
    fileSize?: number;
  }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!assignment) return;
    
    if (!submissionText.trim() && attachments.length === 0) {
      Alert.alert('Error', 'Please provide either text submission or attachments');
      return;
    }

    setSubmitting(true);
    try {
      console.log('🚀 Submitting homework:', {
        assignment: assignment.id,
        student: studentId,
        text: submissionText.trim(),
        attachments: attachments.length
      });
      
      // Convert attachments to the format expected by HomeworkService
      const mediaFiles = attachments.map(attachment => ({
        uri: attachment.uri,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType
      }));
      
      const result = await HomeworkService.submitHomework(
        {
          homework_assignment_id: assignment.id,
          student_id: studentId,
          submission_content: submissionText.trim(),
          attachment_urls: [] // Will be populated after upload
        },
        mediaFiles
      );

      // Enhanced success message
      const successMessage = `🎉 Homework submitted successfully!

📝 Text: ${submissionText.trim() ? 'Included' : 'None'}
📎 Attachments: ${attachments.length} file(s)
${result.uploadedFiles && result.uploadedFiles.length > 0 ? `🚀 ${result.uploadedFiles.length} files uploaded to cloud` : ''}

✨ Your teacher will review and provide feedback soon!`;
      
      if (typeof window !== 'undefined') {
        // Web environment - use native browser alert
        window.alert(successMessage);
      } else {
        // Mobile environment - use React Native alert
        Alert.alert('✅ Success!', successMessage);
      }
      
      setSubmissionText('');
      setAttachments([]);
      onSubmit();
      onClose();
    } catch (error) {
      console.error('❌ Error submitting homework:', error);
      
      // Enhanced error message
      const errorMessage = `❌ Oops! Something went wrong.

${error instanceof Error ? error.message : 'Unknown error occurred'}

🔄 Don't worry, your work is saved! Please try again.`;
      
      if (typeof window !== 'undefined') {
        // Web environment - use native browser alert
        window.alert(errorMessage);
      } else {
        // Mobile environment - use React Native alert
        Alert.alert('❌ Submission Failed', errorMessage, [
          { text: 'Try Again', style: 'default' },
          { text: 'Close', style: 'cancel', onPress: onClose }
        ]);
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const pickImage = async () => {
    try {

      setUploading(true);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment = {
          uri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          fileSize: asset.fileSize,
        };

        setAttachments(prev => [...prev, newAttachment]);
        Alert.alert('Success', 'Image added successfully!');
      }
    } catch (error) {
      console.error('📸 Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    try {

      setUploading(true);
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment = {
          uri: asset.uri,
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          fileSize: asset.fileSize,
        };

        setAttachments(prev => [...prev, newAttachment]);
        Alert.alert('Success', 'Photo taken successfully!');
      }
    } catch (error) {
      console.error('📷 Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setUploading(false);
    }
  };

  const pickDocument = async () => {
    try {

      setUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment = {
          uri: asset.uri,
          fileName: asset.name || `document_${Date.now()}`,
          mimeType: asset.mimeType || 'application/octet-stream',
          fileSize: asset.size,
        };

        setAttachments(prev => [...prev, newAttachment]);
        Alert.alert('Success', 'Document added successfully!');
      }
    } catch (error) {
      console.error('📄 Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const showAttachmentOptions = () => {

    ; // Will be web in this case
    
    // For web environments, Alert might not work properly, let's try a direct call first
    if (typeof window !== 'undefined') {

      const choice = window.confirm('Choose attachment type:\n\n1. Take Photo\n2. Choose from Library\n3. Choose Document\n\nClick OK to choose from library, Cancel to see more options');
      if (choice) {
        pickImage();
        return;
      }
    }
    
    Alert.alert(
      'Add Attachment',
      'Choose how you want to add your work',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Choose Document', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (!assignment) return null;

  console.log('📋 HomeworkSubmission component rendering with:', {
    visible,
    assignmentTitle: assignment?.title,
    studentId,
    attachmentsCount: attachments.length
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submit Homework</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
          {/* Assignment Info */}
          <View style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <IconSymbol name="doc.text.fill" size={24} color="#3B82F6" />
              <Text style={styles.assignmentTitle}>{assignment.title}</Text>
            </View>
            <Text style={styles.assignmentDescription}>{assignment.description}</Text>
            
            {assignment.instructions && (
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>Instructions:</Text>
                <Text style={styles.instructionsText}>{assignment.instructions}</Text>
              </View>
            )}

            {assignment.materials_needed && (
              <View style={styles.materialsSection}>
                <Text style={styles.sectionTitle}>Materials needed:</Text>
                <Text style={styles.materialsText}>{assignment.materials_needed}</Text>
              </View>
            )}
          </View>

          {/* Submission Section */}
          <View style={styles.submissionSection}>
            <Text style={styles.sectionTitle}>Your Submission</Text>
            
            <TextInput
              style={styles.textInput}
              value={submissionText}
              onChangeText={setSubmissionText}
              placeholder="Describe your work or provide written answers here..."
              multiline
              textAlignVertical="top"
            />

            {/* Attachments */}
            <View style={styles.attachmentsSection}>
              <View style={styles.attachmentsHeader}>
                <Text style={styles.sectionTitle}>Attachments</Text>
                <TouchableOpacity 
                  style={styles.addAttachmentButton}
                  onPress={showAttachmentOptions}
                >
                  <IconSymbol name="plus" size={16} color="#3B82F6" />
                  <Text style={styles.addAttachmentText}>Add</Text>
                </TouchableOpacity>
              </View>

              {uploading && (
                <View style={styles.uploadingIndicator}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.uploadingText}>Adding attachment...</Text>
                </View>
              )}
              
              {attachments.length > 0 && (
                <View style={styles.attachmentsList}>
                  {attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachmentItem}>
                      <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => removeAttachment(index)}
                      >
                        <IconSymbol name="xmark.circle.fill" size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {attachment.fileName}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 Tips for a great submission:</Text>
              <Text style={styles.tipText}>• Make sure photos are clear and well-lit</Text>
              <Text style={styles.tipText}>• Include all pages of your work</Text>
              <Text style={styles.tipText}>• Double-check your written answers</Text>
              <Text style={styles.tipText}>• Ask your parent for help if needed</Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Homework</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth < 400 ? 12 : 20,
    paddingTop: 16,
    paddingBottom: 16,
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
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: screenWidth < 400 ? 12 : 20,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: screenWidth < 400 ? 12 : 16,
    marginBottom: screenWidth < 400 ? 16 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: screenWidth < 400 ? 16 : 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  assignmentDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  instructionsSection: {
    marginBottom: 12,
  },
  materialsSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  materialsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  submissionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: screenWidth < 400 ? 12 : 16,
    marginBottom: screenWidth < 400 ? 16 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: screenWidth < 400 ? 8 : 12,
    height: screenWidth < 400 ? 100 : 120,
    fontSize: screenWidth < 400 ? 14 : 16,
    marginBottom: screenWidth < 400 ? 16 : 20,
    backgroundColor: '#FAFAFA',
  },
  attachmentsSection: {
    marginBottom: 20,
  },
  attachmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addAttachmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 4,
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentItem: {
    position: 'relative',
  },
  attachmentImage: {
    width: screenWidth < 400 ? 60 : 80,
    height: screenWidth < 400 ? 60 : 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  tipsSection: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#047857',
    marginBottom: 4,
  },
  footer: {
    padding: screenWidth < 400 ? 12 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  attachmentInfo: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  attachmentName: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
});
