const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.send('open-file-dialog'),
  saveFile: (filePath, content) => ipcRenderer.send('save-file', filePath, content),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (_event, value) => callback(value)),
  openFolderDialog: () => ipcRenderer.send('open-folder-dialog'),
  onDirectoryOpened: (callback) => ipcRenderer.on('directory-opened', (_event, structure) => callback(structure)),
  openFile: (filePath) => ipcRenderer.send('open-file', filePath)
});