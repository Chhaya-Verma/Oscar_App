import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { FeedbackReason } from '@/services/feedback.service';

interface FeedbackWidgetProps {
  onSubmit: (helpful: boolean, reasons?: string[]) => void;
  isSubmitting?: boolean;
  hasSubmitted?: boolean;
  submittedValue?: boolean | null;
}

const FEEDBACK_REASONS: Array<{ value: FeedbackReason; label: string }> = [
  { value: 'too_short', label: 'Too short' },
  { value: 'missed_key_info', label: 'Missed key info' },
  { value: 'incorrect_grammar', label: 'Incorrect grammar' },
  { value: 'wrong_tone', label: 'Wrong tone' },
  { value: 'poor_formatting', label: 'Poor formatting' },
  { value: 'other', label: 'Other' },
];

export function FeedbackWidget({
  onSubmit,
  isSubmitting = false,
  hasSubmitted = false,
  submittedValue = null,
}: FeedbackWidgetProps) {
  const [showReasons, setShowReasons] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [clickedValue, setClickedValue] = useState<boolean | null>(null);
  const [otherText, setOtherText] = useState('');

  const handleYesClick = () => {
    setClickedValue(true);
    onSubmit(true);
  };

  const handleNoClick = () => {
    setClickedValue(false);
    setShowReasons(true);
  };

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmitReasons = () => {
    const finalReasons = selectedReasons.filter((r) => r !== 'other');

    if (selectedReasons.includes('other') && otherText.trim()) {
      finalReasons.push(otherText.trim());
    }

    onSubmit(false, finalReasons.length > 0 ? finalReasons : undefined);
  };

  const handleCancel = () => {
    setShowReasons(false);
    setClickedValue(null);
    setSelectedReasons([]);
    setOtherText('');
  };

  // If already submitted, show thank you message
  if (hasSubmitted && submittedValue !== null) {
    return (
      <View style={styles.container}>
        <View style={styles.submittedContainer}>
          <View style={styles.submittedContent}>
            <Text style={styles.submittedText}>
              {submittedValue
                ? '✓ Thanks for your feedback!'
                : '✓ Thanks! We\'ll work on improving.'}
            </Text>
            <Text style={styles.submittedSubText}>
              {submittedValue ? 'Helpful' : 'Needs improvement'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (showReasons) {
    return (
      <View style={styles.container}>
        <View style={styles.reasonsContainer}>
          <View style={styles.reasonsHeader}>
            <View>
              <Text style={styles.reasonsTitle}>What could be improved?</Text>
              <Text style={styles.reasonsSubtitle}>(optional)</Text>
            </View>
            <Pressable
              onPress={handleCancel}
              disabled={isSubmitting}
              hitSlop={8}
            >
              <Icon
                name="close"
                size={20}
                color="#a3a3a3"
                style={{ opacity: isSubmitting ? 0.5 : 1 }}
              />
            </Pressable>
          </View>

          <ScrollView style={styles.reasonsList}>
            <View style={styles.reasonsGrid}>
              {FEEDBACK_REASONS.map((reason) => (
                <Pressable
                  key={reason.value}
                  onPress={() => handleReasonToggle(reason.value)}
                  disabled={isSubmitting}
                  style={[
                    styles.reasonButton,
                    selectedReasons.includes(reason.value) &&
                      styles.reasonButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.reasonButtonText,
                      selectedReasons.includes(reason.value) &&
                        styles.reasonButtonTextSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {selectedReasons.includes('other') && (
            <View style={styles.otherInputContainer}>
              <Text style={styles.otherInputLabel}>Please describe:</Text>
              <TextInput
                style={styles.otherTextInput}
                value={otherText}
                onChangeText={setOtherText}
                placeholder="Tell us what could be improved..."
                placeholderTextColor="#6b7280"
                multiline
                editable={!isSubmitting}
              />
              <Text style={styles.otherInputNoteText}>
                Your feedback will be sent with your note.
              </Text>
            </View>
          )}

          <View style={styles.reasonsActions}>
            <Pressable
              onPress={handleSubmitReasons}
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#22d3ee" />
              ) : (
                <Icon name="send" size={16} color="#22d3ee" />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackQuestion}>
          Was this formatting helpful?
        </Text>

        <View style={styles.feedbackButtons}>
          <Pressable
            onPress={handleYesClick}
            disabled={isSubmitting || clickedValue !== null}
            style={[
              styles.feedbackButton,
              (isSubmitting || clickedValue !== null) &&
                styles.feedbackButtonDisabled,
            ]}
          >
            <Icon
              name="thumbs-up-outline"
              size={16}
              color="#a3a3a3"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.feedbackButtonText}>Yes</Text>
          </Pressable>

          <Pressable
            onPress={handleNoClick}
            disabled={isSubmitting || clickedValue !== null}
            style={[
              styles.feedbackButton,
              (isSubmitting || clickedValue !== null) &&
                styles.feedbackButtonDisabled,
            ]}
          >
            <Icon
              name="thumbs-down-outline"
              size={16}
              color="#a3a3a3"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.feedbackButtonText}>No</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },

  // Initial State
  feedbackCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackQuestion: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 12,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  feedbackButtonDisabled: {
    opacity: 0.5,
  },
  feedbackButtonText: {
    fontSize: 13,
    color: '#a3a3a3',
    fontWeight: '500',
  },

  // Reasons State
  reasonsContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  reasonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500',
  },
  reasonsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  reasonsList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  reasonButtonSelected: {
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderColor: 'rgba(34, 211, 238, 0.5)',
  },
  reasonButtonText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  reasonButtonTextSelected: {
    color: '#22d3ee',
  },

  otherInputContainer: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 211, 238, 0.15)',
  },
  otherInputLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
    fontWeight: '500',
  },
  otherTextInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#e5e7eb',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  otherInputNoteText: {
    fontSize: 11,
    color: '#6b7280',
  },

  reasonsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  submitButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },

  // Submitted State
  submittedContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submittedContent: {
    alignItems: 'center',
  },
  submittedText: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  submittedSubText: {
    fontSize: 11,
    color: '#6b7280',
  },
});
