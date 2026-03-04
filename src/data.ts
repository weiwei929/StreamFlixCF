export interface Video {
  id: string;
  stream_id: string;
  title: string;
  thumbnail: string;
  duration: number; // in seconds
  created_at: string; // ISO date string
  videoUrl: string; // For HTML5 video fallback
  description?: string;
  views?: number;
  author?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://streamflix-api.pennfly2008.workers.dev';

export async function fetchVideos(): Promise<Video[]> {
  const res = await fetch(`${API_URL}/videos`);
  if (!res.ok) throw new Error('Failed to fetch videos');
  const data = await res.json();
  return (data.videos || []).map((v: Video) => ({
    ...v,
    created_at: v.created_at?.replace(' ', 'T') || v.created_at,
  }));
}

export async function patchVideo(id: string, fields: Partial<Pick<Video, 'title' | 'thumbnail' | 'duration' | 'description' | 'views' | 'author'>>): Promise<void> {
  await fetch(`${API_URL}/videos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

/** @deprecated 使用 fetchVideos 从 API 获取，仅作开发回退 */
export const MOCK_VIDEOS: Video[] = [
  {
    id: "1",
    stream_id: "stream_001",
    title: "Big Buck Bunny",
    thumbnail: "https://picsum.photos/seed/bbb/640/360",
    duration: 596,
    created_at: "2023-10-01T12:00:00Z",
    videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself. When one sunny day three rodents rudely awaken him from his daily butterfly contemplation, his heart is broken.",
    views: 120500,
    author: "Blender Foundation"
  },
  {
    id: "2",
    stream_id: "stream_002",
    title: "Elephant Dream",
    thumbnail: "https://picsum.photos/seed/elephant/640/360",
    duration: 653,
    created_at: "2023-10-02T14:30:00Z",
    videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "The first computer-generated animated short film made almost completely with free and open-source software.",
    views: 84000,
    author: "Blender Foundation"
  },
  {
    id: "3",
    stream_id: "stream_003",
    title: "For Bigger Blazes",
    thumbnail: "https://picsum.photos/seed/blazes/640/360",
    duration: 15,
    created_at: "2023-10-05T09:15:00Z",
    videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "HBO GO now works with Chromecast -- the easiest way to enjoy online video on your TV.",
    views: 45000,
    author: "Google"
  },
  {
    id: "4",
    stream_id: "stream_004",
    title: "For Bigger Escape",
    thumbnail: "https://picsum.photos/seed/escape/640/360",
    duration: 15,
    created_at: "2023-10-10T16:45:00Z",
    videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "Introducing Chromecast. The easiest way to enjoy online video and music on your TV.",
    views: 62000,
    author: "Google"
  },
  {
    id: "5",
    stream_id: "stream_005",
    title: "Sintel",
    thumbnail: "https://picsum.photos/seed/sintel/640/360",
    duration: 888,
    created_at: "2023-10-15T11:20:00Z",
    videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    description: "Sintel is an independently produced short film, initiated by the Blender Foundation.",
    views: 210000,
    author: "Blender Foundation"
  },
  {
    id: "6",
    stream_id: "stream_006",
    title: "Tears of Steel",
    thumbnail: "https://picsum.photos/seed/tears/640/360",
    duration: 734,
    created_at: "2023-10-20T08:00:00Z",
    videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description: "Tears of Steel was realized with crowd-funding by users of the open source 3D creation tool Blender.",
    views: 156000,
    author: "Blender Foundation"
  }
];
