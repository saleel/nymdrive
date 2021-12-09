const { contextBridge, ipcRenderer } = require('electron');
const API = require('./api');

const api = new API();
contextBridge.exposeInMainWorld('API', {
  createFile: api.createFile,
  findFiles: api.findFiles,
  createFolder: api.createFolder,
  fetchFile: api.fetchFile,
  deleteFileLocally: api.deleteFileLocally,
  deleteFile: api.deleteFile,
  shareFile: api.shareFile,
  openFile: api.openFile,
  clearCache: api.clearCache,
  setFolderFavorite: api.setFolderFavorite,
  removeFolderFavorite: api.removeFolderFavorite,
  getFavoriteFolders: api.getFavoriteFolders,
  addDevice: api.addDevice,
  registerNewDeviceHandler: api.registerNewDeviceHandler,
  isClientConnected: api.isClientConnected,
});

contextBridge.exposeInMainWorld('electron', {
  startDrag: async (file) => {
    if (file.type !== 'FOLDER' && file.temporaryLocalPath) {
      ipcRenderer.send('ondragstart', file.temporaryLocalPath);
    }
  },
});

api.on('client-connected', () => {
  ipcRenderer.send('client-connected');
});

api.on('client-disconnected', () => {
  ipcRenderer.send('client-disconnected');
});
