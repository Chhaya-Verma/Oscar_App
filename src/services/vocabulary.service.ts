import { supabase } from '@/lib/supabase/client';
import type {
  VocabularyEntry,
  VocabularyInsert,
  VocabularyUpdate,
} from '@/types/vocabulary.types';

/**
 * Vocabulary service for React Native app
 * Manages user custom vocabulary for better speech recognition
 * Data is stored in Supabase user_vocabulary table and used during formatting
 */
export const vocabularyService = {
  /**
   * Get all vocabulary entries for the current user
   */
  async getVocabulary(): Promise<{
    data: VocabularyEntry[] | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_vocabulary')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      return { data: data as VocabularyEntry[], error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Add a new vocabulary entry
   */
  async addVocabularyEntry(
    entry: VocabularyInsert
  ): Promise<{ data: VocabularyEntry | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .insert(entry)
        .select()
        .single();

      return { data: data as VocabularyEntry, error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Update an existing vocabulary entry
   */
  async updateVocabularyEntry(
    id: string,
    updates: VocabularyUpdate
  ): Promise<{ data: VocabularyEntry | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      return { data: data as VocabularyEntry, error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Delete a vocabulary entry
   */
  async deleteVocabularyEntry(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('user_vocabulary')
        .delete()
        .eq('id', id);

      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  /**
   * Get vocabulary count for the current user
   */
  async getVocabularyCount(): Promise<{
    count: number | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { count, error } = await supabase
        .from('user_vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return { count, error: error as Error | null };
    } catch (error) {
      return { count: null, error: error as Error };
    }
  },
};
