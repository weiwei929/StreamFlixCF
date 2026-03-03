import { useState, useEffect } from 'react';
import type { Video } from '../types';
import { MOCK_VIDEOS } from '../data';
import VideoGrid from '../components/VideoGrid';
import VideoGridSkeleton from '../components/VideoGridSkeleton';

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/videos', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json();
      })
      .then((data: Video[]) => {
        setVideos(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.warn('API unavailable, falling back to mock data:', err.message);
        setVideos(MOCK_VIDEOS);
        setError('fallback');
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (isLoading) return <VideoGridSkeleton />;

  return (
    <div>
      {error === 'fallback' && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-xs">
          API 未连接，当前使用本地 Mock 数据。启动后端：<code className="bg-white/10 px-1.5 py-0.5 rounded">npm run dev:api</code>
        </div>
      )}
      <VideoGrid videos={videos} />
    </div>
  );
}
