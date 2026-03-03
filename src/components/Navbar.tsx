import { Menu, Upload, Search, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  toggleSidebar: () => void;
  onUploadClick: () => void;
}

export default function Navbar({ toggleSidebar, onUploadClick }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-[#050505]/50 backdrop-blur-xl sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hidden sm:block">
          <Menu size={24} />
        </button>
        <div className="font-bold text-xl tracking-tight cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
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
