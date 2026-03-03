DROP TABLE IF EXISTS videos;

CREATE TABLE videos (
  id         TEXT PRIMARY KEY,
  stream_id  TEXT NOT NULL,
  title      TEXT NOT NULL,
  thumbnail  TEXT,
  duration   REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  video_url  TEXT,
  description TEXT,
  views      INTEGER DEFAULT 0,
  author     TEXT
);
