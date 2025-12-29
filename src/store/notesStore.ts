import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Note {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  updated_at: string;
  user_id: string;
}

interface NotesState {
  notes: Note[];
  loading: boolean;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string, folderId?: string) => Promise<Note | null>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Promise<Note | null>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  fetchNotes: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      set({ notes: data || [] });
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      set({ loading: false });
    }
  },
  createNote: async (title, content, folderId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .insert([
          { 
            title, 
            content, 
            folder_id: folderId || null,
            user_id: user.id 
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      set((state) => ({ notes: [data, ...state.notes] }));
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  },
  updateNote: async (id, title, content) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
            title, 
            content, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) throw error;
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n)),
      }));
    } catch (error) {
      console.error('Error updating note:', error);
    }
  },
  deleteNote: async (id) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: true })
        .eq('id', id);
      
      if (error) throw error;
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  },
  getNote: async (id) => {
    const existingNote = get().notes.find((n) => n.id === id);
    if (existingNote) return existingNote;

    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting note:', error);
        return null;
    }
  }
}));
