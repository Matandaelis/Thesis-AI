
import { supabase } from '@/lib/supabase';
import { Document, LibraryItem, Annotation } from '@/types';

const DEMO_USER_ID = 'user_123'; 
const LOCAL_DOCS_KEY = 'thesisai_documents';
const LOCAL_LIB_KEY = 'thesisai_library';
const LOCAL_ANNOTATIONS_KEY = 'thesisai_annotations';

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

const getLocalAnnotations = (): Annotation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_ANNOTATIONS_KEY);
    return stored ? JSON.parse(stored).map((a: any) => ({...a, createdAt: new Date(a.createdAt)})) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalAnnotations = (items: Annotation[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_ANNOTATIONS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Local storage save failed", e);
  }
};

// Cosine similarity for local fallback
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
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
        raw: i.raw || '',
        fullText: i.full_text || '',
        embedding: i.embedding || undefined
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
        full_text: item.fullText,
        embedding: item.embedding,
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
      if (updates.embedding !== undefined) payload.embedding = updates.embedding;
      
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
  },

  // --- Semantic Search ---

  async searchSimilarLibraryItems(queryEmbedding: number[]): Promise<LibraryItem[]> {
      // 1. Try Remote RPC (pgvector)
      try {
          const { data, error } = await supabase.rpc('match_library_items', {
              query_embedding: queryEmbedding,
              match_threshold: 0.5,
              match_count: 10
          });

          if (!error && data) {
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
                  raw: i.raw || '',
                  fullText: i.full_text,
                  similarity: i.similarity
              }));
          }
      } catch (e) {
          console.warn("RPC vector search failed, falling back to local cosine similarity.", e);
      }

      // 2. Local Fallback (Brute force for demo purposes)
      const items = getLocalLib();
      const scoredItems = items.map(item => {
          if (!item.embedding) return { ...item, similarity: 0 };
          return { ...item, similarity: cosineSimilarity(queryEmbedding, item.embedding) };
      });

      // Filter and sort
      return scoredItems
          .filter(item => (item.similarity || 0) > 0.3)
          .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
          .slice(0, 10);
  },

  // --- Annotations ---

  async getAnnotations(paperId: string): Promise<Annotation[]> {
    // Local fallback priority for demo speed
    const all = getLocalAnnotations();
    const filtered = all.filter(a => a.paperId === paperId);
    
    // Attempt remote fetch in background (mock implementation would go here)
    // For now, rely on local state for speed in this demo
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async saveAnnotation(annotation: Annotation): Promise<void> {
    const all = getLocalAnnotations();
    const index = all.findIndex(a => a.id === annotation.id);
    
    if (index >= 0) {
        all[index] = annotation;
    } else {
        all.push(annotation);
    }
    saveLocalAnnotations(all);

    // Remote Sync (Fire and forget)
    try {
        const payload = {
            id: annotation.id,
            paper_id: annotation.paperId,
            user_id: annotation.userId,
            type: annotation.type,
            content: annotation.content,
            color: annotation.color,
            position: annotation.position,
            created_at: annotation.createdAt.toISOString(),
            status: annotation.status
        };
        await supabase.from('annotations').upsert(payload);
    } catch (e) {
        // Silent fail for offline/demo
    }
  },

  async deleteAnnotation(id: string): Promise<void> {
    const all = getLocalAnnotations().filter(a => a.id !== id);
    saveLocalAnnotations(all);
    
    try {
        await supabase.from('annotations').delete().eq('id', id);
    } catch(e) {}
  }
};
