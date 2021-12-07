const { contextBridge, ipcRenderer } = require('electron');
const DB = require('./db');

const db = new DB();
contextBridge.exposeInMainWorld('DB', {
  createFile: db.createFile,
  findFiles: db.findFiles,
  createFolder: db.createFolder,
  fetchFile: db.fetchFile,
  deleteFileLocally: db.deleteFileLocally,
  deleteFile: db.deleteFile,
  shareFile: db.shareFile,
});

contextBridge.exposeInMainWorld('electron', {
  startDrag: async (file) => {
    if (file.localPath) {
      ipcRenderer.send('ondragstart', file.localPath);
    }
  },
});


db.on('client-connected', () => {
  ipcRenderer.send('client-connected');
})

db.on('client-disconnected', () => {
  ipcRenderer.send('client-disconnected');
})

