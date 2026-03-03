import { useState, useRef, useEffect } from 'react';
import { RotateCw, Settings } from 'lucide-react';
import type { Video } from '../types';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerContainer({ video }: { video: Video }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rotation, setRotation] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setRotation(0);
    setPlaybackRate(1);
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
  }, [video]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  const isVertical = rotation === 90 || rotation === 270;

  return (
    <div className="flex flex-col gap-2">
      <div className={`w-full bg-black rounded-2xl overflow-hidden relative border border-white/10 shadow-lg flex items-center justify-center transition-all duration-300 ${isVertical ? 'aspect-[9/16] max-h-[80vh] mx-auto' : 'aspect-video'}`}>
        {/*
          Cloudflare Stream 预留位置
          <stream src={video.stream_id} controls preload></stream>
          <script data-cfasync="false" defer type="text/javascript" src="https://embed.videodelivery.net/embed/r4.core.js"></script>
        */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnail}
            controls
            className="w-full h-full object-contain"
            autoPlay
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-2 py-1">
        <button
          onClick={handleRotate}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          title="旋转视频"
        >
          <RotateCw size={16} />
          <span>旋转</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
            title="播放速度"
          >
            <Settings size={16} />
            <span>{playbackRate}x</span>
          </button>

          {showSettings && (
            <div className="absolute bottom-full right-0 mb-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-white/5">播放速度</div>
                {PLAYBACK_RATES.map(rate => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${playbackRate === rate ? 'text-blue-400 font-medium' : 'text-gray-200'}`}
                  >
                    {rate === 1 ? '正常' : `${rate}x`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
