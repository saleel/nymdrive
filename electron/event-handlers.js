const { ipcMain } = require('electron');
const path = require('path');

const iconName = path.join(__dirname, 'dnd-icon.png');

ipcMain.on('ondragstart', (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: iconName,
  });
});
