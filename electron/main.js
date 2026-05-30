const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const db = require('./db')


let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '前人树',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // In development, load from Vite dev server; in production, load built files
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  // Initialize database before creating window
  try {
    db.initDatabase()
    console.log('[Main] Database initialized')
  } catch (err) {
    console.error('[Main] Database init failed:', err.message)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('quit', () => {
  db.closeDatabase()
})

// ---- IPC Handlers ----

// Database: full-text search
ipcMain.handle('search-documents', async (_event, query, subject) => {
  console.log('[Search] 收到关键词:', query, '学科:', subject)
  try {
    const data = db.searchDocuments(query, subject)
    console.log('[Search] 找到结果数量:', data.length)
    return { success: true, data }
  } catch (err) {
    console.error('[Search] 搜索出错:', err.message, err.stack)
    return { success: false, error: err.message }
  }
})

// Database: get single document content
ipcMain.handle('get-document-content', async (_event, docId) => {
  try {
    const doc = db.getDocumentContent(docId)
    if (!doc) return { success: false, error: '文档不存在' }
    return { success: true, data: doc }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Database: knowledge chunks search
ipcMain.handle('search-knowledge', async (_event, keyword, subject) => {
  try {
    return { success: true, data: db.searchKnowledgeChunks(keyword, subject) }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Database: list documents by subject
ipcMain.handle('list-documents', async (_event, subject) => {
  try {
    return { success: true, data: db.listDocumentsBySubject(subject) }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Database: get available subjects
ipcMain.handle('get-subjects', async () => {
  try {
    return { success: true, data: db.getAvailableSubjects() }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Settings: get API key
ipcMain.handle('get-api-key', async () => {
  try {
    const key = db.getSetting('deepseek_api_key')
    return { success: true, data: key || '' }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Settings: save API key
ipcMain.handle('save-api-key', async (_event, apiKey) => {
  try {
    db.saveSetting('deepseek_api_key', apiKey)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Notes: save
ipcMain.handle('save-note', async (_event, title, markdown) => {
  try {
    const note = db.saveNote(title, markdown)
    return { success: true, data: note }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Notes: list all
ipcMain.handle('list-notes', async () => {
  try {
    return { success: true, data: db.listNotes() }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Notes: get single
ipcMain.handle('get-note', async (_event, id) => {
  try {
    const note = db.getNote(id)
    if (!note) return { success: false, error: '笔记不存在' }
    return { success: true, data: note }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// DeepSeek API proxy
ipcMain.handle('call-deepseek', async (_event, messages) => {
  const apiKey = db.getSetting('deepseek_api_key')
  if (!apiKey) {
    return { offline: true, message: 'AI 服务不可用：请先在设置中配置 API Key' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errText = await response.text()
      console.error('[DeepSeek] API error:', response.status, errText)
      return { offline: true, message: `AI 服务请求失败 (${response.status})` }
    }

    const data = await response.json()
    return {
      offline: false,
      content: data.choices?.[0]?.message?.content || ''
    }
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      console.warn('[DeepSeek] Request timed out')
      return { offline: true, message: 'AI 服务请求超时，请检查网络后重试' }
    }
    console.error('[DeepSeek] Network error:', err.message)
    return { offline: true, message: 'AI 服务不可用：网络连接失败' }
  }
})

// Database: read raw document file (for PDF/DOCX preview)
ipcMain.handle('get-document-file', async (_event, docPath) => {
  try {
    const resourcesPath = app.isPackaged
      ? process.resourcesPath
      : path.join(__dirname, '..', 'resources')
    const fullPath = path.join(resourcesPath, 'documents', docPath)
    const fs = require('fs')
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: '文件不存在' }
    }
    const buffer = fs.readFileSync(fullPath)
    return { success: true, data: buffer.toString('base64'), size: buffer.length }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Bookmarks: add
ipcMain.handle('add-bookmark', async (_event, targetType, targetId) => {
  try {
    db.addBookmark(targetType, targetId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Bookmarks: remove
ipcMain.handle('remove-bookmark', async (_event, targetType, targetId) => {
  try {
    db.removeBookmark(targetType, targetId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Bookmarks: check status
ipcMain.handle('check-bookmark', async (_event, targetType, targetId) => {
  try {
    return { success: true, data: db.isBookmarked(targetType, targetId) }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Bookmarks: list all
ipcMain.handle('list-bookmarks', async () => {
  try {
    return { success: true, data: db.listBookmarks() }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Quiz: get random questions by subject
ipcMain.handle('get-random-questions', async (_event, subject, limit) => {
  try {
    const questions = db.getRandomQuestions(subject, limit || 20)
    return { success: true, data: questions }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// File: write content to disk (for note export)
ipcMain.handle('write-file', async (_event, filePath, content) => {
  try {
    require('fs').writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// File dialog for exporting notes
ipcMain.handle('show-save-dialog', async (_event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出笔记',
    defaultPath: defaultName || 'note.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })
  return result
})

// Open file in system file manager
ipcMain.handle('show-item-in-folder', async (_event, filePath) => {
  shell.showItemInFolder(filePath)
})
