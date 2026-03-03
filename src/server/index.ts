/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
};

interface VideoRow {
  id: string;
  stream_id: string;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  created_at: string | null;
  video_url: string | null;
  description: string | null;
  views: number | null;
  author: string | null;
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());

app.get('/api/videos', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM videos ORDER BY created_at DESC'
  ).all<VideoRow>();

  const videos = (results ?? []).map(toVideoResponse);
  return c.json(videos);
});

app.get('/api/videos/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    'SELECT * FROM videos WHERE id = ?'
  ).bind(id).first<VideoRow>();

  if (!row) {
    return c.json({ error: 'Video not found' }, 404);
  }
  return c.json(toVideoResponse(row));
});

function toVideoResponse(row: VideoRow) {
  return {
    id: row.id,
    stream_id: row.stream_id,
    title: row.title,
    thumbnail: row.thumbnail ?? '',
    duration: row.duration ?? 0,
    created_at: row.created_at ?? '',
    videoUrl: row.video_url ?? '',
    description: row.description ?? '',
    views: row.views ?? 0,
    author: row.author ?? '',
  };
}

export default app;
