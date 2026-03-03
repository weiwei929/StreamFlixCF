import { Home, TrendingUp, Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { icon: <Home size={20} />, label: '首页', path: '/' },
    { icon: <TrendingUp size={20} />, label: '热门', path: '/trending' },
    { icon: <Heart size={20} />, label: '收藏', path: '/favorites' },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-4 z-20">
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === item.path ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        >
          {item.icon}
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
