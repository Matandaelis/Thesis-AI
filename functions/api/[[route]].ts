
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

const USER_ID = 'user_123'; // Hardcoded for demo, replace with auth context

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', ''); 
  const method = request.method;

  try {
    // --- Documents Endpoints ---
    if (path === 'documents') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY last_modified DESC').bind(USER_ID).all();
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
          Date.now(), body.status, body.progress, USER_ID
        ).run();
        return Response.json({ success: true });
      }

      // PATCH for efficient partial updates (e.g. rename)
      if (method === 'PATCH') {
        const body: any = await request.json();
        const id = url.searchParams.get('id');
        
        if (!id) return new Response('Missing ID', { status: 400 });

        const updates: string[] = [];
        const values: any[] = [];

        if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
        if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
        if (body.progress !== undefined) { updates.push('progress = ?'); values.push(body.progress); }
        if (body.content !== undefined) { updates.push('content = ?'); values.push(body.content); }
        
        // Always update modified time
        updates.push('last_modified = ?');
        values.push(Date.now());

        if (updates.length > 0) {
            values.push(id);
            values.push(USER_ID);
            const sql = `UPDATE documents SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
            await env.DB.prepare(sql).bind(...values).run();
        }
        return Response.json({ success: true });
      }
      
      if (method === 'DELETE') {
        const id = url.searchParams.get('id');
        await env.DB.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?').bind(id, USER_ID).run();
        return Response.json({ success: true });
      }
    }

    // --- Library Endpoints ---
    if (path === 'library') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM library_items WHERE user_id = ? ORDER BY added_date DESC').bind(USER_ID).all();
        return Response.json(results);
      }

      if (method === 'POST') {
        const body: any = await request.json();
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
          body.folderId, body.raw, body.fullText, embedding, USER_ID
        ).run();
        return Response.json({ success: true });
      }

      if (method === 'PATCH') {
        const body: any = await request.json();
        const id = url.searchParams.get('id');
        if (!id) return new Response('Missing ID', { status: 400 });

        const updates: string[] = [];
        const values: any[] = [];

        if (body.readStatus !== undefined) { updates.push('read_status = ?'); values.push(body.readStatus); }
        if (body.isFavorite !== undefined) { updates.push('is_favorite = ?'); values.push(body.isFavorite ? 1 : 0); }
        if (body.folderId !== undefined) { updates.push('folder_id = ?'); values.push(body.folderId); }
        if (body.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(body.tags)); }

        if (updates.length > 0) {
            values.push(id);
            values.push(USER_ID);
            const sql = `UPDATE library_items SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
            await env.DB.prepare(sql).bind(...values).run();
        }
        return Response.json({ success: true });
      }

      if (method === 'DELETE') {
        const id = url.searchParams.get('id');
        await env.DB.prepare('DELETE FROM library_items WHERE id = ? AND user_id = ?').bind(id, USER_ID).run();
        return Response.json({ success: true });
      }
    }

    // --- Annotations Endpoints ---
    if (path === 'annotations') {
        if (method === 'GET') {
            const paperId = url.searchParams.get('paperId');
            const { results } = await env.DB.prepare('SELECT * FROM annotations WHERE paper_id = ? AND user_id = ?').bind(paperId, USER_ID).all();
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
                body.id, body.paperId, USER_ID, body.type, body.content, body.color,
                position, Date.now(), body.status
            ).run();
            return Response.json({ success: true });
        }

        if (method === 'DELETE') {
            const id = url.searchParams.get('id');
            await env.DB.prepare('DELETE FROM annotations WHERE id = ? AND user_id = ?').bind(id, USER_ID).run();
            return Response.json({ success: true });
        }
    }

    // --- Semantic Search ---
    if (path === 'search/semantic') {
        if (method === 'POST') {
            const { embedding } = await request.json() as any;
            
            const { results: vectors } = await env.DB.prepare("SELECT id, embedding FROM library_items WHERE embedding IS NOT NULL AND user_id = ?").bind(USER_ID).all();
            
            if (!vectors || vectors.length === 0) return Response.json([]);

            const scores: { id: string, similarity: number }[] = [];
            
            for (const item of vectors as any[]) {
                try {
                    const itemVec = JSON.parse(item.embedding);
                    const similarity = cosineSimilarity(embedding, itemVec);
                    scores.push({ id: item.id, similarity });
                } catch (e) { continue; }
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
        }
    }

    return new Response('Not Found', { status: 404 });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
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
