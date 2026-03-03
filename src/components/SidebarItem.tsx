import React from 'react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  active?: boolean;
  onClick?: () => void;
}

export default function SidebarItem({ icon, label, isOpen, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      {isOpen && <span className="font-medium whitespace-nowrap">{label}</span>}
    </button>
  );
}
