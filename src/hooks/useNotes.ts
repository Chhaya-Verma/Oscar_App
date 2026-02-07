import { useState, useEffect, useCallback } from 'react';
import type { Note } from '@/services/notes.service';
import {
  fetchUserNotes,
  createNote,
  updateNote,
  deleteNote,
  toggleNoteStar,
  searchNotes,
  getStarredNotes,
} from '@/services/notes.service';
import { useAuth } from '@/context/AuthContext';

interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addNote: (
    title: string,
    content: string,
    rawContent?: string
  ) => Promise<Note | null>;
  updateNoteLocal: (
    noteId: string,
    title?: string,
    content?: string,
    rawContent?: string
  ) => Promise<Note | null>;
  removeNote: (noteId: string) => Promise<boolean>;
  toggleStar: (noteId: string, isStarred: boolean) => Promise<Note | null>;
  search: (query: string) => Promise<Note[]>;
  getStarred: () => Promise<Note[]>;
}

/**
 * Custom hook to manage notes from Supabase
 */
export function useNotes(): UseNotesResult {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch notes on component mount or when user changes
  useEffect(() => {
    if (user) {
      loadNotes();
    } else {
      setNotes([]);
      setLoading(false);
    }
  }, [user]);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { notes: fetchedNotes, error: fetchError } = await fetchUserNotes();

    if (fetchError) {
      setError(fetchError);
      console.error('Failed to load notes:', fetchError);
    } else {
      setNotes(fetchedNotes);
    }

    setLoading(false);
  }, []);

  const refetch = useCallback(async () => {
    await loadNotes();
  }, [loadNotes]);

  const addNote = useCallback(
    async (title: string, content: string, rawContent?: string) => {
      const { note, error: createError } = await createNote({
        title,
        content,
        raw_content: rawContent,
        is_starred: false,
      });

      if (createError) {
        console.error('Failed to create note:', createError);
        return null;
      }

      // Add the new note to the local state
      if (note) {
        setNotes((prev) => [note, ...prev]);
      }

      return note;
    },
    []
  );

  const updateNoteLocal = useCallback(
    async (
      noteId: string,
      title?: string,
      content?: string,
      rawContent?: string
    ) => {
      const { note, error: updateError } = await updateNote(noteId, {
        title,
        content,
        raw_content: rawContent,
      });

      if (updateError) {
        console.error('Failed to update note:', updateError);
        return null;
      }

      // Update the local state
      if (note) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? note : n))
        );
      }

      return note;
    },
    []
  );

  const removeNote = useCallback(async (noteId: string) => {
    const { success, error: deleteError } = await deleteNote(noteId);

    if (deleteError) {
      console.error('Failed to delete note:', deleteError);
      return false;
    }

    // Remove from local state
    if (success) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }

    return success;
  }, []);

  const toggleStar = useCallback(
    async (noteId: string, isStarred: boolean) => {
      const { note, error: toggleError } = await toggleNoteStar(
        noteId,
        isStarred
      );

      if (toggleError) {
        console.error('Failed to toggle star:', toggleError);
        return null;
      }

      // Update local state
      if (note) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? note : n))
        );
      }

      return note;
    },
    []
  );

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Return all notes if query is empty
      const { notes: allNotes } = await fetchUserNotes();
      return allNotes;
    }

    const { notes: searchResults } = await searchNotes(query);
    return searchResults;
  }, []);

  const getStarred = useCallback(async () => {
    const { notes: starredNotes } = await getStarredNotes();
    return starredNotes;
  }, []);

  return {
    notes,
    loading,
    error,
    refetch,
    addNote,
    updateNoteLocal,
    removeNote,
    toggleStar,
    search,
    getStarred,
  };
}
