import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { createNote, fetchUserNotes } from '@/services/notes.service';
import { submitFeedback, type FeedbackReason } from '@/services/feedback.service';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { SUBSCRIPTION_CONFIG, ERROR_MESSAGES } from '@/constants';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Result'
>;

export default function ResultScreen() {
  const route = useRoute<ResultScreenRouteProp>();
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const { rawText, formattedText, title } = route.params;

  const [isSaving, setIsSaving] = useState(true);
  const [noteId, setNoteId] = useState<string | null>(null);
  
  // Feedback state
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [hasFeedbackSubmitted, setHasFeedbackSubmitted] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState<boolean | null>(null);

  // Auto-save note on component mount
  React.useEffect(() => {
    autoSaveNote();
  }, []);

  const handleShare = async () => {
    try {
      const shareText = title
        ? `${title}\n\n${formattedText}`
        : formattedText;

      await Share.share({
        message: shareText,
        title: title || 'My Note',
      });
    } catch (error: any) {
      Alert.alert('Share failed', error.message);
    }
  };

  const autoSaveNote = async () => {
    try {
      if (!user) {
        setIsSaving(false);
        return;
      }

      // Save note automatically
      const { note, error } = await createNote({
        title: title || 'Untitled Note',
        content: formattedText,
        raw_content: rawText,
        is_starred: false,
      });

      if (error) {
        console.error('Auto-save failed:', error);
        setIsSaving(false);
        return;
      }

      // Store noteId for feedback widget
      if (note?.id) {
        setNoteId(note.id);
      }
    } catch (err) {
      console.error('Auto-save note error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordAgain = () => {
    navigation.navigate('Recording');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleFeedbackSubmit = async (
    helpful: boolean,
    reasons?: FeedbackReason[]
  ) => {
    if (!noteId) {
      Alert.alert('Error', 'Could not submit feedback - note not found.');
      return;
    }

    setIsFeedbackSubmitting(true);
    const { success, error } = await submitFeedback(noteId, helpful, reasons);

    if (error || !success) {
      Alert.alert(
        'Error',
        'Failed to submit feedback. Please try again.'
      );
    } else {
      setHasFeedbackSubmitted(true);
      setFeedbackValue(helpful);
      Alert.alert('Thanks!', 'Your feedback helps us improve.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Recording');
          },
        },
      ]);
    }
    setIsFeedbackSubmitting(false);
  };

  return (
    <AppShell showUtilities={true}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={handleBack}>
                <Icon name="arrow-back" size={24} color="#22d3ee" />
              </Pressable>
              <Text style={styles.headerTitle}>Formatted Note</Text>
              <Pressable onPress={handleShare}>
                <Icon name="share-social" size={24} color="#22d3ee" />
              </Pressable>
            </View>

            {/* Title Section */}
            {title && (
              <View style={styles.titleSection}>
                <Text style={styles.title}>{title}</Text>
              </View>
            )}

            {/* Formatted Text Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color="#22d3ee"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.cardTitle}>Formatted Version</Text>
              </View>

              <View style={styles.contentBox}>
                <Text style={styles.formattedText}>{formattedText}</Text>
              </View>
            </View>

            {/* Feedback Widget */}
            {noteId && (
              <FeedbackWidget
                onSubmit={handleFeedbackSubmit}
                isSubmitting={isFeedbackSubmitting}
                hasSubmitted={hasFeedbackSubmitted}
                submittedValue={feedbackValue}
              />
            )}

            {/* Original Transcript Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon
                  name="document-text"
                  size={20}
                  color="#9ca3af"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.cardTitle}>Original Transcript</Text>
              </View>

              <View style={[styles.contentBox, styles.originalBox]}>
                <Text style={styles.originalText}>{rawText}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={handleRecordAgain}
              >
                <Icon
                  name="mic-outline"
                  size={16}
                  color="#22d3ee"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.secondaryButtonText}>Record Again</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={handleBack}
              >
                <Icon
                  name="arrow-back"
                  size={16}
                  color="#22d3ee"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.secondaryButtonText}>Back to Notes</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },

  // Title Section
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22d3ee',
    lineHeight: 36,
  },

  // Cards
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },

  contentBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.15)',
    maxHeight: 300,
  },
  formattedText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#e5e7eb',
  },

  originalBox: {
    borderColor: 'rgba(156, 163, 175, 0.15)',
  },
  originalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#9ca3af',
    fontStyle: 'italic',
  },

  // Actions
  actions: {
    gap: 12,
    marginTop: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#22d3ee',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },

  secondaryButton: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22d3ee',
  },
});
