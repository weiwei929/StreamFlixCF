import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import UploadModal from './components/UploadModal';
import HomePage from './pages/HomePage';
import VideoDetailPage from './pages/VideoDetailPage';
import TrendingPage from './pages/TrendingPage';
import FavoritesPage from './pages/FavoritesPage';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white font-sans">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/video/:id" element={<VideoDetailPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
          </Routes>
        </main>

        <MobileNav />
      </div>

      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
}
