const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // DeepSeek AI proxy
  callDeepSeek: (messages) => ipcRenderer.invoke('call-deepseek', messages),

  // File operations
  showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),

  // Document search & retrieval
  searchDocuments: (query, subject) => ipcRenderer.invoke('search-documents', query, subject),
  getDocumentContent: (docId) => ipcRenderer.invoke('get-document-content', docId),
  listDocuments: (subject) => ipcRenderer.invoke('list-documents', subject),
  getSubjects: () => ipcRenderer.invoke('get-subjects'),

  // Knowledge chunks
  searchKnowledge: (keyword, subject) => ipcRenderer.invoke('search-knowledge', keyword, subject)
})
