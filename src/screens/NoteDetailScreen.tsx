import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Share,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';
import { fetchNoteById, updateNote } from '@/services/notes.service';
import { useAuth } from '@/context/AuthContext';
import type { Note } from '@/services/notes.service';

type NoteDetailScreenRouteProp = RouteProp<RootStackParamList, 'NoteDetail'>;
type NoteDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'NoteDetail'
>;

export default function NoteDetailScreen() {
  const route = useRoute<NoteDetailScreenRouteProp>();
  const navigation = useNavigation<NoteDetailScreenNavigationProp>();
  const { user } = useAuth();
  const { noteId } = route.params;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    loadNoteDetail();
  }, [noteId]);

  const loadNoteDetail = async () => {
    setLoading(true);
    console.log('Loading note with ID:', noteId);
    const { note: fetchedNote, error } = await fetchNoteById(noteId);

    console.log('Fetched note:', fetchedNote);
    console.log('Fetch error:', error);

    if (error) {
      console.error('Error loading note:', error);
      Alert.alert('Error', 'Could not load note: ' + error.message);
      navigation.goBack();
      setLoading(false);
      return;
    }

    if (!fetchedNote) {
      console.error('Note not found');
      Alert.alert('Error', 'Note not found');
      navigation.goBack();
      setLoading(false);
      return;
    }

    // Check ownership
    if (user && fetchedNote.user_id !== user.id) {
      Alert.alert('Error', 'You do not have permission to view this note');
      navigation.goBack();
      setLoading(false);
      return;
    }

    console.log('Setting note with content:', fetchedNote.content);
    setNote(fetchedNote);
    setEditedContent(fetchedNote.content || '');
    setEditedTitle(fetchedNote.title || '');
    setLoading(false);
  };

  const handleSaveChanges = async () => {
    if (!note) return;

    setIsSaving(true);
    const { note: updatedNote, error } = await updateNote(note.id, {
      title: editedTitle,
      content: editedContent,
    });

    if (error) {
      Alert.alert('Error', 'Failed to save changes');
      setIsSaving(false);
      return;
    }

    setNote(updatedNote!);
    setIsEditing(false);
    setIsSaving(false);
    Alert.alert('Success', 'Note updated');
  };

  const handleShare = async () => {
    if (!note) return;

    try {
      await Share.share({
        message: `${note.title}\n\n${note.content}`,
        title: note.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share note');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <AppShell showUtilities={true}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22d3ee" />
          </View>
        </SafeAreaView>
      </AppShell>
    );
  }

  if (!note) {
    return (
      <AppShell showUtilities={true}>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Note not found</Text>
          </View>
        </SafeAreaView>
      </AppShell>
    );
  }

  return (
    <AppShell showUtilities={true}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContent}>
          {/* Title Section */}
          <View style={styles.section}>
            {isEditing ? (
              <TextInput
                style={styles.editTitleInput}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Note Title"
                placeholderTextColor="#6b7280"
              />
            ) : (
              <Text style={styles.title}>{note.title}</Text>
            )}
            <Text style={styles.dateText}>
              {formatDate(note.created_at)}
            </Text>
          </View>

          {/* Content Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Formatted Note</Text>
            </View>

            {isEditing ? (
              <TextInput
                style={styles.editContentInput}
                value={editedContent}
                onChangeText={setEditedContent}
                placeholder="Note content"
                placeholderTextColor="#6b7280"
                multiline
              />
            ) : (
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>
                  {note.content && note.content.length > 0
                    ? note.content
                    : editedContent || 'No content available'}
                </Text>
              </View>
            )}

            {/* Action Buttons under content box */}
            {isEditing ? (
              <View style={styles.contentActionBar}>
                <Pressable
                  style={[styles.contentActionButton, styles.contentActionButtonPrimary]}
                  onPress={handleSaveChanges}
                  disabled={isSaving}
                >
                  <Icon name="checkmark" size={20} color="#ffffff" />
                </Pressable>
                <Pressable
                  style={styles.contentActionButton}
                  onPress={() => {
                    setIsEditing(false);
                    setEditedTitle(note.title);
                    setEditedContent(note.content);
                  }}
                >
                  <Icon name="close" size={20} color="#ef4444" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.contentActionBar}>
                <Pressable
                  style={styles.contentActionButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Icon name="pencil" size={20} color="#22d3ee" />
                </Pressable>
                <Pressable
                  style={styles.contentActionButton}
                  onPress={handleShare}
                >
                  <Icon name="share-social" size={20} color="#22d3ee" />
                </Pressable>
                <Pressable
                  style={[styles.contentActionButton, styles.contentActionButtonDanger]}
                  onPress={() => {
                    Alert.alert(
                      'Delete Note',
                      'Are you sure? This cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            navigation.goBack();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Icon name="trash" size={20} color="#ef4444" />
                </Pressable>
              </View>
            )}
          </View>

          {/* Raw Text Section (if available) */}
          {note.raw_content && (
            <View style={styles.section}>
              <Pressable
                onPress={() => setShowRawText(!showRawText)}
                style={styles.rawTextToggle}
              >
                <Icon
                  name={showRawText ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color="#22d3ee"
                />
                <Text style={styles.rawTextToggleText}>
                  {showRawText ? 'Hide Original Transcript' : 'Show Original Transcript'}
                </Text>
              </Pressable>

              {showRawText && (
                <View style={styles.rawTextBox}>
                  <Text style={styles.rawTextLabel}>Original Transcription:</Text>
                  <Text style={styles.rawTextContent}>{note.raw_content}</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22d3ee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  editTitleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  contentBox: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#e5e7eb',
  },
  editContentInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 250,
    textAlignVertical: 'top',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  rawTextToggle: {
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
  rawTextToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22d3ee',
  },
  rawTextBox: {
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  rawTextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  rawTextContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 211, 238, 0.2)',
    backgroundColor: '#0f172a',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: 'rgba(34, 211, 238, 0.4)',
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22d3ee',
  },
  actionButtonTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22d3ee',
  },
  actionButtonTextCancel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  actionButtonTextDelete: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  contentActionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  contentActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentActionButtonPrimary: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: 'rgba(34, 211, 238, 0.4)',
  },
  contentActionButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  contentActionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22d3ee',
  },
  contentActionButtonTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22d3ee',
  },
  contentActionButtonTextCancel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  contentActionButtonTextDelete: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  backButtonBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 211, 238, 0.2)',
    backgroundColor: '#0f172a',
  },
  backButton: {
    flex: 0.5,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22d3ee',
  },
  topBackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.2)',
  },
  topBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
});
