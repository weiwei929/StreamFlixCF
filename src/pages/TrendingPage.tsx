import { TrendingUp } from 'lucide-react';

export default function TrendingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
      <TrendingUp size={48} className="opacity-30" />
      <p className="text-lg font-medium">热门视频</p>
      <p className="text-sm">即将推出，敬请期待</p>
    </div>
  );
}
