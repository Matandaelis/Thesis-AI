
import { Document, LibraryItem, Annotation } from '@/types';

// Local storage fallback keys
const LOCAL_DOCS_KEY = 'thesisai_documents';

const getLocalDocs = (): Document[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_DOCS_KEY);
    return stored ? JSON.parse(stored).map((d: any) => ({...d, lastModified: new Date(d.lastModified)})) : [];
  } catch (e) { return []; }
};

const saveLocalDocs = (docs: Document[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
};

export const dbService = {
  // --- Documents ---
  
  async getDocuments(): Promise<Document[]> {
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('API Error');
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
      console.warn('D1 API fetch failed, falling back to local storage.');
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
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      return doc;
    } catch (error) {
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
      await fetch(`/api/documents?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
    } catch(e) { console.error("Failed to patch document title", e); }
  },

  async deleteDocument(id: string): Promise<void> {
    const docs = getLocalDocs().filter(d => d.id !== id);
    saveLocalDocs(docs);
    try {
        await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    } catch(e) {}
  },

  // --- Library ---

  async getLibrary(): Promise<LibraryItem[]> {
    try {
      const res = await fetch('/api/library');
      if (!res.ok) throw new Error('API Error');
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
      return [];
    }
  },

  async addToLibrary(item: LibraryItem): Promise<void> {
    try {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (e) {}
  },

  async updateLibraryItem(id: string, updates: Partial<LibraryItem>): Promise<void> {
    // Efficient PATCH update
    try {
        await fetch(`/api/library?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    } catch (e) {
        console.error("Failed to patch library item", e);
    }
  },
  
  async deleteLibraryItem(id: string): Promise<void> {
      try {
        await fetch(`/api/library?id=${id}`, { method: 'DELETE' });
      } catch (e) {}
  },

  // --- Semantic Search ---

  async searchSimilarLibraryItems(queryEmbedding: number[]): Promise<LibraryItem[]> {
      try {
          const res = await fetch('/api/search/semantic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ embedding: queryEmbedding })
          });
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
      } catch (e) {
          console.error("Semantic search error", e);
          return [];
      }
  },

  // --- Annotations ---

  async getAnnotations(paperId: string): Promise<Annotation[]> {
    try {
        const res = await fetch(`/api/annotations?paperId=${paperId}`);
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
    } catch (e) { return []; }
  },

  async saveAnnotation(annotation: Annotation): Promise<void> {
    try {
        await fetch('/api/annotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(annotation)
        });
    } catch (e) {}
  },

  async deleteAnnotation(id: string): Promise<void> {
    try {
        await fetch(`/api/annotations?id=${id}`, { method: 'DELETE' });
    } catch(e) {}
  }
};
