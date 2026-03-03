export interface Video {
  id: string;
  stream_id: string;
  title: string;
  thumbnail: string;
  duration: number;
  created_at: string;
  videoUrl: string;
  description?: string;
  views?: number;
  author?: string;
}
