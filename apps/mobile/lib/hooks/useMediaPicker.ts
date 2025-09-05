import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface MediaFile {
  uri: string;
  type: 'image' | 'video' | 'document' | 'audio';
  name: string;
  size?: number;
  mimeType?: string;
}

export const useMediaPicker = () => {
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      camera: cameraPermission.status === 'granted',
      library: libraryPermission.status === 'granted',
    };
  };

  const pickFromCamera = async (mediaTypes: ImagePicker.MediaTypeOptions = ImagePicker.MediaTypeOptions.Images): Promise<MediaFile | null> => {
    const permissions = await requestPermissions();
    
    if (!permissions.camera) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return null;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        name: asset.fileName || `camera_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        size: asset.fileSize,
        mimeType: asset.mimeType,
      };
    } catch (error) {
      console.error('Error picking from camera:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  };

  const pickFromGallery = async (mediaTypes: ImagePicker.MediaTypeOptions = ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection = false): Promise<MediaFile[]> => {
    const permissions = await requestPermissions();
    
    if (!permissions.library) {
      Alert.alert('Permission Required', 'Photo library permission is needed to select images.');
      return [];
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: !allowsMultipleSelection,
        allowsMultipleSelection,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets.length) {
        return [];
      }

      return result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        name: asset.fileName || `gallery_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        size: asset.fileSize,
        mimeType: asset.mimeType,
      }));
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select from gallery');
      return [];
    }
  };

  const pickDocument = async (): Promise<MediaFile | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'document',
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      };
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
      return null;
    }
  };

  const getFileInfo = async (uri: string) => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info;
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  };

  return {
    isUploading,
    setIsUploading,
    pickFromCamera,
    pickFromGallery,
    pickDocument,
    getFileInfo,
    requestPermissions,
  };
};
