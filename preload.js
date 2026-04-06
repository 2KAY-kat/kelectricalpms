const { contextBridge, ipcRenderer } = require('electron');

// Branded bridge for communication between the desktop and the web core
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // Offline DB Methods
  getLocalDocuments: () => ipcRenderer.invoke('get-local-documents'),
  saveLocalDocument: (doc) => ipcRenderer.invoke('save-local-document', doc),
  deleteLocalDocument: (docId) => ipcRenderer.invoke('delete-local-document', docId),
  // Desktop Menu Event Listeners
  onNavigate: (callback) => ipcRenderer.on('nav-to', (event, url) => callback(url)),
  onCreateDoc: (callback) => ipcRenderer.on('create-doc', callback),
  onSyncNow: (callback) => ipcRenderer.on('sync-now', callback),
  onSyncStatus: (callback) => ipcRenderer.on('sync-status', callback),
});
