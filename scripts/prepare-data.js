/**
 * 前人树 - 数据预处理脚本
 * 遍历 raw-data/ 下的原始文档，复制到 resources/documents/，
 * 提取文本并构建 FTS5 全文索引数据库 index.db。
 *
 * 执行：npm run prepare-data
 */

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const ROOT = path.join(__dirname, '..')
const RESOURCES_DIR = path.join(ROOT, 'resources')
const RAW_DATA_DIR = path.join(ROOT, 'raw-data')
const SUPPORTED_EXTS = new Set(['.pdf', '.docx', '.md', '.txt'])

// ---- Helpers ----

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * 递归遍历目录，返回所有支持文件的 { fullPath, relativePath, subject, ext } 数组。
 * relativePath 相对于 resources/documents/
 * subject 由第一级子目录名确定（如 theory/法学/xxx.pdf → 法学）
 */
function collectFiles(dir, baseDir) {
  const results = []
  if (!fs.existsSync(dir)) return results

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, baseDir))
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      if (SUPPORTED_EXTS.has(ext)) {
        const relativePath = path.relative(baseDir, fullPath)
        // subject = first subdirectory under theory/ or questions/
        const parts = relativePath.split(path.sep)
        const subject = parts.length >= 2 ? parts[1] : '未知'
        results.push({ fullPath, relativePath, subject, ext })
      }
    }
  }
  return results
}

// ---- Text Extractors ----

function extractText(filePath, ext) {
  try {
    switch (ext) {
      case '.txt':
        return fs.readFileSync(filePath, 'utf-8')
      case '.md':
        return extractMarkdown(filePath)
      case '.pdf':
        return extractPdf(filePath)
      case '.docx':
        return extractDocx(filePath)
      default:
        return ''
    }
  } catch (err) {
    console.warn(`  [警告] 无法提取文本: ${filePath} — ${err.message}`)
    return ''
  }
}

function extractMarkdown(filePath) {
  // Simple: strip markdown syntax for plain text indexing
  const raw = fs.readFileSync(filePath, 'utf-8')
  return raw
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[.*?\]\(.+?\)/g, '')
    .replace(/>\s+/gm, '')
    .replace(/[-*+]\s+/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function extractPdf(filePath) {
  // pdf-parse is synchronous-ish via callback but we wrap it
  const pdfParse = require('pdf-parse')
  const dataBuffer = fs.readFileSync(filePath)
  // pdf-parse uses a callback; run synchronously via a simple approach
  return new Promise((resolve) => {
    pdfParse(dataBuffer).then(data => resolve(data.text)).catch(() => resolve(''))
  })
}

async function extractDocx(filePath) {
  const mammoth = require('mammoth')
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

// ---- Database Setup ----

function createIndexDb(dbPath) {
  const db = new Database(dbPath)

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      subject TEXT NOT NULL,
      filename TEXT NOT NULL,
      content TEXT
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      content,
      content_rowid='id'
    );
  `)

  return db
}

function insertDocument(db, file) {
  const stmt = db.prepare(`
    INSERT INTO documents (path, subject, filename, content)
    VALUES (?, ?, ?, ?)
  `)
  const info = stmt.run(file.relativePath, file.subject, path.basename(file.relativePath), file.content)

  // Also insert into FTS index
  if (file.content) {
    const ftsStmt = db.prepare(`INSERT INTO documents_fts (rowid, content) VALUES (?, ?)`)
    ftsStmt.run(info.lastInsertRowid, file.content)
  }
}

// ---- Main ----

async function main() {
  console.log('=== 前人树 数据预处理 ===\n')

  // Step 1: Clean output directories
  console.log('[1/4] 清理输出目录...')
  const docsDir = path.join(RESOURCES_DIR, 'documents')
  const distDir = path.join(RESOURCES_DIR, 'dist-data')
  if (fs.existsSync(docsDir)) fs.rmSync(docsDir, { recursive: true })
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true })
  fs.mkdirSync(docsDir, { recursive: true })
  fs.mkdirSync(distDir, { recursive: true })
  console.log('  完成\n')

  // Step 2: Copy raw documents
  console.log('[2/4] 复制原始文档...')
  copyDir(RAW_DATA_DIR, docsDir)
  const theoryDir = path.join(docsDir, 'theory')
  const questionsDir = path.join(docsDir, 'questions')
  console.log(`  theory: ${fs.existsSync(theoryDir) ? fs.readdirSync(theoryDir).filter(d => fs.statSync(path.join(theoryDir, d)).isDirectory()).join(', ') || '(空)' : '(无)'}`)
  console.log(`  questions: ${fs.existsSync(questionsDir) ? fs.readdirSync(questionsDir).filter(d => fs.statSync(path.join(questionsDir, d)).isDirectory()).join(', ') || '(空)' : '(无)'}`)
  console.log('  完成\n')

  // Step 3: Extract text and build FTS index
  console.log('[3/4] 提取文本并建立全文索引...')
  const dbPath = path.join(distDir, 'index.db')
  const db = createIndexDb(dbPath)
  const allFiles = collectFiles(docsDir, docsDir)
  console.log(`  发现 ${allFiles.length} 个支持文件`)

  // Sync: txt and md
  const syncFiles = allFiles.filter(f => f.ext === '.txt' || f.ext === '.md')
  const asyncFiles = allFiles.filter(f => f.ext === '.pdf' || f.ext === '.docx')

  const insertBatch = db.transaction((files) => {
    for (const file of files) {
      console.log(`  处理: ${file.relativePath}`)
      file.content = extractText(file.fullPath, file.ext)
      insertDocument(db, file)
    }
  })
  insertBatch(syncFiles)

  // Async: pdf and docx
  for (const file of asyncFiles) {
    console.log(`  处理: ${file.relativePath}`)
    try {
      if (file.ext === '.pdf') {
        file.content = await extractPdf(file.fullPath)
      } else {
        file.content = await extractDocx(file.fullPath)
      }
    } catch (e) {
      console.warn(`  [警告] ${file.relativePath}: ${e.message}`)
      file.content = ''
    }
    const insertOne = db.transaction(() => insertDocument(db, file))
    insertOne()
  }

  console.log(`  索引建立完成，数据库: ${dbPath}\n`)
  db.close()

  // Step 4: Process theory knowledge chunks (placeholder)
  console.log('[4/4] 处理理论知识切片与向量索引...')
  const chunksPath = path.join(distDir, 'knowledge_chunks.json')
  fs.writeFileSync(chunksPath, JSON.stringify([], null, 2))
  console.log(`  切片文件已生成 (空): ${chunksPath}`)
  console.log('  (向量索引将在后续版本实现)\n')

  console.log('=== 预处理完成 ===')
}

main().then(() => {
  // Electron keeps the event loop alive; explicitly exit
  process.exit(0)
}).catch(err => {
  console.error('预处理失败:', err)
  process.exit(1)
})
