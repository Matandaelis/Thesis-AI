import { supabase } from '@/lib/supabase';
import { Document, LibraryItem } from '@/types';

// Hardcoded user ID for this phase since we haven't built full Auth UI yet
const DEMO_USER_ID = 'user_123'; 

export const dbService = {
  // --- Documents ---
  
  async getDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('last_modified', { ascending: false });

    if (error) {
      console.error('Error fetching docs:', error);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      universityId: d.university_id,
      content: d.content,
      lastModified: new Date(d.last_modified),
      status: d.status,
      progress: d.progress
    }));
  },

  async saveDocument(doc: Document): Promise<Document | null> {
    const payload = {
      id: doc.id,
      title: doc.title,
      university_id: doc.universityId,
      content: doc.content,
      last_modified: new Date().toISOString(),
      status: doc.status,
      progress: doc.progress,
      user_id: DEMO_USER_ID
    };

    const { data, error } = await supabase
      .from('documents')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error saving doc:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      universityId: data.university_id,
      content: data.content,
      lastModified: new Date(data.last_modified),
      status: data.status,
      progress: data.progress
    };
  },

  // --- Library ---

  async getLibrary(): Promise<LibraryItem[]> {
    const { data, error } = await supabase
      .from('library_items')
      .select('*')
      .order('added_date', { ascending: false });

    if (error) {
      console.error('Error fetching library:', error);
      return [];
    }

    return data.map((i: any) => ({
      id: i.id,
      type: i.type,
      author: i.author,
      year: i.year,
      title: i.title,
      source: i.source,
      formatted: i.formatted,
      tags: i.tags || [],
      pdfUrl: i.pdf_url,
      readStatus: i.read_status,
      isFavorite: i.is_favorite,
      addedDate: new Date(i.added_date),
      folderId: i.folder_id,
      raw: i.raw || ''
    }));
  },

  async addToLibrary(item: LibraryItem): Promise<void> {
    const payload = {
      id: item.id,
      type: item.type,
      author: item.author,
      year: item.year,
      title: item.title,
      source: item.source,
      formatted: item.formatted,
      tags: item.tags,
      pdf_url: item.pdfUrl,
      read_status: item.readStatus,
      is_favorite: item.isFavorite,
      added_date: item.addedDate.toISOString(),
      folder_id: item.folderId,
      raw: item.raw,
      user_id: DEMO_USER_ID
    };

    const { error } = await supabase.from('library_items').upsert(payload);
    if (error) console.error('Error adding to library:', error);
  },

  async updateLibraryItem(id: string, updates: Partial<LibraryItem>): Promise<void> {
    // Map partial camelCase updates to snake_case
    const payload: any = {};
    if (updates.readStatus) payload.read_status = updates.readStatus;
    if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite;
    
    if (Object.keys(payload).length === 0) return;

    const { error } = await supabase
        .from('library_items')
        .update(payload)
        .eq('id', id);
        
    if (error) console.error('Error updating item:', error);
  },
  
  async deleteLibraryItem(id: string): Promise<void> {
      const { error } = await supabase.from('library_items').delete().eq('id', id);
      if (error) console.error('Error deleting item:', error);
  }
};