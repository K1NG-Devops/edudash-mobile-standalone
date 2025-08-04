import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface MediaUpload {
  id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  preschool_id: string;
  message_id?: string;
  classroom_activity_id?: string;
  student_id?: string;
  created_at: string;
}

export class MediaService {
  // Request permissions for camera and media library
  static async requestPermissions() {
    try {
      const cameraPermissions = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return {
        camera: cameraPermissions.status === 'granted',
        mediaLibrary: mediaLibraryPermissions.status === 'granted',
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { camera: false, mediaLibrary: false };
    }
  }

  // Pick image from camera or gallery
  static async pickImage(source: 'camera' | 'gallery' = 'gallery') {
    try {
      const permissions = await this.requestPermissions();
      
      if (source === 'camera' && !permissions.camera) {
        throw new Error('Camera permission is required');
      }
      
      if (source === 'gallery' && !permissions.mediaLibrary) {
        throw new Error('Media library permission is required');
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        return {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          type: result.assets[0].type,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  // Pick video from camera or gallery
  static async pickVideo(source: 'camera' | 'gallery' = 'gallery') {
    try {
      const permissions = await this.requestPermissions();
      
      if (source === 'camera' && !permissions.camera) {
        throw new Error('Camera permission is required');
      }
      
      if (source === 'gallery' && !permissions.mediaLibrary) {
        throw new Error('Media library permission is required');
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: 60, // 1 minute max
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        return {
          uri: result.assets[0].uri,
          type: result.assets[0].type,
          width: result.assets[0].width,
          height: result.assets[0].height,
          duration: result.assets[0].duration,
          fileSize: result.assets[0].fileSize,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking video:', error);
      throw error;
    }
  }

  // Upload media to Supabase Storage
  static async uploadMedia(
    fileUri: string,
    fileName: string,
    mimeType: string,
    uploadedBy: string,
    preschoolId: string,
    options?: {
      messageId?: string;
      classroomActivityId?: string;
      studentId?: string;
      isBase64?: boolean;
    }
  ) {
    try {
      let fileData;
      let actualFileName = fileName;

      if (options?.isBase64) {
        // Handle base64 data
        const base64Data = fileUri.split(',')[1] || fileUri;
        fileData = decode(base64Data);
      } else {
        // Read file from URI
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }

        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileData = decode(base64);
        
        // Generate unique filename if not provided
        if (!fileName) {
          const timestamp = Date.now();
          const extension = mimeType.split('/')[1] || 'jpg';
          actualFileName = `${timestamp}.${extension}`;
        }
      }

      // Upload to Supabase Storage
      const filePath = `${preschoolId}/media/${actualFileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media-uploads')
        .upload(filePath, fileData, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media-uploads')
        .getPublicUrl(filePath);

      // Save media record to database
      const { data: mediaRecord, error: dbError } = await supabase
        .from('media_uploads')
        .insert({
          file_name: actualFileName,
          file_url: urlData.publicUrl,
          file_type: this.getFileType(mimeType),
          file_size: fileData.byteLength,
          mime_type: mimeType,
          uploaded_by: uploadedBy,
          preschool_id: preschoolId,
          message_id: options?.messageId,
          classroom_activity_id: options?.classroomActivityId,
          student_id: options?.studentId,
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      return { data: mediaRecord, error: null };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { data: null, error };
    }
  }

  // Get media for a message
  static async getMessageMedia(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('media_uploads')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching message media:', error);
      return { data: null, error };
    }
  }

  // Get classroom activity media
  static async getClassroomActivityMedia(activityId: string) {
    try {
      const { data, error } = await supabase
        .from('media_uploads')
        .select(`
          *,
          uploader:users!media_uploads_uploaded_by_fkey(name, avatar_url, role)
        `)
        .eq('classroom_activity_id', activityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching classroom activity media:', error);
      return { data: null, error };
    }
  }

  // Delete media
  static async deleteMedia(mediaId: string, userId: string) {
    try {
      // Get media record first
      const { data: mediaRecord, error: fetchError } = await supabase
        .from('media_uploads')
        .select('*')
        .eq('id', mediaId)
        .eq('uploaded_by', userId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const filePath = mediaRecord.file_url.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage
        .from('media-uploads')
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_uploads')
        .delete()
        .eq('id', mediaId)
        .eq('uploaded_by', userId);

      if (dbError) throw dbError;
      return { error: null };
    } catch (error) {
      console.error('Error deleting media:', error);
      return { error };
    }
  }

  // Create classroom activity with media
  static async createClassroomActivity(
    preschoolId: string,
    teacherId: string,
    title: string,
    description: string,
    activityType: 'learning' | 'play' | 'meal' | 'nap' | 'outdoor' | 'art' | 'music' | 'reading',
    studentIds: string[],
    mediaUris?: string[]
  ) {
    try {
      // Create activity record
      const { data: activity, error: activityError } = await supabase
        .from('classroom_activities')
        .insert({
          preschool_id: preschoolId,
          teacher_id: teacherId,
          title,
          description,
          activity_type: activityType,
          student_ids: studentIds,
        })
        .select()
        .single();

      if (activityError) throw activityError;

      // Upload media if provided
      if (mediaUris && mediaUris.length > 0) {
        const mediaPromises = mediaUris.map(async (uri, index) => {
          const timestamp = Date.now();
          const fileName = `activity_${activity.id}_${index}_${timestamp}.jpg`;
          
          return this.uploadMedia(
            uri,
            fileName,
            'image/jpeg',
            teacherId,
            preschoolId,
            { classroomActivityId: activity.id }
          );
        });

        await Promise.all(mediaPromises);
      }

      return { data: activity, error: null };
    } catch (error) {
      console.error('Error creating classroom activity:', error);
      return { data: null, error };
    }
  }

  // Get student's recent activities with media
  static async getStudentActivities(studentId: string, preschoolId: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('classroom_activities')
        .select(`
          *,
          teacher:users!classroom_activities_teacher_id_fkey(name, avatar_url),
          media:media_uploads(id, file_name, file_url, file_type, created_at)
        `)
        .eq('preschool_id', preschoolId)
        .contains('student_ids', [studentId])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching student activities:', error);
      return { data: null, error };
    }
  }

  // Helper method to determine file type
  private static getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  // Get media statistics for dashboard
  static async getMediaStats(preschoolId: string, dateRange?: { from: string; to: string }) {
    try {
      let query = supabase
        .from('media_uploads')
        .select('file_type, created_at')
        .eq('preschool_id', preschoolId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by file type
      const stats = data.reduce((acc, media) => {
        acc[media.file_type] = (acc[media.file_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching media stats:', error);
      return { data: null, error };
    }
  }
}
