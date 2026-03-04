-- StreamFlix D1 Schema
-- 免费方案：stream_id 存 R2 视频 URL (https://disk.f2008.cf/video/xxx.mp4)
-- 付费方案：stream_id 存 Cloudflare Stream Video ID

DROP TABLE IF EXISTS videos;

CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  duration REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  views INTEGER DEFAULT 0,
  author TEXT
);

CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_videos_author ON videos(author);
