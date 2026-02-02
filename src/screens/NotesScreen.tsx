import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppShell from '@/components/AppShell';

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isStarred: boolean;
};

const DUMMY_NOTES: Note[] = [
  {
    id: '1',
    title: 'Product Launch Strategy',
    content:
      'Discuss the key points for launching the new product line. Focus on market positioning, target audience, and competitive analysis. Timeline should be finalized by end of quarter...',
    createdAt: 'Jan 15, 2025 2:30 PM',
    isStarred: true,
  },
  {
    id: '2',
    title: 'Meeting Notes - Team Sync',
    content:
      'Quick sync with the team about upcoming project milestones. Discussed deliverables, timeline, and resource allocation. Action items assigned to respective team members...',
    createdAt: 'Jan 12, 2025 11:00 AM',
    isStarred: false,
  },
];

export default function NotesScreen() {
  const navigation = useNavigation();
  const [notes, setNotes] = useState<Note[]>(DUMMY_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStarred = !showOnlyStarred || note.isStarred;
    return matchesSearch && matchesStarred;
  });

  const handleToggleStar = (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, isStarred: !note.isStarred } : note
      )
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const renderNoteCard = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteCard}
      activeOpacity={0.8}
      onPress={() => {
        // Navigate to detail page
      }}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteTitleContainer}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.noteDate}>{item.createdAt}</Text>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            onPress={() => handleToggleStar(item.id)}
            style={styles.actionButton}
          >
            <Icon
              name={item.isStarred ? 'star' : 'star-outline'}
              size={18}
              color={item.isStarred ? '#22d3ee' : '#9ca3af'}
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

        {notes.length > 0 && (
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
        )}

        {filteredNotes.length === 0 ? (
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
        ) : (
          <FlatList
            data={filteredNotes}
            renderItem={renderNoteCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 60,
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
