# AI News

> 每日人工智能新闻聚合与展示的静态网站 · A static site that aggregates and displays daily AI news.

---

## 简介 / Overview

**中文** — AI News 是一个纯前端静态网站，每日自动抓取并聚合人工智能领域的新闻，支持中英双语、暗/亮主题切换、邮件订阅与历史版本浏览。新闻数据存放在 `data/news.json`，由原生 JavaScript 负责渲染。

**EN** — AI News is a pure-frontend static site that automatically aggregates daily AI news. It supports a bilingual (zh/en) interface, dark/light theme switching, email subscription, and historical edition browsing. News data lives in `data/news.json` and is rendered with vanilla JavaScript.

---

## 功能特性 / Features

- 中英双语界面，语言偏好持久化（localStorage）· Bilingual UI with persisted language preference
- 暗色 / 亮色主题切换 · Dark / light theme toggle
- 新闻网格、分类筛选、文章详情、相关推荐 · News grid, category filter, detail view, related articles
- 阅读历史（基于 hash 路由 + localStorage，上限 20 条）· Reading history via hash routing + localStorage (capped at 20)
- Supabase 用户认证与订阅偏好 · Supabase auth and subscription preferences
- Resend 邮件订阅与每日简报 · Email subscription and daily newsletter via Resend
- 历史版本浏览 · Edition history browsing
- 每日 7:30 自动化更新（定时任务抓取新闻并推送 GitHub）· Daily 07:30 automated news update via scheduled task

---

## 技术栈 / Tech Stack

| 层 / Layer | 选型 / Choice |
|-----------|---------------|
| 前端 / Frontend | 原生 HTML / CSS / JavaScript（无框架）· Vanilla, no framework |
| 认证与数据 / Auth & Data | Supabase JS SDK |
| 邮件 / Email | Resend |
| 测试 / Testing | Playwright（端到端）· Playwright (E2E) |
| 部署 / Deploy | Vercel 构建 + Cloudflare DNS 代理 + 自定义域名 `xjagent.cn` |
| 自动化 / Automation | WorkBuddy 定时任务（每日 07:30）· Scheduled task at 07:30 |

---

## 目录结构 / Project Structure

```
ai-news/
├── index.html            # SPA 入口 / SPA entry (nav, grid, auth modal, footer)
├── js/
│   ├── app.js           # 主逻辑：状态、主题、渲染、路由 / core app logic
│   ├── auth.js          # Supabase 认证 / Supabase auth
│   └── i18n.js          # 中英双语字典 / bilingual dictionary
├── css/
│   └── style.css        # 全局样式与主题变量 / global styles & theme vars
├── data/
│   ├── news.json        # 当前新闻数据源（按日期组织）/ current news data
│   ├── archive/         # 历史版本归档 / historical editions
│   └── news.schema.json # 数据格式校验 schema / validation schema
├── api/                 # Vercel serverless（邮件订阅、简报）/ serverless functions
├── tests/               # Playwright 端到端测试 / E2E tests
├── scripts/
│   └── validate-news.js # news.json schema 校验 / schema validator
└── vercel.json          # Vercel 配置（含每日简报 cron）/ Vercel config
```

---

## 本地开发 / Local Development

```bash
npm install
npm run serve        # 本地静态服务，端口 3456 / local static server on :3456
# 打开 http://localhost:3456
```

---

## 测试 / Testing

端到端测试基于 [Playwright](https://playwright.dev/)，覆盖首页、导航路由、i18n、主题、阅读历史、图片可用性、响应式、可访问性与性能等 **10 个 spec 文件、共 88 个用例**，并在 3 种设备上执行：

E2E tests use Playwright across **10 spec files / 88 cases**, executed on 3 device projects:

- `chromium` — 桌面 Chrome / Desktop Chrome
- `mobile-chrome` — Pixel 5 移动端 / Mobile
- `tablet` — iPad (gen 7) 平板 / Tablet

```bash
npm test                 # 运行全部（三端）/ run all projects
npm run test:chromium    # 仅桌面 Chrome / desktop only
npm run test:mobile      # 仅移动端 / mobile only
npm run test:ui          # 交互式 UI 模式 / interactive UI mode
npm run test:report      # 查看 HTML 报告 / open HTML report
node scripts/validate-news.js   # 校验 news.json 格式 / validate news data
```

测试报告见 [TEST_REPORT.md](./TEST_REPORT.md)。

See [TEST_REPORT.md](./TEST_REPORT.md) for the latest test report.

---

## 部署 / Deployment

CI/CD 链路（自动）：

The delivery pipeline (automatic):

```
AI 工具 / 定时任务 (07:30)
   │ 抓取新闻 → 写 data/news.json → git push
   ▼
GitHub (main) ── push 触发 webhook
   ▼
Vercel ──────── 拉取仓库、构建、部署（源站 ai-news.vercel.app）
   ▼
Cloudflare ──── DNS 托管 + 代理回源（在前）/ DNS hosting + proxy (in front)
   ▼
xjagent.cn ──── 国内可访问 / reachable in CN
```

- 推送 `main` 即触发 Vercel 自动构建部署。· Pushing to `main` triggers Vercel auto-deploy.
- 域名 DNS 托管于 Cloudflare，CNAME 回源到 Vercel 子域。· DNS is hosted on Cloudflare, CNAME-proxied to the Vercel subdomain.
- `vercel.json` 内含每日 01:00 UTC 的简报 cron。· `vercel.json` includes a daily 01:00 UTC newsletter cron.

---

## 数据格式 / Data Format

`data/news.json` 由一篇 `featured`（头条，id:0）与若干 `articles`（id:1..N）组成；每篇含双语 `en` / `zh` 的对象（title / excerpt / content）以及 `category`、`image`、`readTime`、`timeAgo`、`date` 等字段。

`data/news.json` consists of one `featured` (id:0) and N `articles` (id:1..N). Each item has bilingual `en` / `zh` objects (title / excerpt / content) plus `category`, `image`, `readTime`, `timeAgo`, `date`.

- `category` 取值：`llm` / `cv` / `robotics` / `ethics` / `healthcare` / `research` / `business` / `infra` / `policy`
- `image` 必须为可公开访问的 URL（image-validity 测试会校验加载成功）· URL must be reachable (image-validity test asserts load success)
- 修改数据后请运行 `node scripts/validate-news.js` 校验。· Run the validator after editing data.

---

## 许可证 / License

ISC — 详见 [package.json](./package.json)。· See [package.json](./package.json).
