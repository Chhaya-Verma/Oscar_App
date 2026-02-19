import { supabase } from '@/lib/supabase/client';

export interface Note {
  id: string;
  title: string;
  content: string;
  raw_content?: string;
  is_starred: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Oscar web schema fields
  original_formatted_text?: string;
  raw_text?: string;
  edited_text?: string;
  feedback_helpful?: boolean | null;
  feedback_reasons?: string[] | null;
}

export interface CreateNotePayload {
  title: string;
  content: string;
  raw_content?: string;
  is_starred?: boolean;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  raw_content?: string;
  is_starred?: boolean;
}

/**
 * Fetch all notes for the current user
 */
export async function fetchUserNotes(): Promise<{
  notes: Note[];
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
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const notes: Note[] = (data || []).map((note: any) => {
      const displayContent = note.edited_text || 
                            note.original_formatted_text || 
                            note.content || 
                            '';
      
      const displayRawContent = note.raw_text || 
                               note.raw_content || 
                               '';

      return {
        id: note.id,
        title: note.title,
        content: displayContent,
        raw_content: displayRawContent,
        is_starred: note.is_starred || false,
        user_id: note.user_id,
        created_at: note.created_at,
        updated_at: note.updated_at,
        original_formatted_text: note.original_formatted_text,
        raw_text: note.raw_text,
        edited_text: note.edited_text,
        feedback_helpful: note.feedback_helpful,
        feedback_reasons: note.feedback_reasons,
      };
    });

    return { notes, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error fetching notes:', error);
    return { notes: [], error };
  }
}

/**
 * Fetch a single note by ID
 */
export async function fetchNoteById(
  noteId: string
): Promise<{ note: Note | null; error: Error | null }> {
  try {
    console.log('Fetching note with ID:', noteId);

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (error) {
      throw error;
    }

    console.log('Raw data from Supabase:', data);

    // Map Supabase columns to our Note interface
    // Support both old schema (content, raw_content) and new schema (original_formatted_text, raw_text)
    const displayContent = data.edited_text || 
                          data.original_formatted_text || 
                          data.content || 
                          '';
    
    const displayRawContent = data.raw_text || 
                             data.raw_content || 
                             '';

    const note: Note = {
      id: data.id,
      title: data.title,
      content: displayContent,
      raw_content: displayRawContent,
      is_starred: data.is_starred || false,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // Include original fields too
      original_formatted_text: data.original_formatted_text,
      raw_text: data.raw_text,
      edited_text: data.edited_text,
      feedback_helpful: data.feedback_helpful,
      feedback_reasons: data.feedback_reasons,
    };

    console.log('Transformed note:', note);
    console.log('Display content:', displayContent);

    return { note, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error fetching note:', error);
    return { note: null, error };
  }
}

/**
 * Create a new note
 */
export async function createNote(
  payload: CreateNotePayload
): Promise<{ note: Note | null; error: Error | null }> {
  try {
    // Validate payload
    if (!payload.title || payload.title.trim().length === 0) {
      throw new Error('Note title is required');
    }
    if (!payload.content || payload.content.trim().length === 0) {
      throw new Error('Note content is required');
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Creating note with:', {
      title: payload.title,
      content: payload.content,
      raw_content: payload.raw_content,
    });

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          title: payload.title,
          original_formatted_text: payload.content,
          raw_text: payload.raw_content || '',
          is_starred: payload.is_starred || false,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Note created successfully:', data);

    const displayContent = data.edited_text || 
                          data.original_formatted_text || 
                          data.content || 
                          '';
    
    const displayRawContent = data.raw_text || 
                             data.raw_content || 
                             '';

    const note: Note = {
      id: data.id,
      title: data.title,
      content: displayContent,
      raw_content: displayRawContent,
      is_starred: data.is_starred || false,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      original_formatted_text: data.original_formatted_text,
      raw_text: data.raw_text,
      edited_text: data.edited_text,
      feedback_helpful: data.feedback_helpful,
      feedback_reasons: data.feedback_reasons,
    };

    return { note, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error creating note:', error);
    return { note: null, error };
  }
}

/**
 * Update an existing note
 */
export async function updateNote(
  noteId: string,
  payload: UpdateNotePayload
): Promise<{ note: Note | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.content !== undefined && { content: payload.content }),
        ...(payload.raw_content !== undefined && {
          raw_content: payload.raw_content,
        }),
        ...(payload.is_starred !== undefined && {
          is_starred: payload.is_starred,
        }),
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const note: Note = {
      id: data.id,
      title: data.title,
      content: data.content,
      raw_content: data.raw_content,
      is_starred: data.is_starred || false,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { note, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error updating note:', error);
    return { note: null, error };
  }
}

/**
 * Toggle star status of a note
 */
export async function toggleNoteStar(
  noteId: string,
  isStarred: boolean
): Promise<{ note: Note | null; error: Error | null }> {
  return updateNote(noteId, { is_starred: !isStarred });
}

/**
 * Delete a note
 */
export async function deleteNote(
  noteId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error deleting note:', error);
    return { success: false, error };
  }
}

/**
 * Search notes by title or content
 */
export async function searchNotes(
  query: string
): Promise<{ notes: Note[]; error: Error | null }> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,original_formatted_text.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const notes: Note[] = (data || []).map((note: any) => {
      const displayContent = note.edited_text || 
                            note.original_formatted_text || 
                            note.content || 
                            '';
      
      const displayRawContent = note.raw_text || 
                               note.raw_content || 
                               '';

      return {
        id: note.id,
        title: note.title,
        content: displayContent,
        raw_content: displayRawContent,
        is_starred: note.is_starred || false,
        user_id: note.user_id,
        created_at: note.created_at,
        updated_at: note.updated_at,
        original_formatted_text: note.original_formatted_text,
        raw_text: note.raw_text,
        edited_text: note.edited_text,
        feedback_helpful: note.feedback_helpful,
        feedback_reasons: note.feedback_reasons,
      };
    });

    return { notes, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error searching notes:', error);
    return { notes: [], error };
  }
}

/**
 * Get starred notes
 */
export async function getStarredNotes(): Promise<{
  notes: Note[];
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
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_starred', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const notes: Note[] = (data || []).map((note: any) => {
      const displayContent = note.edited_text || 
                            note.original_formatted_text || 
                            note.content || 
                            '';
      
      const displayRawContent = note.raw_text || 
                               note.raw_content || 
                               '';

      return {
        id: note.id,
        title: note.title,
        content: displayContent,
        raw_content: displayRawContent,
        is_starred: note.is_starred || false,
        user_id: note.user_id,
        created_at: note.created_at,
        updated_at: note.updated_at,
        original_formatted_text: note.original_formatted_text,
        raw_text: note.raw_text,
        edited_text: note.edited_text,
        feedback_helpful: note.feedback_helpful,
        feedback_reasons: note.feedback_reasons,
      };
    });

    return { notes, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Error fetching starred notes:', error);
    return { notes: [], error };
  }
}

/**
 * Get the count of notes for the current user
 */
export async function getNotesCount(): Promise<{
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
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return { count, error: error as Error | null };
  } catch (error) {
    return { count: null, error: error as Error };
  }
}
