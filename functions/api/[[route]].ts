
// Cloudflare Pages Function to handle D1 interactions

// Type definitions for Cloudflare Pages and D1 to satisfy TypeScript compiler
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', ''); // Remove /api/ prefix
  const method = request.method;

  try {
    // --- Documents Endpoints ---
    if (path === 'documents') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM documents ORDER BY last_modified DESC').all();
        return Response.json(results);
      }
      
      if (method === 'POST') {
        const body: any = await request.json();
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
        `).bind(
          body.id, body.title, body.universityId, body.content, 
          Date.now(), body.status, body.progress, 'user_123'
        ).run();
        return Response.json({ success: true });
      }
      
      if (method === 'DELETE') {
        const id = url.searchParams.get('id');
        await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
        return Response.json({ success: true });
      }
    }

    // --- Library Endpoints ---
    if (path === 'library') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM library_items ORDER BY added_date DESC').all();
        return Response.json(results);
      }

      if (method === 'POST') {
        const body: any = await request.json();
        // Convert arrays/objects to strings for SQLite
        const tags = JSON.stringify(body.tags || []);
        const embedding = body.embedding ? JSON.stringify(body.embedding) : null;
        
        await env.DB.prepare(`
          INSERT INTO library_items (id, type, author, year, title, source, formatted, tags, pdf_url, read_status, is_favorite, added_date, folder_id, raw, full_text, embedding, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            read_status=excluded.read_status,
            is_favorite=excluded.is_favorite,
            folder_id=excluded.folder_id,
            tags=excluded.tags
        `).bind(
          body.id, body.type, body.author, body.year, body.title, body.source, body.formatted, 
          tags, body.pdfUrl, body.readStatus, body.isFavorite ? 1 : 0, Date.now(), 
          body.folderId, body.raw, body.fullText, embedding, 'user_123'
        ).run();
        return Response.json({ success: true });
      }

      if (method === 'DELETE') {
        const id = url.searchParams.get('id');
        await env.DB.prepare('DELETE FROM library_items WHERE id = ?').bind(id).run();
        return Response.json({ success: true });
      }

      if (method === 'PATCH') {
        const id = url.searchParams.get('id');
        if (!id) return new Response('Missing ID', { status: 400 });

        const body: any = await request.json();
        const updates: string[] = [];
        const values: any[] = [];

        // Mapping and Validation
        const map: Record<string, string> = {
            type: 'type',
            author: 'author',
            year: 'year',
            title: 'title',
            source: 'source',
            formatted: 'formatted',
            pdfUrl: 'pdf_url',
            readStatus: 'read_status',
            isFavorite: 'is_favorite',
            folderId: 'folder_id',
            raw: 'raw',
            fullText: 'full_text',
        };

        for (const [key, val] of Object.entries(body)) {
            if (map[key]) {
                updates.push(`${map[key]} = ?`);
                values.push(key === 'isFavorite' ? (val ? 1 : 0) : val);
            } else if (key === 'tags') {
                updates.push('tags = ?');
                values.push(JSON.stringify(val || []));
            } else if (key === 'embedding') {
                updates.push('embedding = ?');
                values.push(val ? JSON.stringify(val) : null);
            }
        }

        if (updates.length === 0) return Response.json({ success: true }); // Nothing to update

        values.push(id);

        await env.DB.prepare(`UPDATE library_items SET ${updates.join(', ')} WHERE id = ?`)
            .bind(...values)
            .run();

        return Response.json({ success: true });
      }
    }

    // --- Annotations Endpoints ---
    if (path === 'annotations') {
        if (method === 'GET') {
            const paperId = url.searchParams.get('paperId');
            const { results } = await env.DB.prepare('SELECT * FROM annotations WHERE paper_id = ?').bind(paperId).all();
            return Response.json(results);
        }
        
        if (method === 'POST') {
            const body: any = await request.json();
            const position = JSON.stringify(body.position);
            
            await env.DB.prepare(`
                INSERT INTO annotations (id, paper_id, user_id, type, content, color, position, created_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET content=excluded.content
            `).bind(
                body.id, body.paperId, 'user_123', body.type, body.content, body.color,
                position, Date.now(), body.status
            ).run();
            return Response.json({ success: true });
        }

        if (method === 'DELETE') {
            const id = url.searchParams.get('id');
            await env.DB.prepare('DELETE FROM annotations WHERE id = ?').bind(id).run();
            return Response.json({ success: true });
        }
    }

    // --- Semantic Search (Cosine Similarity simulation in SQL/JS) ---
    // Note: D1 supports `vec_` extensions in beta, but for standard SQLite we might fetch and filter in JS if dataset is small
    if (path === 'search/semantic') {
        if (method === 'POST') {
            const { embedding } = await request.json() as any;
            // Fetch all items with embeddings
            const { results } = await env.DB.prepare("SELECT id, title, author, year, source, formatted, tags, pdf_url, read_status, is_favorite, added_date, folder_id, raw, full_text, embedding FROM library_items WHERE embedding IS NOT NULL").all();
            
            // Calculate similarity in the worker (JavaScript)
            const scored = results.map((item: any) => {
                const itemVec = JSON.parse(item.embedding);
                const similarity = cosineSimilarity(embedding, itemVec);
                return { ...item, similarity };
            });
            
            // Sort and slice
            scored.sort((a: any, b: any) => b.similarity - a.similarity);
            return Response.json(scored.slice(0, 10));
        }
    }

    return new Response('Not Found', { status: 404 });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// Vector math helper
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
