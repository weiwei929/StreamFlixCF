import { useState, useEffect } from 'react';
import { MOCK_VIDEOS } from '../data';
import VideoGrid from '../components/VideoGrid';
import VideoGridSkeleton from '../components/VideoGridSkeleton';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return isLoading ? <VideoGridSkeleton /> : <VideoGrid videos={MOCK_VIDEOS} />;
}
