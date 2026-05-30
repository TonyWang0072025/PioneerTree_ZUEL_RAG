# CLAUDE.md — 前人树 (ZUEL-RAG)

## 项目简介

前人树 (ZUEL-RAG) — 专为中南财经政法大学期末复习打造的 AI 辅助本地 Electron 桌面应用。核心理念："前人栽树，后人乘凉 · 厚德济世"。全离线优先架构，除 DeepSeek API 外所有功能零网络依赖。

## 当前任务

Law-Student 引擎整合完成，准备进入最终测试与 electron-builder 打包阶段。

## 开发纪律

**小步快跑**：每完成 2-3 个子任务后必须停下来汇报、提醒用户 git commit，获得允许后再继续。禁止一口气写完大量功能。

汇报时必须主动更新本文件中的"已完成步骤"、"改了哪些文件"和"当前任务"字段。

## 已完成步骤

### Phase 1 — 基座初始化
- Electron 28 + Vue 3 + Vite 项目脚手架
- better-sqlite3 原生模块编译（electron-rebuild 解决 NODE_MODULE_VERSION 不匹配）
- Tailwind CSS 4 主题系统 + KaTeX 公式渲染集成

### Phase 2-3 — 核心数据引擎与渲染准备
- 数据库层 (`electron/db.js`)：FTS5 全文检索、知识块搜索、文档/题库 CRUD、收藏
- 数据预处理 (`scripts/prepare-data.js`)：txt/md/pdf/docx → 索引入库，使用 `electron` 运行时
- 离线资源复制 (`scripts/copy-vendor-assets.js`)：Vditor / PDF.js 本地化
- IPC 通信层 (`electron/preload.js`)：contextBridge 暴露全部方法

### Phase 4 — 全局 UI 框架与笔记集成
- 顶部导航栏 5 标签页 (App.vue) + Vue Router Hash 路由
- SubjectLayout 70/30 分栏 + Vditor WYSIWYG 笔记编辑器（保存/加载/导出 .md）

### Phase 5 — API 链路、全局交互与笔记入库
- DeepSeek API 代理（主进程 fetch，15s AbortController 超时，三级降级）
- MarkdownRenderer（marked + KaTeX 双重渲染，双击查词 → FloatingTooltip）
- Settings 页面 API Key 配置

### Phase 6 — 文档库全格式预览与文科模块
- DocLibrary：FTS5 搜索 + 250ms 防抖 + PDF 分页 / DOCX mammoth / MD 预览
- LawSubject：自动挖空 + 背书对齐
- BookmarkStar 收藏组件

### Phase 7 — 理科模块、组卷、收藏与导出
- MathSubject：极限/导数/积分例题 + KaTeX + AI 深度讲解
- EconSubject：踩点核对 + 得分率
- QuickQuiz：随机抽题卡片流练习
- 笔记导出到本地 .md 文件

### Bug 修复与文档补全
- 添加 `npm start` 脚本
- 修复 App.vue 路由导航不切换内容（$router.push → useRouter + navigate 函数）
- 修复 Vditor zh_CN.js 404（copy-vendor-assets.js 目标路径对齐 `${cdn}/dist/...`）
- 移除 electron-squirrel-startup 残余依赖
- 创建 README.md + MIT LICENSE

### Phase 8 — Law-Student AI 引擎整合
- `src/services/LawStudentService.js` — 封装 4 个法学 Skill 系统提示词（冷不防提问 / 考试预测 / 写作反馈 / 记忆卡片），通过 IPC call-deepseek 调用 AI
- LawSubject.vue 新增 "Law-Student！" 第三个 Tab，保留 70/30 分屏
- 左侧：本地 SQLite 法学文献搜索 + 上下文编辑区 + 4 个功能入口卡片
- 右侧：覆盖 notebook 插槽，MarkdownRenderer 渲染 AI 反馈

## 改了哪些文件

最近一批改动（Phase 8 — Law-Student 整合）：
- `src/services/LawStudentService.js` — 新建 AI 服务层
- `src/views/LawSubject.vue` — 全量重写，整合 Law-Student Tab
- `CLAUDE.md` — 更新项目状态

## 核心文件目录映射

```
PTZR/
├── electron/
│   ├── main.js              # 主进程入口 + 全部 IPC handler
│   ├── preload.js           # contextBridge API 暴露
│   └── db.js                # 数据访问层 (FTS5 + CRUD)
├── src/
│   ├── App.vue              # 根组件 + 顶部导航栏
│   ├── router/index.js      # vue-router Hash 配置
│   ├── assets/main.css      # Tailwind v4 主题 + 打印样式
│   ├── views/
│   │   ├── LawSubject.vue   # 法学（自动挖空 + 背书对齐）
│   │   ├── MathSubject.vue  # 数学（例题 + KaTeX + AI）
│   │   ├── EconSubject.vue  # 经管（踩点核对）
│   │   ├── DocLibrary.vue   # 文档库（FTS5 搜索 + 全格式预览）
│   │   └── Settings.vue     # API Key 配置
│   ├── services/
│   │   └── LawStudentService.js  # 法学 AI 服务层（4 个 Skill 提示词 + DeepSeek 调用）
│   └── components/
│       ├── SubjectLayout.vue    # 70/30 分栏布局
│       ├── NotebookEditor.vue   # Vditor 笔记编辑器
│       ├── MarkdownRenderer.vue # marked + KaTeX 渲染
│       ├── FloatingTooltip.vue  # AI 解释浮动弹窗
│       ├── BookmarkStar.vue     # 收藏按钮
│       └── QuickQuiz.vue        # 随机组卷
├── scripts/
│   ├── prepare-data.js      # 数据预处理（electron 运行时）
│   └── copy-vendor-assets.js # 离线资源复制
├── resources/               # 预处理产物（自动生成）
├── public/                  # 第三方离线资源（自动生成）
├── package.json             # 依赖 + 脚本
├── vite.config.js           # Vite 构建配置
├── electron-builder.json    # 打包配置
├── README.md                # 项目文档
└── LICENSE                  # MIT
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面外壳 | Electron 28 |
| 前端框架 | Vue 3 + Composition API |
| 样式 | Tailwind CSS 4 |
| 构建 | Vite 8 |
| 本地数据库 | better-sqlite3 (FTS5) |
| AI 接口 | DeepSeek API (主进程代理) |
| 公式渲染 | KaTeX |
| 笔记编辑 | Vditor (离线部署) |
| 文档预览 | PDF.js + mammoth.js + marked |
| 打包 | electron-builder |

## 下一步

1. 配置 electron-builder 打包参数（图标、extraResources、NSIS 安装器）
2. 输出 .exe (Windows) / .dmg (Mac) 安装包
3. 全功能人工测试
