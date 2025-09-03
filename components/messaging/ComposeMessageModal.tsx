import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ActionSheetIOS,
  Platform,
  Modal,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import ChatViewModal from '@/components/messaging/ChatViewModal';
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
  mode?: 'sheet' | 'modal';
}

const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  visible,
  onClose,
  profile,
  childrenList,
  onMessageSent,
  mode = 'sheet',
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
    if (!profile?.preschool_id) {
      Alert.alert('Setup Required', 'Please complete your preschool setup to access messaging.');
      return;
    }

    try {
      setLoading(true);
      await waitForAuthSession();

      // Fetch contacts via SECURITY DEFINER RPC (scoped to same preschool)
      const { data, error } = await supabase.rpc('get_messaging_contacts', {
        p_include_staff: true,
        p_include_parents: true,
        p_limit: 500,
      });

      if (error) {
        console.error('Contact loading error:', error);
        throw error;
      }

      const mapped: Contact[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name || 'Unknown',
        role: row.role,
        avatar_url: row.avatar_url || undefined,
        email: row.email || undefined,
        class_name: row.class_name || undefined,
        is_online: false,
      }));

      console.log('Loaded contacts:', mapped.length, 'contacts');
      setContacts(mapped);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load contacts. Please try again or contact support.');
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

      // Atomic server-side send to satisfy RLS via SECURITY DEFINER RPC
      const { data: newMessageId, error: rpcError } = await supabase.rpc('send_direct_message', {
        p_recipient_user_id: selectedContact.id,
        p_content: messageContent.trim() || (attachedMedia.length > 0 ? '📷 Photo message' : ''),
        p_subject: '',
        p_message_type: 'direct',
      });

      if (rpcError || !newMessageId) {
        throw rpcError || new Error('send_direct_message failed');
      }

      const messageId = typeof newMessageId === 'string' ? newMessageId : (newMessageId as any);

      // Upload attached media if any
      if (attachedMedia.length > 0) {
        const uploadPromises = attachedMedia.map(async (media, index) => {
          const fileName = media.fileName || `message_${messageId}_${index}_${Date.now()}.jpg`;
          return MediaService.uploadMedia(
            media.uri,
            fileName,
            'image/jpeg', // Assuming images for now
            parentProfile.id,
            profile.preschool_id!,
            { messageId }
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

  const getEmptyStateMessage = () => {
    const isParent = profile?.role === 'parent';
    
    switch (activeTab) {
      case 'teachers':
        return 'No teachers found. Teachers may not be set up in your preschool yet.';
      case 'admin':
        return 'No administrators found. Admin staff may not be set up yet.';
      case 'parents':
        if (isParent) {
          return 'No other parents found. You can only message parents whose children share a class with your child.';
        } else {
          return 'No parents found in your preschool.';
        }
      default:
        return 'No contacts available at this time.';
    }
  };

  const renderContactItem = (contact: Contact) => {
    const bg = selectedContact?.id === contact.id ? selectionBg : palette.surface;
    return (
      <TouchableOpacity
        key={contact.id}
        className="flex-row items-center border-b"
        style={{ backgroundColor: bg, borderBottomColor: palette.outline, paddingHorizontal: 16, paddingVertical: 12 }}
        onPress={() => setSelectedContact(contact)}
      >
        <View className="relative mr-3">
          {contact.avatar_url ? (
            <Image source={{ uri: contact.avatar_url }} className="w-12 h-12 rounded-full" />
          ) : (
            <View className="w-12 h-12 rounded-full justify-center items-center" style={{ backgroundColor: isDark ? '#334155' : '#E5E7EB' }}>
              <Text className="text-lg font-semibold" style={{ color: isDark ? '#CBD5E1' : '#6B7280' }}>
                {contact.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {contact.is_online && (
            <View className="absolute w-3 h-3 rounded-full" style={{ bottom: 2, right: 2, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFFFF' }} />
          )}
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold" style={{ color: palette.text }}>{contact.name}</Text>
          <Text className="text-sm" style={{ color: palette.textSecondary }}>
            {contact.role === 'teacher' ? '👩‍🏫 Teacher' :
             (contact.role === 'admin' || contact.role === 'principal' || contact.role === 'preschool_admin') ? '👨‍💼 Admin' : '👨‍👩‍👧‍👦 Parent'}
            {contact.class_name && ` • ${contact.class_name}`}
          </Text>
          {contact.email && (
            <Text className="text-xs" style={{ color: palette.textSecondary }}>{contact.email}</Text>
          )}
        </View>

        {selectedContact?.id === contact.id && (
          <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
        )}
      </TouchableOpacity>
    );
  };

  const renderMessageComposer = () => (
    <View className="flex-1 p-5">
      <View className="flex-row justify-between items-start rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: palette.surface }}>
        <View className="flex-1">
          <Text className="text-sm mb-1" style={{ color: palette.textSecondary }}>Send message to:</Text>
          <Text className="text-lg font-semibold mb-0.5" style={{ color: palette.text }}>{selectedContact?.name}</Text>
          <Text className="text-sm" style={{ color: palette.textSecondary }}>
            {selectedContact?.role === 'teacher' ? 'Teacher' :
             (selectedContact?.role === 'admin' || selectedContact?.role === 'principal' || selectedContact?.role === 'preschool_admin') ? 'Administrator' : 'Parent'}
            {selectedContact?.class_name && ` • ${selectedContact.class_name}`}
          </Text>
        </View>
        <TouchableOpacity
          className="px-3 py-1.5 rounded-md border"
          style={{ borderColor: palette.primary }}
          onPress={() => setSelectedContact(null)}
        >
          <Text className="text-sm font-medium" style={{ color: palette.primary }}>Change</Text>
        </TouchableOpacity>
      </View>

      <View className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: palette.surface }}>
        <Text className="text-sm font-medium mb-2" style={{ color: palette.textSecondary }}>Message</Text>
        <TextInput
          className="border rounded-lg p-2.5 text-base"
          style={{ borderColor: palette.outline, color: palette.text, height: 120, textAlignVertical: 'top' as any, paddingBottom: 8 }}
          value={messageContent}
          onChangeText={setMessageContent}
          placeholder="Type your message here..."
          placeholderTextColor={placeholderColor}
          multiline
          maxLength={1000}
        />
        <Text className="text-xs text-right mt-1" style={{ color: palette.textSecondary }}>
          {messageContent.length}/1000
        </Text>
        
        {/* Media Attachment Controls */}
        <View className="flex-row mt-3">
          <TouchableOpacity
            className="flex-row items-center px-4 py-2 rounded-lg border gap-2"
            style={{ borderColor: palette.primary, backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EBF4FF' }}
            onPress={handleAddPhoto}
            disabled={uploadingMedia}
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <IconSymbol name="camera.fill" size={20} color={palette.primary} />
            )}
            <Text className="text-sm font-medium" style={{ color: palette.primary }}>
              {uploadingMedia ? 'Adding...' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Attached Media Preview */}
        {attachedMedia.length > 0 && (
          <View className="mt-4 pt-4 border-t" style={{ borderTopColor: palette.outline }}>
            <Text className="text-sm font-medium mb-2" style={{ color: palette.text }}>Attached Photos ({attachedMedia.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {attachedMedia.map((media, index) => (
                <View key={index} className="relative mr-3">
                  <Image source={{ uri: media.uri }} className="w-20 h-20 rounded-lg" style={{ backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }} />
                  <TouchableOpacity
                    className="absolute -top-1.5 -right-1.5 rounded-full"
                    style={{ backgroundColor: isDark ? palette.surface : '#FFFFFF' }}
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

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 py-3 rounded-lg border items-center"
          style={{ borderColor: palette.outline }}
          onPress={() => {
            setSelectedContact(null);
            setMessageContent('');
            setAttachedMedia([]);
          }}
        >
          <Text className="text-base font-medium" style={{ color: palette.textSecondary }}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-lg gap-2"
          style={{ backgroundColor: palette.primary, opacity: ((!messageContent.trim() && attachedMedia.length === 0) || sending) ? 0.6 : 1 }}
          onPress={sendMessage}
          disabled={(!messageContent.trim() && attachedMedia.length === 0) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
              <Text className="text-base font-medium text-white">Send Message</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const content = (
    <View className="pb-1" style={{ flex: 1, padding: 0, backgroundColor: palette.background }}>
      {!selectedContact && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.outline }}>
          <TouchableOpacity 
            className="w-8 h-8 rounded-full items-center justify-center bg-background-subtle"
            onPress={onClose}
            accessibilityLabel="Close"
          >
            <IconSymbol name="xmark" size={20} color={palette.textSecondary} />
          </TouchableOpacity>

          <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text }}>New Message</Text>

          <View style={{ width: 32 }} />
        </View>
      )}

      {/* ChatView overlay when a contact is selected - this should close the compose modal */}
      {selectedContact && (
        <ChatViewModal
          visible={true}
          onClose={() => {
            setSelectedContact(null);
            onClose(); // Close the entire compose modal
          }}
          contact={{ id: selectedContact.id, name: selectedContact.name }}
          profile={profile as any}
          onMessageSent={() => {
            onMessageSent?.();
            onClose(); // Close compose modal after message sent
          }}
        />
      )}

      {!selectedContact && (
        <>
          {/* Search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.outline, paddingHorizontal: 12, paddingVertical: 8 }}>
            <IconSymbol name="magnifyingglass" size={16} color={placeholderColor} />
            <TextInput
              style={{ flex: 1, fontSize: 16, marginLeft: 12, color: palette.text }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search contacts..."
              placeholderTextColor={placeholderColor}
            />
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', marginTop: 12, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: palette.outline, backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }}>
            {[
              { key: 'teachers', label: 'Teachers' },
              { key: 'admin', label: 'Staff' },
              { key: 'parents', label: 'Parents' },
            ].map(tab => {
              const isActive = activeTab === (tab.key as 'teachers' | 'admin' | 'parents');
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: isActive ? Colors[colorScheme].primary : 'transparent' }}
                  onPress={() => setActiveTab(tab.key as any)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? Colors[colorScheme].onPrimary : palette.textSecondary }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Contacts List */}
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.8, backgroundColor: palette.background }}>
            {loading ? (
              <View className="items-center justify-center py-10">
                <ActivityIndicator size="large" color={palette.primary} />
                <Text className="mt-4 text-base text-foreground-muted">Loading contacts...</Text>
              </View>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(renderContactItem)
            ) : (
              <View className="items-center justify-center py-14 px-6">
                <IconSymbol name="person.2" size={48} color={placeholderColor} />
                <Text className="mt-3 text-base font-semibold text-foreground text-center">No contacts found</Text>
                <Text className="mt-2 text-sm text-foreground-muted text-center leading-relaxed">
                  {searchQuery ? 
                    'Try adjusting your search terms or checking a different tab.' : 
                    getEmptyStateMessage()}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity 
                    className="mt-4 px-4 py-2 rounded-lg border" 
                    style={{ borderColor: palette.primary }}
                    onPress={() => loadContacts()}
                  >
                    <Text className="text-sm font-medium" style={{ color: palette.primary }}>Refresh</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );

  if (mode === 'modal') {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: palette.background, padding: 16 }}>
          {content}
        </View>
      </Modal>
    );
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} testID="compose-message">
      {content}
    </BottomSheetModal>
  );
};

export default ComposeMessageModal;
