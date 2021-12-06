const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const DB = require('./db');

contextBridge.exposeInMainWorld('electron', {
  startDrag: (fileName) => {
    ipcRenderer.send('ondragstart', path.join(process.cwd(), fileName));
  },
});

const db = new DB();
contextBridge.exposeInMainWorld('DB', {
  createFile: db.createFile,
  findFiles: db.findFiles,
  createFolder: db.createFolder,
  fetchFile: db.fetchFile,
  deleteFileLocally: db.deleteFileLocally,
  deleteFile: db.deleteFile,
});
