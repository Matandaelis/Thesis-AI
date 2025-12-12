
import { supabase } from '@/lib/supabase';
import { Document, LibraryItem } from '@/types';

const DEMO_USER_ID = 'user_123'; 
const LOCAL_DOCS_KEY = 'thesisai_documents';
const LOCAL_LIB_KEY = 'thesisai_library';

// Helper to get local data safely
const getLocalDocs = (): Document[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_DOCS_KEY);
    return stored ? JSON.parse(stored).map((d: any) => ({...d, lastModified: new Date(d.lastModified)})) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalDocs = (docs: Document[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error("Local storage save failed", e);
  }
};

const getLocalLib = (): LibraryItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_LIB_KEY);
    return stored ? JSON.parse(stored).map((i: any) => ({...i, addedDate: new Date(i.addedDate)})) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalLib = (items: LibraryItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_LIB_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Local storage save failed", e);
  }
};

export const dbService = {
  // --- Documents ---
  
  async getDocuments(): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('last_modified', { ascending: false });

      if (error) throw error;

      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        universityId: d.university_id,
        content: d.content,
        lastModified: new Date(d.last_modified),
        status: d.status,
        progress: d.progress
      }));
    } catch (error) {
      console.warn('Supabase fetch failed (using local fallback):', JSON.stringify(error));
      return getLocalDocs();
    }
  },

  async saveDocument(doc: Document): Promise<Document | null> {
    // 1. Optimistic Local Save
    const docs = getLocalDocs();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.unshift(doc);
    }
    saveLocalDocs(docs);

    // 2. Try Remote Save
    try {
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

      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        universityId: data.university_id,
        content: data.content,
        lastModified: new Date(data.last_modified),
        status: data.status,
        progress: data.progress
      };
    } catch (error) {
      // Return local doc if remote fails
      return doc;
    }
  },

  async renameDocument(id: string, title: string): Promise<void> {
    // Local
    const docs = getLocalDocs();
    const doc = docs.find(d => d.id === id);
    if (doc) {
      doc.title = title;
      doc.lastModified = new Date();
      saveLocalDocs(docs);
    }

    // Remote
    try {
      await supabase
        .from('documents')
        .update({ title: title, last_modified: new Date().toISOString() })
        .eq('id', id);
    } catch (e) {}
  },

  async deleteDocument(id: string): Promise<void> {
    // Local
    const docs = getLocalDocs().filter(d => d.id !== id);
    saveLocalDocs(docs);

    // Remote
    try {
      await supabase
        .from('documents')
        .delete()
        .eq('id', id);
    } catch (e) {}
  },

  // --- Library ---

  async getLibrary(): Promise<LibraryItem[]> {
    try {
      const { data, error } = await supabase
        .from('library_items')
        .select('*')
        .order('added_date', { ascending: false });

      if (error) throw error;

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
    } catch (error) {
      console.warn('Supabase library fetch failed (using local fallback):', JSON.stringify(error));
      return getLocalLib();
    }
  },

  async addToLibrary(item: LibraryItem): Promise<void> {
    // Local
    const items = getLocalLib();
    if (!items.some(i => i.id === item.id)) {
        items.unshift(item);
        saveLocalLib(items);
    }

    // Remote
    try {
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
      await supabase.from('library_items').upsert(payload);
    } catch (e) {}
  },

  async updateLibraryItem(id: string, updates: Partial<LibraryItem>): Promise<void> {
    // Local
    const items = getLocalLib();
    const item = items.find(i => i.id === id);
    if (item) {
        Object.assign(item, updates);
        saveLocalLib(items);
    }

    // Remote
    try {
      // Map partial camelCase updates to snake_case
      const payload: any = {};
      if (updates.readStatus) payload.read_status = updates.readStatus;
      if (updates.isFavorite !== undefined) payload.is_favorite = updates.isFavorite;
      
      if (Object.keys(payload).length > 0) {
        await supabase
            .from('library_items')
            .update(payload)
            .eq('id', id);
      }
    } catch (e) {}
  },
  
  async deleteLibraryItem(id: string): Promise<void> {
      // Local
      const items = getLocalLib().filter(i => i.id !== id);
      saveLocalLib(items);

      // Remote
      try {
        await supabase.from('library_items').delete().eq('id', id);
      } catch (e) {}
  }
};
