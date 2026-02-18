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
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
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
import { useAIEmailFormatting } from '@/hooks/useAIEmailFormatting';
import { useAITranslation } from '@/hooks/useAITranslation';
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

  // Language & Formatting state
  const [displayedText, setDisplayedText] = useState(formattedText);
  const [currentMode, setCurrentMode] = useState<'original' | 'formatted' | 'email' | 'hindi' | 'english'>('formatted');
  const [displayLanguage, setDisplayLanguage] = useState<'original' | 'hindi' | 'english'>('original');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isEmailFormat, setIsEmailFormat] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedText, setEditedText] = useState(formattedText);
  const [showOriginalTranscript, setShowOriginalTranscript] = useState(false);

  // Hooks for formatting
  const { formatEmailText, isFormatting } = useAIEmailFormatting();
  const { translateText, isTranslating } = useAITranslation();

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

  // Language & Formatting Handlers
  const handleLanguageChange = async (language: 'original' | 'hindi' | 'english') => {
    setShowLanguageDropdown(false);

    if (language === 'original') {
      setDisplayedText(formattedText);
      setDisplayLanguage('original');
      setCurrentMode('formatted');
      return;
    }

    if (language === 'hindi' && displayLanguage === 'hindi') {
      return; // Already in Hindi
    }

    if (language === 'english' && displayLanguage === 'english') {
      return; // Already in English
    }

    // Translate to requested language
    const sourceText = currentMode === 'email' ? displayedText : formattedText;
    const result = await translateText(sourceText, language === 'hindi' ? 'hi' : 'en');

    if (result.success && result.translatedText) {
      setDisplayedText(result.translatedText);
      setDisplayLanguage(language);
      setCurrentMode(language);
    } else {
      Alert.alert('Error', result.error || 'Translation failed');
    }
  };

  const handleEmailFormat = async () => {
    if (isEmailFormat) {
      // Toggle back to simple format
      setDisplayedText(editedText);
      setIsEmailFormat(false);
      setCurrentMode('formatted');
      return;
    }

    // Format as email
    const result = await formatEmailText(displayedText, title);
    if (result.success && result.formattedText) {
      setDisplayedText(result.formattedText);
      setIsEmailFormat(true);
      setCurrentMode('email');
    } else {
      Alert.alert('Error', result.error || 'Failed to format as email');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setString(displayedText);
      Alert.alert('Copied', 'Text copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy');
    }
  };

  const handleDownload = async () => {
    try {
      // Placeholder for download functionality
      Alert.alert('Download', 'Note downloaded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to download');
    }
  };

  const handleEditText = () => {
    if (isEditMode) {
      setEditedText(displayedText);
      setIsEditMode(false);
    } else {
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = () => {
    setEditedText(displayedText);
    setIsEditMode(false);
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

              {/* Language Dropdown & Action Icons */}
              <View style={styles.controlBar}>
                {/* Language Dropdown */}
                <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownLabel}>Transcript language:</Text>
                  <Pressable
                    style={styles.dropdown}
                    onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  >
                    <Text style={styles.dropdownValue}>
                      {displayLanguage === 'original' && 'Original'}
                      {displayLanguage === 'hindi' && 'हिंदी'}
                      {displayLanguage === 'english' && 'English'}
                    </Text>
                    <Icon
                      name={showLanguageDropdown ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#22d3ee"
                    />
                  </Pressable>

                  {/* Dropdown Menu */}
                  {showLanguageDropdown && (
                    <View style={styles.dropdownMenu}>
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => handleLanguageChange('original')}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            displayLanguage === 'original' && styles.dropdownItemActive,
                          ]}
                        >
                          Original
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => handleLanguageChange('hindi')}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            displayLanguage === 'hindi' && styles.dropdownItemActive,
                          ]}
                        >
                          हिंदी (Hindi)
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => handleLanguageChange('english')}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            displayLanguage === 'english' && styles.dropdownItemActive,
                          ]}
                        >
                          English
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Action Icons with Labels */}
                <View style={styles.actionIconsContainer}>
                  {/* Edit Button */}
                  <Pressable 
                    style={styles.iconButtonWithLabel} 
                    onPress={handleEditText}
                  >
                    <View style={[styles.iconWrapper, isEditMode && styles.iconWrapperActive]}>
                      <Icon 
                        name="pencil" 
                        size={20} 
                        color={isEditMode ? '#000' : '#22d3ee'} 
                      />
                    </View>
                    <Text style={styles.iconLabel}>Edit</Text>
                  </Pressable>

                  {/* Simple/Email Toggle Button */}
                  <Pressable 
                    style={styles.iconButtonWithLabel} 
                    onPress={handleEmailFormat}
                    disabled={isFormatting}
                  >
                    <View style={[styles.iconWrapper, isEmailFormat && styles.iconWrapperActive]}>
                      {isFormatting ? (
                        <ActivityIndicator size={20} color="#22d3ee" />
                      ) : (
                        <Icon 
                          name="mail" 
                          size={20} 
                          color={isEmailFormat ? '#000' : '#22d3ee'} 
                        />
                      )}
                    </View>
                    <Text style={styles.iconLabel}>
                      {isEmailFormat ? 'Simple' : 'Email'}
                    </Text>
                  </Pressable>

                  {/* Copy Button */}
                  <Pressable 
                    style={styles.iconButtonWithLabel} 
                    onPress={handleCopyToClipboard}
                  >
                    <View style={styles.iconWrapper}>
                      <Icon name="copy" size={20} color="#22d3ee" />
                    </View>
                    <Text style={styles.iconLabel}>Copy</Text>
                  </Pressable>

                  {/* Download Button */}
                  <Pressable 
                    style={styles.iconButtonWithLabel} 
                    onPress={handleDownload}
                  >
                    <View style={styles.iconWrapper}>
                      <Icon name="download" size={20} color="#22d3ee" />
                    </View>
                    <Text style={styles.iconLabel}>Download</Text>
                  </Pressable>

                  {/* Share Button */}
                  <Pressable 
                    style={styles.iconButtonWithLabel} 
                    onPress={handleShare}
                  >
                    <View style={styles.iconWrapper}>
                      <Icon name="share-social" size={20} color="#22d3ee" />
                    </View>
                    <Text style={styles.iconLabel}>Share</Text>
                  </Pressable>
                </View>
              </View>

              {/* Content Box */}
              {isEditMode ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={displayedText}
                    onChangeText={setDisplayedText}
                    multiline
                    placeholderTextColor="#9ca3af"
                  />
                  <Pressable 
                    style={styles.saveButton}
                    onPress={handleSaveEdit}
                  >
                    <Icon name="checkmark" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.contentBox}>
                  {isTranslating ? (
                    <ActivityIndicator size="large" color="#22d3ee" />
                  ) : (
                    <Text style={styles.formattedText}>{displayedText}</Text>
                  )}
                </View>
              )}
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
              <Pressable
                style={styles.transcriptToggle}
                onPress={() => setShowOriginalTranscript(!showOriginalTranscript)}
              >
                <Icon
                  name={showOriginalTranscript ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color="#22d3ee"
                />
                <Text style={styles.transcriptToggleText}>
                  {showOriginalTranscript ? 'Hide Original Transcript' : 'Show Original Transcript'}
                </Text>
              </Pressable>

              {showOriginalTranscript && (
                <View style={[styles.contentBox, styles.originalBox]}>
                  <Text style={styles.originalText}>{rawText}</Text>
                </View>
              )}
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

  // Transcript Header (Toggle)
  transcriptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  transcriptToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22d3ee',
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

  // Control Bar Styles
  controlBar: {
    marginBottom: 16,
    gap: 12,
  },
  dropdownContainer: {
    gap: 8,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e7eb',
  },
  dropdownMenu: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.1)',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dropdownItemActive: {
    color: '#22d3ee',
    fontWeight: '600',
  },

  // Action Icons
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },

  // Action Icons with Labels (New)
  actionIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  iconButtonWithLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  iconWrapperActive: {
    backgroundColor: '#22d3ee',
    borderColor: '#22d3ee',
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Edit Mode Styles
  editContainer: {
    gap: 12,
  },
  editInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.15)',
    color: '#e5e7eb',
    fontSize: 15,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#22d3ee',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
});
