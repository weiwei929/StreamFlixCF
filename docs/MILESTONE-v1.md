# StreamFlix 阶段性里程碑报告 · v1.0

> 记录日期：2026-03-03  
> 部署地址：https://vid.mgtv.dev（主域）/ https://streamflix-a2q.pages.dev（Pages 原始域）  
> Worker API：https://streamflix-api.pennfly2008.workers.dev  
> 最新提交：`a2bc04b`

---

## 一、项目概况

StreamFlix 是一个基于 **Cloudflare 免费层（Free Tier）** 搭建的私有视频平台，架构如下：

| 层级 | 服务 | 说明 |
|---|---|---|
| 前端 | Cloudflare Pages | React 19 + Vite + Tailwind CSS v4 |
| API | Cloudflare Workers | TypeScript，无框架，轻量路由 |
| 数据库 | Cloudflare D1 | `streamflix-db`，存储视频元数据 |
| 存储 | Cloudflare R2 | Bucket `pf2008`，公开域名 `disk.f2008.cf` |

---

## 二、已完成功能

### 2.1 前端界面

- [x] 深色高级质感 UI（`#050505` 背景 + 毛玻璃效果）
- [x] 响应式视频瀑布流（1列 → 5列自适应）
- [x] 骨架屏加载动画
- [x] 移动端底部导航栏
- [x] 视频详情页（标题、作者、观看数、描述）
- [x] 推荐视频侧边栏
- [x] 定制控制栏：90° 旋转（自动适配 9:16 竖屏）、多档倍速
- [x] 搜索框 UI（静态，待接入逻辑）
- [x] 上传弹窗 UI（静态，待接入逻辑）

### 2.2 后端 & 数据

- [x] Worker GET `/videos` — 列出所有视频（从 D1 读取）
- [x] Worker POST `/sync` — 将 R2 中的视频文件同步到 D1（自动补全元数据）
- [x] Worker GET `/audit` — 校验 D1 与 R2 的一致性（查重、残余记录检测）
- [x] Worker PATCH `/videos/:id` — 更新视频元数据字段（thumbnail/title/description 等）
- [x] D1 `streamflix-db` 已运行，当前存有 **7 条**视频记录
- [x] R2 `pf2008` 已运行，当前存有 **7 个**视频文件，与 D1 0 差异

### 2.3 运维 & 安全

- [x] Cloudflare Access 保护（Zero Trust，邮箱+密码登录）
- [x] 维护页（`npm run deploy:pause` 一键切换，停止流量消耗）
- [x] `public/_headers`：`index.html` 设置 `no-cache`，确保部署后立即生效
- [x] `.gitignore` 已追加 `.wrangler/`，排除本地开发缓存

---

## 三、关键问题处理记录

### 3.1 R2 视频流量失控

**现象**：页面加载后即使未点击播放，单次访问消耗 1 GB+ 流量，直到关闭页面才停止。

**根因**：
1. `<video src="url">` 渲染到 DOM 时，即使设置了 `preload="none"`，Chrome 仍会发起 Range 请求探测文件头（moov atom 位置）
2. 原文件 moov atom 在末尾，浏览器需要多次 Range 请求才能定位，导致大量冗余流量

**解决方案**：
1. **PlayerContainer 懒激活**：进入详情页时不渲染 `<video>` DOM 元素，只显示封面覆层。用户点击播放按钮后，才通过 `isActivated` 状态触发 `<video>` 渲染并在 `useEffect` 中设置 `src`
2. **切换/卸载清空 src**：视频切换和组件卸载时执行 `el.src = ''; el.load()` 立即终止所有网络连接
3. **ffmpeg faststart 处理**：对所有 R2 视频用 `ffmpeg -movflags faststart -c copy` 重新封装，将 moov atom 移至文件头，减少 metadata 请求次数

```powershell
# 处理命令（ffmpeg v6.1.2）
& $ffmpeg -i input.mp4 -movflags faststart -c copy output.mp4
```

**当前局限**：MP4 直链无法阻止 Chrome 的激进并发 Range 预读（可通过 HLS 切片解决，纳入后续计划）。

### 3.2 缩略图失效

**现象**：接入 R2/D1 后，视频卡片的缩略图全部显示为破图。

**根因**：`syncR2ToD1` Worker 同步时，将 `thumbnail` 字段设置为与 `videoUrl` 相同的 MP4 地址。用 `<img src={mp4url}>` 渲染时浏览器无法作为图片解码，显示破图。

**错误修复路径**（已废弃）：
- 尝试通过 `canvas.drawImage(<video>)` 截帧并存入 localStorage，再通过 PATCH API 回写 D1
- 因 R2 未配置 CORS `allow-origin` 响应头，跨域 canvas 操作被浏览器安全策略阻断，截帧失败

**正确修复**：
- `VideoCard` 和 `RecommendedItem` 改用 `<video muted preload="metadata">` 直接展示
- `PlayerContainer` 封面覆层同样使用 `<video muted preload="metadata">` 代替 `<img>`
- 浏览器原生解码视频并渲染第一帧作为缩略图，无需 CORS，无需额外 API
- `preload="metadata"` 在 moov faststart 视频上仅读取数十 KB（远小于完整预加载）

```tsx
// 当前方案（src/App.tsx）
<video
  src={video.videoUrl}
  muted
  preload="metadata"
  playsInline
  className="w-full h-full object-cover pointer-events-none"
/>
```

---

## 四、当前数据状态

```
R2 视频列表（disk.f2008.cf/video/）：
  8us6jf.mp4      ← id: r2-8us6jf
  9yljv6.mp4      ← id: video-9yljv6
  g4ko9w.mp4      ← id: video-g4ko9w
  q2dj3h.mp4      ← id: video-q2dj3h
  tlcig1.mp4      ← id: video-tlcig1
  清晰.mp4        ← id: video-清晰
  IMG_1636.MOV    ← id: video-IMG_1636

D1 记录数：7  |  R2 文件数：7  |  差异：0
所有视频 thumbnail 字段 = videoUrl（待长期治理）
```

---

## 五、已知限制 & 后续计划

| 优先级 | 事项 | 说明 |
|---|---|---|
| 高 | **HLS 切片** | 将 MP4 转为 m3u8+ts，彻底解决 Chrome 激进 Range 预读问题 |
| 中 | **视频时长自动识别** | 目前 `duration = 0`，需在同步时用 ffprobe 读取后写入 D1 |
| 中 | **R2 CORS 配置** | 配置 `Access-Control-Allow-Origin`，为未来 canvas 截帧或 Fetch Range 请求做准备 |
| 中 | **搜索功能** | 接入 Workers 全文搜索（D1 LIKE 或 FTS5）|
| 低 | **上传功能** | 前端上传 → R2 Presigned URL → 自动触发 D1 同步 |
| 低 | **升级 Cloudflare Stream** | HLS 自适应码率、正版缩略图 API、全球 CDN 加速（$5/月起）|
| 低 | **Cron 定时同步** | 激活 Worker Cron Triggers，每小时自动同步 R2 → D1 |

---

## 六、技术栈版本速查

| 工具 | 版本 |
|---|---|
| Node.js | LTS |
| Vite | 6.4.1 |
| React | 19 |
| Tailwind CSS | v4 |
| Wrangler | 4.69.0 |
| ffmpeg | n6.1.2（本地处理工具）|

---

## 七、关键命令速查

```bash
# 开发
npm run dev

# 构建
npm run build

# 部署前端（Pages）
node scripts/deploy-pages.mjs

# 部署 Worker API
npm run deploy:api

# 切换维护页（停止流量）
npm run deploy:pause

# 恢复站点
npm run deploy

# 查询 D1 数据
npx wrangler d1 execute streamflix-db --remote --command "SELECT * FROM videos"

# 手动触发 R2→D1 同步
curl -X POST https://streamflix-api.pennfly2008.workers.dev/sync

# 校验 R2/D1 一致性
curl https://streamflix-api.pennfly2008.workers.dev/audit
```

---

# StreamFlix 阶段性里程碑报告 · v1.1

> 记录日期：2026-03-04  
> 基于 v1.0 的安全加固与体验优化

## 新增 / 修复内容

### 🔐 安全加固

- **Admin API Bearer Token 鉴权**：`/admin/sync-r2`、`/admin/diagnostics`、`POST /videos`、`PATCH /videos/:id` 均需 `Authorization: Bearer <ADMIN_TOKEN>`
- Token 通过 `wrangler secret put` 加密存储于 Cloudflare，不出现在代码中
- `workers/.dev.vars` 加入 `.gitignore`

### 🗂️ 文件夹分组浏览

- 主页按 R2 文件夹路径自动分组（从 `stream_id` URL 解析，无需数据库改动）
- 每组支持**折叠 / 展开**（默认收起）
- 新增文件夹自动识别，无需任何代码改动

### 🎬 视频卡片体验

- **真实时长**：`onLoadedMetadata` 事件读取实际时长，不再显示 `0:00`
- **来源路径**：从视频 URL 解析真实文件夹路径（如 `video/shows`）替代硬编码 `R2`

### 📝 文档

- 重写 `README.md`：明确 R2 为主要文件管理入口，记录完整工作流、Admin API 鉴权说明

## 待办项（更新）

| 优先级 | 事项 |
|--------|------|
| 🟡 | 搜索功能 |
| 🟡 | 分页 / 无限滚动 |
| 🟡 | `DELETE /videos/:id` 接口 |
| 🟢 | 路由系统（URL 可分享） |

---

## ⚠️ 故障记录：`.wrangler/` 污染 git 历史导致 push 失败

**现象**：`git push` 失败，错误涉及 GitHub LFS / storage，推送体积异常高达 65MB+。

**根因**：
- `wrangler dev` 本地运行时会在 `.wrangler/state/v3/r2/` 下生成 **大量二进制 blob 文件**（本地 R2 模拟数据）
- `.gitignore` 中虽有 `.wrangler/` 规则，但该目录在 **gitignore 规则生效之前** 已被某次 commit 追踪进 git 历史
- 此后即便 `.gitignore` 生效，git 仍会持续追踪这些文件，并在后续 commit 中记录它们的变化
- 多个 session 积累后，未推送的 commit 中包含了数十 MB 的 wrangler 二进制对象，被 GitHub 拒绝

**解决方式**：

```bash
# 1. 软重置到远程最新 commit（保留所有代码改动在暂存区）
git reset --soft origin/main

# 2. 确认暂存区没有 .wrangler 文件
git status --short | Select-String "wrangler"  # 只应出现 workers/wrangler.toml

# 3. 重新提交（干净 commit，不含 .wrangler/）
git add -A
git commit -m "..."

# 4. 推送
git push origin main --tags
```

**预防措施**：
- 确保 `.gitignore` 中有 `.wrangler/`（已有）
- 若已意外追踪，立即执行：`git rm -r --cached .wrangler/` 并 commit 清理
- 本地运行 `wrangler dev` 前不要执行 `git add -A`，或用 `git status` 确认后再 add
