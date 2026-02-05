import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/context/AuthContext';
import type { Note } from '@/services/notes.service';

type NotesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Notes'
>;

type SortOption = 'created' | 'updated' | 'length';

export default function NotesScreen() {
  const navigation = useNavigation<NotesScreenNavigationProp>();
  const { notes, loading, refetch, toggleStar, removeNote, search } =
    useNotes();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [displayedNotes, setDisplayedNotes] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Refetch notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        refetch();
      }
    }, [user, refetch])
  );

  // Handle search and filtering with sorting
  useEffect(() => {
    async function filterAndSearch() {
      setIsSearching(true);
      let filtered = notes;

      // Apply search query
      if (searchQuery.trim()) {
        const searchResults = await search(searchQuery);
        filtered = searchResults;
      }

      // Apply starred filter
      if (showOnlyStarred) {
        filtered = filtered.filter((note) => note.is_starred);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'created':
            comparison =
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime();
            break;
          case 'updated':
            comparison =
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime();
            break;
          case 'length':
            const aLength = (a.content || '').length;
            const bLength = (b.content || '').length;
            comparison = bLength - aLength;
            break;
        }
        if (comparison === 0) {
          comparison = a.id.localeCompare(b.id);
        }
        return comparison;
      });

      setDisplayedNotes(filtered);
      setIsSearching(false);
    }

    filterAndSearch();
  }, [searchQuery, showOnlyStarred, sortBy, notes, search]);

  const handleToggleStar = async (id: string, isStarred: boolean) => {
    const result = await toggleStar(id, isStarred);
    if (!result) {
      Alert.alert('Error', 'Failed to update star status');
    }
  };

  const handleDeleteNote = async (id: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          const success = await removeNote(id);
          if (!success) {
            Alert.alert('Error', 'Failed to delete note');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderNoteCard = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteCard}
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('NoteDetail', { noteId: item.id });
      }}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteTitleContainer}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.noteDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            onPress={() => handleToggleStar(item.id, item.is_starred)}
            style={styles.actionButton}
          >
            <Icon
              name={item.is_starred ? 'star' : 'star-outline'}
              size={18}
              color={item.is_starred ? '#22d3ee' : '#9ca3af'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteNote(item.id)}
            style={styles.actionButton}
          >
            <Icon name="trash-outline" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
      <Text style={styles.notePreview} numberOfLines={2}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  return (
    <AppShell showUtilities={true}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Notes</Text>
        </View>

        {!user ? (
          <View style={styles.emptyState}>
            <Icon name="log-in-outline" size={48} color="#4b5563" />
            <Text style={styles.emptyStateText}>
              Please sign in to view your notes
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22d3ee" />
            <Text style={styles.loadingText}>Loading your notes...</Text>
          </View>
        ) : displayedNotes.length > 0 ? (
          <>
            <View style={styles.filterBar}>
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Icon
                  name="search"
                  size={16}
                  color="#6b7280"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search notes..."
                  placeholderTextColor="#6b7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Sort Dropdown Button */}
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setShowSortModal(true)}
              >
                <Icon
                  name="funnel"
                  size={16}
                  color="#9ca3af"
                />
                <Text style={styles.sortButtonText}>
                  {sortBy === 'created' && 'Date'}
                  {sortBy === 'updated' && 'Updated'}
                  {sortBy === 'length' && 'Length'}
                </Text>
              </TouchableOpacity>

              {/* Starred Filter Button */}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  showOnlyStarred && styles.filterButtonActive,
                ]}
                onPress={() => setShowOnlyStarred(!showOnlyStarred)}
              >
                <Icon
                  name={showOnlyStarred ? 'star' : 'star-outline'}
                  size={18}
                  color={showOnlyStarred ? '#22d3ee' : '#9ca3af'}
                />
              </TouchableOpacity>
            </View>

            {/* Sort Modal */}
            <Modal
              visible={showSortModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowSortModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowSortModal(false)}
              >
                <View style={styles.sortModal}>
                  <Text style={styles.sortModalTitle}>Sort by</Text>
                  {(['created', 'updated', 'length'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.sortModalOption}
                      onPress={() => {
                        setSortBy(option);
                        setShowSortModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.sortModalOptionText,
                          sortBy === option &&
                            styles.sortModalOptionTextActive,
                        ]}
                      >
                        {option === 'created' && 'Date Created'}
                        {option === 'updated' && 'Date Updated'}
                        {option === 'length' && 'Length'}
                      </Text>
                      {sortBy === option && (
                        <Icon name="checkmark" size={18} color="#22d3ee" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            <FlatList
              data={displayedNotes}
              renderItem={renderNoteCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="document-outline" size={48} color="#4b5563" />
            <Text style={styles.emptyStateText}>
              {notes.length === 0
                ? 'No notes yet. Start recording to create your first note!'
                : 'No notes match your search.'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearFilterText}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 211, 238, 0.4)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderColor: 'rgba(34, 211, 238, 0.6)',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    backgroundColor: '#1e293b',
    gap: 6,
  },
  sortButtonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModal: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: '60%',
  },
  sortModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  sortModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.1)',
  },
  sortModalOptionText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  sortModalOptionTextActive: {
    color: '#22d3ee',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  noteCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#22d3ee',
    marginVertical: 8,
    width: 24,
  },
  notePreview: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  clearFilterText: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: '600',
  },
});
