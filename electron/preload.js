const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // DeepSeek AI proxy
  callDeepSeek: (messages) => ipcRenderer.invoke('call-deepseek', messages),

  // File operations
  showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),

  // Database operations (to be expanded)
  dbQuery: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
  dbRun: (sql, params) => ipcRenderer.invoke('db-run', sql, params),

  // Document operations (to be expanded)
  searchDocuments: (query, subject) => ipcRenderer.invoke('search-documents', query, subject),
  getDocumentPreview: (docPath, fileType) => ipcRenderer.invoke('get-document-preview', docPath, fileType)
})
