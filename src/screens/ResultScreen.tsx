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
import { NotesLimitModal } from '@/components/NotesLimitModal';
import { createNote, fetchUserNotes } from '@/services/notes.service';
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

  const [isSaving, setIsSaving] = useState(false);
  
  // Notes limit modal state
  const [showNotesLimitModal, setShowNotesLimitModal] = useState(false);
  const [notesLimitData, setNotesLimitData] = useState({
    currentCount: 0,
    limit: 10,
    isApproaching: false,
  });

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

  const handleSaveNote = async () => {
    try {
      setIsSaving(true);

      if (!user) {
        Alert.alert('Please log in to save notes');
        return;
      }

      // Check notes limit
      const { notes, error: fetchError } = await fetchUserNotes();
      
      if (fetchError) {
        Alert.alert('Error', 'Failed to check notes limit');
        return;
      }

      const notesLimit = isProUser 
        ? SUBSCRIPTION_CONFIG.PRO_MAX_NOTES
        : SUBSCRIPTION_CONFIG.FREE_MAX_NOTES;

      // Show modal if limit reached
      if (notesLimit !== null && notes.length >= notesLimit) {
        setNotesLimitData({
          currentCount: notes.length,
          limit: notesLimit,
          isApproaching: false,
        });
        setShowNotesLimitModal(true);
        return;
      }

      // Warn if approaching limit
      if (notesLimit !== null && notes.length === notesLimit - 1) {
        setNotesLimitData({
          currentCount: notes.length,
          limit: notesLimit,
          isApproaching: true,
        });
        setShowNotesLimitModal(true);
        // Don't return - let user continue after dismissing
        return;
      }

      // Save note
      const { note, error } = await createNote({
        title: title || 'Untitled Note',
        content: formattedText,
        raw_content: rawText,
        is_starred: false,
      });

      if (error) {
        Alert.alert('Save failed', error.message);
        return;
      }

      Alert.alert('Success', 'Note saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Recording');
          },
        },
      ]);
    } catch (err) {
      console.error('Save note error:', err);
      Alert.alert('Error', 'Failed to save note');
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

  return (
    <AppShell showUtilities={true}>
      {/* Notes Limit Modal */}
      <NotesLimitModal
        visible={showNotesLimitModal}
        currentCount={notesLimitData.currentCount}
        limit={notesLimitData.limit}
        isApproachingLimit={notesLimitData.isApproaching}
        onClose={() => setShowNotesLimitModal(false)}
        onUpgradePress={() => {
          setShowNotesLimitModal(false);
          // TODO: Navigate to upgrade screen
          Alert.alert('Coming Soon', 'Pro subscription upgrade coming soon!');
        }}
      />

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
                style={[styles.button, styles.primaryButton]}
                onPress={handleSaveNote}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Icon
                      name="save"
                      size={16}
                      color="#000"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryButtonText}>Save Note</Text>
                  </>
                )}
              </Pressable>

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
