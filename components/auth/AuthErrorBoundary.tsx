import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import { classifyError, AppErrorInfo } from '@/lib/utils/errorClassify';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  appError?: AppErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

/**
 * Error boundary that classifies errors (auth, rate limit, quota, network, etc.)
 * and provides contextual recovery options.
 */
export class AuthErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('🚨 [ERROR-BOUNDARY] Error caught:', error);
    console.error('🚨 [ERROR-BOUNDARY] Error info:', errorInfo);
    console.error('🚨 [ERROR-BOUNDARY] Error stack:', error?.stack);
    
    const appError = classifyError(error);

    this.setState({
      hasError: true,
      error,
      errorInfo,
      appError,
    });

    // You could also log this to an error reporting service
    // logErrorToService({ error, errorInfo, appError });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, appError: undefined });
  };

  getGradientColors(type: AppErrorInfo['type']): [string, string, ...string[]] {
    switch (type) {
      case 'auth':
        return ['#DC2626', '#EF4444', '#F87171']; // red
      case 'rate_limit':
        return ['#F59E0B', '#FBBF24', '#FCD34D']; // amber
      case 'quota':
        return ['#7C3AED', '#8B5CF6', '#A78BFA']; // violet
      case 'ai_config':
        return ['#DB2777', '#EC4899', '#F472B6']; // pink
      case 'network':
        return ['#2563EB', '#3B82F6', '#60A5FA']; // blue
      default:
        return ['#374151', '#4B5563', '#6B7280']; // gray
    }
  }

  getTitle(type: AppErrorInfo['type']): string {
    switch (type) {
      case 'auth':
        return 'Authentication Error';
      case 'rate_limit':
        return 'Too Many Requests';
      case 'quota':
        return 'AI Usage Limit Reached';
      case 'ai_config':
        return 'AI Configuration Error';
      case 'network':
        return 'Network Error';
      default:
        return 'Something went wrong';
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      const appError = this.state.appError ?? { type: 'unknown', userMessage: 'An unexpected error occurred.' } as AppErrorInfo;
      const colors = this.getGradientColors(appError.type);
      const title = this.getTitle(appError.type);

      return (
        <LinearGradient
          colors={colors}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <IconSymbol name="exclamationmark.triangle.fill" size={60} color="#FFFFFF" />
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>
              {appError.userMessage || 'Please try again or contact support if the problem persists.'}
            </Text>
            
            {__DEV__ && (this.state.error || this.state.errorInfo) && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info (Dev Only):</Text>
                {this.state.error && (
                  <Text style={styles.debugText}>{this.state.error.message}</Text>
                )}
                {this.state.errorInfo?.componentStack ? (
                  <>
                    <Text style={[styles.debugTitle, { marginTop: 8 }]}>Component stack:</Text>
                    <Text style={[styles.debugText, { maxHeight: 200 }]}>{this.state.errorInfo.componentStack}</Text>
                  </>
                ) : null}
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={this.retry}>
                <IconSymbol name="arrow.clockwise" size={20} color={colors[0]} />
                <Text style={[styles.primaryButtonText, { color: colors[0] }]}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => {
                  router.replace('/');
                }}
              >
                <IconSymbol name="house" size={20} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
