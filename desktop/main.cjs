const { app, BrowserWindow, protocol } = require('electron');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

const gameURL = 'eldritch://game/index.html';
protocol.registerSchemesAsPrivileged([{scheme:'eldritch', privileges:{standard:true,secure:true}}]);
let mainWindow;

function openWindow() {
  mainWindow = new BrowserWindow({
    width:1280,height:800,minWidth:640,minHeight:480,backgroundColor:'#0b131d',title:'ELDRITCH-404',autoHideMenuBar:true,
    webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  mainWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  mainWindow.webContents.on('will-navigate',(event,url)=>{ if (url!==gameURL) event.preventDefault(); });
  mainWindow.on('closed',()=>{ mainWindow=null; });
  mainWindow.loadURL(gameURL).catch(console.error);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance',()=>{
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  app.whenReady().then(async ()=>{
    const document = await readFile(join(__dirname,'game.html'));
    protocol.handle('eldritch',request=>request.url===gameURL
      ? new Response(document,{headers:{'Content-Type':'text/html; charset=utf-8',
        'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:"}})
      : new Response('Not found',{status:404}));
    openWindow();
  }).catch(error=>{ console.error(error); app.exit(1); });
  app.on('window-all-closed',()=>app.quit());
}
