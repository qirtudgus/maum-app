import { app } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
  });
  // const mainWindow2 = createWindow('main2', {
  //   width: 1000,
  //   height: 600,
  // });

  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
    // await mainWindow2.loadURL('app://./home.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    // await mainWindow2.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
    // mainWindow2.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});
