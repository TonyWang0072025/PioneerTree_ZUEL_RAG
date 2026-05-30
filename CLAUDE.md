# CLAUDE.md — 前人树 (ZUEL-RAG)

## 项目简介

前人树 (ZUEL-RAG) — 专为中南财经政法大学期末复习打造的 AI 辅助本地 Electron 桌面应用。核心理念："前人栽树，后人乘凉 · 厚德济世"。全离线优先架构，除 DeepSeek API 外所有功能零网络依赖。

## 当前任务

**局部 UI 细节调整 — ✅ 已完成。** Law-Student 选项卡移至最左侧作为默认 Tab，移除标题栏冗余窗口控制按钮。

## 下一步

1. 在 Electron 中启动应用实测 UI 调整效果（Tab 顺序、标题栏）
2. 配置 electron-builder 打包参数（图标、extraResources、NSIS 安装器）
3. 输出 .exe (Windows) 安装包
4. 全功能人工测试

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

### Phase 9 — 视觉重构与 Law-Student 适配
- 提取 `_ui_reference/` 设计规范（DESIGN-HANDOFF.md + DESIGN-MANIFEST.json + 8 个 HTML）→ 全局 CSS 令牌系统
- `src/assets/main.css` — 全量重写：`:root` 变量、scrollbar、.titlebar/.sidebar/.card/.btn/.mode-switcher/.notes-panel 等 70+ 全局类
- `App.vue` — 从水平 top-nav 重构为 titlebar(38px) + sidebar(220px) + main-content + statusbar(28px) 四区布局
- `SubjectLayout.vue` — 右侧栏改为 notes-panel(320px) 设计外壳
- `LawSubject.vue` — 模板全面重构：page-header、mode-switcher/mode-btn、card/card-header、skill-grid/skill-card 适配
- `NotebookEditor.vue` — notes-header + notes-btn 按钮样式对齐设计规范

### Phase 9 第二部分 — 全局 UI 清理与侧边栏高级交互
- 删除 `App.vue` sidebar-footer 账户 UI（纯本地应用，无需用户图像/名）
- `App.vue` statusbar 实现真实 API 连接状态：IPC `getApiKey` 查询 SQLite → 绿点"已连接" / 灰点"未配置"
- `SubjectLayout.vue` 添加 4px resize handle + mousedown/mousemove/mouseup 拖拽调整右侧栏宽度（20%-50%约束）+ 折叠按钮
- `SubjectLayout.vue` 支持 `showAiTab` prop → 右侧栏顶部 Tabs [记事本 | AI 导师] + keep-alive
- `LawSubject.vue` 接入右侧栏 Tabs 机制：AI 响应移入 `ai-tutor` slot，不再覆盖笔记本；触发 Skill 时自动切换到 AI 导师 Tab

### Bug 修复 — 开发环境路径与 FTS5 搜索（✅ 全部完成）

#### 修复 1：`process.resourcesPath` 开发环境指向错误
- **问题：** `process.resourcesPath` 在 dev 下指向 `node_modules\electron\dist\resources`
- **修复：** `electron/db.js` + `electron/main.js` — resourcesPath 加 `app.isPackaged` 判断

#### 修复 2：FTS5 snippet 列索引错误
- **问题：** `snippet(idx.documents_fts, 1, ...)` — FTS5 列索引从 0 开始，`1` 超出单列表范围
- **修复：** 改为 `snippet(documents_fts, -1, ...)` 使用裸表名 + 全列匹配

#### 修复 3：FTS5 MATCH 语法错误
- **问题：** `WHERE idx.documents_fts MATCH ?` — SQLite 将带 schema 前缀的表名误判为列名
- **修复：** 改为 `WHERE documents_fts MATCH ?` 使用裸表名

#### 修复 4：增加搜索日志
- `electron/main.js` `search-documents` handler — 打印关键词、结果数量、错误堆栈
- `electron/db.js` `searchDocuments()` — 打印查询参数和结果数、空查询保护、idx attach 状态检查

#### ✅ 修复 5：FTS5 ATTACH 裸表名（最终修复，解决问题）
- **问题：** 修复 2/3 将 MATCH 和 snippet() 改为别名 `fts`，但在 ATTACH 数据库中，FTS5 的 `MATCH` 运算符和 `snippet()` 函数不识别别名也不识别 `idx.` 前缀，必须使用**裸表名** `documents_fts`。查询始终因 `no such column: fts` 错误而返回空结果。
- **诊断过程：**
  1. 直接连入 `index.db` — 验证 20 条文档、FTS5 MATCH 正常、中文分词正常
  2. 模拟 `ATTACH` + 裸表名测试 — 确认 `FROM idx.documents_fts` 需要 `idx.` 前缀但 `MATCH` 和 `snippet()` 只能用 `documents_fts`
  3. 对比测试：`WHERE fts MATCH ?` (❌) vs `WHERE documents_fts MATCH ?` (✅)
- **修复：** 去掉别名，FROM 用 `idx.documents_fts`（需要 schema 前缀定位表），MATCH 和 snippet() 用 `documents_fts`（裸表名才能被 FTS5 模块识别）

## 改了哪些文件

最近一批改动（UI 细节调整）：
- `src/views/LawSubject.vue` — modes 数组重排，Law-Student 移至第一位作为默认 Tab
- `src/App.vue` — 移除 titlebar-controls（最小化/最大化/关闭按钮）
- `src/assets/main.css` — 移除 .titlebar-controls / .titlebar-btn 样式规则

## 核心文件目录映射

```
PTZR/
├── electron/
│   ├── main.js              # 主进程入口 + 全部 IPC handler
│   ├── preload.js           # contextBridge API 暴露
│   └── db.js                # 数据访问层 (FTS5 + CRUD)
├── src/
│   ├── App.vue              # 根组件 + sidebar 布局
│   ├── router/index.js      # vue-router Hash 配置
│   ├── assets/main.css      # Tailwind v4 主题 + 70+ 全局类
│   ├── views/
│   │   ├── LawSubject.vue   # 法学（挖空 + 对齐 + Law-Student）
│   │   ├── MathSubject.vue  # 数学（例题 + KaTeX + AI）
│   │   ├── EconSubject.vue  # 经管（踩点核对）
│   │   ├── DocLibrary.vue   # 文档库（FTS5 搜索 + 全格式预览）
│   │   └── Settings.vue     # API Key 配置
│   ├── services/
│   │   └── LawStudentService.js  # 法学 AI 服务层
│   └── components/
│       ├── SubjectLayout.vue    # 70/30 分栏 + resize + Tabs
│       ├── NotebookEditor.vue   # Vditor 笔记编辑器
│       ├── MarkdownRenderer.vue # marked + KaTeX 渲染
│       ├── FloatingTooltip.vue  # AI 解释浮动弹窗
│       ├── BookmarkStar.vue     # 收藏按钮
│       └── QuickQuiz.vue        # 随机组卷
├── scripts/
│   ├── prepare-data.js      # 数据预处理（electron 运行时）
│   └── copy-vendor-assets.js # 离线资源复制
├── raw-data/                # 原始复习资料（用户放入）
├── resources/               # 预处理产物（prepare-data 生成）
│   ├── documents/           # 复制过来的原始文档
│   └── dist-data/
│       ├── index.db         # FTS5 全文索引数据库
│       └── knowledge_chunks.json
├── public/                  # 第三方离线资源（copy-assets 生成）
├── _ui_reference/           # 设计规范参考文件
├── package.json
├── vite.config.js
├── electron-builder.json
├── README.md
└── LICENSE
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
