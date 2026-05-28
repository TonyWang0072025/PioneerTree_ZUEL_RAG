# 前人树 (ZUEL-RAG)

> 前人栽树，后人乘凉 · 厚德济世

**专为中南财经政法大学期末复习打造的 AI 辅助桌面应用。**

## 核心能力

- **离线文档库** — 全文检索 + PDF/Word/Markdown 离线预览，无需网络
- **AI 智能辅导** — 基于 DeepSeek API 的名词解释、数学分步推导、记忆核对
- **学科专属模块** — 法学背书对齐/自动挖空、经管踩点核对、数学逐步解析
- **边搜边记** — 基于 Vditor 的所见即所得 Markdown 笔记，支持导出 .md
- **随机组卷** — 从本地题库随机抽题，卡片流练习
- **全离线优先** — 除 AI 接口外，所有功能零网络依赖

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面外壳 | Electron 28 |
| 前端框架 | Vue 3 + Tailwind CSS 4 |
| 构建工具 | Vite |
| 本地数据库 | better-sqlite3 (FTS5 全文检索) |
| AI 接口 | DeepSeek API |
| 公式渲染 | KaTeX |
| 笔记编辑器 | Vditor (离线部署) |
| 文档预览 | PDF.js + mammoth.js + marked |

## 项目结构

```
PTZR/
├── electron/           # Electron 主进程 + preload
├── src/                # Vue 3 渲染进程
│   ├── views/          # 页面组件（法学/数学/经管/文档库/设置）
│   ├── components/     # 通用组件
│   ├── router/         # vue-router 配置
│   └── assets/         # 样式资源
├── scripts/            # 数据预处理 + 资源复制脚本
├── raw-data/           # 原始复习资料（用户自行添加）
├── resources/          # 预处理产物（自动生成）
└── public/             # 第三方离线资源（自动生成）
```

## 本地开发指南

### 环境要求

- **Node.js** >= 18
- **Python** >= 3.8 (node-gyp 编译 better-sqlite3 需要)
- **Visual Studio 2022** + "Desktop development with C++" + Windows SDK (Windows 平台编译原生模块需要)

### 首次启动

```bash
# 1. 安装依赖（会自动执行 electron-rebuild 编译原生模块）
npm install

# 2. 复制第三方离线资源（Vditor / PDF.js / KaTeX）
npm run copy-assets

# 3. （可选）放入复习资料后，运行数据预处理
npm run prepare-data

# 4. 启动应用
npm start
```

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动 Electron + Vite 开发模式 |
| `npm run dev` | 仅启动 Vite 前端开发服务器（浏览器预览） |
| `npm run build` | 构建前端产物 |
| `npm run electron:dev` | 完整 Electron 开发模式 |
| `npm run electron:build` | 打包为 .exe / .dmg |
| `npm run prepare-data` | 预处理 raw-data/ → resources/ |
| `npm run copy-assets` | 复制第三方库资源到 public/ |

### 添加复习资料

1. 将文档放入 `raw-data/` 对应目录：
   - 理论资料 → `raw-data/theory/{学科}/`
   - 题库 → `raw-data/questions/{学科}/`
2. 运行 `npm run prepare-data` 构建索引
3. 重启应用

### 配置 AI 功能

启动应用后，进入「设置」页面，填入 DeepSeek API Key，保存即可启用 AI 增强功能。

## License

MIT
