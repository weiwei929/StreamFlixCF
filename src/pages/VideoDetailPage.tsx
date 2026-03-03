import { useParams, useNavigate } from 'react-router-dom';
import { Film, Heart } from 'lucide-react';
import { MOCK_VIDEOS } from '../data';
import PlayerContainer from '../components/PlayerContainer';
import { formatDuration, formatDate } from '../utils/format';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const video = MOCK_VIDEOS.find(v => v.id === id);
  const recommendedVideos = MOCK_VIDEOS.filter(v => v.id !== id);

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-400 text-lg">视频未找到</p>
        <button onClick={() => navigate('/')} className="text-blue-400 hover:underline">返回首页</button>
      </div>
    );
  }

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
            <div key={v.id} className="flex gap-3 group cursor-pointer" onClick={() => navigate(`/video/${v.id}`)}>
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
