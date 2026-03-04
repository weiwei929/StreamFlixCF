# 参考项目分析：KVideo & HLS 预切片技术

> 参考来源：`KVIDEO_ANALYSIS.md`、`HLS_PRESLICE_GUIDE.md`  
> 分析日期：2026-03-04  
> 结论：部分技术可直接借用，已有内容落实到当前架构

---

## 一、KVideo 项目能借用什么

KVideo 是基于 Next.js 的前端视频聚合播放器，核心是用 hls.js 播放第三方采集站 API 返回的 m3u8 链接。

### 1.1 可直接借用的技术

| 技术模块 | KVideo 实现 | 对 StreamFlix 的价值 | 状态 |
|---------|-----------|-------------------|------|
| **HLS.js 集成** | `useHlsPlayer.ts` 钩子，支持多分辨率切换、卡顿检测、iOS Blob URL 降级 | 直播源频道和外站 m3u8 播放 | ✅ **已落实**（`hls.js` 已安装并集成到 `LiveChannel`、`ExternalChannel`）|
| **M3U8 URL 重写代理** | `proxy-utils.ts`，重写 m3u8 内的 `.ts` 分片 URL 为代理路径，解决 CORS | 未来公开 IPTV 源出现 CORS 时的兜底 | 🟡 **待实现**（在 Worker 加 `/api/proxy` 端点）|
| **请求重试逻辑** | `fetch-with-retry.ts` | 代理环境下提升稳定性 | 🟡 低优先级，按需添加 |
| **IPTV 频道管理 UI** | KVideo 有独立 IPTV 模块，支持源列表增删 | 直播源频道的 UI 设计参考 | ✅ **参考落实**（`LiveChannel` 的列表 + 增删 UI）|

### 1.2 不适合借用的部分

| 内容 | 原因 |
|------|------|
| KVideo 的采集站 API 模型 | 设计给「搜索 → 详情 → 播放」三步走接口，与 StreamFlix 的直链模型不兼容 |
| KVideo 的账号/订阅系统 | 个人使用，不需要 |
| KVideo 全套代码 Fork | 维护成本高，架构差异大，不划算 |

---

## 二、HLS 预切片技术的应用

HLS 预切片 = 用 FFmpeg 一次性将视频切成 `.m3u8 + .ts` 分片，上传到存储，播放时服务器只做静态分发。

### 2.1 与当前架构的对应

| 场景 | 建议方式 | 原因 |
|------|---------|------|
| R2 视频（已上传的 mp4）| **按需预切片** | 一次切片，零成本多次播放；R2 存 mp4 直链也可，取决于大小 |
| 直播源（公开 IPTV）| **不需要切片** | 直播源本身就是 m3u8，直接 hls.js 播放 |
| PikPak 离线视频（未来）| **本地预切片后上传** | PikPak 自身提供原生 HLS，无需手动切片 |
| CF Stream（待购）| **不需要切片** | CF Stream 自动转码，上传原始视频即可 |

### 2.2 预切片工作流（本地）

```bash
# 将 R2 上的视频在本地预切片后重新上传（可选优化）
ffmpeg -i video.mp4 \
  -c copy \
  -hls_time 10 \
  -hls_list_size 0 \
  -hls_segment_filename "output/seg_%03d.ts" \
  output/index.m3u8

# 上传切片到 R2（使用 rclone 或 wrangler r2 object put）
```

> **注意**：目前 R2 存的是 mp4 直链，浏览器原生 `<video>` 支持范围请求（Range Request），无需额外切片即可流畅播放。只有当文件极大（>2GB）或需要多码率自适应时才值得切片。

---

## 三、已落实到 StreamFlix 的结论

### 直接采用
1. **hls.js** — 已安装（v1.x），用于直播源 + 外站 m3u8 播放
2. **IPTV 列表管理 UI 模式** — 参考 KVideo，实现了 LiveChannel 的增删列表

### 待实现（优先级排序）

| 优先级 | 功能 | 参考来源 |
|--------|------|---------|
| 🟡 P1 | Worker 加 `/api/proxy` CORS 代理端点（解决部分直播源跨域） | KVideo `proxy-utils.ts` |
| 🟡 P2 | CF Stream 频道的真实实现 | 需先订阅 CF 捆绑包 |
| 🟢 P3 | hls.js 卡顿检测 + 代理回退策略 | KVideo `useHlsPlayer.ts` |
| 🟢 P3 | 预切片工作流脚本（如有大文件需求）| `HLS_PRESLICE_GUIDE.md`|

---

## 四、结论

> KVideo 最有价值的贡献是**验证了 hls.js 在 Cloudflare 生态中的可行性**，以及提供了**M3U8 CORS 代理的参考实现**。  
> HLS 预切片在当前阶段对 StreamFlix 意义有限（R2 mp4 直链已够用），但为未来大文件或多码率场景做了技术储备。
