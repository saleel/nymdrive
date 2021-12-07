const { ipcMain } = require('electron');
const path = require('path');

/**
 *
 * @param {{ tray: import("electron").Tray }} param0
 */
module.exports = function registerHandlers({ tray }) {
  const iconName = path.join(__dirname, 'dnd-icon.png');

  ipcMain.on('ondragstart', (event, filePath) => {
    event.sender.startDrag({
      file: filePath,
      icon: iconName,
    });
  });

  ipcMain.on('client-connected', () => {
    console.log('client-connected');
    tray.setImage(path.join(__dirname, '../icons/png/20x20-connected.png'));
  });

  ipcMain.on('client-disconnected', () => {
    console.log('client-disconnected');
    tray.setImage(path.join(__dirname, '../icons/png/20x20-disconnected.png'));
  });
};
