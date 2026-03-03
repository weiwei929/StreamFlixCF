import React, { useState, useRef, useEffect } from 'react';
import { Home, TrendingUp, Heart, Menu, Upload, Search, X, Play, MoreVertical, RotateCw, Settings, Film } from 'lucide-react';
import { MOCK_VIDEOS, Video } from './data';

// Helper to format duration
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate network loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white font-sans">
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onUploadClick={() => setIsUploadModalOpen(true)}
          onHomeClick={() => setCurrentVideo(null)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          {currentVideo ? (
            <VideoDetail video={currentVideo} onVideoSelect={setCurrentVideo} />
          ) : (
            isLoading ? <VideoGridSkeleton /> : <VideoGrid videos={MOCK_VIDEOS} onVideoSelect={setCurrentVideo} />
          )}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNav isOpen={isSidebarOpen} />
      </div>

      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
}

function Sidebar({ isOpen }: { isOpen: boolean }) {
  return (
    <aside className={`transition-all duration-300 ease-in-out flex flex-col border-r border-white/10 bg-[#050505] hidden sm:flex ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col gap-2 p-4 mt-2">
        <SidebarItem icon={<Home size={22} />} label="首页" isOpen={isOpen} active />
        <SidebarItem icon={<TrendingUp size={22} />} label="热门" isOpen={isOpen} />
        <SidebarItem icon={<Heart size={22} />} label="收藏" isOpen={isOpen} />
      </div>
    </aside>
  );
}

function MobileNav({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-4 z-20">
      <button className="flex flex-col items-center gap-1 text-white">
        <Home size={20} />
        <span className="text-[10px] font-medium">首页</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
        <TrendingUp size={20} />
        <span className="text-[10px] font-medium">热门</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
        <Heart size={20} />
        <span className="text-[10px] font-medium">收藏</span>
      </button>
    </div>
  );
}

function SidebarItem({ icon, label, isOpen, active }: { icon: React.ReactNode, label: string, isOpen: boolean, active?: boolean }) {
  return (
    <button className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      <div className="flex-shrink-0">{icon}</div>
      {isOpen && <span className="font-medium whitespace-nowrap">{label}</span>}
    </button>
  );
}

function Navbar({ toggleSidebar, onUploadClick, onHomeClick }: { toggleSidebar: () => void, onUploadClick: () => void, onHomeClick: () => void }) {
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-[#050505]/50 backdrop-blur-xl sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hidden sm:block">
          <Menu size={24} />
        </button>
        <div className="font-bold text-xl tracking-tight cursor-pointer flex items-center gap-2" onClick={onHomeClick}>
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Play size={16} fill="white" />
          </div>
          <span className="hidden sm:inline">StreamFlix</span>
        </div>
      </div>
      
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-500 group-focus-within:text-gray-300" />
          </div>
          <input 
            type="text" 
            placeholder="搜索视频..." 
            className="w-full bg-[#121212]/80 border border-white/10 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all"
          />
        </div>
      </div>

      <div>
        <button onClick={onUploadClick} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors font-medium text-sm">
          <Upload size={18} />
          <span className="hidden sm:inline">上传</span>
        </button>
      </div>
    </header>
  );
}

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 animate-pulse">
          <div className="aspect-video rounded-xl bg-white/5 border border-white/5"></div>
          <div className="flex gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0 mt-1"></div>
            <div className="flex flex-col gap-2 w-full mt-1">
              <div className="h-4 bg-white/5 rounded w-full"></div>
              <div className="h-4 bg-white/5 rounded w-3/4"></div>
              <div className="h-3 bg-white/5 rounded w-1/2 mt-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VideoGrid({ videos, onVideoSelect }: { videos: Video[], onVideoSelect: (v: Video) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} onClick={() => onVideoSelect(video)} />
      ))}
    </div>
  );
}

function VideoCard({ video, onClick }: { video: Video, onClick: () => void, key?: React.Key }) {
  return (
    <div className="group cursor-pointer flex flex-col gap-3" onClick={onClick}>
      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-[#121212]">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-mono">
          {formatDuration(video.duration)}
        </div>
      </div>
      <div className="flex gap-3 px-1">
        <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Film size={16} className="text-gray-400" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <h3 className="font-medium text-sm text-white line-clamp-2 leading-snug group-hover:text-gray-300 transition-colors">{video.title}</h3>
          <p className="text-xs text-gray-400 mt-1">{video.author}</p>
          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
            <span>{video.views?.toLocaleString()} 观看</span>
            <span>•</span>
            <span>{formatDate(video.created_at)}</span>
          </div>
        </div>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoDetail({ video, onVideoSelect }: { video: Video, onVideoSelect: (v: Video) => void }) {
  const recommendedVideos = MOCK_VIDEOS.filter(v => v.id !== video.id);

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
      <div className="flex-1 flex flex-col gap-4">
        <PlayerContainer video={video} />
        
        <div className="flex flex-col gap-2 mt-2">
          <h1 className="text-2xl font-bold text-white">{video.title}</h1>
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0">
                <Film size={20} className="text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-white">{video.author}</div>
                <div className="text-xs text-gray-400">1.2M 订阅者</div>
              </div>
              <button className="ml-2 sm:ml-4 bg-white text-black px-4 py-2 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors">
                订阅
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors text-sm font-medium">
                <Heart size={18} />
                <span>喜欢</span>
              </button>
            </div>
          </div>
          
          <div className="bg-[#121212] rounded-xl p-4 mt-2 border border-white/5">
            <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <span>{video.views?.toLocaleString()} 观看</span>
              <span>•</span>
              <span>{formatDate(video.created_at)}</span>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {video.description}
            </p>
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        <h3 className="font-medium text-lg px-1">推荐视频</h3>
        <div className="flex flex-col gap-3">
          {recommendedVideos.map(v => (
            <div key={v.id} className="flex gap-3 group cursor-pointer" onClick={() => onVideoSelect(v)}>
              <div className="relative w-40 aspect-video rounded-lg overflow-hidden border border-white/5 bg-[#121212] flex-shrink-0">
                <img 
                  src={v.thumbnail} 
                  alt={v.title} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {formatDuration(v.duration)}
                </div>
              </div>
              <div className="flex flex-col py-1">
                <h4 className="font-medium text-sm text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">{v.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{v.author}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.views?.toLocaleString()} 观看</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerContainer({ video }: { video: Video }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rotation, setRotation] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // Reset states when video changes
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

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Calculate dynamic aspect ratio based on rotation
  const isVertical = rotation === 90 || rotation === 270;
  
  return (
    <div className="flex flex-col gap-2">
      <div className={`w-full bg-black rounded-2xl overflow-hidden relative border border-white/10 shadow-lg flex items-center justify-center transition-all duration-300 ${isVertical ? 'aspect-[9/16] max-h-[80vh] mx-auto' : 'aspect-video'}`}>
        {/* 
          Cloudflare Stream 预留位置 
          <stream src={video.stream_id} controls preload></stream>
          <script data-cfasync="false" defer type="text/javascript" src={`https://embed.videodelivery.net/embed/r4.core.js`}></script>
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
      
      {/* Custom Controls Bar */}
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
                {playbackRates.map(rate => (
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

function UploadModal({ onClose }: { onClose: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = () => {
    setUploading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onClose();
        }, 500);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">上传视频</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          {!uploading ? (
            <>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-10 flex flex-col items-center justify-center gap-4 hover:border-white/40 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-gray-300">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-white">拖拽文件到此处或点击上传</p>
                  <p className="text-sm text-gray-500 mt-1">支持 MP4, WebM 格式</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">视频标题</label>
                <input 
                  type="text" 
                  placeholder="输入一个吸引人的标题..." 
                  className="w-full bg-[#050505] border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  onClick={handleUpload}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  开始上传
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <div className="w-full bg-[#050505] rounded-full h-3 border border-white/10 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-2xl font-medium text-white">{progress}%</p>
                <p className="text-sm text-gray-400">正在上传到 Cloudflare Stream...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
