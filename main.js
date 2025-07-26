const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // This is crucial for allowing renderer.js to communicate with this file
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Listen for a 'open-file-dialog' message from the renderer process
ipcMain.on('open-file-dialog', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt', 'js', 'html', 'css', 'md'] }, { name: 'All Files', extensions: ['*'] }]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const content = fs.readFileSync(filePath, 'utf-8');
      // Send the file content back to the renderer process
      event.sender.send('file-opened', { filePath, content });
    }
  }).catch(err => {
    console.log(err);
  });
});

// Listen for a 'save-file-dialog' message
ipcMain.on('save-file-dialog', (event, content) => {
  dialog.showSaveDialog({
    filters: [{ name: 'Text Files', extensions: ['txt', 'js', 'html', 'css', 'md'] }, { name: 'All Files', extensions: ['*'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content);
    }
  }).catch(err => {
    console.log(err);
  });
});

// Standard boilerplate for macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});