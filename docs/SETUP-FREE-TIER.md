# 层级 1 实施记录：D1 + R2 免费方案

本文档记录 StreamFlix 免费方案（D1 + R2）的准备工作及实施成果。

---

## 一、R2 存储准备

### 1.1 存储桶配置

| 项目 | 值 |
|------|-----|
| **存储桶名称** | pf2008 |
| **账户 ID** | 0f0b7b5320f7022bf49994c35f002ab3 |
| **控制台路径** | [R2 存储桶 pf2008](https://dash.cloudflare.com/0f0b7b5320f7022bf49994c35f002ab3/r2/default/buckets/pf2008) |

### 1.2 公开访问

| 配置项 | 状态 |
|--------|------|
| **公开访问** | ✅ 已启用 |
| **自定义域** | disk.f2008.cf |
| **公共开发 URL** | https://pub-d66c74b641ca4ba6a60c53ea70c080da.r2.dev |

**视频 URL 格式**：`https://disk.f2008.cf/<object-key>`

### 1.3 CORS 策略

| 允许的源 | 允许的方法 | 允许的标头 |
|----------|------------|------------|
| https://vid.mgtv.dev, https://streamflix-a2q.pages.dev, http://localhost:3000 | GET, HEAD | * |

### 1.4 验证结果

**测试视频**：`video/8us6jf.mp4`

- **公开 URL**：https://disk.f2008.cf/video/8us6jf.mp4
- **浏览器播放**：✅ 正常
- **加载表现**：1.9 MB，约 2.34 秒完成

---

## 二、D1 数据库

| 项目 | 值 |
|------|-----|
| **数据库名称** | streamflix-db |
| **database_id** | b56c85ef-4bdb-4993-9f2d-6a83cf116b90 |
| **区域** | WNAM |
| **Schema** | `schema.sql` |

**执行记录**：已执行 `wrangler d1 execute streamflix-db --file=./schema.sql --remote`

---

## 三、Workers API

| 项目 | 值 |
|------|-----|
| **Worker 名称** | streamflix-api |
| **API 地址** | https://streamflix-api.pennfly2008.workers.dev |
| **部署命令** | `npm run deploy:api` |

### 接口说明

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /videos | 视频列表，支持 `?limit=20&offset=0` |
| GET | /videos/:id | 视频详情 |
| POST | /videos | 创建视频元数据 |
| GET | /admin/sync-r2 | 手动同步 R2 存储桶 `video/` 目录下视频到 D1 |

### R2 自动同步（Cron + Queue）

| 触发方式 | 说明 |
|----------|------|
| **Cron** | 每小时整点执行全量同步（`0 * * * *`） |
| **Queue** | R2 `video/` 下对象创建/删除时实时同步到 D1 |

**首次配置**：执行 `npm run r2-sync:setup` 创建 Queue 并添加 R2 事件通知。

---

## 四、前端对接

- **API 配置**：通过 `VITE_API_URL` 环境变量或默认使用 Workers 地址
- **数据流**：`fetchVideos()` → API → D1，失败时回退到 Mock 数据
- **R2 同步**：Cron 每小时 + Queue 实时触发，也可手动调用 `GET /admin/sync-r2`
- **缩略图**：使用静态占位符（零流量），详见 [TRAFFIC-SAFETY.md](./TRAFFIC-SAFETY.md)
