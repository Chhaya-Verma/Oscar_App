import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';
import { aiService } from '@/services/ai.service';

type ProcessingScreenRouteProp = RouteProp<RootStackParamList, 'Processing'>;
type ProcessingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Processing'
>;

export default function ProcessingScreen() {
  const route = useRoute<ProcessingScreenRouteProp>();
  const navigation = useNavigation<ProcessingScreenNavigationProp>();
  const { rawText } = route.params;

  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    formatAndNavigate();
  }, []);

  const formatAndNavigate = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setIsRetrying(false);

      console.log('Starting formatting for transcript...');

      // Format the text
      const formatResult = await aiService.formatText(rawText);

      if (!formatResult.success || !formatResult.formattedText) {
        throw new Error(
          formatResult.error || 'Failed to format transcript'
        );
      }

      console.log('Formatting successful, generating title...');

      // Generate title
      const titleResult = await aiService.generateTitle(formatResult.formattedText);

      console.log('Navigation to Result screen...');

      // Navigate to Result screen
      navigation.replace('Result', {
        rawText,
        formattedText: formatResult.formattedText,
        title: titleResult.success ? titleResult.title : undefined,
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Processing error:', errorMsg);
      setError(errorMsg);
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await formatAndNavigate();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <AppShell showUtilities={false}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleCancel}>
              <Icon name="arrow-back" size={24} color="#22d3ee" />
            </Pressable>
            <Text style={styles.title}>Processing</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Processing State */}
          {isProcessing && !error && (
            <View style={styles.processingContent}>
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#22d3ee" />
              </View>
              <Text style={styles.processingText}>
                Formatting your transcript...
              </Text>
              <Text style={styles.subText}>
                DeepSeek is organizing your thoughts
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorContent}>
              <View style={styles.errorIconContainer}>
                <Icon name="alert-circle" size={64} color="#ef4444" />
              </View>
              <Text style={styles.errorTitle}>Formatting Failed</Text>
              <Text style={styles.errorMessage}>{error}</Text>

              <View style={styles.errorActions}>
                <Pressable
                  style={[styles.button, styles.retryButton]}
                  onPress={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Icon
                        name="refresh"
                        size={16}
                        color="#000"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.buttonText}>Try Again</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Icon
                    name="close"
                    size={16}
                    color="#9ca3af"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },

  // Processing State
  processingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    marginBottom: 40,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 300,
  },

  // Error State
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
    lineHeight: 20,
  },

  errorActions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#22d3ee',
  },
  cancelButton: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
