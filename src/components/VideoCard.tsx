import { Film, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Video } from '../types';
import { formatDuration, formatDate } from '../utils/format';

export default function VideoCard({ video }: { video: Video }) {
  const navigate = useNavigate();

  return (
    <div className="group cursor-pointer flex flex-col gap-3" onClick={() => navigate(`/video/${video.id}`)}>
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
