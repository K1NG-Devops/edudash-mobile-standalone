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
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ProofOfPaymentUploadProps {
  visible: boolean;
  onClose: () => void;
  onUpload: (proofData: ProofOfPaymentData) => Promise<void>;
  childName?: string;
  feeAmount?: string;
  feeDescription?: string;
  studentId?: string;
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
  visible,
  onClose,
  onUpload,
  childName,
  feeAmount,
  feeDescription,
  studentId,
}) => {
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
      await onUpload(formData);
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

  // Generate payment reference number
  const generateReferenceNumber = (studentId?: string, childName?: string): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Use student ID if available, otherwise use initials from child name
    let prefix = 'EDU';
    if (studentId) {
      prefix = studentId.slice(0, 8).toUpperCase();
    } else if (childName) {
      const names = childName.split(' ');
      prefix = names.map(name => name.charAt(0).toUpperCase()).join('') + 'EDU';
    }
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    
    return `${prefix}${year}${month}${day}${timestamp}`;
  };

  // Pre-fill form when modal opens with data
  useEffect(() => {
    if (visible && (childName || feeAmount || studentId)) {
      const referenceNumber = generateReferenceNumber(studentId, childName);
      const notes = feeDescription ? `Payment for: ${feeDescription}${childName ? ` - ${childName}` : ''}` : '';
      
      setFormData(prev => ({
        ...prev,
        referenceNumber,
        amount: feeAmount || prev.amount,
        notes,
      }));
    }
  }, [visible, childName, feeAmount, feeDescription, studentId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Proof of Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Upload proof of payment for school fees. Your submission will be reviewed by the school administration.
          </Text>

          {/* Payment Reference */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Reference Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter payment reference number"
              value={formData.referenceNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, referenceNumber: text }))}
              autoCapitalize="characters"
            />
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount Paid *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Payment Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Date *</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={showDatePickerModal}>
              <IconSymbol name="calendar" size={20} color="#6B7280" />
              <Text style={styles.datePickerText}>
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
            <Text style={styles.label}>Payment Method</Text>
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
                    formData.paymentMethod === method.key && styles.methodButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, paymentMethod: method.key }))}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
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
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional information..."
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Attachment */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Attach Proof</Text>
            <View style={styles.attachmentSection}>
              <View style={styles.attachmentButtons}>
                <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                  <IconSymbol name="camera.fill" size={20} color="#3B82F6" />
                  <Text style={styles.attachButtonText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
                  <IconSymbol name="doc.fill" size={20} color="#3B82F6" />
                  <Text style={styles.attachButtonText}>Document</Text>
                </TouchableOpacity>
              </View>

              {formData.attachment && (
                <View style={styles.attachmentPreview}>
                  <View style={styles.attachmentInfo}>
                    <IconSymbol 
                      name={formData.attachment.type.startsWith('image') ? "photo" : "doc.text"} 
                      size={24} 
                      color="#10B981" 
                    />
                    <Text style={styles.attachmentName}>{formData.attachment.name}</Text>
                  </View>
                  <TouchableOpacity onPress={removeAttachment} style={styles.removeButton}>
                    <IconSymbol name="xmark.circle.fill" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
