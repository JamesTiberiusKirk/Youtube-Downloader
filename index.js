const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

require('electron-context-menu')({
  // prepend: params => [],
  // append: params => [],
  menu: defaults => [
      defaults.COPY,
      defaults.PASTE
  ],
  showInspectElement: true
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 630,
    height: 450,
    icon: path.join(__dirname, 'build/assets/icons/256x256.png')
    })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  //Temove menuBar
  mainWindow.setMenu(null);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
  
  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  //licking the window to a specific size
  mainWindow.setResizable(false)

  //Being able to drag a link on the app
  mainWindow.webContents.on('will-navigate',(e, url) => {
    const {ipcMain} = require('electron');    
    e.preventDefault();
    console.log(url);
    ipcMain('dragNdrop',url);
  })
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})