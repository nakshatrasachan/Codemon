const { app, BrowserWindow, ipcMain, dialog, Notification} = require('electron');
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
      console.log("File Selected and file-opened sent");
      event.sender.send('file-opened', { filePath, content });
    }
  }).catch(err => {
    console.log(err);
  });
});

// // Listen for a 'save-file-dialog' message
// ipcMain.on('save-file', (event, filePath, content) => {
//   // dialog.showSaveDialog({
//   //   filters: [{ name: 'Text Files', extensions: ['txt', 'js', 'html', 'css', 'md'] }, { name: 'All Files', extensions: ['*'] }]
//   // }).then(result => {
//   //   if (!result.canceled && result.filePath) {
//   //     fs.writeFileSync(result.filePath, content);
//   //   }
//   // }).catch(err => {
//   //   console.log(err);
//   // });
//   fs.writeFileSync(filePath, content);
// });
// Replace the old listener in main.js with this one
ipcMain.on('save-file', (event, filePath, content) => {
  try {
    // Attempt to write the file to the disk
    fs.writeFileSync(filePath, content);

    // If writing is successful, create and show a notification
    new Notification({
      title: 'File Saved',
      body: `${path.basename(filePath)} has been saved successfully.`
    }).show();

  } catch (error) {
    // If an error occurs, log it to the terminal
    console.error(`Failed to save file: ${filePath}`, error);
  }
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

// Function to recursively read a directory
function readDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    const directoryStructure = [];
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            directoryStructure.push({
                name: file,
                type: 'folder',
                path: filePath,
                children: readDirectory(filePath)
            });
        } else {
            directoryStructure.push({
                name: file,
                type: 'file',
                path: filePath
            });
        }
    }
    return directoryStructure;
}

// Listen for the 'open-folder-dialog' message
ipcMain.on('open-folder-dialog', (event) => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const dirPath = result.filePaths[0];
            const structure = readDirectory(dirPath);
            event.sender.send('directory-opened', structure);
        }
    }).catch(err => console.log(err));
});

// ipcMain.on('open-file', (event, filePath) => {
//     const content = fs.readFileSync(filePath, 'utf-8');
//     event.sender.send('file-opened', { filePath, content });
// });
ipcMain.on('open-file', (event, filePath) => {
    // 1. Define which file extensions are allowed
    const allowedExtensions = ['.txt', '.js', '.html', '.css', '.md', '.json', '.py', '.java'];

    // 2. Get the extension of the selected file
    const fileExtension = path.extname(filePath).toLowerCase();

    // 3. Check if the extension is in our allowlist
    if (!allowedExtensions.includes(fileExtension)) {
        console.log(`Blocked unsupported file type: ${filePath}`);
        // If not allowed, simply do nothing and return.
        return;
    }

    // 4. If allowed, proceed with reading the file
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        event.sender.send('file-opened', { filePath, content });
    } catch (error) {
        console.error(`Failed to read file: ${filePath}`, error);
    }
});