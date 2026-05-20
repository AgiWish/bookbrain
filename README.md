# BookBrain · AI 书签大脑

> 让收藏夹里的链接真正被用起来

书签越存越多、搜不到、找不到——BookBrain 用 AI 把浏览器收藏夹变成可检索、可推荐的知识库。DeepSeek 自动生成摘要与标签，pgvector 提供语义相似度搜索，Chrome 插件一键收藏，知识图谱可视化关联关系。

---

## 核心功能

| 功能 | 说明 |
|------|------|
| **AI 自动处理** | DeepSeek 批量生成书签摘要与语义标签，区分 AI 打标 / 用户打标 |
| **语义搜索** | pgvector（vector 1536 维）相似度召回，关键词搜索 + 向量搜索双路并行 |
| **知识图谱** | 可视化书签间关联关系，发现隐藏的知识连接 |
| **去重智能导入** | 导入浏览器书签 HTML，自动检测重复，保留原始目录结构 |
| **Chrome 插件** | 弹窗快速收藏当前页面，显示已钉选书签，Token 鉴权独立于浏览器 Session |
| **分类管理** | 目录 / 子目录 / 标签 / 钉选多维度浏览 |
| **生产部署** | Docker Compose 一键启动，PostgreSQL + pgvector 容器化，带登录保护 |

---

## 系统架构

```
Chrome 插件
    ↓  X-BookBrain-Extension-Token
Next.js App Router (App 层)
    ↓
┌──────────────────────────────────────────┐
│  /api/bookmarks   书签 CRUD              │
│  /api/ai          批量 AI 处理           │
│  /api/search      关键词 + 语义搜索      │
│  /api/graph       知识图谱数据           │
│  /api/tags        标签管理               │
└──────────────────────────────────────────┘
    ↓
PostgreSQL + pgvector
（Bookmark / Tag / BookmarkEmbedding 三张核心表）
    ↓  embedding vector(1536)
DeepSeek API（摘要生成 + 标签提取）
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15（App Router）+ TypeScript |
| 数据库 | PostgreSQL + pgvector（语义向量） |
| ORM | Prisma（含 vector 扩展预览特性） |
| AI | DeepSeek（摘要 + 标签）+ OpenAI 兼容接口 |
| 部署 | Docker Compose（App + PostgreSQL 分离） |
| 插件 | Chrome Extension（Manifest V3） |

---

## 本地运行

```bash
cp .env.example .env.local
docker compose up -d postgres
npx prisma migrate deploy
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

### 手动触发 AI 批处理

```bash
curl -X POST http://localhost:3000/api/ai/process-batch
```

> `NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS` 默认关闭，大量导入时不会自动调用模型，按需手动触发以控制成本。

---

## 生产部署

```bash
docker compose up -d --build
```

App 容器启动前自动执行 `prisma migrate deploy`，端口默认：
- App：`3200`
- PostgreSQL：`127.0.0.1:5433`

登录保护：`BOOKBRAIN_LOGIN_CODE` 必须为 6 位数字，否则返回 503；连续 10 次错误锁定当前 Session。

---

## 关键环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `BOOKBRAIN_LOGIN_CODE` | 6 位登录码 |
| `BOOKBRAIN_EXTENSION_TOKEN` | Chrome 插件鉴权 Token |
| `NEXT_PUBLIC_BOOKBRAIN_AUTO_AI_PROCESS` | 是否自动 AI 处理（默认 false） |

---

*个人效率工具 · 张益豪 · 2025–*
