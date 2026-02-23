
// Cloudflare Pages Function to handle D1 interactions

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: any;
  error?: string;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = unknown>(query: string): Promise<D1Result<T>>;
}

type Params<P extends string = any> = Record<P, string | string[]>;

interface EventContext<Env, P extends string, Data> {
  request: Request;
  functionPath: string;
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
  env: Env;
  params: Params<P>;
  data: Data;
}

type PagesFunction<Env = unknown, P extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> = (
  context: EventContext<Env, P, Data>
) => Response | Promise<Response>;

interface Env {
  DB: D1Database;
}

// Helper to extract user context from request (replace with real auth)
const getUserId = (request: Request): string => {
  // TODO: Replace with real authentication (JWT, session, etc.)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return 'user_123'; // Temporary fallback for demo
};

// Validation helpers
const validateString = (value: any, name: string, minLength = 1): string => {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new Error(`Invalid ${name}: must be a non-empty string`);
  }
  return value.trim();
};

const validateObject = (value: any, name: string): any => {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Invalid ${name}: must be an object`);
  }
  return value;
};

const validateArray = (value: any, name: string, maxLength = 1000): any[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${name}: must be an array`);
  }
  if (value.length > maxLength) {
    throw new Error(`${name} exceeds maximum length of ${maxLength}`);
  }
  return value;
};

const validateEmbedding = (embedding: any): number[] => {
  const arr = validateArray(embedding, 'embedding', 10000);
  if (!arr.every(x => typeof x === 'number')) {
    throw new Error('Invalid embedding: all elements must be numbers');
  }
  if (arr.length === 0) {
    throw new Error('Invalid embedding: must not be empty');
  }
  return arr;
};

// Safe JSON parsing with error handling
const parseJSON = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON in request body');
  }
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', ''); 
  const method = request.method;
  
  try {
    // Validate request method
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }
    
    const userId = getUserId(request);
    // --- Documents Endpoints ---
    if (path === 'documents') {
      if (method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY last_modified DESC').bind(userId).all();
          return Response.json(results);
        } catch (dbError) {
          console.error('[API] Database error fetching documents:', dbError);
          return Response.json({ error: 'Failed to fetch documents' }, { status: 500 });
        }
      }
      
      if (method === 'POST') {
        try {
          const body = parseJSON(await request.text());
          const id = validateString(body.id, 'document id');
          const title = validateString(body.title, 'title');
          const universityId = validateString(body.universityId, 'universityId');
          const content = body.content || '';
          const status = body.status || 'Draft';
          const progress = typeof body.progress === 'number' ? body.progress : 0;
          
          await env.DB.prepare(`
            INSERT INTO documents (id, title, university_id, content, last_modified, status, progress, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title=excluded.title,
              university_id=excluded.university_id,
              content=excluded.content,
              last_modified=excluded.last_modified,
              status=excluded.status,
              progress=excluded.progress
          `).bind(id, title, universityId, content, Date.now(), status, progress, userId).run();
          return Response.json({ success: true });
        } catch (error: any) {
          console.error('[API] Error creating document:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }

      // PATCH for efficient partial updates (e.g. rename)
      if (method === 'PATCH') {
        try {
          const id = validateString(url.searchParams.get('id') || '', 'id parameter');
          const body = parseJSON(await request.text());

          const updates: string[] = [];
          const values: any[] = [];

          if (body.title !== undefined) { 
            updates.push('title = ?'); 
            values.push(validateString(body.title, 'title')); 
          }
          if (body.status !== undefined) { 
            updates.push('status = ?'); 
            values.push(body.status); 
          }
          if (body.progress !== undefined) { 
            updates.push('progress = ?'); 
            values.push(body.progress); 
          }
          if (body.content !== undefined) { 
            updates.push('content = ?'); 
            values.push(body.content); 
          }
          
          // Always update modified time
          updates.push('last_modified = ?');
          values.push(Date.now());

          if (updates.length > 0) {
            values.push(id);
            values.push(userId);
            const sql = `UPDATE documents SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
            await env.DB.prepare(sql).bind(...values).run();
          }
          return Response.json({ success: true });
        } catch (error: any) {
          console.error('[API] Error patching document:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }
      
      if (method === 'DELETE') {
        try {
          const id = validateString(url.searchParams.get('id') || '', 'id parameter');
          await env.DB.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?').bind(id, userId).run();
          return Response.json({ success: true });
        } catch (error: any) {
          console.error('[API] Error deleting document:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }
    }

    // --- Library Endpoints ---
    if (path === 'library') {
      if (method === 'GET') {
        try {
          const { results } = await env.DB.prepare('SELECT * FROM library_items WHERE user_id = ? ORDER BY added_date DESC').bind(userId).all();
          return Response.json(results);
        } catch (dbError) {
          console.error('[API] Database error fetching library:', dbError);
          return Response.json({ error: 'Failed to fetch library' }, { status: 500 });
        }
      }

      if (method === 'POST') {
        try {
          const body = parseJSON(await request.text());
          const id = validateString(body.id, 'item id');
          const type = body.type || 'other';
          const title = validateString(body.title, 'title');
          const author = body.author || 'Unknown';
          const year = body.year || 'N/A';
          const source = body.source || '';
          const formatted = body.formatted || '';
          const tags = validateArray(body.tags || [], 'tags', 100);
          const embedding = body.embedding ? validateEmbedding(body.embedding) : null;
          
          const tagsJson = JSON.stringify(tags);
          const embeddingJson = embedding ? JSON.stringify(embedding) : null;
          
          await env.DB.prepare(`
            INSERT INTO library_items (id, type, author, year, title, source, formatted, tags, pdf_url, read_status, is_favorite, added_date, folder_id, raw, full_text, embedding, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              read_status=excluded.read_status,
              is_favorite=excluded.is_favorite,
              folder_id=excluded.folder_id,
              tags=excluded.tags,
              embedding=excluded.embedding
          `).bind(
            id, type, author, year, title, source, formatted, 
            tagsJson, body.pdfUrl || null, body.readStatus || 'unread', body.isFavorite ? 1 : 0, Date.now(), 
            body.folderId || null, body.raw || '', body.fullText || '', embeddingJson, userId
          ).run();
          return Response.json({ success: true });
        } catch (error: any) {
          console.error('[API] Error adding library item:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }

      if (method === 'PATCH') {
        try {
          const id = validateString(url.searchParams.get('id') || '', 'id parameter');
          const body = parseJSON(await request.text());

          const updates: string[] = [];
          const values: any[] = [];

          if (body.readStatus !== undefined) { updates.push('read_status = ?'); values.push(body.readStatus); }
          if (body.isFavorite !== undefined) { updates.push('is_favorite = ?'); values.push(body.isFavorite ? 1 : 0); }
          if (body.folderId !== undefined) { updates.push('folder_id = ?'); values.push(body.folderId); }
          if (body.tags !== undefined) { 
            const tags = validateArray(body.tags, 'tags', 100);
            updates.push('tags = ?'); 
            values.push(JSON.stringify(tags)); 
          }

          if (updates.length > 0) {
            values.push(id);
            values.push(userId);
            const sql = `UPDATE library_items SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
            await env.DB.prepare(sql).bind(...values).run();
          }
          return Response.json({ success: true });
        } catch (error: any) {
          console.error('[API] Error updating library item:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }

      if (method === 'DELETE') {
        try {
          const id = validateString(url.searchParams.get('id') || '', 'id parameter');
          await env.DB.prepare('DELETE FROM library_items WHERE id = ? AND user_id = ?').bind(id, userId).run();
          return Response.json({ success: true });
        } catch (error: any) {
          console.error('[API] Error deleting library item:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }
    }

    // --- Annotations Endpoints ---
    if (path === 'annotations') {
      if (method === 'GET') {
        try {
          const paperId = validateString(url.searchParams.get('paperId') || '', 'paperId parameter');
          const { results } = await env.DB.prepare('SELECT * FROM annotations WHERE paper_id = ? AND user_id = ?').bind(paperId, userId).all();
          return Response.json(results);
        } catch (error: any) {
          console.error('[API] Error fetching annotations:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }
      
      if (method === 'POST') {
        try {
          const body = parseJSON(await request.text());
          const id = validateString(body.id, 'annotation id');
          const paperId = validateString(body.paperId, 'paperId');
          const type = validateString(body.type, 'type');
          const content = validateString(body.content, 'content');
          const color = body.color || '#FFF000';
          const position = validateObject(body.position, 'position');
          const status = body.status || 'active';
          
          const positionJson = JSON.stringify(position);
          
          await env.DB.prepare(`
            INSERT INTO annotations (id, paper_id, user_id, type, content, color, position, created_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET content=excluded.content
          `).bind(id, paperId, userId, type, content, color, positionJson, Date.now(), status).run();
          return Response.json({ success: true });
        } catch (error: any) {
          console.error('[API] Error creating annotation:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }

      if (method === 'DELETE') {
        try {
          const id = validateString(url.searchParams.get('id') || '', 'id parameter');
          await env.DB.prepare('DELETE FROM annotations WHERE id = ? AND user_id = ?').bind(id, userId).run();
          return Response.json({ success: true });
        } catch (error: any) {
          console.error('[API] Error deleting annotation:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }
    }

    // --- Semantic Search ---
    if (path === 'search/semantic') {
      if (method === 'POST') {
        try {
          const body = parseJSON(await request.text());
          const embedding = validateEmbedding(body.embedding);
          
          const { results: vectors } = await env.DB.prepare("SELECT id, embedding FROM library_items WHERE embedding IS NOT NULL AND user_id = ?").bind(userId).all();
          
          if (!vectors || vectors.length === 0) return Response.json([]);

          const scores: { id: string, similarity: number }[] = [];
          
          for (const item of vectors as any[]) {
            try {
              const itemVec = JSON.parse(item.embedding);
              // Validate embedding dimensions match
              if (!Array.isArray(itemVec) || itemVec.length !== embedding.length) {
                console.warn('[API] Skipping embedding with mismatched dimensions');
                continue;
              }
              const similarity = cosineSimilarity(embedding, itemVec);
              if (similarity >= 0) { // Only include valid similarities
                scores.push({ id: item.id, similarity });
              }
            } catch (e) { 
              console.warn('[API] Error parsing embedding:', e);
              continue; 
            }
          }
          
          scores.sort((a, b) => b.similarity - a.similarity);
          const topIds = scores.slice(0, 10);
          
          if (topIds.length === 0) return Response.json([]);

          const placeholders = topIds.map(() => '?').join(',');
          const { results: items } = await env.DB.prepare(`SELECT * FROM library_items WHERE id IN (${placeholders})`)
            .bind(...topIds.map(x => x.id))
            .all();

          const enrichedResults = items.map((item: any) => ({
            ...item,
            similarity: topIds.find(x => x.id === item.id)?.similarity || 0
          })).sort((a, b) => b.similarity - a.similarity);

          return Response.json(enrichedResults);
        } catch (error: any) {
          console.error('[API] Error in semantic search:', error.message);
          return Response.json({ error: error.message }, { status: 400 });
        }
      }
    }

    return Response.json({ error: 'Not Found' }, { status: 404 });

  } catch (error: any) {
    console.error('[API] Unhandled error:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    return Response.json({ error: message }, { status });
  }
};

function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    if (vecA.length !== vecB.length) return 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}
