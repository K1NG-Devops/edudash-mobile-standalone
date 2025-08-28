import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserProfile } from '@/contexts/SimpleWorkingAuth';
import { supabase } from '@/lib/supabase';
import { MediaService } from '@/lib/services/mediaService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface Contact {
  id: string;
  name: string;
  role: 'teacher' | 'admin' | 'parent' | 'principal' | 'preschool_admin';
  avatar_url?: string;
  email?: string;
  class_name?: string;
  child_name?: string;
  is_online?: boolean;
}

interface ComposeMessageModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  childrenList: any[];
  onMessageSent: () => void;
}

const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  visible,
  onClose,
  profile,
  childrenList,
  onMessageSent,
}) => {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const placeholderColor = isDark ? '#94A3B8' : '#9CA3AF';
  const selectionBg = isDark ? 'rgba(59,130,246,0.15)' : '#EBF4FF';
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'teachers' | 'parents' | 'admin'>('teachers');
  const [attachedMedia, setAttachedMedia] = useState<{
    uri: string;
    type: string;
    fileName: string;
    fileSize?: number;
  }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      loadContacts();
    }
  }, [visible, profile]);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts, activeTab]);

  // Defensive default for children list
  const safeChildrenList = Array.isArray(childrenList) ? childrenList : [];

  const waitForAuthSession = async (timeoutMs = 3000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) return true;
      } catch {}
      await new Promise(r => setTimeout(r, 150));
    }
    return false;
  };

  const loadContacts = async () => {
    if (!profile?.preschool_id) return;

    try {
      setLoading(true);
      await waitForAuthSession();

      // Fetch contacts via SECURITY DEFINER RPC (scoped to same preschool)
      const { data, error } = await supabase.rpc('get_messaging_contacts', {
        p_include_staff: true,
        p_include_parents: true,
        p_limit: 500,
      });

      if (error) throw error;

      const mapped: Contact[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name || 'Unknown',
        role: row.role,
        avatar_url: row.avatar_url || undefined,
        email: row.email || undefined,
        class_name: row.class_name || undefined,
        is_online: false,
      }));

      setContacts(mapped);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = searchQuery === '' || 
        (contact.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const isStaff = contact.role === 'admin' || contact.role === 'principal' || contact.role === 'preschool_admin';
      const matchesTab = activeTab === 'teachers' ? contact.role === 'teacher' :
                        activeTab === 'admin' ? isStaff :
                        contact.role === 'parent';
      
      return matchesSearch && matchesTab;
    });

    // Sort by online status and name
    filtered.sort((a, b) => {
      if (a.is_online !== b.is_online) {
        return a.is_online ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    setFilteredContacts(filtered);
  };

  const sendMessage = async () => {
    if (!selectedContact || (!messageContent.trim() && attachedMedia.length === 0) || !profile) return;

    try {
      setSending(true);

      await waitForAuthSession();

      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }

      // Create the message first
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          preschool_id: profile.preschool_id!,
          subject: '',
          content: messageContent.trim() || (attachedMedia.length > 0 ? '📷 Photo message' : ''),
          sender_id: parentProfile.id,
          message_type: 'direct'
        })
        .select('id')
        .single();

      if (messageError) {
        throw messageError;
      }

      // Insert recipients row for selected contact
      if (selectedContact?.id) {
        await supabase
          .from('message_recipients')
          .insert({
            message_id: messageData.id,
            recipient_id: selectedContact.id
          });
      }

      // Upload attached media if any
      if (attachedMedia.length > 0) {
        const uploadPromises = attachedMedia.map(async (media, index) => {
          const fileName = media.fileName || `message_${messageData.id}_${index}_${Date.now()}.jpg`;
          return MediaService.uploadMedia(
            media.uri,
            fileName,
            'image/jpeg', // Assuming images for now
            parentProfile.id,
            profile.preschool_id!,
            { messageId: messageData.id }
          );
        });

        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.filter(result => result.error);
        
        if (failedUploads.length > 0) {
          // Removed debug statement: console.warn('Some media uploads failed:', failedUploads);
        }
      }

      Alert.alert('Success', 'Message sent successfully!');
      setMessageContent('');
      setAttachedMedia([]);
      setSelectedContact(null);
      setSearchQuery('');
      onMessageSent();
      onClose();
    } catch (error) {
      // Removed debug statement: console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

const handleAddPhoto = () => {
    // RN Web doesn't support multi-button Alert reliably; open gallery directly
    if (Platform.OS === 'web') {
      pickImageFromGallery();
      return;
    }

    const options = [
      'Take Photo',
      'Choose from Gallery',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            pickImageFromCamera();
          } else if (buttonIndex === 1) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Photo',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: pickImageFromCamera },
          { text: 'Choose from Gallery', onPress: pickImageFromGallery },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const pickImageFromCamera = async () => {
    try {
      setUploadingMedia(true);
      const result = await MediaService.pickImage('camera');
      if (result) {
        setAttachedMedia(prev => [...prev, {
          uri: result.uri,
          type: result.type || 'image',
          fileName: `camera_${Date.now()}.jpg`,
          fileSize: result.fileSize,
        }]);
      }
    } catch (error) {
      // Removed debug statement: console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to take photo. Please check camera permissions.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setUploadingMedia(true);
      const result = await MediaService.pickImage('gallery');
      if (result) {
        setAttachedMedia(prev => [...prev, {
          uri: result.uri,
          type: result.type || 'image',
          fileName: `gallery_${Date.now()}.jpg`,
          fileSize: result.fileSize,
        }]);
      }
    } catch (error) {
      // Removed debug statement: console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please check gallery permissions.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index: number) => {
    setAttachedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const renderContactItem = (contact: Contact) => (
    <TouchableOpacity
      key={contact.id}
      style={[
        styles.contactItem,
        { backgroundColor: palette.surface, borderBottomColor: palette.outline },
        selectedContact?.id === contact.id && { backgroundColor: selectionBg }
      ]}
      onPress={() => setSelectedContact(contact)}
    >
      <View style={styles.contactAvatar}>
        {contact.avatar_url ? (
          <Image source={{ uri: contact.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.defaultAvatar, { backgroundColor: isDark ? '#334155' : '#E5E7EB' }]}>
            <Text style={[styles.avatarText, { color: isDark ? '#CBD5E1' : '#6B7280' }]}>
              {contact.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {contact.is_online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: palette.text }]}>{contact.name}</Text>
        <Text style={[styles.contactRole, { color: palette.textSecondary }]}>
          {contact.role === 'teacher' ? '👩‍🏫 Teacher' :
           (contact.role === 'admin' || contact.role === 'principal' || contact.role === 'preschool_admin') ? '👨‍💼 Admin' : '👨‍👩‍👧‍👦 Parent'}
          {contact.class_name && ` • ${contact.class_name}`}
        </Text>
        {contact.email && (
          <Text style={[styles.contactEmail, { color: palette.textSecondary }]}>{contact.email}</Text>
        )}
      </View>

      {selectedContact?.id === contact.id && (
        <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  const renderMessageComposer = () => (
    <View style={[styles.composerContainer, { backgroundColor: 'transparent' }]}>
      <View style={[styles.selectedContactHeader, { backgroundColor: palette.surface }]}>
        <View style={styles.selectedContactInfo}>
          <Text style={[styles.composerTitle, { color: palette.textSecondary }]}>Send message to:</Text>
          <Text style={[styles.selectedContactName, { color: palette.text }]}>{selectedContact?.name}</Text>
          <Text style={[styles.selectedContactRole, { color: palette.textSecondary }]}> 
            {selectedContact?.role === 'teacher' ? 'Teacher' :
             (selectedContact?.role === 'admin' || selectedContact?.role === 'principal' || selectedContact?.role === 'preschool_admin') ? 'Administrator' : 'Parent'}
            {selectedContact?.class_name && ` • ${selectedContact.class_name}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.changeContactButton, { borderColor: palette.primary }]}
          onPress={() => setSelectedContact(null)}
        >
          <Text style={[styles.changeContactText, { color: palette.primary }]}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.messageInputContainer, { backgroundColor: palette.surface }]}>
        <Text style={[styles.messageInputLabel, { color: palette.textSecondary }]}>Message</Text>
        <TextInput
          style={[styles.messageInput, { borderColor: palette.outline, color: palette.text }]}
          value={messageContent}
          onChangeText={setMessageContent}
          placeholder="Type your message here..."
          placeholderTextColor={placeholderColor}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={[styles.characterCount, { color: palette.textSecondary }]}>
          {messageContent.length}/1000
        </Text>
        
        {/* Media Attachment Controls */}
        <View style={styles.mediaControls}>
          <TouchableOpacity
            style={[styles.addPhotoButton, { borderColor: palette.primary, backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EBF4FF' }]}
            onPress={handleAddPhoto}
            disabled={uploadingMedia}
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <IconSymbol name="camera.fill" size={20} color={palette.primary} />
            )}
            <Text style={[styles.addPhotoText, { color: palette.primary }]}>
              {uploadingMedia ? 'Adding...' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Attached Media Preview */}
        {attachedMedia.length > 0 && (
          <View style={[styles.attachedMediaContainer, { borderTopColor: palette.outline }]}>
            <Text style={[styles.attachedMediaLabel, { color: palette.text }]}>Attached Photos ({attachedMedia.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewScroll}>
              {attachedMedia.map((media, index) => (
                <View key={index} style={styles.mediaPreviewItem}>
                  <Image source={{ uri: media.uri }} style={[styles.mediaPreviewImage, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]} />
                  <TouchableOpacity
                    style={[styles.removeMediaButton, { backgroundColor: isDark ? palette.surface : '#FFFFFF' }]}
                    onPress={() => removeMedia(index)}
                  >
                    <IconSymbol name="xmark.circle.fill" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.composerActions}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: palette.outline }]}
          onPress={() => {
            setSelectedContact(null);
            setMessageContent('');
            setAttachedMedia([]);
          }}
        >
          <Text style={[styles.cancelButtonText, { color: palette.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sendMessageButton,
            { backgroundColor: palette.primary },
            ((!messageContent.trim() && attachedMedia.length === 0) || sending) && { opacity: 0.6 }
          ]}
          onPress={sendMessage}
          disabled={(!messageContent.trim() && attachedMedia.length === 0) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.outline }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]} onPress={onClose}>
            <IconSymbol name="xmark" size={20} color={palette.textSecondary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: palette.text }]}>New Message</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {selectedContact ? (
          renderMessageComposer()
        ) : (
          <>
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: palette.surface, borderColor: palette.outline }]}>
              <IconSymbol name="magnifyingglass" size={16} color={placeholderColor} />
              <TextInput
                style={[styles.searchInput, { color: palette.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search contacts..."
                placeholderTextColor={placeholderColor}
              />
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: palette.surface }]}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'teachers' && [styles.activeTab, { backgroundColor: palette.primary }]]}
                onPress={() => setActiveTab('teachers')}
              >
                <Text style={[
                  styles.tabText,
                  { color: palette.textSecondary },
                  activeTab === 'teachers' && styles.activeTabText
                ]}>
                  Teachers
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'admin' && [styles.activeTab, { backgroundColor: palette.primary }]]}
                onPress={() => setActiveTab('admin')}
              >
                <Text style={[
                  styles.tabText,
                  { color: palette.textSecondary },
                  activeTab === 'admin' && styles.activeTabText
                ]}>
                  Staff
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'parents' && [styles.activeTab, { backgroundColor: palette.primary }]]}
                onPress={() => setActiveTab('parents')}
              >
                <Text style={[
                  styles.tabText,
                  { color: palette.textSecondary },
                  activeTab === 'parents' && styles.activeTabText
                ]}>
                  Parents
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contacts List */}
            <ScrollView style={styles.contactsList}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={palette.primary} />
                  <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Loading contacts...</Text>
                </View>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map(renderContactItem)
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol name="person.2" size={48} color={placeholderColor} />
                  <Text style={[styles.emptyStateTitle, { color: palette.text }]}>No contacts found</Text>
                  <Text style={[styles.emptyStateText, { color: palette.textSecondary }]}>
                    {searchQuery ? 
                      'Try adjusting your search terms' : 
                      `No ${activeTab} available to message`
                    }
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedContact: {
    backgroundColor: '#EBF4FF',
  },
  contactAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  composerContainer: {
    flex: 1,
    padding: 20,
  },
  selectedContactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedContactInfo: {
    flex: 1,
  },
  composerTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedContactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedContactRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  changeContactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  changeContactText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  messageInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  messageInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  composerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  sendMessageButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Media Controls Styles
  mediaControls: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
    gap: 8,
  },
  addPhotoText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  attachedMediaContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachedMediaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  mediaPreviewScroll: {
    flexDirection: 'row',
  },
  mediaPreviewItem: {
    position: 'relative',
    marginRight: 12,
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ComposeMessageModal;
