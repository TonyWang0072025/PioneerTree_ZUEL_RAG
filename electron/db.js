/**
 * 前人树 - 数据库访问层 (Data Access Layer)
 * 管理 userdata.db（用户数据）、附加预处理 index.db 和 vector_index.db。
 */
const path = require('path')
const { app } = require('electron')
const Database = require('better-sqlite3')

let db = null

function getDbPath(dbName) {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, dbName)
}

/**
 * 初始化数据库：创建 userdata.db，附加预处理数据库，导入切片数据。
 * 必须在 app.whenReady() 之后调用。
 */
function initDatabase() {
  const userDbPath = getDbPath('userdata.db')
  db = new Database(userDbPath)

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL')

  // Create user tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS user_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      markdown TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT,
      target_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id INTEGER PRIMARY KEY,
      subject TEXT,
      chapter TEXT,
      content TEXT
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      question_text TEXT,
      answer_content TEXT
    );
  `)

  // Attach pre-built index databases from resources
  const resourcesPath = app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, '..', 'resources')
  const indexDbPath = path.join(resourcesPath, 'dist-data', 'index.db')
  const vectorDbPath = path.join(resourcesPath, 'dist-data', 'vector_index.db')

  try {
    db.exec(`ATTACH DATABASE '${indexDbPath.replace(/'/g, "''")}' AS idx`)
    console.log('[DB] Attached index.db')
  } catch (err) {
    console.error('[DB] Failed to attach index.db:', err.message)
  }

  try {
    db.exec(`ATTACH DATABASE '${vectorDbPath.replace(/'/g, "''")}' AS vec`)
    console.log('[DB] Attached vector_index.db')
  } catch (err) {
    console.warn('[DB] vector_index.db not available (will be added in future version)')
  }

  // Import knowledge chunks on first run
  const count = db.prepare('SELECT COUNT(*) as cnt FROM knowledge_chunks').get()
  if (count.cnt === 0) {
    try {
      const chunksPath = path.join(resourcesPath, 'dist-data', 'knowledge_chunks.json')
      const fs = require('fs')
      if (fs.existsSync(chunksPath)) {
        const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'))
        if (chunks.length > 0) {
          const insert = db.prepare(
            'INSERT OR IGNORE INTO knowledge_chunks (id, subject, chapter, content) VALUES (?, ?, ?, ?)'
          )
          const importTx = db.transaction(() => {
            for (const chunk of chunks) {
              insert.run(chunk.id, chunk.subject, chunk.chapter, chunk.content)
            }
          })
          importTx()
          console.log(`[DB] Imported ${chunks.length} knowledge chunks`)
        }
      }
    } catch (err) {
      console.warn('[DB] Failed to import knowledge chunks:', err.message)
    }
  }

  return db
}

/**
 * 全文检索文档
 * @param {string} query - 搜索关键词
 * @param {string|null} subject - 可选，按学科筛选
 * @returns {Array} 匹配文档列表，含 snippet
 */
function searchDocuments(query, subject = null) {
  if (!db) throw new Error('Database not initialized')

  if (!query || !query.trim()) return []

  // Check if idx database was attached successfully
  let idxAttached = false
  try {
    db.prepare('SELECT 1 FROM idx.documents LIMIT 1').get()
    idxAttached = true
  } catch (_) {
    console.warn('[DB] idx.documents not available — index.db may not exist. Run npm run prepare-data first.')
  }
  if (!idxAttached) return []

  // FTS5 in ATTACHed DB: MATCH and snippet() require bare table name (no schema prefix, no alias)
  let sql = `
    SELECT d.id, d.path, d.subject, d.filename,
           snippet(documents_fts, -1, '<mark>', '</mark>', '...', 64) AS snippet
    FROM idx.documents_fts
    JOIN idx.documents AS d ON idx.documents_fts.rowid = d.id
    WHERE documents_fts MATCH ?
  `
  const params = [query]

  if (subject && subject !== '全部学科' && subject !== 'null') {
    sql += ' AND d.subject = ?'
    params.push(subject)
  }

  sql += ' ORDER BY rank LIMIT 50'
  console.log('[DB] searchDocuments query:', query, 'subject:', subject)
  const results = db.prepare(sql).all(...params)
  console.log('[DB] searchDocuments results:', results.length)
  return results
}

/**
 * 获取单份文档的完整内容
 * @param {number} id - 文档 ID
 * @returns {Object|null} 文档记录
 */
function getDocumentContent(id) {
  if (!db) throw new Error('Database not initialized')
  return db.prepare('SELECT * FROM idx.documents WHERE id = ?').get(id) || null
}

/**
 * 获取知识切片（用于 AI 名词解释上下文）
 * @param {string} keyword - 关键词
 * @param {string} subject - 学科
 * @param {number} limit - 返回数量
 */
function searchKnowledgeChunks(keyword, subject, limit = 3) {
  if (!db) throw new Error('Database not initialized')
  return db.prepare(`
    SELECT * FROM knowledge_chunks
    WHERE subject = ? AND content LIKE ?
    LIMIT ?
  `).all(subject, `%${keyword}%`, limit)
}

/**
 * 列出指定学科的所有文档
 */
function listDocumentsBySubject(subject) {
  if (!db) throw new Error('Database not initialized')
  return db.prepare('SELECT * FROM idx.documents WHERE subject = ? ORDER BY filename').all(subject)
}

/**
 * 获取所有可用学科
 */
function getAvailableSubjects() {
  if (!db) throw new Error('Database not initialized')
  return db.prepare('SELECT DISTINCT subject FROM idx.documents ORDER BY subject').all()
}

function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

// ---- Settings CRUD ----

function getSetting(key) {
  if (!db) throw new Error('Database not initialized')
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
}

function saveSetting(key, value) {
  if (!db) throw new Error('Database not initialized')
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

// ---- Notes CRUD ----

function saveNote(title, markdown) {
  if (!db) throw new Error('Database not initialized')
  const info = db.prepare(
    'INSERT INTO user_notes (title, markdown) VALUES (?, ?)'
  ).run(title, markdown)
  return { id: info.lastInsertRowid, title, markdown }
}

function listNotes() {
  if (!db) throw new Error('Database not initialized')
  return db.prepare(
    'SELECT id, title, created_at FROM user_notes ORDER BY created_at DESC'
  ).all()
}

function getNote(id) {
  if (!db) throw new Error('Database not initialized')
  return db.prepare('SELECT * FROM user_notes WHERE id = ?').get(id) || null
}

// ---- Bookmarks CRUD ----

function addBookmark(targetType, targetId) {
  if (!db) throw new Error('Database not initialized')
  // Avoid duplicates
  const existing = db.prepare(
    'SELECT id FROM bookmarks WHERE target_type = ? AND target_id = ?'
  ).get(targetType, targetId)
  if (existing) return existing
  const info = db.prepare(
    'INSERT INTO bookmarks (target_type, target_id) VALUES (?, ?)'
  ).run(targetType, targetId)
  return { id: info.lastInsertRowid }
}

function removeBookmark(targetType, targetId) {
  if (!db) throw new Error('Database not initialized')
  db.prepare(
    'DELETE FROM bookmarks WHERE target_type = ? AND target_id = ?'
  ).run(targetType, targetId)
}

function isBookmarked(targetType, targetId) {
  if (!db) throw new Error('Database not initialized')
  const row = db.prepare(
    'SELECT id FROM bookmarks WHERE target_type = ? AND target_id = ?'
  ).get(targetType, targetId)
  return !!row
}

function listBookmarks() {
  if (!db) throw new Error('Database not initialized')
  return db.prepare(
    'SELECT * FROM bookmarks ORDER BY id DESC'
  ).all()
}

// ---- Question Bank ----

function getRandomQuestions(subject, limit = 20) {
  if (!db) throw new Error('Database not initialized')
  return db.prepare(`
    SELECT * FROM question_bank
    WHERE subject = ?
    ORDER BY RANDOM()
    LIMIT ?
  `).all(subject, limit)
}

module.exports = {
  initDatabase,
  searchDocuments,
  getDocumentContent,
  searchKnowledgeChunks,
  listDocumentsBySubject,
  getAvailableSubjects,
  getSetting,
  saveSetting,
  saveNote,
  listNotes,
  getNote,
  addBookmark,
  removeBookmark,
  isBookmarked,
  listBookmarks,
  getRandomQuestions,
  closeDatabase
}
