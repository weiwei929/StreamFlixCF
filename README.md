# 🎬 StreamFlix - 现代视频平台

StreamFlix 是一个基于 **React + Tailwind CSS** 构建的现代视频平台，完全运行在 **Cloudflare 生态**（Pages + Workers + D1 + R2）上。采用深色模式高级质感设计，支持文件夹分组浏览、视频播放、自动元数据同步等功能。

---

## ✨ 功能特性

- **文件夹分组浏览**：主页按 R2 文件夹结构自动分组，支持折叠/展开，适合大量文件管理
- **真实视频时长**：从视频元数据自动读取，无需手动填写
- **来源路径显示**：每个视频卡片显示其在 R2 中的真实路径（如 `video/shows`）
- **响应式瀑布流**：支持从手机端（1列）到 4K 大屏（5列）的自适应网格布局
- **定制化播放器**：支持 90° 视频旋转（自动适配 9:16 竖屏比例）和多档倍速播放
- **骨架屏加载**：优雅的加载动画，提升首屏加载体验
- **移动端适配**：专属的移动端底部毛玻璃导航栏
- **Admin API 鉴权**：写操作（新增、修改）及管理接口均需 Bearer Token 验证

---

## 📁 文件管理说明

> **文件管理以 Cloudflare R2 后台为主，站点仅负责展示与播放。**

### 工作流程

```
Cloudflare R2 后台（上传 / 移动 / 删除文件）
        ↓ 自动触发 Queue 事件
   Workers 处理同步
        ↓
   D1 数据库（视频元数据）
        ↓
  vid.mgtv.dev 展示 & 播放
```

### 支持的文件夹结构

R2 bucket `pf2008` 下以 `video/` 为根目录：
```
video/           ← 根目录
├── 视频A.mp4
├── shows/       ← 子文件夹，自动识别
│   └── 视频B.mp4
└── movies/
    └── 视频C.mp4
```

站点主页会自动按此结构分组显示，新增文件夹无需任何代码改动。

### 手动同步

若 Queue 未触发，可手动调用同步接口：

```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://streamflix-api.pennfly2008.workers.dev/admin/sync-r2
```

---

## ⚠️ 视频格式建议

R2 视频请使用 **H.264 + MP4** 格式，避免 H.265/HEVC（Chrome 不原生支持，会导致重复下载、流量异常）：

```bash
ffmpeg -i input.mp4 -c:v libx264 -c:a aac -movflags +faststart output.mp4
```

---

## 🔐 Admin API 鉴权

以下接口需要 `Authorization: Bearer <ADMIN_TOKEN>` 请求头：

| 接口 | 说明 |
|------|------|
| `GET /admin/sync-r2` | 手动触发 R2 → D1 全量同步 |
| `GET /admin/diagnostics` | 查看 R2 与 D1 数据差异 |
| `POST /videos` | 新建视频元数据 |
| `PATCH /videos/:id` | 修改视频元数据 |

以下接口**公开访问**（前端必须能调用）：

| 接口 | 说明 |
|------|------|
| `GET /videos` | 获取视频列表（分页） |
| `GET /videos/:id` | 获取单个视频详情 |

### 设置 / 更换 Token

```bash
# 生成新 Token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 上传到 Cloudflare（加密存储）
cd workers && npx wrangler secret put ADMIN_TOKEN

# 重新部署 Worker
npm run deploy:api
```

本地调试：在 `workers/.dev.vars` 中添加：
```
ADMIN_TOKEN=你的token
```

---

## 🚀 本地开发

```bash
npm install       # 安装依赖
npm run dev       # 启动前端开发服务器（端口 3000）
npm run dev:api   # 启动 Worker 本地服务
```

## 部署

```bash
npm run deploy        # 构建并部署前端到 Cloudflare Pages
npm run deploy:api    # 部署 Worker API
npm run deploy:pause  # 部署维护页（紧急暂停站点）
```

---

## ☁️ Cloudflare 全栈部署指南

详见 [docs/SETUP-FREE-TIER.md](docs/SETUP-FREE-TIER.md) 和 [docs/UPGRADE-TIERS.md](docs/UPGRADE-TIERS.md)。

### D1 数据库初始化

```bash
npx wrangler d1 create streamflix-db
npx wrangler d1 execute streamflix-db --file=./schema.sql --remote
```

### 接入 Cloudflare Stream（付费可选）

在 `src/App.tsx` 的 `PlayerContainer` 中，将 `<video>` 替换为 `<stream>` 标签，并引入 Stream 播放器脚本。详见 README 原版说明（docs/UPGRADE-TIERS.md 层级 2）。

---

## 📋 升级路线

- **层级 1（当前，免费）**：R2 直链 + D1 + Workers，完整自托管视频平台
- **层级 2（$5/月起）**：接入 Cloudflare Stream，获得 HLS/DASH 自适应码率播放

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + Vite |
| 样式方案 | Tailwind CSS v4 |
| 图标库 | Lucide React |
| 前端托管 | Cloudflare Pages |
| API | Cloudflare Workers (TypeScript) |
| 数据库 | Cloudflare D1 (SQLite) |
| 对象存储 | Cloudflare R2 |
