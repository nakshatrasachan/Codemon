const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.send('open-file-dialog'),
  saveFileDialog: (content) => ipcRenderer.send('save-file-dialog', content),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (_event, value) => callback(value))
});