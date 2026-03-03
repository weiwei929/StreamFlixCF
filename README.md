# 🎬 StreamFlix - 现代视频平台原型

StreamFlix 是一个基于 React + Tailwind CSS 构建的现代视频平台前端原型。它采用了类似 Netflix / YouTube Premium 的深色模式高级质感设计，包含响应式视频瀑布流、视频播放器（支持旋转和倍速）、骨架屏加载以及模拟上传功能。

本项目专为 **Cloudflare 生态 (Pages + Workers + D1 + Stream)** 部署而设计。

## ✨ 功能特性

- **高级深色模式**：使用 `#050505` 背景色与毛玻璃 (Backdrop Blur) 效果。
- **响应式瀑布流**：支持从手机端 (1列) 到 4K 大屏 (5列) 的自适应网格布局。
- **定制化播放器**：支持 90 度视频旋转（自动适配 9:16 竖屏比例）和多档倍速播放。
- **骨架屏加载**：优雅的 `Skeleton` 动画，提升首屏加载体验。
- **移动端适配**：专属的移动端底部毛玻璃导航栏。

---

## 🚀 本地开发指南

1. **克隆项目并安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **构建生产版本**
   ```bash
   npm run build
   ```

---

## ☁️ Cloudflare 全栈部署指南

本项目的前端部分可以直接部署到 Cloudflare Pages。如果需要将其转化为真正的全栈应用，请按照以下步骤配置 Cloudflare 的各项服务。

### 1. 部署前端到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> 点击 **Create application** -> 选择 **Pages** 选项卡 -> **Connect to Git**。
3. 选择你存放此代码的 GitHub 仓库。
4. 在 **Set up builds and deployments** 阶段，配置如下：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. 点击 **Save and Deploy**。你的前端页面现在已经上线了！

### 2. 配置 Cloudflare D1 (关系型数据库)

D1 将用于存储视频的元数据（标题、作者、Stream ID 等）。

1. **创建数据库**：
   在本地终端运行（需要安装 wrangler）：
   ```bash
   npx wrangler d1 create streamflix-db
   ```
2. **初始化数据表 (Schema)**：
   创建一个 `schema.sql` 文件，包含以下内容：
   ```sql
   DROP TABLE IF EXISTS videos;
   CREATE TABLE videos (
     id TEXT PRIMARY KEY,
     stream_id TEXT NOT NULL,
     title TEXT NOT NULL,
     thumbnail TEXT,
     duration REAL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     description TEXT,
     views INTEGER DEFAULT 0,
     author TEXT
   );
   ```
3. **执行 SQL 脚本**：
   ```bash
   npx wrangler d1 execute streamflix-db --file=./schema.sql --remote
   ```

### 3. 配置 Cloudflare Workers (后端 API)

Workers 将作为前端和 D1 数据库之间的桥梁。

1. **创建 Worker**：
   ```bash
   npm create cloudflare@latest streamflix-api
   ```
2. **绑定 D1 数据库**：
   在 Worker 的 `wrangler.toml` 中添加绑定：
   ```toml
   [[d1_databases]]
   binding = "DB" # 在代码中通过 env.DB 访问
   database_name = "streamflix-db"
   database_id = "你的-d1-database-id"
   ```
3. **编写 API 逻辑**：
   在 Worker 中编写 `GET /videos` 接口，从 D1 读取数据并返回 JSON。
4. **前端对接**：
   将 `src/data.ts` 中的 Mock 数据替换为 `fetch('你的-worker-域名/videos')`。

### 4. 接入 Cloudflare Stream (视频托管与流媒体)

当你在 Cloudflare 购买并开通 Stream 服务后，可以替换掉现有的 HTML5 `<video>` 标签，获得自适应码率 (HLS/DASH) 的极致播放体验。

**步骤 1：上传视频并获取 Stream ID**
- 在 Cloudflare Dashboard 中进入 **Stream**。
- 上传你的视频（或通过 API 上传）。
- 视频处理完成后，复制视频的 **Video ID (uid)**。将这个 ID 存入你的 D1 数据库的 `stream_id` 字段。

**步骤 2：修改前端代码 (`src/App.tsx`)**
找到 `PlayerContainer` 组件，将原本的 `<video>` 标签替换为 Cloudflare Stream 的专属标签：

```tsx
// 修改前的代码：
<video src={video.videoUrl} poster={video.thumbnail} controls autoPlay ... />

// 修改后的代码：
function PlayerContainer({ video }: { video: Video }) {
  // ... 保留之前的旋转和倍速状态逻辑 ...

  return (
    <div className="flex flex-col gap-2">
      <div className={`w-full bg-black rounded-2xl overflow-hidden relative border border-white/10 shadow-lg flex items-center justify-center transition-all duration-300 ${isVertical ? 'aspect-[9/16] max-h-[80vh] mx-auto' : 'aspect-video'}`}>
        
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* 引入 Cloudflare Stream 播放器 */}
          <stream 
            src={video.stream_id} 
            controls 
            preload="auto"
            autoplay="true"
            style={{ width: '100%', height: '100%' }}
          ></stream>
          {/* 必须引入 Stream 的核心脚本 */}
          <script data-cfasync="false" defer type="text/javascript" src="https://embed.videodelivery.net/embed/r4.core.js"></script>
        </div>

      </div>
      {/* ... 保留控制栏代码 ... */}
    </div>
  );
}
```

*注意：React 中使用自定义标签 `<stream>` 可能会有 TypeScript 报错。你可以在 `src/vite-env.d.ts` 或新建一个 `global.d.ts` 文件中添加类型声明：*
```typescript
declare namespace JSX {
  interface IntrinsicElements {
    'stream': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { src: string; controls?: boolean | string; preload?: string; autoplay?: boolean | string }, HTMLElement>;
  }
}
```

---

## 🛠 技术栈

- **前端框架**: React 19 + Vite
- **样式方案**: Tailwind CSS v4
- **图标库**: Lucide React
- **部署目标**: Cloudflare Pages
