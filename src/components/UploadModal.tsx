import { useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function UploadModal({ onClose }: { onClose: () => void }) {
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
