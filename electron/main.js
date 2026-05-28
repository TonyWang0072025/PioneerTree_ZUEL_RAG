const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const db = require('./db')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) app.quit()

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
  try {
    return { success: true, data: db.searchDocuments(query, subject) }
  } catch (err) {
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

// DeepSeek API proxy (placeholder)
ipcMain.handle('call-deepseek', async (_event, messages) => {
  return { offline: true, message: 'AI 服务暂未配置' }
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
