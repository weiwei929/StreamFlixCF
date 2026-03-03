import type { Video } from '../types';

interface CloudflarePlayerProps {
  video: Video;
  className?: string;
}

/**
 * Cloudflare Stream 播放器占位组件。
 *
 * 当 stream_id 为真实 Cloudflare Stream ID 时，此组件将渲染
 * <stream> 嵌入式播放器，支持 HLS/DASH 自适应码率。
 *
 * 当前阶段：stream_id 仍为占位值 (stream_001 等)，
 * 因此回退到标准 HTML5 <video> 标签。
 *
 * 接入步骤：
 * 1. 在 Cloudflare Dashboard 开通 Stream 服务
 * 2. 上传视频，获取真实 stream_id (uid)
 * 3. 将 seed.sql 中的 stream_id 更新为真实值
 * 4. 取消下方 <stream> 标签的注释，删除 <video> 回退
 */
export default function CloudflarePlayer({ video, className }: CloudflarePlayerProps) {
  const isRealStreamId = video.stream_id && !video.stream_id.startsWith('stream_');

  if (isRealStreamId) {
    return (
      <>
        {/* @ts-expect-error -- <stream> is a Cloudflare custom element */}
        <stream
          src={video.stream_id}
          controls
          preload="auto"
          autoplay
          style={{ width: '100%', height: '100%' }}
          className={className}
        />
        <script
          data-cfasync="false"
          defer
          type="text/javascript"
          src="https://embed.videodelivery.net/embed/r4.core.js"
        />
      </>
    );
  }

  return (
    <video
      src={video.videoUrl}
      poster={video.thumbnail}
      controls
      className={`w-full h-full object-contain ${className ?? ''}`}
      autoPlay
    >
      Your browser does not support the video tag.
    </video>
  );
}
