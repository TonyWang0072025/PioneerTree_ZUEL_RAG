const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // DeepSeek AI proxy
  callDeepSeek: (messages) => ipcRenderer.invoke('call-deepseek', messages),

  // Settings
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (apiKey) => ipcRenderer.invoke('save-api-key', apiKey),

  // Notes
  saveNote: (title, markdown) => ipcRenderer.invoke('save-note', title, markdown),
  listNotes: () => ipcRenderer.invoke('list-notes'),
  getNote: (id) => ipcRenderer.invoke('get-note', id),

  // Bookmarks
  addBookmark: (targetType, targetId) => ipcRenderer.invoke('add-bookmark', targetType, targetId),
  removeBookmark: (targetType, targetId) => ipcRenderer.invoke('remove-bookmark', targetType, targetId),
  checkBookmark: (targetType, targetId) => ipcRenderer.invoke('check-bookmark', targetType, targetId),
  listBookmarks: () => ipcRenderer.invoke('list-bookmarks'),

  // Quiz
  getRandomQuestions: (subject, limit) => ipcRenderer.invoke('get-random-questions', subject, limit),

  // File operations
  showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // Document search & retrieval
  searchDocuments: (query, subject) => ipcRenderer.invoke('search-documents', query, subject),
  getDocumentContent: (docId) => ipcRenderer.invoke('get-document-content', docId),
  getDocumentFile: (docPath) => ipcRenderer.invoke('get-document-file', docPath),
  listDocuments: (subject) => ipcRenderer.invoke('list-documents', subject),
  getSubjects: () => ipcRenderer.invoke('get-subjects'),

  // Knowledge chunks
  searchKnowledge: (keyword, subject) => ipcRenderer.invoke('search-knowledge', keyword, subject)
})
