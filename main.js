const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const isDev = !app.isPackaged;

// Hot Reloading for desktop dev
if (isDev) {
  try {
    require('electron-reloader')(module);
  } catch (_) {}
}

// Data Directory setup
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

// Initialize Default State
db.defaults({ documents: [], settings: {} }).write();

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "K.Electrical PMS",
    backgroundColor: '#ffffff', // Set a default white background
    show: false, // Don't show until ready-to-show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove the default system menu (toolbar)
  win.removeMenu();

  // Show the window only when the content is ready to prevent blank flashes
  win.once('ready-to-show', () => {
    win.show();
  });

  // During development, load the Vite dev server
  if (isDev) {
    win.loadURL('http://localhost:8080').catch((err) => {
      console.log("Waiting for Vite server...", err.message);
      // Retry in 1 second if the server isn't up yet
      setTimeout(() => win.loadURL('http://localhost:8080'), 1000);
    });
    // win.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- OFFLINE SYNC ENGINE (IPC HANDLERS) ---

// Get all local documents
ipcMain.handle('get-local-documents', async () => {
  return db.get('documents').value();
});

// Save a document locally
ipcMain.handle('save-local-document', async (event, doc) => {
  const existing = db.get('documents').find({ id: doc.id }).value();
  
  if (existing) {
    db.get('documents')
      .find({ id: doc.id })
      .assign({ ...doc, lastSync: null, isDirty: true })
      .write();
  } else {
    db.get('documents')
      .push({ ...doc, lastSync: null, isDirty: true })
      .write();
  }
  return { success: true };
});

// Delete a document locally
ipcMain.handle('delete-local-document', async (event, docId) => {
  db.get('documents').remove({ id: docId }).write();
  return { success: true };
});
