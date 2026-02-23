
import { Document, LibraryItem, Annotation } from '@/types';

// Local storage fallback keys
const LOCAL_DOCS_KEY = 'thesisai_documents';

// Configuration
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const getLocalDocs = (): Document[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_DOCS_KEY);
    return stored ? JSON.parse(stored).map((d: any) => ({...d, lastModified: new Date(d.lastModified)})) : [];
  } catch (e) { 
    console.error('[dbService] Error reading local documents:', e);
    return []; 
  }
};

const saveLocalDocs = (docs: Document[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error('[dbService] Error saving local documents:', e);
  }
};

// Helper to fetch with timeout and retry logic
const fetchWithRetry = async (
  url: string, 
  options?: RequestInit, 
  retries = MAX_RETRIES
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Retry on network errors (not on client errors like 400)
    if (retries > 0 && (error.name === 'AbortError' || !error.status)) {
      console.warn(`[dbService] Request failed, retrying... (${retries} retries left)`, error.message);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
};

export const dbService = {
  // --- Documents ---
  
  async getDocuments(): Promise<Document[]> {
    try {
      const res = await fetchWithRetry('/api/documents');
      if (!res.ok) throw new Error(`API returned ${res.status}: ${res.statusText}`);
      const data = await res.json();
      
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
      console.error('[dbService] Failed to fetch documents:', error instanceof Error ? error.message : error);
      console.warn('[dbService] Falling back to local storage');
      return getLocalDocs();
    }
  },

  async saveDocument(doc: Document): Promise<Document | null> {
    // 1. Optimistic Local Save
    const docs = getLocalDocs();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) docs[index] = doc; else docs.unshift(doc);
    saveLocalDocs(docs);

    // 2. Remote Save via API
    try {
      const res = await fetchWithRetry('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      if (!res.ok) throw new Error(`Failed to save document: ${res.statusText}`);
      return doc;
    } catch (error) {
      console.error('[dbService] Error saving document remotely:', error instanceof Error ? error.message : error);
      return doc;
    }
  },

  async renameDocument(id: string, title: string): Promise<void> {
    // Local Update
    const docs = getLocalDocs();
    const doc = docs.find(d => d.id === id);
    if (doc) {
      doc.title = title;
      doc.lastModified = new Date();
      saveLocalDocs(docs);
    }

    // Remote Patch
    try {
      const res = await fetchWithRetry(`/api/documents?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error(`Failed to rename document: ${res.statusText}`);
    } catch(error) { 
      console.error("[dbService] Failed to patch document title", error instanceof Error ? error.message : error); 
    }
  },

  async deleteDocument(id: string): Promise<void> {
    const docs = getLocalDocs().filter(d => d.id !== id);
    saveLocalDocs(docs);
    try {
      const res = await fetchWithRetry(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete document: ${res.statusText}`);
    } catch(error) {
      console.error('[dbService] Failed to delete document:', error instanceof Error ? error.message : error);
    }
  },

  // --- Library ---

  async getLibrary(): Promise<LibraryItem[]> {
    try {
      const res = await fetchWithRetry('/api/library');
      if (!res.ok) throw new Error(`Failed to fetch library: ${res.statusText}`);
      const data = await res.json();

      return data.map((i: any) => ({
        id: i.id,
        type: i.type,
        author: i.author,
        year: i.year,
        title: i.title,
        source: i.source,
        formatted: i.formatted,
        tags: i.tags ? JSON.parse(i.tags) : [],
        pdfUrl: i.pdf_url,
        readStatus: i.read_status,
        isFavorite: Boolean(i.is_favorite),
        addedDate: new Date(i.added_date),
        folderId: i.folder_id,
        raw: i.raw || '',
        fullText: i.full_text || '',
        embedding: i.embedding ? JSON.parse(i.embedding) : undefined
      }));
    } catch (error) {
      console.error('[dbService] Failed to fetch library:', error instanceof Error ? error.message : error);
      return [];
    }
  },

  async addToLibrary(item: LibraryItem): Promise<void> {
    try {
      const res = await fetchWithRetry('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error(`Failed to add library item: ${res.statusText}`);
    } catch (error) {
      console.error('[dbService] Failed to add library item:', error instanceof Error ? error.message : error);
    }
  },

  async updateLibraryItem(id: string, updates: Partial<LibraryItem>): Promise<void> {
    // Efficient PATCH update
    try {
      const res = await fetchWithRetry(`/api/library?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(`Failed to update library item: ${res.statusText}`);
    } catch (error) {
      console.error("[dbService] Failed to update library item", error instanceof Error ? error.message : error);
    }
  },
  
  async deleteLibraryItem(id: string): Promise<void> {
    try {
      const res = await fetchWithRetry(`/api/library?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete library item: ${res.statusText}`);
    } catch (error) {
      console.error('[dbService] Failed to delete library item:', error instanceof Error ? error.message : error);
    }
  },

  // --- Semantic Search ---

  async searchSimilarLibraryItems(queryEmbedding: number[]): Promise<LibraryItem[]> {
    try {
      const res = await fetchWithRetry('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding: queryEmbedding })
      });
      if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
      const data = await res.json();
      
      return data.map((i: any) => ({
        id: i.id,
        type: i.type,
        author: i.author,
        year: i.year,
        title: i.title,
        source: i.source,
        formatted: i.formatted,
        tags: i.tags ? JSON.parse(i.tags) : [],
        pdfUrl: i.pdf_url,
        readStatus: i.read_status,
        isFavorite: Boolean(i.is_favorite),
        addedDate: new Date(i.added_date),
        folderId: i.folder_id,
        raw: i.raw || '',
        fullText: i.full_text,
        similarity: i.similarity
      }));
    } catch (error) {
      console.error("[dbService] Semantic search error", error instanceof Error ? error.message : error);
      return [];
    }
  },

  // --- Annotations ---

  async getAnnotations(paperId: string): Promise<Annotation[]> {
    try {
      const res = await fetchWithRetry(`/api/annotations?paperId=${paperId}`);
      if (!res.ok) throw new Error(`Failed to fetch annotations: ${res.statusText}`);
      const data = await res.json();
      return data.map((a: any) => ({
        id: a.id,
        paperId: a.paper_id,
        userId: a.user_id,
        type: a.type,
        content: a.content,
        color: a.color,
        position: JSON.parse(a.position),
        createdAt: new Date(a.created_at),
        status: a.status
      }));
    } catch (error) { 
      console.error('[dbService] Failed to fetch annotations:', error instanceof Error ? error.message : error);
      return []; 
    }
  },

  async saveAnnotation(annotation: Annotation): Promise<void> {
    try {
      const res = await fetchWithRetry('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation)
      });
      if (!res.ok) throw new Error(`Failed to save annotation: ${res.statusText}`);
    } catch (error) {
      console.error('[dbService] Failed to save annotation:', error instanceof Error ? error.message : error);
    }
  },

  async deleteAnnotation(id: string): Promise<void> {
    try {
      const res = await fetchWithRetry(`/api/annotations?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete annotation: ${res.statusText}`);
    } catch(error) {
      console.error('[dbService] Failed to delete annotation:', error instanceof Error ? error.message : error);
    }
  }
};
