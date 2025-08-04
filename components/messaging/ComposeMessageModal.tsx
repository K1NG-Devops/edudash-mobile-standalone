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

interface Contact {
  id: string;
  name: string;
  role: 'teacher' | 'admin' | 'parent';
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
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'teachers' | 'parents' | 'admin'>('teachers');
  const [attachedMedia, setAttachedMedia] = useState<Array<{
    uri: string;
    type: string;
    fileName: string;
    fileSize?: number;
  }>>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      loadContacts();
    }
  }, [visible, profile]);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts, activeTab]);

  const loadContacts = async () => {
    if (!profile?.preschool_id) return;

    try {
      setLoading(true);

      // Get parent's internal ID
      const { data: parentProfile, error: parentError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentError || !parentProfile) {
        throw new Error('Parent profile not found');
      }

      const allContacts: Contact[] = [];

      // Load teachers and staff from the same preschool
      const { data: teachersData, error: teachersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          role,
          avatar_url,
          email,
          classes (
            name
          )
        `)
        .eq('preschool_id', profile.preschool_id)
        .in('role', ['teacher', 'admin'])
        .neq('id', parentProfile.id);

      if (!teachersError && teachersData) {
        teachersData.forEach((teacher: any) => {
          allContacts.push({
            id: teacher.id,
            name: teacher.name || 'Unknown',
            role: teacher.role,
            avatar_url: teacher.avatar_url,
            email: teacher.email,
            class_name: teacher.classes?.name,
            is_online: Math.random() > 0.5, // Mock online status
          });
        });
      }

      // Load other parents with children in the same classes
      if (childrenList.length > 0) {
        const classIds = childrenList.map(child => child.class_id).filter(Boolean);
        
        if (classIds.length > 0) {
          const { data: classParentsData, error: parentsError } = await supabase
            .from('students')
            .select(`
              parent_id,
              classes (
                name
              ),
              users!students_parent_id_fkey (
                id,
                name,
                avatar_url,
                email
              )
            `)
            .in('class_id', classIds)
            .neq('parent_id', parentProfile.id);

          if (!parentsError && classParentsData) {
            const seenParents = new Set<string>();
            
            classParentsData.forEach((student: any) => {
              if (student.users && !seenParents.has(student.users.id)) {
                seenParents.add(student.users.id);
                allContacts.push({
                  id: student.users.id,
                  name: student.users.name || 'Unknown Parent',
                  role: 'parent',
                  avatar_url: student.users.avatar_url,
                  email: student.users.email,
                  class_name: student.classes?.name,
                  is_online: Math.random() > 0.5, // Mock online status
                });
              }
            });
          }
        }
      }

      setContacts(allContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = searchQuery === '' || 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTab = activeTab === 'teachers' ? contact.role === 'teacher' :
                        activeTab === 'admin' ? contact.role === 'admin' :
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
          content: messageContent.trim() || (attachedMedia.length > 0 ? '📷 Photo message' : ''),
          sender_id: parentProfile.id,
          receiver_id: selectedContact.id,
          sender_type: 'parent',
          receiver_type: selectedContact.role,
          message_type: attachedMedia.length > 0 ? 'image' : 'text',
          is_read: false,
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
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
          console.warn('Some media uploads failed:', failedUploads);
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
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAddPhoto = () => {
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
      console.error('Error picking image from camera:', error);
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
      console.error('Error picking image from gallery:', error);
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
        selectedContact?.id === contact.id && styles.selectedContact
      ]}
      onPress={() => setSelectedContact(contact)}
    >
      <View style={styles.contactAvatar}>
        {contact.avatar_url ? (
          <Image source={{ uri: contact.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>
              {contact.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {contact.is_online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactRole}>
          {contact.role === 'teacher' ? '👩‍🏫 Teacher' :
           contact.role === 'admin' ? '👨‍💼 Admin' : '👨‍👩‍👧‍👦 Parent'}
          {contact.class_name && ` • ${contact.class_name}`}
        </Text>
        {contact.email && (
          <Text style={styles.contactEmail}>{contact.email}</Text>
        )}
      </View>

      {selectedContact?.id === contact.id && (
        <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
      )}
    </TouchableOpacity>
  );

  const renderMessageComposer = () => (
    <View style={styles.composerContainer}>
      <View style={styles.selectedContactHeader}>
        <View style={styles.selectedContactInfo}>
          <Text style={styles.composerTitle}>Send message to:</Text>
          <Text style={styles.selectedContactName}>{selectedContact?.name}</Text>
          <Text style={styles.selectedContactRole}>
            {selectedContact?.role === 'teacher' ? 'Teacher' :
             selectedContact?.role === 'admin' ? 'Administrator' : 'Parent'}
            {selectedContact?.class_name && ` • ${selectedContact.class_name}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.changeContactButton}
          onPress={() => setSelectedContact(null)}
        >
          <Text style={styles.changeContactText}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.messageInputContainer}>
        <Text style={styles.messageInputLabel}>Message</Text>
        <TextInput
          style={styles.messageInput}
          value={messageContent}
          onChangeText={setMessageContent}
          placeholder="Type your message here..."
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.characterCount}>
          {messageContent.length}/1000
        </Text>
        
        {/* Media Attachment Controls */}
        <View style={styles.mediaControls}>
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={handleAddPhoto}
            disabled={uploadingMedia}
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <IconSymbol name="camera.fill" size={20} color="#3B82F6" />
            )}
            <Text style={styles.addPhotoText}>
              {uploadingMedia ? 'Adding...' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Attached Media Preview */}
        {attachedMedia.length > 0 && (
          <View style={styles.attachedMediaContainer}>
            <Text style={styles.attachedMediaLabel}>Attached Photos ({attachedMedia.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewScroll}>
              {attachedMedia.map((media, index) => (
                <View key={index} style={styles.mediaPreviewItem}>
                  <Image source={{ uri: media.uri }} style={styles.mediaPreviewImage} />
                  <TouchableOpacity
                    style={styles.removeMediaButton}
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
          style={styles.cancelButton}
          onPress={() => {
            setSelectedContact(null);
            setMessageContent('');
            setAttachedMedia([]);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sendMessageButton,
            ((!messageContent.trim() && attachedMedia.length === 0) || sending) && styles.sendButtonDisabled
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>New Message</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {selectedContact ? (
          renderMessageComposer()
        ) : (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <IconSymbol name="magnifyingglass" size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search contacts..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'teachers' && styles.activeTab]}
                onPress={() => setActiveTab('teachers')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'teachers' && styles.activeTabText
                ]}>
                  Teachers
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'admin' && styles.activeTab]}
                onPress={() => setActiveTab('admin')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'admin' && styles.activeTabText
                ]}>
                  Staff
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'parents' && styles.activeTab]}
                onPress={() => setActiveTab('parents')}
              >
                <Text style={[
                  styles.tabText,
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
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading contacts...</Text>
                </View>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map(renderContactItem)
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol name="person.2" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateTitle}>No contacts found</Text>
                  <Text style={styles.emptyStateText}>
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
