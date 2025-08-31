import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ProofOfPaymentUploadProps {
  isVisible: boolean;
  onClose: () => void;
  onUploadSuccess: (proofData: ProofOfPaymentData) => Promise<void>;
  studentId?: string;
  amountPaid?: number;
  childName?: string;
  feeAmount?: string;
  feeDescription?: string;
}

export interface ProofOfPaymentData {
  referenceNumber: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string;
  attachment?: {
    uri: string;
    type: string;
    name: string;
  };
}

const ProofOfPaymentUpload: React.FC<ProofOfPaymentUploadProps> = ({
  isVisible,
  onClose,
  onUploadSuccess,
  studentId,
  amountPaid,
  childName,
  feeAmount,
  feeDescription,
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState<ProofOfPaymentData>({
    referenceNumber: '',
    amount: '',
    paymentDate: '',
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      referenceNumber: '',
      amount: '',
      paymentDate: '',
      paymentMethod: 'bank_transfer',
      notes: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload proof of payment.');
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
        setFormData(prev => ({
          ...prev,
          attachment: {
            uri: asset.uri,
            type: asset.type || 'image',
            name: asset.fileName || `proof_${Date.now()}.jpg`,
          },
        }));
      }
    } catch (error) {
      // Removed debug statement: console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFormData(prev => ({
          ...prev,
          attachment: {
            uri: asset.uri,
            type: asset.mimeType || 'application/pdf',
            name: asset.name,
          },
        }));
      }
    } catch (error) {
      // Removed debug statement: console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.referenceNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a payment reference number.');
      return;
    }
    if (!formData.amount.trim()) {
      Alert.alert('Validation Error', 'Please enter the payment amount.');
      return;
    }
    if (!formData.paymentDate.trim()) {
      Alert.alert('Validation Error', 'Please enter the payment date.');
      return;
    }

    try {
      setLoading(true);
      await onUploadSuccess(formData);
      handleClose();
      Alert.alert('Success', 'Proof of payment uploaded successfully. It will be reviewed by the school administration.');
    } catch (error) {
      // Removed debug statement: console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload proof of payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = () => {
    setFormData(prev => ({
      ...prev,
      attachment: undefined,
    }));
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    setFormData(prev => ({
      ...prev,
      paymentDate: formatDate(currentDate)
    }));
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Helper functions for reference generation
  const cleanChildName = (name?: string): string => {
    if (!name) return 'Unknown';
    // Clean and capitalize the name properly
    return name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };

  const generateUniqueNumberForChild = (sid?: string, cname?: string): string => {
    // Generate a consistent unique number based on child name and student ID
    const combined = `${cname || 'unknown'}-${sid || 'no-id'}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = Math.imul(31, hash) + combined.charCodeAt(i) | 0;
    }
    // Ensure we get a 4-digit number (1000-9999) for uniqueness
    const uniqueNumber = 1000 + (Math.abs(hash >>> 0) % 9000);
    return uniqueNumber.toString();
  };

  const generateDeterministicReference = (sid?: string, cname?: string): string => {
    const cleanedName = cleanChildName(cname);
    const uniqueNumber = generateUniqueNumberForChild(sid, cname);
    return `${cleanedName}-${uniqueNumber}`;
  };

  // Pre-fill form when modal opens with data
  useEffect(() => {
    if (isVisible && (childName || feeAmount || amountPaid || studentId)) {
      const autoRef = generateDeterministicReference(studentId, childName);
      const notes = feeDescription ? `Payment for: ${feeDescription}${childName ? ` - ${childName}` : ''}` : '';
      
      setFormData(prev => ({
        ...prev,
        referenceNumber: prev.referenceNumber?.trim() ? prev.referenceNumber : autoRef,
        amount: amountPaid?.toString() || feeAmount || prev.amount,
        notes,
      }));
    }
  }, [isVisible, childName, feeAmount, feeDescription, studentId, amountPaid]);

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.outline }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={palette.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Upload Proof of Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.description, { color: palette.textSecondary }]}>
            Upload proof of payment for school fees. Your submission will be reviewed by the school administration.
          </Text>

          {/* Payment Reference */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Payment Reference Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.outline, color: palette.text }]}
              placeholder="Enter payment reference number"
              placeholderTextColor={palette.textSecondary}
              value={formData.referenceNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, referenceNumber: text.toUpperCase() }))}
              autoCapitalize="characters"
            />
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Amount Paid *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.outline, color: palette.text }]}
              placeholder="0.00"
              placeholderTextColor={palette.textSecondary}
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Payment Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Payment Date *</Text>
            <TouchableOpacity style={[styles.datePickerButton, { backgroundColor: palette.surface, borderColor: palette.outline }]} onPress={showDatePickerModal}>
              <IconSymbol name="calendar" size={20} color={palette.textSecondary} />
              <Text style={[styles.datePickerText, { color: formData.paymentDate ? palette.text : palette.textSecondary }]}>
                {formData.paymentDate || 'Select payment date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          {showDatePicker && Platform.OS !== 'web' && (
            <DateTimePicker
              testID="dateTimePicker"
              value={selectedDate}
              mode="date"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
          
          {/* Web Fallback for Date Picker */}
          {showDatePicker && Platform.OS === 'web' && (
            <View style={styles.webDatePickerContainer}>
              <TextInput
                style={[styles.input, styles.webDateInput]}
                placeholder="YYYY-MM-DD"
                value={formData.paymentDate}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, paymentDate: text }));
                  setShowDatePicker(false);
                }}
                onBlur={() => setShowDatePicker(false)}
                autoFocus
              />
            </View>
          )}

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Payment Method</Text>
            <View style={styles.methodButtons}>
              {[
                { key: 'bank_transfer', label: 'Bank Transfer' },
                { key: 'eft', label: 'EFT' },
                { key: 'cash', label: 'Cash' },
                { key: 'card', label: 'Card' },
              ].map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    styles.methodButton,
                    { backgroundColor: palette.surface, borderColor: palette.outline },
                    formData.paymentMethod === method.key && styles.methodButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, paymentMethod: method.key }))}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      { color: palette.textSecondary },
                      formData.paymentMethod === method.key && styles.methodButtonTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: palette.surface, borderColor: palette.outline, color: palette.text }]}
              placeholder="Any additional information..."
              placeholderTextColor={palette.textSecondary}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Attachment */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Attach Proof</Text>
            <View style={[styles.attachmentSection, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
              <View style={styles.attachmentButtons}>
                <TouchableOpacity style={[styles.attachButton, { backgroundColor: palette.background }]} onPress={pickImage}>
                  <IconSymbol name="camera.fill" size={20} color={palette.primary} />
                  <Text style={[styles.attachButtonText, { color: palette.primary }]}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.attachButton, { backgroundColor: palette.background }]} onPress={pickDocument}>
                  <IconSymbol name="doc.fill" size={20} color={palette.primary} />
                  <Text style={[styles.attachButtonText, { color: palette.primary }]}>Document</Text>
                </TouchableOpacity>
              </View>

              {formData.attachment && (
                <View style={[styles.attachmentPreview, { backgroundColor: colorScheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }]}>
                  <View style={styles.attachmentInfo}>
                    <IconSymbol 
                      name={formData.attachment.type.startsWith('image') ? "photo" : "doc.text"} 
                      size={24} 
                      color="#10B981" 
                    />
                    <Text style={[styles.attachmentName, { color: colorScheme === 'dark' ? '#10B981' : '#065F46' }]}>{formData.attachment.name}</Text>
                  </View>
                  <TouchableOpacity onPress={removeAttachment} style={styles.removeButton}>
                    <IconSymbol name="xmark.circle.fill" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: palette.surface, borderTopColor: palette.outline }]}>
          <TouchableOpacity style={[styles.cancelButton, { borderColor: palette.outline }]} onPress={handleClose}>
            <Text style={[styles.cancelButtonText, { color: palette.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Upload Proof</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    gap: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  methodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  methodButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  methodButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  methodButtonTextActive: {
    color: 'white',
  },
  attachmentSection: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  attachButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: '#065F46',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  webDatePickerContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  webDateInput: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
});

export default ProofOfPaymentUpload;
