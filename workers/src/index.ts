/// <reference path="../worker-configuration.d.ts" />
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  ADMIN_TOKEN: string;
}

/**
 * Validates the Bearer token on requests that mutate data or expose admin info.
 * Returns a 401/403 Response if auth fails, or null if the request is allowed.
 */
function requireAdminAuth(request: Request, env: Env): Response | null {
  if (!env.ADMIN_TOKEN) {
    // If secret is not configured, block all protected routes in production
    return new Response(JSON.stringify({ error: "Server misconfiguration: ADMIN_TOKEN not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer",
      },
    });
  }
  return null; // auth passed
}

interface Video {
  id: string;
  stream_id: string;
  title: string;
  thumbnail: string;
  duration: number;
  created_at: string;
  description?: string;
  views?: number;
  author?: string;
}

function videoFromRow(row: Record<string, unknown>): Video {
  const r = row;
  return {
    id: String(r.id),
    stream_id: String(r.stream_id),
    title: String(r.title),
    thumbnail: String(r.thumbnail || ""),
    duration: Number(r.duration),
    created_at: String(r.created_at),
    description: r.description ? String(r.description) : undefined,
    views: r.views != null ? Number(r.views) : undefined,
    author: r.author ? String(r.author) : undefined,
  };
}

function addVideoUrl(v: Video): Video & { videoUrl: string } {
  return { ...v, videoUrl: v.stream_id };
}

const BASE_URL = "https://disk.f2008.cf/";
const VIDEO_EXT = /\.(mp4|webm|mkv|mov)$/i;

async function syncR2ToD1(env: Env): Promise<{ total: number; added: number }> {
  let total = 0,
    added = 0;
  let cursor: string | undefined;
  do {
    const listed = await env.R2.list({ prefix: "video/", cursor });
    const objects = listed.objects || [];
    for (const obj of objects) {
      const key = obj.key;
      if (!VIDEO_EXT.test(key)) continue;
      total++;
      const id = key.replace(/\//g, "-").replace(/\.[^.]+$/, "");
      const videoUrl = BASE_URL + key;
      const { results } = await env.DB.prepare("SELECT id FROM videos WHERE stream_id = ?")
        .bind(videoUrl)
        .all();
      if (!results?.length) {
        const name = key.split("/").pop()?.replace(/\.[^.]+$/, "") || id;
        await env.DB.prepare(
          `INSERT INTO videos (id, stream_id, title, thumbnail, duration, description, views, author)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(id, videoUrl, name, videoUrl, 0, "", 0, "R2")
          .run();
        added++;
      }
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return { total, added };
}

interface R2EventMessage {
  action: string;
  bucket: string;
  object?: { key: string };
  eventTime?: string;
}

async function upsertVideoFromKey(env: Env, key: string): Promise<boolean> {
  if (!VIDEO_EXT.test(key)) return false;
  const id = key.replace(/\//g, "-").replace(/\.[^.]+$/, "");
  const videoUrl = BASE_URL + key;
  const name = key.split("/").pop()?.replace(/\.[^.]+$/, "") || id;
  const { results } = await env.DB.prepare("SELECT id FROM videos WHERE stream_id = ?")
    .bind(videoUrl)
    .all();
  if (results?.length) return true;
  await env.DB.prepare(
    `INSERT INTO videos (id, stream_id, title, thumbnail, duration, description, views, author)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, videoUrl, name, videoUrl, 0, "", 0, "R2")
    .run();
  return true;
}

async function deleteVideoFromKey(env: Env, key: string): Promise<boolean> {
  const videoUrl = BASE_URL + key;
  await env.DB.prepare("DELETE FROM videos WHERE stream_id = ?").bind(videoUrl).run();
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return corsResponse();
    }

    try {
      if (path === "/videos" && request.method === "GET") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const { results } = await env.DB.prepare(
          "SELECT * FROM videos ORDER BY created_at DESC LIMIT ? OFFSET ?"
        )
          .bind(limit, offset)
          .all();
        const videos = (results || []).map((r: Record<string, unknown>) => addVideoUrl(videoFromRow(r as Record<string, unknown>)));
        return jsonResponse({ videos });
      }

      const match = path.match(/^\/videos\/([^/]+)$/);
      if (match && request.method === "GET") {
        const id = match[1];
        const { results } = await env.DB.prepare("SELECT * FROM videos WHERE id = ?")
          .bind(id)
          .all();
        if (!results?.length) {
          return jsonResponse({ error: "Not found" }, 404);
        }
        const video = addVideoUrl(videoFromRow(results[0] as Record<string, unknown>));
        return jsonResponse(video);
      }

      if (match && request.method === "PATCH") {
        const authErr = requireAdminAuth(request, env);
        if (authErr) return authErr;
        const id = decodeURIComponent(match[1]);
        const { results: existing } = await env.DB.prepare("SELECT id FROM videos WHERE id = ?")
          .bind(id)
          .all();
        if (!existing?.length) {
          return jsonResponse({ error: "Not found" }, 404);
        }
        const body = (await request.json()) as Record<string, unknown>;
        const fields: string[] = [];
        const values: unknown[] = [];
        const allowed = ["title", "thumbnail", "duration", "description", "views", "author"] as const;
        for (const key of allowed) {
          if (key in body) {
            fields.push(`${key} = ?`);
            values.push(body[key] ?? null);
          }
        }
        if (!fields.length) return jsonResponse({ error: "No updatable fields provided" }, 400);
        values.push(id);
        await env.DB.prepare(`UPDATE videos SET ${fields.join(", ")} WHERE id = ?`)
          .bind(...values)
          .run();
        const { results: updated } = await env.DB.prepare("SELECT * FROM videos WHERE id = ?")
          .bind(id)
          .all();
        return jsonResponse(addVideoUrl(videoFromRow(updated![0] as Record<string, unknown>)));
      }

      if (path === "/admin/sync-r2" && request.method === "GET") {
        const authErr = requireAdminAuth(request, env);
        if (authErr) return authErr;
        const result = await syncR2ToD1(env);
        return jsonResponse(result);
      }

      if (path === "/admin/diagnostics" && request.method === "GET") {
        const authErr = requireAdminAuth(request, env);
        if (authErr) return authErr;
        const r2Keys: string[] = [];
        let cursor: string | undefined;
        do {
          const listed = await env.R2.list({ prefix: "video/", cursor });
          for (const obj of listed.objects || []) {
            if (VIDEO_EXT.test(obj.key)) r2Keys.push(obj.key);
          }
          cursor = listed.truncated ? listed.cursor : undefined;
        } while (cursor);
        const { results } = await env.DB.prepare("SELECT stream_id FROM videos").all();
        const d1Urls = new Set((results || []).map((r: Record<string, unknown>) => String(r.stream_id)));
        const baseUrl = BASE_URL;
        const missingInD1 = r2Keys.filter((k) => !d1Urls.has(baseUrl + k));
        const d1FromR2 = ([...d1Urls] as string[]).filter((u) => u.startsWith(baseUrl + "video/"));
        const extraInD1 = d1FromR2.filter((u) => !r2Keys.includes(u.slice(baseUrl.length)));
        return jsonResponse({
          r2: { total: r2Keys.length, keys: r2Keys },
          d1: { total: d1Urls.size },
          missingInD1,
          extraInD1: extraInD1.map((u) => u.slice(baseUrl.length)),
        });
      }

      if (path === "/videos" && request.method === "POST") {
        const authErr = requireAdminAuth(request, env);
        if (authErr) return authErr;
        const body = (await request.json()) as Record<string, unknown>;
        const id = (body.id as string) || crypto.randomUUID();
        const stream_id = String(body.stream_id ?? body.videoUrl ?? "");
        const title = String(body.title ?? "Untitled");
        const thumbnail = String(body.thumbnail ?? "");
        const duration = Number(body.duration ?? 0);
        const description = body.description ? String(body.description) : null;
        const views = body.views != null ? Number(body.views) : 0;
        const author = body.author ? String(body.author) : null;

        await env.DB.prepare(
          `INSERT INTO videos (id, stream_id, title, thumbnail, duration, description, views, author)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(id, stream_id, title, thumbnail, duration, description, views, author)
          .run();

        const { results } = await env.DB.prepare("SELECT * FROM videos WHERE id = ?")
          .bind(id)
          .all();
        const video = addVideoUrl(videoFromRow(results![0] as Record<string, unknown>));
        return jsonResponse(video, 201);
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (e) {
      console.error(e);
      return jsonResponse({ error: String(e) }, 500);
    }
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const result = await syncR2ToD1(env);
    console.log("[Cron] R2 sync:", result);
  },

  async queue(batch: MessageBatch<R2EventMessage>, env: Env): Promise<void> {
    const createActions = ["PutObject", "CopyObject", "CompleteMultipartUpload"];
    const deleteActions = ["DeleteObject", "LifecycleDeletion"];
    for (const msg of batch.messages) {
      try {
        const body = msg.body;
        const key = body.object?.key;
        if (!key || !key.startsWith("video/")) continue;
        if (createActions.includes(body.action)) {
          await upsertVideoFromKey(env, key);
        } else if (deleteActions.includes(body.action)) {
          await deleteVideoFromKey(env, key);
        }
      } catch (e) {
        console.error("[Queue] R2 event failed:", JSON.stringify(msg.body), e);
        throw e;
      }
    }
  },
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
