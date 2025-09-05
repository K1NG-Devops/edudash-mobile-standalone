import { useState, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface VoiceMessage {
  uri: string;
  duration: number;
  size: number;
}

// Lazy-load expo-av to avoid native module errors on clients without the AV module
let ExpoAV: any | null = null;
const loadAV = async () => {
  if (ExpoAV) return ExpoAV;
  try {
    const mod = await import('expo-av');
    ExpoAV = mod;
    return mod;
  } catch (e) {
    console.warn('expo-av not available in this build');
    return null;
  }
};

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const recording = useRef<any>(null);
  const sound = useRef<any>(null);
  const durationTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
      }
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    try {
      if (recording.current) {
        await recording.current.stopAndUnloadAsync();
        recording.current = null;
      }
      if (sound.current) {
        await sound.current.unloadAsync();
        sound.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const av = await loadAV();
      if (!av) {
        Alert.alert('Unavailable', 'Audio features are not available in this build.');
        setHasPermission(false);
        return false;
      }
      const permission = await av.Audio.requestPermissionsAsync();
      setHasPermission(permission.status === 'granted');
      return permission.status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  const startRecording = async (): Promise<boolean> => {
    try {
      // Request permission if not already granted
      if (hasPermission === null) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Microphone permission is needed to record voice messages.');
          return false;
        }
      } else if (hasPermission === false) {
        Alert.alert('Permission Required', 'Microphone permission is needed to record voice messages.');
        return false;
      }

      // Configure audio mode
      const av = await loadAV();
      if (!av) {
        Alert.alert('Unavailable', 'Audio features are not available in this build.');
        return false;
      }
      await av.Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const A: any = av.Audio as any;
      const { recording: newRecording } = await av.Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: A?.AndroidOutputFormat?.MPEG_4 ?? 2,
          audioEncoder: A?.AndroidAudioEncoder?.AAC ?? 3,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: A?.IOSOutputFormat?.MPEG4AAC ?? 'mp4a',
          audioQuality: A?.IOSAudioQuality?.HIGH ?? 'High',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      return false;
    }
  };

  const stopRecording = async (): Promise<VoiceMessage | null> => {
    try {
      if (!recording.current || !isRecording) {
        return null;
      }

      // Clear timer
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }

      // Stop recording
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      
      if (!uri) {
        Alert.alert('Error', 'Failed to save recording.');
        return null;
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      setIsRecording(false);
      
      const voiceMessage: VoiceMessage = {
        uri,
        duration: recordingDuration,
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
      };

      recording.current = null;
      setRecordingDuration(0);

      return voiceMessage;
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
      setIsRecording(false);
      return null;
    }
  };

  const cancelRecording = async () => {
    try {
      if (recording.current && isRecording) {
        await recording.current.stopAndUnloadAsync();
        recording.current = null;
      }
      
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }

      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  const playVoiceMessage = async (uri: string): Promise<boolean> => {
    try {
      // Stop current playback if any
      if (sound.current) {
        await sound.current.unloadAsync();
        sound.current = null;
      }

      const av = await loadAV();
      if (!av) {
        Alert.alert('Unavailable', 'Audio features are not available in this build.');
        return false;
      }
      const { sound: newSound } = await av.Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      sound.current = newSound;
      setIsPlaying(true);

      // Listen for playback status
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      return true;
    } catch (error) {
      console.error('Error playing voice message:', error);
      Alert.alert('Error', 'Failed to play voice message.');
      return false;
    }
  };

  const stopPlayback = async () => {
    try {
      if (sound.current) {
        await sound.current.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    isPlaying,
    recordingDuration,
    hasPermission,
    requestPermission,
    startRecording,
    stopRecording,
    cancelRecording,
    playVoiceMessage,
    stopPlayback,
    formatDuration,
  };
};
