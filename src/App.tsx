import React, { useState, useRef, useEffect } from 'react';
import { Home, Menu, Upload, Search, X, Play, MoreVertical, RotateCw, Settings, Film, ChevronRight, Cloud, Server, Youtube, Link2, Radio, Bookmark, Clock, Trash2, Star, Heart } from 'lucide-react';
import Hls from 'hls.js';
import { fetchVideos, MOCK_VIDEOS, Video } from './data';

type Channel = 'home' | 'r2' | 'selfhosted' | 'youtube' | 'external' | 'live' | 'stream';

const NAV_ITEMS: { id: Channel; icon: React.ElementType; label: string; dot?: string }[] = [
  { id: 'home',       icon: Home,    label: '首页' },
  { id: 'r2',         icon: Cloud,   label: 'R2 视频' },
  { id: 'selfhosted', icon: Server,  label: '自建视频' },
  { id: 'youtube',    icon: Youtube, label: 'YouTube',  dot: 'red' },
  { id: 'external',   icon: Link2,   label: '外站链接' },
  { id: 'live',       icon: Radio,   label: '直播源',   dot: 'orange' },
  { id: 'stream',     icon: Film,    label: 'CF Stream', dot: 'blue' },
];


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

// Extract folder path from video URL, e.g.
//   https://disk.f2008.cf/video/shows/abc.mp4  →  video/shows
//   https://disk.f2008.cf/video/abc.mp4         →  video
const getVideoPath = (video: { videoUrl: string; author?: string }) => {
  try {
    const { pathname } = new URL(video.videoUrl);
    const parts = pathname.split('/').filter(Boolean); // remove empty segments
    // Drop the filename (last part), keep the folder(s)
    parts.pop();
    return parts.length ? parts.join('/') : (video.author ?? 'R2');
  } catch {
    return video.author ?? 'R2';
  }
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChannel, setCurrentChannel] = useState<Channel>('r2');
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos()
      .then(setVideos)
      .catch((e) => { setError(e.message); setVideos(MOCK_VIDEOS); })
      .finally(() => setIsLoading(false));
  }, []);

  const handleChannelChange = (ch: Channel) => {
    setCurrentChannel(ch);
    setCurrentVideo(null);
  };

  const renderChannel = () => {
    switch (currentChannel) {
      case 'home':       return <HomeChannel onNavigate={handleChannelChange} />;
      case 'r2':         return currentVideo
        ? <VideoDetail video={currentVideo} onVideoSelect={setCurrentVideo} recommendedVideos={videos.filter(v => v.id !== currentVideo.id)} />
        : isLoading ? <VideoGridSkeleton /> : <VideoGrid videos={videos} onVideoSelect={setCurrentVideo} />;
      case 'selfhosted': return <SelfHostedChannel />;
      case 'youtube':    return <YouTubeChannel />;
      case 'external':   return <ExternalChannel />;
      case 'live':       return <LiveChannel />;
      case 'stream':     return <StreamChannel />;
      default:           return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white font-sans">
      <Sidebar isOpen={isSidebarOpen} currentChannel={currentChannel} onChannelChange={handleChannelChange} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onHomeClick={() => handleChannelChange('r2')}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          {renderChannel()}
        </main>
        <MobileNav currentChannel={currentChannel} onChannelChange={handleChannelChange} />
      </div>
      {isUploadModalOpen && <UploadModal onClose={() => setIsUploadModalOpen(false)} />}
    </div>
  );
}

function Sidebar({ isOpen, currentChannel, onChannelChange }: { isOpen: boolean; currentChannel: Channel; onChannelChange: (c: Channel) => void }) {
  return (
    <aside className={`transition-all duration-300 ease-in-out flex flex-col border-r border-white/10 bg-[#050505] hidden sm:flex ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col gap-1 p-3 mt-2">
        {NAV_ITEMS.map(item => (
          <React.Fragment key={item.id}>
            <SidebarItem
              icon={<item.icon size={22} />}
              label={item.label}
              isOpen={isOpen}
              active={currentChannel === item.id}
              dot={item.dot}
              onClick={() => onChannelChange(item.id)}
            />
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
}

function MobileNav({ currentChannel, onChannelChange }: { currentChannel: Channel; onChannelChange: (c: Channel) => void }) {
  const items = NAV_ITEMS.slice(0, 5); // show first 5 on mobile
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 z-20">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChannelChange(item.id)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentChannel === item.id ? 'text-white' : 'text-gray-500 hover:text-white'}`}
        >
          <item.icon size={20} />
          <span className="text-[9px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function SidebarItem({ icon, label, isOpen, active, dot, onClick }: { icon: React.ReactNode; label: string; isOpen: boolean; active?: boolean; dot?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors w-full text-left ${
        active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className="flex-shrink-0 relative">
        {icon}
        {dot && <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-${dot}-500`} />}
      </div>
      {isOpen && <span className="font-medium whitespace-nowrap text-sm">{label}</span>}
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
  // Track which folders are expanded; default: all collapsed
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (path: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });

  // Group videos by folder path
  const groups = videos.reduce<Record<string, Video[]>>((acc, video) => {
    const path = getVideoPath(video);
    if (!acc[path]) acc[path] = [];
    acc[path].push(video);
    return acc;
  }, {});

  // Sort: root folder first (fewer slashes), then alphabetically
  const sortedPaths = Object.keys(groups).sort((a, b) => {
    const depthA = a.split('/').length;
    const depthB = b.split('/').length;
    if (depthA !== depthB) return depthA - depthB;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-4">
      {sortedPaths.map(path => {
        const isOpen = expanded.has(path);
        return (
          <section key={path}>
            {/* Folder header — clickable to toggle */}
            <button
              onClick={() => toggle(path)}
              className="w-full flex items-center gap-2 py-2 px-1 border-b border-white/10 hover:bg-white/5 rounded-lg transition-colors group"
            >
              <ChevronRight
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              />
              <span className="text-lg">📁</span>
              <h2 className="text-sm font-semibold text-gray-300 tracking-wide">{path}</h2>
              <span className="text-xs text-gray-600 ml-1">({groups[path].length})</span>
            </button>
            {/* Video grid — visible only when expanded */}
            {isOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 mt-4">
                {groups[path].map(video => (
                  <VideoCard key={video.id} video={video} onClick={() => onVideoSelect(video)} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function VideoCard({ video, onClick }: { video: Video, onClick: () => void, key?: React.Key }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [realDuration, setRealDuration] = useState(video.duration);
  return (
    <div className="group cursor-pointer flex flex-col gap-3" onClick={onClick}>
      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-[#121212]">
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          preload="metadata"
          playsInline
          onLoadedMetadata={() => {
            if (videoRef.current?.duration) setRealDuration(videoRef.current.duration);
          }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-mono">
          {formatDuration(realDuration)}
        </div>
      </div>
      <div className="flex gap-3 px-1">
        <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Film size={16} className="text-gray-400" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <h3 className="font-medium text-sm text-white line-clamp-2 leading-snug group-hover:text-gray-300 transition-colors">{video.title}</h3>
          <p className="text-xs text-gray-400 mt-1">{getVideoPath(video)}</p>
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

function VideoDetail({ video, onVideoSelect, recommendedVideos }: { video: Video; onVideoSelect: (v: Video) => void; recommendedVideos: Video[] }) {

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
                <div className="font-medium text-white">{getVideoPath(video)}</div>
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
            <RecommendedItem key={v.id} video={v} onSelect={onVideoSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendedItem({ video, onSelect }: { video: Video; onSelect: (v: Video) => void; key?: React.Key }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [realDuration, setRealDuration] = useState(video.duration);
  return (
    <div className="flex gap-3 group cursor-pointer" onClick={() => onSelect(video)}>
      <div className="relative w-40 aspect-video rounded-lg overflow-hidden border border-white/5 bg-[#121212] flex-shrink-0">
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          preload="metadata"
          playsInline
          onLoadedMetadata={() => {
            if (videoRef.current?.duration) setRealDuration(videoRef.current.duration);
          }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
        />
        <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
          {formatDuration(realDuration)}
        </div>
      </div>
      <div className="flex flex-col py-1">
        <h4 className="font-medium text-sm text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">{video.title}</h4>
        <p className="text-xs text-gray-400 mt-1">{video.author}</p>
        <p className="text-xs text-gray-500 mt-0.5">{video.views?.toLocaleString()} 观看</p>
      </div>
    </div>
  );
}

function PlayerContainer({ video }: { video: Video }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rotation, setRotation] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  // 未激活时完全不渲染 <video> 元素，进入详情页零流量
  const [isActivated, setIsActivated] = useState(false);

  // 切换视频时：重置所有状态，并强制中止当前视频的网络加载
  useEffect(() => {
    setRotation(0);
    setPlaybackRate(1);
    setIsActivated(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load();
    }
  }, [video.id]);

  // 激活后：赋 src 并开始播放
  useEffect(() => {
    if (!isActivated || !videoRef.current) return;
    const el = videoRef.current;
    el.src = video.videoUrl;
    el.playbackRate = playbackRate;
    el.play().catch(() => {});
  }, [isActivated]); // eslint-disable-line react-hooks/exhaustive-deps

  // 组件卸载时（离开详情页）立即中止所有网络连接
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, []);

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
          {!isActivated ? (
            /* 封面覆层：未激活时 src 完全不存在，零流量 */
            <button
              onClick={() => setIsActivated(true)}
              className="w-full h-full flex items-center justify-center relative group bg-black"
              aria-label="播放视频"
            >
              <video
                src={video.videoUrl}
                muted
                preload="metadata"
                playsInline
                className="w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Play size={36} fill="white" className="text-white ml-1" />
                </div>
              </div>
            </button>
          ) : (
            /* 用户点击后才渲染视频元素，src 由 useEffect 统一管理 */
            <video
              ref={videoRef}
              controls
              className="w-full h-full object-contain"
              preload="none"
            >
              Your browser does not support the video tag.
            </video>
          )}
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

// ─── Helper functions for new channels ───────────────────────────────────────

const LS = {
  get: <T,>(key: string, fallback: T): T => {
    try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; }
  },
  set: (key: string, val: unknown) => localStorage.setItem(key, JSON.stringify(val)),
};

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return m ? m[1] : null;
}

function detectPlayerType(url: string): 'youtube' | 'm3u8' | 'video' | 'iframe' {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/\.m3u8/i.test(url)) return 'm3u8';
  if (/\.(mp4|webm|mov|avi|mkv)/i.test(url)) return 'video';
  return 'iframe';
}

interface SavedLink { id: string; url: string; title: string; addedAt: string; favorited: boolean; }
interface LiveSource { id: string; name: string; url: string; addedAt: string; }

// ─── HomeChannel ─────────────────────────────────────────────────────────────

function HomeChannel({ onNavigate }: { onNavigate: (c: Channel) => void }) {
  const cards = [
    { id: 'r2' as Channel, icon: Cloud, label: 'R2 视频', desc: '基于 Cloudflare R2 自托管的视频库，自动按文件夹分组', color: 'from-blue-900/40 to-blue-800/20' },
    { id: 'selfhosted' as Channel, icon: Server, label: '自建视频', desc: '添加第三方自托管视频直链，本地保存播放记录', color: 'from-purple-900/40 to-purple-800/20' },
    { id: 'youtube' as Channel, icon: Youtube, label: 'YouTube', desc: '粘贴 YouTube 链接即可播放，支持收藏和历史记录', color: 'from-red-900/40 to-red-800/20' },
    { id: 'external' as Channel, icon: Link2, label: '外站链接', desc: '自动识别 MP4、M3U8 或 iframe，一键粘贴播放', color: 'from-green-900/40 to-green-800/20' },
    { id: 'live' as Channel, icon: Radio, label: '直播源', desc: '管理 M3U8 直播流列表，支持公开 IPTV 源', color: 'from-orange-900/40 to-orange-800/20' },
    { id: 'stream' as Channel, icon: Film, label: 'CF Stream', desc: 'Cloudflare 付费托管流媒体，自动转码+全球 CDN（调研中）', color: 'from-sky-900/40 to-sky-800/20' },
  ];
  return (
    <div className="max-w-4xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-bold text-white mb-2">StreamFlix</h1>
      <p className="text-gray-400 mb-8">个人媒体中心 — 选择频道开始</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <button key={c.id} onClick={() => onNavigate(c.id)}
            className={`bg-gradient-to-br ${c.color} border border-white/10 rounded-2xl p-6 text-left hover:border-white/20 hover:scale-[1.02] transition-all group`}>
            <c.icon size={28} className="text-white/70 mb-3 group-hover:text-white transition-colors" />
            <div className="font-semibold text-white text-base mb-1">{c.label}</div>
            <div className="text-gray-400 text-sm leading-relaxed">{c.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── YouTubeChannel ───────────────────────────────────────────────────────────

function YouTubeChannel() {
  const LS_KEY = 'streamflix_youtube';
  const [links, setLinks] = useState<SavedLink[]>(() => LS.get(LS_KEY, []));
  const [input, setInput] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const save = (updated: SavedLink[]) => { setLinks(updated); LS.set(LS_KEY, updated); };

  const play = (link: SavedLink) => setActiveId(link.id);

  const addUrl = () => {
    const url = input.trim();
    if (!url || !extractYoutubeId(url)) return;
    const existing = links.find(l => l.url === url);
    if (existing) { setActiveId(existing.id); return; }
    const item: SavedLink = { id: crypto.randomUUID(), url, title: extractYoutubeId(url) ?? url, addedAt: new Date().toISOString(), favorited: false };
    const next = [item, ...links].slice(0, 50);
    save(next);
    setActiveId(item.id);
    setInput('');
  };

  const toggleFav = (id: string) => save(links.map(l => l.id === id ? { ...l, favorited: !l.favorited } : l));
  const remove = (id: string) => { if (activeId === id) setActiveId(null); save(links.filter(l => l.id !== id)); };

  const activeLink = links.find(l => l.id === activeId);
  const vidId = activeLink ? extractYoutubeId(activeLink.url) : null;
  const favorites = links.filter(l => l.favorited);
  const recents = links.filter(l => !l.favorited).slice(0, 20);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className={`w-full bg-black rounded-2xl border border-white/10 overflow-hidden ${vidId ? 'aspect-video' : 'aspect-video flex items-center justify-center'}`}>
        {vidId ? (
          <iframe key={vidId} src={`https://www.youtube.com/embed/${vidId}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen className="w-full h-full" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Youtube size={48} />
            <span className="text-sm">粘贴 YouTube 链接开始播放</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUrl()}
          placeholder="粘贴 YouTube 链接..." className="flex-1 bg-[#121212] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 text-sm" />
        <button onClick={addUrl} className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors">▶ 播放</button>
        {activeLink && (
          <button onClick={() => toggleFav(activeLink.id)} className={`px-4 py-3 rounded-xl text-sm transition-colors border ${activeLink.favorited ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
            <Star size={16} fill={activeLink.favorited ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {favorites.length > 0 && (
        <LinkSection title="★ 收藏" items={favorites} activeId={activeId} onPlay={play} onToggleFav={toggleFav} onRemove={remove} />
      )}
      {recents.length > 0 && (
        <LinkSection title="🕐 最近" items={recents} activeId={activeId} onPlay={play} onToggleFav={toggleFav} onRemove={remove} />
      )}
    </div>
  );
}

// ─── ExternalChannel ──────────────────────────────────────────────────────────

function ExternalChannel() {
  const LS_KEY = 'streamflix_external';
  const [links, setLinks] = useState<SavedLink[]>(() => LS.get(LS_KEY, []));
  const [input, setInput] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const save = (updated: SavedLink[]) => { setLinks(updated); LS.set(LS_KEY, updated); };

  const activeLink = links.find(l => l.id === activeId);
  const playerType = activeLink ? detectPlayerType(activeLink.url) : null;

  useEffect(() => {
    hlsRef.current?.destroy();
    if (!activeLink || playerType !== 'm3u8' || !videoRef.current) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(activeLink.url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => videoRef.current?.play().catch(() => {}));
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = activeLink.url;
    }
    return () => { hlsRef.current?.destroy(); };
  }, [activeId]);

  const addUrl = () => {
    const url = input.trim();
    if (!url) return;
    const existing = links.find(l => l.url === url);
    if (existing) { setActiveId(existing.id); return; }
    const item: SavedLink = { id: crypto.randomUUID(), url, title: url.split('/').pop() ?? url, addedAt: new Date().toISOString(), favorited: false };
    const next = [item, ...links].slice(0, 50);
    save(next);
    setActiveId(item.id);
    setInput('');
  };

  const toggleFav = (id: string) => save(links.map(l => l.id === id ? { ...l, favorited: !l.favorited } : l));
  const remove = (id: string) => { if (activeId === id) setActiveId(null); save(links.filter(l => l.id !== id)); };

  const favorites = links.filter(l => l.favorited);
  const recents = links.filter(l => !l.favorited).slice(0, 20);

  const renderPlayer = () => {
    if (!activeLink) return (
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Link2 size={48} /><span className="text-sm">粘贴视频链接开始播放</span>
      </div>
    );
    if (playerType === 'video') return <video ref={videoRef} src={activeLink.url} controls autoPlay className="w-full h-full" />;
    if (playerType === 'm3u8') return <video ref={videoRef} controls className="w-full h-full" />;
    if (playerType === 'youtube') return <iframe src={`https://www.youtube.com/embed/${extractYoutubeId(activeLink.url)}?autoplay=1`} allow="autoplay" allowFullScreen className="w-full h-full" />;
    return <iframe src={activeLink.url} className="w-full h-full" sandbox="allow-scripts allow-same-origin allow-presentation" />;
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className={`w-full bg-black rounded-2xl border border-white/10 overflow-hidden aspect-video ${!activeLink ? 'flex items-center justify-center' : ''}`}>
        {renderPlayer()}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUrl()}
          placeholder="粘贴 MP4 / M3U8 / 页面链接..." className="flex-1 bg-[#121212] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 text-sm" />
        <button onClick={addUrl} className="bg-green-700 hover:bg-green-800 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors">▶ 播放</button>
        {activeLink && (
          <button onClick={() => toggleFav(activeLink.id)} className={`px-4 py-3 rounded-xl text-sm transition-colors border ${activeLink.favorited ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
            <Star size={16} fill={activeLink.favorited ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      {activeLink && <div className="text-xs text-gray-500 -mt-3 px-1">类型识别：<span className="text-gray-300">{playerType}</span></div>}
      {favorites.length > 0 && <LinkSection title="★ 收藏" items={favorites} activeId={activeId} onPlay={l => setActiveId(l.id)} onToggleFav={toggleFav} onRemove={remove} />}
      {recents.length > 0 && <LinkSection title="🕐 最近" items={recents} activeId={activeId} onPlay={l => setActiveId(l.id)} onToggleFav={toggleFav} onRemove={remove} />}
    </div>
  );
}

// ─── LiveChannel ──────────────────────────────────────────────────────────────

function LiveChannel() {
  const LS_KEY = 'streamflix_live';
  const [sources, setSources] = useState<LiveSource[]>(() => LS.get(LS_KEY, []));
  const [nameInput, setNameInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const save = (updated: LiveSource[]) => { setSources(updated); LS.set(LS_KEY, updated); };

  const activeSource = sources.find(s => s.id === activeId);

  useEffect(() => {
    hlsRef.current?.destroy();
    if (!activeSource || !videoRef.current) return;
    const el = videoRef.current;
    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(activeSource.url);
      hls.attachMedia(el);
      hls.on(Hls.Events.MANIFEST_PARSED, () => el.play().catch(() => {}));
      hlsRef.current = hls;
    } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = activeSource.url;
      el.play().catch(() => {});
    }
    return () => { hlsRef.current?.destroy(); };
  }, [activeId]);

  const addSource = () => {
    if (!nameInput.trim() || !urlInput.trim()) return;
    const item: LiveSource = { id: crypto.randomUUID(), name: nameInput.trim(), url: urlInput.trim(), addedAt: new Date().toISOString() };
    save([...sources, item]);
    setNameInput(''); setUrlInput('');
  };
  const remove = (id: string) => { if (activeId === id) setActiveId(null); save(sources.filter(s => s.id !== id)); };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {activeSource ? (
        <div className="w-full bg-black rounded-2xl border border-white/10 overflow-hidden aspect-video">
          <video ref={videoRef} controls className="w-full h-full" />
        </div>
      ) : (
        <div className="w-full aspect-video bg-[#0a0a0a] rounded-2xl border border-white/10 flex items-center justify-center text-gray-500">
          <div className="flex flex-col items-center gap-3"><Radio size={48} /><span className="text-sm">选择直播源开始收看</span></div>
        </div>
      )}

      <div className="bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
        <div className="text-sm font-semibold text-gray-300">+ 添加直播源</div>
        <div className="flex gap-2 flex-wrap">
          <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="频道名称" className="flex-1 min-w-32 bg-[#050505] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/30" />
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSource()} placeholder="M3U8 地址" className="flex-[3] min-w-48 bg-[#050505] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/30" />
          <button onClick={addSource} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">添加</button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {sources.length === 0 && <p className="text-gray-600 text-sm text-center py-4">暂无直播源，请添加一个</p>}
        {sources.map(src => (
          <div key={src.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${activeId === src.id ? 'bg-orange-600/20 border-orange-500/40' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
            <Radio size={16} className={activeId === src.id ? 'text-orange-400' : 'text-gray-500'} />
            <span className="flex-1 font-medium text-sm text-white truncate">{src.name}</span>
            <span className="text-xs text-gray-500 truncate max-w-48 hidden sm:block">{src.url}</span>
            <button onClick={() => setActiveId(src.id)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">▶ 播放</button>
            <button onClick={() => remove(src.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SelfHostedChannel ────────────────────────────────────────────────────────

function SelfHostedChannel() {
  const LS_KEY = 'streamflix_selfhosted';
  const [items, setItems] = useState<SavedLink[]>(() => LS.get(LS_KEY, []));
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const save = (updated: SavedLink[]) => { setItems(updated); LS.set(LS_KEY, updated); };

  const activeItem = items.find(i => i.id === activeId);

  const add = () => {
    if (!urlInput.trim()) return;
    const item: SavedLink = { id: crypto.randomUUID(), url: urlInput.trim(), title: titleInput.trim() || urlInput.trim().split('/').pop() || urlInput.trim(), addedAt: new Date().toISOString(), favorited: false };
    save([item, ...items]);
    setTitleInput(''); setUrlInput('');
  };

  const remove = (id: string) => { if (activeId === id) setActiveId(null); save(items.filter(i => i.id !== id)); };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {activeItem && (
        <div className="w-full bg-black rounded-2xl border border-white/10 overflow-hidden aspect-video">
          <video key={activeItem.id} src={activeItem.url} controls autoPlay className="w-full h-full" />
        </div>
      )}

      <div className="bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
        <div className="text-sm font-semibold text-gray-300">+ 添加视频</div>
        <div className="flex gap-2 flex-wrap">
          <input value={titleInput} onChange={e => setTitleInput(e.target.value)} placeholder="标题（可选）" className="flex-1 min-w-32 bg-[#050505] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/30" />
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="视频直链 URL" className="flex-[3] min-w-48 bg-[#050505] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/30" />
          <button onClick={add} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">添加</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.length === 0 && <p className="text-gray-600 text-sm col-span-full text-center py-8">暂无视频，请添加直链</p>}
        {items.map(item => (
          <div key={item.id} className={`group flex flex-col gap-2 cursor-pointer ${activeId === item.id ? 'opacity-100' : ''}`}>
            <div onClick={() => setActiveId(item.id)} className={`relative aspect-video rounded-xl overflow-hidden border ${activeId === item.id ? 'border-purple-500/50' : 'border-white/5'} bg-[#121212] hover:border-white/20 transition-colors`}>
              <video src={item.url} muted preload="metadata" playsInline className="w-full h-full object-cover pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={28} fill="white" className="text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-1">
              <span className="flex-1 text-sm text-white truncate font-medium">{item.title}</span>
              <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared LinkSection (used by YouTube + External channels) ────────────────

function LinkSection({ title, items, activeId, onPlay, onToggleFav, onRemove }: {
  title: string; items: SavedLink[]; activeId: string | null;
  onPlay: (l: SavedLink) => void; onToggleFav: (id: string) => void; onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold text-gray-400">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map(item => (
          <div key={item.id} onClick={() => onPlay(item)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${activeId === item.id ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:border-white/15'}`}>
            <Play size={14} className="text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-sm text-white truncate">{item.title}</span>
            <button onClick={e => { e.stopPropagation(); onToggleFav(item.id); }} className="text-gray-500 hover:text-yellow-400 transition-colors p-0.5 flex-shrink-0">
              <Star size={13} fill={item.favorited ? 'currentColor' : 'none'} className={item.favorited ? 'text-yellow-400' : ''} />
            </button>
            <button onClick={e => { e.stopPropagation(); onRemove(item.id); }} className="text-gray-500 hover:text-red-400 transition-colors p-0.5 flex-shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StreamChannel (placeholder — Cloudflare Stream, pending subscription) ──

function StreamChannel() {
  const features = [
    { icon: '🎬', title: '自动转码', desc: 'Cloudflare Stream 自动将上传视频转为多码率 HLS，无需本地 FFmpeg' },
    { icon: '🌍', title: '全球 CDN', desc: '视频通过 Cloudflare 全球边缘节点分发，首帧速度极快' },
    { icon: '📺', title: '嵌入播放器', desc: '提供官方播放器 iframe，带进度条、全屏、画中画支持' },
    { icon: '🔒', title: '访问控制', desc: '支持签名 URL、Hotlink 保护、IP 限制等安全功能' },
    { icon: '📊', title: '播放分析', desc: '内置观看时长、唯一观看人数、带宽使用等数据分析' },
    { icon: '🔗', title: 'Workers 集成', desc: '通过 CF Workers API 上传、管理视频，与 D1 数据库同步' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-2">
      {/* Header */}
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
          <Film size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Cloudflare Stream</h1>
          <p className="text-gray-400 text-sm">付费托管视频流媒体服务</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            🔜 即将推出
          </span>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-blue-950/40 border border-blue-500/20 rounded-2xl p-4 mb-6 text-sm text-blue-300 leading-relaxed">
        <span className="font-semibold">当前状态：</span>调研准备中。订阅 Cloudflare 捆绑包后，将在此频道实现完整的上传、管理和播放功能。届时可逐步替代或补充 R2 自托管方案。
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((f, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">{f.icon}</span>
            <div>
              <div className="font-medium text-white text-sm mb-1">{f.title}</div>
              <div className="text-gray-400 text-xs leading-relaxed">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Note */}
      <div className="mt-6 bg-[#111] border border-white/10 rounded-2xl p-4 text-xs text-gray-500 leading-relaxed">
        <span className="text-gray-400 font-medium">定价参考：</span>$5/月起，含 1,000 分钟视频存储 + 10,000 分钟流量；超出部分按量计费。Workers &amp; Pages 捆绑包亦有包含。
      </div>
    </div>
  );
}
