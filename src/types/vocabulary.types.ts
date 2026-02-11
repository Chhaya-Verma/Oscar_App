/**
 * Vocabulary type definitions for React Native app
 */

export interface VocabularyEntry {
  id: string;
  user_id: string;
  term: string;
  pronunciation: string | null;
  context: string | null;
  created_at: string;
  updated_at: string;
}

export interface VocabularyInsert {
  user_id: string;
  term: string;
  pronunciation?: string | null;
  context?: string | null;
}

export interface VocabularyUpdate {
  term?: string;
  pronunciation?: string | null;
  context?: string | null;
}
