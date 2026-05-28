const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')

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
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ---- IPC Handlers ----
// DeepSeek API proxy (placeholder)
ipcMain.handle('call-deepseek', async (_event, messages) => {
  // Will be implemented in later phases
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
