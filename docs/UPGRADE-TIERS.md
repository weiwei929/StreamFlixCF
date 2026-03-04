# StreamFlix 升级方案：双层级技术方法

本文档基于 Cloudflare 官方定价与限制，形成两种开发层级的完整技术方案。

---

## 一、层级对比总览

| 维度 | 层级 1：免费方案 | 层级 2：付费入门包 ($5/月) |
|------|------------------|---------------------------|
| **月费** | $0 | $5 起 |
| **视频存储** | 外部 URL（无 Stream） | Cloudflare Stream |
| **视频播放** | HTML5 直链 | HLS/DASH 自适应码率 |
| **缩略图** | 外部 URL 或 Images 免费额度 | Images 付费存储 |
| **数据库** | D1 免费额度 | D1 付费额度 |
| **API** | Workers 免费额度 | Workers 付费额度 |

---

## 二、层级 1：免费方案（Cloudflare 免费层级）

### 2.1 适用场景

- 个人项目、演示、MVP 验证
- 低流量（日活 < 3000）
- 视频使用外部链接（YouTube、自托管等）

### 2.2 各服务限制与容量

#### D1（关系型数据库）

| 指标 | 免费限制 | 说明 |
|------|----------|------|
| 数据库数量 | 10 个/账户 | 足够单应用 |
| 单库最大容量 | 500 MB | 约 10 万条视频元数据 |
| 账户总存储 | 5 GB | 所有 D1 共享 |
| 每日读取 | 500 万行 | 约 170 次/秒持续 |
| 每日写入 | 10 万行 | 约 1.2 次/秒持续 |
| 单次请求查询数 | 50 条 SQL | 需控制批量操作 |
| Time Travel | 7 天 | 点-in-time 恢复 |

**容量估算**：每条视频元数据约 0.5 KB，500 MB 可存约 **100 万条** 记录；500 万行/日读取约支持 **数千 DAU** 的列表/详情查询。

#### Workers（API 层）

| 指标 | 免费限制 |
|------|----------|
| 请求数 | 10 万/天 |
| CPU 时间 | 10 ms/次 |
| 子请求 | 50 次/调用（含 D1 查询） |

#### Pages

- 静态站点：免费、无限制
- Pages Functions：按 Workers 计费

#### Images

| 指标 | 免费限制 |
|------|----------|
| 图片变换 | 5,000 次/月（唯一变换） |
| 超出后 | 返回 9422 错误，可配置回退原图 |

#### Stream

- **免费方案不包含 Stream**，需使用外部视频源。

### 2.3 技术架构（免费）

```
┌─────────────────────────────────────────────────────────────┐
│  Pages (前端) - 免费无限                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ fetch()
┌─────────────────────────▼───────────────────────────────────┐
│  Workers (API) - 10万请求/天                                 │
│  GET /videos, GET /videos/:id, POST /videos (元数据)         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  D1 - 5GB 总存储, 500万读/日, 10万写/日                      │
│  videos(id, stream_id, title, thumbnail, duration, ...)     │
│  注：stream_id 存外部视频 URL                                 │
└─────────────────────────────────────────────────────────────┘

视频文件：外部 URL（YouTube embed、自托管 MP4、R2 直链等）
缩略图：  thumbnail 字段存外部 URL，或 Images 免费 5k 变换
```

### 2.4 实现要点

1. **视频源**：`videoUrl` 使用外部链接（如 R2 直链、自托管、YouTube iframe）
2. **缩略图**：优先外部 URL；需裁剪时用 Images 免费 5k 变换
3. **D1 查询**：加索引、控制单次查询量，避免超 50 条 SQL
4. **Workers**：逻辑精简，单次 CPU < 10ms

---

## 三、层级 2：付费入门包（$5/月起）

### 3.1 套餐说明

- **Workers Paid**：$5/月最低消费
- **Stream**：按用量计费（存储 + 分发）
- **Images**：按用量计费（存储 + 分发 + 变换）

单独购买 Stream + Images 约 $20/月起，通过 **Workers Paid 入门包** 可整合为 **$5/月起**，并随用量扩展。

### 3.2 各服务限制与容量（付费）

#### Workers Paid

| 指标 | 包含额度 | 超额计费 |
|------|----------|----------|
| 请求 | 1,000 万/月 | $0.30/百万 |
| CPU 时间 | 3,000 万 ms/月 | $0.02/百万 ms |
| 单次 CPU | 最长 5 分钟 | - |

#### D1（Workers Paid 下）

| 指标 | 包含额度 | 超额计费 |
|------|----------|----------|
| 读取 | 250 亿行/月 | $0.001/百万行 |
| 写入 | 5,000 万行/月 | $1.00/百万行 |
| 存储 | 5 GB | $0.75/GB·月 |
| 单库容量 | 10 GB | 不可扩展 |
| 单次查询数 | 1,000 条 SQL | - |

#### Cloudflare Stream

| 指标 | 计费方式 |
|------|----------|
| 存储 | $5/1,000 分钟（按视频时长，非文件大小） |
| 分发 | $1/1,000 分钟（实际播放时长） |
| 上传/转码 | 免费 |
| 带宽 | 已含在分发费中 |

**示例**：100 个 10 分钟视频 = 1,000 分钟存储 ≈ $5/月；若每月播放 5,000 分钟 ≈ $5 分发，合计约 $10/月。

#### Cloudflare Images

| 指标 | 计费方式 |
|------|----------|
| 变换 | 5,000 次/月免费 + $0.50/1,000 次 |
| 存储 | $5/10 万张/月 |
| 分发 | $1/10 万张/月 |

### 3.3 技术架构（付费）

```
┌─────────────────────────────────────────────────────────────┐
│  Pages (前端) - 免费                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ fetch()
┌─────────────────────────▼───────────────────────────────────┐
│  Workers (API) - $5/月 含 1000万请求                         │
│  GET /videos, GET /videos/:id, POST /videos                  │
│  POST /upload/token (Stream Direct Creator Upload)           │
└──────────┬────────────────────────────┬────────────────────┘
           │                              │
┌──────────▼──────────┐      ┌───────────▼────────────────────┐
│  D1                 │      │  Stream API (上传/元数据)        │
│  stream_id 存       │      │  - 创建上传 URL                  │
│  Stream Video ID    │      │  - 获取播放信息                  │
└─────────────────────┘      └───────────┬────────────────────┘
                                         │
                          ┌──────────────▼────────────────────┐
                          │  Cloudflare Stream                 │
                          │  - 视频存储、转码、HLS/DASH 分发    │
                          │  - <stream> 播放器                 │
                          └───────────────────────────────────┘

缩略图：Images 存储或 Stream 截帧
```

### 3.4 实现要点

1. **Stream 上传**：使用 Direct Creator Upload，前端拿一次性 URL 直传
2. **播放器**：用 `<stream src={videoId}>` 替代 `<video>`
3. **缩略图**：Stream 自动生成，或存 Images 做裁剪
4. **成本控制**：监控 Stream 存储/分发、Images 用量

---

## 四、开发路线建议

### 阶段 1：免费方案（0 成本验证）

1. 创建 D1 数据库与 schema
2. 部署 Workers API（GET/POST videos）
3. 前端对接 API，视频暂用外部 URL
4. 缩略图用外部 URL 或 Images 免费变换

### 阶段 2：升级付费（按需开通）

1. 开通 Workers Paid（$5/月）
2. 开通 Stream，实现真实上传与 HLS 播放
3. 可选：Images 存储缩略图
4. 将 `videoUrl` 迁移为 `stream_id`，切换播放器

### 阶段 3：成本优化

1. 为 D1 查询加索引，控制 rows_read
2. 使用 Stream 签名 URL 控制访问
3. 定期清理未使用视频，控制 Stream 存储
4. 利用 CDN 缓存降低 Images 分发

---

## 五、Schema 与 API 设计（通用）

两种层级共用同一数据模型，仅 `stream_id` / `videoUrl` 含义不同：

```sql
-- D1 schema (两种层级通用)
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,     -- 免费: 外部URL; 付费: Stream Video ID
  title TEXT NOT NULL,
  thumbnail TEXT,
  duration REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  views INTEGER DEFAULT 0,
  author TEXT
);

CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_videos_author ON videos(author);
```

```typescript
// API 设计
GET  /videos          // 列表，分页
GET  /videos/:id     // 详情
POST /videos         // 创建元数据（付费层含 Stream 上传 URL）
```

---

## 六、参考链接

- [D1 限制](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 定价](https://developers.cloudflare.com/d1/platform/pricing/)
- [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)
- [Stream 定价](https://developers.cloudflare.com/stream/pricing/)
- [Images 定价](https://developers.cloudflare.com/images/pricing/)
