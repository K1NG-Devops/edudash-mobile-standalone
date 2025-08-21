import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  Share,
  Clipboard,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
let QRCodeComponent: any = null;
try {
  // Optional dependency; fallback to image if unavailable
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-qrcode-svg');
  QRCodeComponent = mod?.default || mod?.QRCode || null;
} catch (_) {}
import { PrincipalService, SchoolInvitationCode } from '@/lib/services/principalService';

interface SchoolCodeManagerProps {
  preschoolId: string;
  principalId: string;
  schoolName: string;
  onClose: () => void;
  visible: boolean;
}

export const SchoolCodeManager: React.FC<SchoolCodeManagerProps> = ({
  preschoolId,
  principalId,
  schoolName,
  onClose,
  visible,
}) => {
  const [activeCode, setActiveCode] = useState<SchoolInvitationCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadActiveCode();
    }
  }, [visible, preschoolId]);

  const loadActiveCode = async () => {
    try {
      setLoading(true);
      const result = await PrincipalService.getActiveSchoolInvitationCode(preschoolId);
      if (result.data) {
        setActiveCode(result.data);
      } else {
        setActiveCode(null);
      }
    } catch (error) {
      // Removed debug statement: console.error('Error loading active code:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewCode = async () => {
    try {
      setLoading(true);
      
      // Deactivate any existing code first
      if (activeCode) {
        await PrincipalService.deactivateSchoolInvitationCode(preschoolId);
      }

      const result = await PrincipalService.generateSchoolInvitationCode(
        preschoolId,
        principalId,
        {
          description: `Parent invitation code for ${schoolName}`,
          expiryDays: 90, // 3 months
        }
      );

      if (result.data) {
        Alert.alert(
          'New School Code Generated! 🎉',
          `Your new parent invitation code is: ${result.data}\n\nParents can use this code to join ${schoolName}.\n\nThe code expires in 90 days.`,
          [
            { text: 'Copy Code', onPress: () => copyCodeToClipboard(result.data!) },
            { text: 'Share Code', onPress: () => shareCode(result.data!) },
            { text: 'OK' }
          ]
        );

        // Reload the active code
        await loadActiveCode();
      } else {
        Alert.alert('Error', 'Failed to generate school code. Please try again.');
      }
    } catch (error) {
      // Removed debug statement: console.error('Error generating code:', error);
      Alert.alert('Error', 'Failed to generate school code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deactivateCode = async () => {
    if (!activeCode) return;

    Alert.alert(
      'Deactivate School Code',
      'Are you sure you want to deactivate the current school code? Parents will no longer be able to use it to join your school.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await PrincipalService.deactivateSchoolInvitationCode(preschoolId);
              if (result.success) {
                Alert.alert('Success', 'School code has been deactivated.');
                setActiveCode(null);
              } else {
                Alert.alert('Error', 'Failed to deactivate school code.');
              }
            } catch (error) {
              // Removed debug statement: console.error('Error deactivating code:', error);
              Alert.alert('Error', 'Failed to deactivate school code.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const copyCodeToClipboard = async (code?: string) => {
    const codeToUse = code || activeCode?.code;
    if (codeToUse) {
      Clipboard.setString(codeToUse);
      Alert.alert('Copied!', `School code "${codeToUse}" has been copied to your clipboard.`);
    }
  };

  const shareCode = async (code?: string) => {
    const codeToUse = code || activeCode?.code;
    if (codeToUse) {
      try {
        // Create deep link URL that will open the app directly to signup with the code
        const deepLinkUrl = `edudashpro://invite/${codeToUse}`;
        const webFallbackUrl = `https://edudashpro.app/invite/${codeToUse}`;
        
        await Share.share({
          message: `🎓 Join ${schoolName} on EduDash Pro!\n\n📱 If you have the app installed, tap this link:\n${deepLinkUrl}\n\n🌐 Or use our web portal:\n${webFallbackUrl}\n\n📋 Manual setup:\n1. Download EduDash Pro from your app store\n2. Tap "Join School"\n3. Enter school code: ${codeToUse}\n\nWelcome to our school community! 🏫✨`,
          title: `Join ${schoolName} - EduDash Pro`,
          url: webFallbackUrl, // This will be used on platforms that support URL sharing
        });
      } catch (error) {
        // Removed debug statement: console.error('Error sharing code:', error);
      }
    }
  };

  const copyCodeWithLink = async (code?: string) => {
    const codeToUse = code || activeCode?.code;
    if (codeToUse) {
      const deepLinkUrl = `edudashpro://invite/${codeToUse}`;
      const webFallbackUrl = `https://edudashpro.app/invite/${codeToUse}`;
      
      const textToCopy = `Join ${schoolName} on EduDash Pro!\n\nApp Link: ${deepLinkUrl}\nWeb Link: ${webFallbackUrl}\nSchool Code: ${codeToUse}`;
      
      Clipboard.setString(textToCopy);
      Alert.alert('Copied!', 'School invitation links and code have been copied to your clipboard.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isCodeExpiring = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 14; // Show warning if expiring in 2 weeks
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Emerald accent to match principal theme */}
        {/* Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>School Code Management</Text>
            <Text style={styles.modalSubtitle}>Manage parent invitation codes for {schoolName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeCode ? (
            <>
              {/* Active Code Section */}
              <View style={styles.activeCodeCard}>
                <View style={styles.codeHeader}>
                  <View style={styles.codeIconContainer}>
                    <IconSymbol name="qrcode.viewfinder" size={32} color="#059669" />
                  </View>
                  <View style={styles.codeInfo}>
                    <Text style={styles.codeLabel}>Active School Code</Text>
                    <Text style={styles.codeText}>{activeCode.code}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: isCodeExpiring(activeCode.expires_at) ? '#F59E0B' : '#10B981' }
                  ]}>
                    <Text style={styles.statusText}>
                      {isCodeExpiring(activeCode.expires_at) ? 'Expiring Soon' : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.codeDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="calendar" size={16} color="#065F46" />
                    <Text style={styles.detailText}>
                      Created: {formatDate(activeCode.created_at)} at {formatTime(activeCode.created_at)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol name="clock" size={16} color="#6B7280" />
                    <Text style={[
                      styles.detailText,
                      isCodeExpiring(activeCode.expires_at) && styles.expiringText
                    ]}>
                      Expires: {formatDate(activeCode.expires_at)} 
                      ({getDaysUntilExpiry(activeCode.expires_at)} days remaining)
                    </Text>
                  </View>

                  {!!activeCode.description && (
                    <View style={styles.detailRow}>
                      <IconSymbol name="text.alignleft" size={16} color="#6B7280" />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {activeCode.description}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <IconSymbol name="person.2.fill" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Used: {activeCode.usage_count} times
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => copyCodeToClipboard()}
                  >
                    <IconSymbol name="doc.on.doc" size={20} color="#3B82F6" />
                    <Text style={styles.secondaryButtonText}>Copy Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setQrVisible(true)}
                  >
                    <IconSymbol name="qrcode" size={20} color="#059669" />
                    <Text style={[styles.secondaryButtonText, { color: '#059669' }]}>Show QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => shareCode()}
                  >
                    <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Share Code</Text>
                  </TouchableOpacity>
                </View>

                {/* Link Actions */}
                <View style={styles.linkActions}>
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => copyCodeWithLink()}
                  >
                    <IconSymbol name="link" size={20} color="#10B981" />
                    <Text style={styles.linkButtonText}>Copy Links & Code</Text>
                  </TouchableOpacity>
                </View>

                {/* Code Management */}
                <View style={styles.managementButtons}>
                  <TouchableOpacity
                    style={styles.warningButton}
                    onPress={deactivateCode}
                    disabled={loading}
                  >
                    <IconSymbol name="xmark.circle" size={20} color="#EF4444" />
                    <Text style={styles.warningButtonText}>Deactivate Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.generateButton, loading && styles.disabledButton]}
                    onPress={generateNewCode}
                    disabled={loading}
                  >
                    <IconSymbol name="arrow.clockwise" size={20} color="#FFFFFF" />
                    <Text style={styles.generateButtonText}>
                      {loading ? 'Generating...' : 'Generate New'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Optional metadata display */}
              {!!(activeCode as any)?.metadata && (
                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsTitle}>Metadata</Text>
                  {Object.entries((activeCode as any).metadata || {}).length === 0 ? (
                    <Text style={styles.detailText}>No metadata set</Text>
                  ) : (
                    <View style={{ marginLeft: 8 }}>
                      {Object.entries((activeCode as any).metadata).map(([k, v]) => (
                        <Text key={k} style={styles.instructionItem}>
                          {k}: {(typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 120)}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Usage Instructions */}
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>📱 How Parents Use This Code:</Text>
                <View style={styles.instructionsList}>
                  <Text style={styles.instructionItem}>
                    1. Parent downloads EduDash Pro app
                  </Text>
                  <Text style={styles.instructionItem}>
                    2. Creates account with their email
                  </Text>
                  <Text style={styles.instructionItem}>
                    3. Enters school code: <Text style={styles.boldText}>{activeCode.code}</Text>
                  </Text>
                  <Text style={styles.instructionItem}>
                    4. Gets access to {schoolName} dashboard
                  </Text>
                  <Text style={styles.instructionItem}>
                    5. Can register their children
                  </Text>
                </View>
              </View>
            </>
          ) : (
            /* No Active Code */
            <View style={styles.noCodeContainer}>
              <View style={styles.emptyState}>
                <IconSymbol name="qrcode" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Active School Code</Text>
                <Text style={styles.emptySubtitle}>
                  Generate a school code that parents can use to join {schoolName}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.generateButton, loading && styles.disabledButton]}
                onPress={generateNewCode}
                disabled={loading}
              >
                <IconSymbol name="plus.circle" size={24} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>
                  {loading ? 'Generating School Code...' : 'Generate School Code'}
                </Text>
              </TouchableOpacity>

              {/* Benefits Info */}
              <View style={styles.benefitsCard}>
                <Text style={styles.benefitsTitle}>✨ Benefits of School Codes:</Text>
                <View style={styles.benefitsList}>
                  <Text style={styles.benefitItem}>• Simplified parent onboarding</Text>
                  <Text style={styles.benefitItem}>• No individual invitations needed</Text>
                  <Text style={styles.benefitItem}>• Parents can self-register</Text>
                  <Text style={styles.benefitItem}>• Automatic school association</Text>
                  <Text style={styles.benefitItem}>• Easy to share and promote</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* QR Modal */}
      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Scan to Join {schoolName}</Text>
            {activeCode && (
              QRCodeComponent ? (
                <QRCodeComponent
                  value={`edudashpro://invite/${activeCode.code}`}
                  size={280}
                  backgroundColor="#FFFFFF"
                  color="#111827"
                />
              ) : (
                <Image
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(`edudashpro://invite/${activeCode.code}`)}` }}
                  style={{ width: 280, height: 280, borderRadius: 12, backgroundColor: '#FFFFFF' }}
                  resizeMode="contain"
                />
              )
            )}
            <Text style={styles.qrHint}>If the app is not installed, visit https://edudashpro.app/invite/{activeCode?.code}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => copyCodeWithLink()}
              >
                <IconSymbol name="link" size={20} color="#10B981" />
                <Text style={[styles.secondaryButtonText, { color: '#10B981' }]}>Copy Links</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setQrVisible(false)}
              >
                <IconSymbol name="xmark" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activeCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  codeInfo: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  codeDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
  },
  expiringText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  managementButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  warningButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  instructionsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionsList: {
    marginLeft: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#3B82F6',
  },
  noCodeContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  benefitsCard: {
    backgroundColor: '#F9FDF4',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  },
  linkActions: {
    marginBottom: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  linkButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  qrHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
