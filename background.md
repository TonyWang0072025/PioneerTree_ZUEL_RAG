前人树 (ZUEL-RAG) - 桌面端开发文档（v4.0 最终版）

致 Claude Code (AI 开发者) 的系统提示：
本文档是“前人树”期末复习桌面应用的完整产品需求与架构设计。请严格按照以下规范完成代码编写。
核心约束：纯离线运行（DeepSeek API 调用除外）、本地 SQLite 存储、无跨域网络调用。
所有非 AI 功能必须在无互联网连接时完整可用，包括文档预览和全文检索。

1. 项目概述

项目名称：前人树（寓意：前人栽树，后人乘凉 / 厚德济世；专为中南大期末复习打造）

产品形态：基于 Electron 的本地桌面应用程序（.exe / .dmg）

核心定位：无需 VPN、免环境配置、开箱即用的 AI 辅助复习工作台，同时提供本地文档库（教科书、讲义、题库）的统一检索与预览。

运行机制：UI 前端渲染 + Electron 主进程处理本地文件与 API 请求 + SQLite 本地数据库支撑检索。

2. 技术栈选型（唯一确定）

层级

技术选型

说明

桌面外壳

Electron 28+

提供底层系统权限，消除 CORS 限制

前端框架

Vue 3 + Tailwind CSS

静态导出，不依赖后端服务

本地数据库

better-sqlite3

同步 API，在主进程运行，启用 FTS5 全文检索

AI 接口

DeepSeek API

仅用于智能名词解释、记忆核对、数学推导；无网络时跳过并提示

公式渲染

KaTeX 0.16.0

自包含，离线可用

向量索引

sqlite-vss 0.1.2

本地 embedding 存储与余弦相似度检索，完全离线

笔记编辑器

Vditor 3.10.2

本地化资源，离线完整可用

文档预览

PDF.js 4.0.379 + mammoth.js 1.6.0 + marked 11.0.0

分别支持 PDF、Word（.docx）、Markdown 离线预览

3. 数据架构与数据流转

3.1 设计原则

两类数据资产：

原始文档库：所有教科书、讲义、手动分类的题库文档（保持原始格式），用于人工翻阅、全文检索和预览。

结构化数据：从理论知识文档中抽取的文本切片及向量索引，用于 RAG 检索和智能组卷。

单一命令完成所有预处理：开发者执行 npm run prepare-data 后，脚本自动完成文档复制、文本提取、索引构建、切片生成和向量化，并将所有产物输出到 resources/ 目录。

Electron 应用不包含任何数据处理逻辑：所有清洗、切片、索引构建均在构建阶段完成，运行时只读取预处理好的数据。

离线能力底线：除 DeepSeek API 调用外，所有功能（全文检索、文档预览、组卷、挖空、踩点词核对、笔记、公式渲染、向量相似度检索）均不依赖网络。

3.2 原始资料目录结构（固定）

项目根目录下必须创建以下目录结构：

raw-data/
├── theory/               # 理论知识原始文档（PDF、Word、Markdown）
│   ├── 法学/
│   │   ├── 民法总论.pdf
│   │   └── 刑法分则.docx
│   ├── 数学/
│   │   └── 高等数学.md
│   └── 经管/
│       └── 微观经济学.pdf
├── questions/            # 题库原始文档（任意格式）
│   ├── 法学/
│   │   ├── 选择题.pdf
│   │   └── 案例分析.docx
│   ├── 数学/
│   │   └── 证明题集.md
│   └── 经管/
│       └── 计算题.pdf
└── metadata/             # 可选：补充结构化标注（如挖空标记、踩点词 JSON）
    ├── 法学/
    └── ...


说明：

theory/ 和 questions/ 下的子目录名称必须完全一致，均为学科名称（当前支持：法学、数学、经管）。未来增加学科时，在两个目录下同时新建同名字目录。

每个学科子目录下可放置任意数量、任意格式（.pdf, .docx, .md, .txt）的文档。

metadata/ 目录为可选，用于存放与理论或题库配套的结构化标注文件（JSON 格式），其子目录结构应与 theory/ 或 questions/ 对应。

3.3 数据处理脚本的工作流（确定步骤）

脚本位置：scripts/prepare-data.js。执行顺序如下：

清理输出目录 删除 resources/documents/ 和 resources/dist-data/（如果存在），然后创建空目录。

复制原始文档 将 raw-data/ 下的所有文件和子目录（theory/、questions/、metadata/）递归复制到 resources/documents/。

提取文档文本并建立全文索引

遍历 resources/documents/ 下的所有文件（.pdf, .docx, .md, .txt）。

使用对应库提取纯文本内容：

PDF：pdf.js（Node.js 环境下使用 pdf-parse）

DOCX：mammoth.js

Markdown：marked 提取纯文本

TXT：直接读取

将以下信息写入临时 SQLite 数据库（temp-index.db）：

表 documents：字段 id, path, subject, filename, content

FTS5 虚拟表 documents_fts(content)

其中 subject 通过文件相对于 resources/documents/ 的第一级子目录名确定（如 theory/法学/xxx.pdf → subject='法学'）。

索引建立完成后，将 temp-index.db 移动/复制到 resources/dist-data/index.db。

处理理论知识（结构化切片 + 向量索引）

仅处理 resources/documents/theory/ 下的文档（不处理 questions/）。

对每份文档按章节（若有）或固定长度 512 字符进行切片，重叠 64 字符。

每个切片保存为 JSON 对象：{ id, subject, chapter, content }，最终输出为 knowledge_chunks.json 文件到 resources/dist-data/。

使用 sqlite-vss 或 TF‑IDF 算法为每个切片生成向量。本项目选择 TF‑IDF + 余弦相似度 以零依赖离线运行。向量存储为单独 SQLite 文件 vector_index.db 输出到 resources/dist-data/。

最终产物结构

resources/
├── documents/                 # 原始文档副本（保持原格式，完整保留）
│   ├── theory/
│   ├── questions/
│   └── metadata/（可选）
└── dist-data/
    ├── index.db               # 包含 documents 表和 FTS5 索引
    ├── knowledge_chunks.json  # 理论知识切片
    └── vector_index.db        # 切片对应的向量索引


3.4 SQLite 运行时表结构

Electron 应用启动时会创建用户数据库 userdata.db（存储在用户数据目录），并附加预处理生成的 index.db 和 vector_index.db。

用户数据库（userdata.db）中的表：

表名

字段

说明

settings

key TEXT PRIMARY KEY, value TEXT

存储 DeepSeek API Key

user_notes

id INTEGER PRIMARY KEY, title TEXT, markdown TEXT, created_at DATETIME

Vditor 笔记

bookmarks

id INTEGER PRIMARY KEY, target_type TEXT, target_id INTEGER

收藏夹（可指向文档、切片或题目）

knowledge_chunks

id INTEGER PRIMARY KEY, subject TEXT, chapter TEXT, content TEXT

从 knowledge_chunks.json 导入的切片数据

question_bank

id INTEGER PRIMARY KEY, subject TEXT, question_text TEXT, answer_content TEXT

可选：若将来从 JSON 导入结构化题库

附加数据库（只读，来自预处理）：

数据库文件

主要表

用途

index.db

documents, documents_fts

原始文档全文检索

vector_index.db

vectors（示例表名）

存储切片 ID 与向量，用于相似度检索

3.5 应用启动时的数据加载逻辑

主进程 app.whenReady() 按以下顺序执行：

校验资源完整性：检查 process.resourcesPath + '/documents' 和 process.resourcesPath + '/dist-data' 是否存在。任一缺失则弹出错误对话框并退出应用。

初始化用户数据库：打开/创建 userdata.db，执行建表语句（若表不存在）。

附加预处理数据库：

const indexDbPath = path.join(process.resourcesPath, 'dist-data', 'index.db');
db.exec(`ATTACH DATABASE '${indexDbPath}' AS idx`);
const vectorDbPath = path.join(process.resourcesPath, 'dist-data', 'vector_index.db');
db.exec(`ATTACH DATABASE '${vectorDbPath}' AS vec`);


导入知识切片（仅首次）：检查 knowledge_chunks 表是否为空。若为空，读取 resources/dist-data/knowledge_chunks.json，批量插入 knowledge_chunks 表。

准备完毕：渲染进程可以开始调用 IPC 接口查询文档和知识库。

4. UI 规范与视觉映射

4.1 全局色彩规范（固定值）

学科/元素

颜色值

法学类主题色

#012d6a

数学类主题色

#5d9b50

经管与概论类主题色

#e42312

辅助色（按钮、链接）

#0068ef

正文灰色

#333333

背景白色

#ffffff

4.2 核心布局

顶部导航栏：高度 56px，包含五个固定按钮：法学、数学、经管、文档库、设置。

点击学科按钮（法学/数学/经管）进入“结构化复习界面”。

点击“文档库”进入文档检索与预览界面。

结构化复习界面（学科按钮后显示）：

左侧区域（宽度 70%）：沉浸式阅读器 / 题库卡片流。背景白色，内容区最大宽度 900px，自动居中。

右侧区域（宽度 30%）：悬浮“边搜边记”记事本，基于 Vditor 实现。

文档库界面（独立全屏布局）：

顶部搜索栏：输入关键词，实时检索文档。

左侧列表（宽度 30%）：显示检索结果（文档标题、路径、所属学科），支持按学科筛选。

右侧预览区（宽度 70%）：根据文件类型使用对应预览组件渲染文档。

4.3 边搜边记（Vditor）详细要求

编辑器工具栏必须包含：加粗、斜体、标题、列表、代码块、公式块、引用。

默认使用所见即所得（WYSIWYG）模式。

保存按钮：将当前编辑器内容（Markdown 源文本）和标题保存到 user_notes 表。

笔记列表抽屉：显示所有笔记标题，点击加载内容到编辑器。

导出按钮：导出当前笔记为 .md 文件（通过 Electron 对话框选择保存位置）。

从左侧选中文本后，右键菜单提供“插入到笔记”，IPC 通信将选中文本和来源信息插入编辑器光标位置（格式：> 引用自《文档名》\n> 原文内容）。

5. 核心功能与 AI 逻辑

5.1 全局通用模块（离线优先）

5.1.1 无感 API 代理

前端通过 ipcRenderer.invoke('call-deepseek', messages) 调用主进程。

主进程使用 axios 发送 POST 到 https://api.deepseek.com/v1/chat/completions，请求头 Authorization: Bearer ${apiKey}。

若 API Key 未配置或网络错误，返回 { offline: true, message: 'AI 服务不可用' }。

5.1.2 智能名词解释

离线部分：用户双击词汇后，前端发送选中词和当前学科。主进程查询 knowledge_chunks 表（FTS5）获取最相关的前 3 条切片内容，直接返回。

在线增强：若 DeepSeek API 可用，将选中词 + 本地检索到的切片作为上下文发送给 AI，生成简洁解释；否则仅展示本地切片原文。

UI 显示：在选中词下方浮动提示框，1.5 秒后自动关闭。

5.1.3 本地组卷与检索

用户输入关键词后，利用 SQLite FTS5 在 knowledge_chunks 和 question_bank 中检索。

支持学科、章节筛选。

抽题：从 question_bank 中随机选取符合条件的不超过 20 道题目，展示为卡片流。

5.1.4 文档检索与预览

全文检索：前端输入关键词，主进程查询 idx.documents_fts，返回匹配的文档记录（包含路径、学科、文件名、命中片段）。

预览实现：

主进程读取 resources/documents/ 下的原始文件。

根据扩展名选择对应预览库，将渲染后的 HTML 返回前端：

PDF：使用 PDF.js 在 canvas 上绘制（可借助 pdfjs-dist 的 getDocument 和 getPage）。

DOCX：mammoth.js 转换为 HTML。

Markdown：marked 渲染，并调用 KaTeX 处理 $...$ 公式。

纯文本：<pre> 包裹。

预览区内置关键词高亮（前端实现）。

所有操作完全离线。

5.2 学科专属模块（全部离线实现，AI 可选）

5.2.1 【法学类】背书对齐 + 自动挖空

背书对齐：左侧展示法条原文（从 knowledge_chunks 读取），右侧为多行文本输入框。用户输入后，前端逐句对比，用绿色背景标记匹配部分，红色背景标记差异部分。无需网络。

自动挖空：从 JSON 数据中识别 {{keyword}} 标记。将这些标记替换为 <input type="text" data-answer="keyword">。用户填完后前端自动比对答案（忽略大小写和空格）。

5.2.2 【经管与概论类】记忆核对

从 JSON 预置的 key_points 数组中读取踩点词。用户输入答案后，前端遍历踩点词，使用 includes() 判断是否出现，返回命中列表和缺失列表。完全离线。

5.2.3 【数学类】逐步解析推导

离线模式：直接展示题目对应的标准答案（一次性给出）。

在线模式：调用 DeepSeek API，传入题目和用户当前进度（如“请分步解释第二步”），流式返回推导过程，使用 KaTeX 实时渲染。若 API 不可用，自动降级为离线模式。

6. 构建与打包

6.1 开发阶段命令（固定）

命令

作用

npm run prepare-data

执行 scripts/prepare-data.js，生成 resources/documents/ 和 resources/dist-data/

npm run start

启动 Electron 开发环境（依赖已准备好的数据）

npm run build

先执行 prepare-data，然后调用 electron-builder 打包

6.2 打包配置（electron-builder.json）

{
  "productName": "前人树",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "node_modules/better-sqlite3/**/*",
    "node_modules/vditor/**/*",
    "node_modules/pdfjs-dist/**/*",
    "node_modules/mammoth/**/*",
    "node_modules/marked/**/*",
    "node_modules/katex/**/*"
  ],
  "extraResources": [
    {
      "from": "resources/documents",
      "to": "documents",
      "filter": ["**/*"]
    },
    {
      "from": "resources/dist-data",
      "to": "dist-data",
      "filter": ["**/*"]
    }
  ],
  "win": {
    "target": "nsis",
    "icon": "build/icon.ico"
  },
  "mac": {
    "target": "dmg",
    "icon": "build/icon.icns"
  }
}


6.3 新增复习资料的操作流程

将新文档放入 raw-data/ 对应子目录：理论放 theory/{学科}/，题库放 questions/{学科}/。

执行 npm run prepare-data（脚本自动复制文档并重建所有索引）。

执行 npm run build 重新打包应用。

用户安装新版本后，文档库和检索功能自动包含新资料。

7. 异常处理与离线保障

场景

处理方式

resources/documents/ 或 resources/dist-data/ 缺失

启动时弹窗报错：“应用资源不完整，请重新安装。”退出应用。

文档预览失败（格式不支持或解析库错误）

在预览区显示提示：“无法预览此文件类型，请在外部打开。”并显示“在文件管理器中显示”按钮（Electron shell 模块）。

index.db 损坏导致检索失败

文档库界面显示“文档索引损坏，请重新安装应用。”

DeepSeek API 调用超时（15秒）

返回离线降级结果，不重试，不阻塞 UI。

Vditor 加载失败（本地资源缺失）

控制台报错，右侧面板显示纯文本输入框作为备用（不依赖编辑器）。

PDF.js 无法解析部分 PDF

提示“PDF 渲染失败，请尝试用外部阅读器打开。”

所有异常必须捕获，不允许抛出未处理错误导致应用崩溃。

8. 本地化资源准备

为确保离线可用，以下依赖必须将完整资源复制到前端可访问的目录（如 public/ 或 dist/ 下）：

Vditor：从 node_modules/vditor/dist 复制 css、js、images、method 等到 public/vditor/。在 HTML 中通过相对路径引入。

PDF.js：复制 node_modules/pdfjs-dist/build/ 下所有文件到 public/pdfjs/，并确保 pdf.worker.js 路径正确。

KaTeX：复制 node_modules/katex/dist/ 下的 katex.min.css 和字体文件到 public/katex/。

9. 文档版本与维护

版本：4.0（最终版）

最后更新：2026-05-28

修订要点：

统一 theory/ 和 questions/ 的目录结构，均按学科分子目录。

明确数据处理脚本对学科目录的识别逻辑。

细化文档预览实现和异常处理策略。

删除所有模糊或选择性的表述，确保每一条指令可直接执行。

项目正式更名为“前人树”。

文档结束
以上内容为“前人树”桌面应用的完整开发规范。请严格按照此文档实现代码。如需进一步细节（如 IPC 接口定义、具体 SQL 语句、脚本示例），可另行提供补充材料。