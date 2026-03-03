import { Home, TrendingUp, Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarItem from './SidebarItem';

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={`transition-all duration-300 ease-in-out flex flex-col border-r border-white/10 bg-[#050505] hidden sm:flex ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col gap-2 p-4 mt-2">
        <SidebarItem icon={<Home size={22} />} label="首页" isOpen={isOpen} active={location.pathname === '/'} onClick={() => navigate('/')} />
        <SidebarItem icon={<TrendingUp size={22} />} label="热门" isOpen={isOpen} active={location.pathname === '/trending'} onClick={() => navigate('/trending')} />
        <SidebarItem icon={<Heart size={22} />} label="收藏" isOpen={isOpen} active={location.pathname === '/favorites'} onClick={() => navigate('/favorites')} />
      </div>
    </aside>
  );
}
