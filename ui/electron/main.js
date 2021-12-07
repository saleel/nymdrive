const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const registerHandlers = require('./event-handlers');

// try {
// require('electron-reloader')(module, { ignore: '*.db' });
// } catch {}

const ui = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;

function createWindow() {
  if (BrowserWindow.getAllWindows().length > 0) {
    return;
  }

  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(ui);
}

let tray = null
app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, '../icons/png/20x20.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open NymDrive',
       type: 'normal',
      click: () => {
        createWindow();
      }
    },
    {
      label: 'Quit', 
      type: 'normal',
      click: () => {
        app.quit();
      }
    },
  ])
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    createWindow();
  });

  createWindow();

  registerHandlers({ tray });
});

app.on('window-all-closed', () => {
  // Do nothing
});

app.dock.hide();
