const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, powerMonitor, screen } = require('electron')
const path = require('node:path')

let windowRef
let breakWindowRef
let tray
let isQuitting = false
let closeToTray = true

function quitApplication() {
  isQuitting = true
  if (breakWindowRef && !breakWindowRef.isDestroyed()) breakWindowRef.destroy()
  if (windowRef && !windowRef.isDestroyed()) windowRef.destroy()
  if (tray) {
    tray.destroy()
    tray = null
  }
  app.quit()
}

function createWindow() {
  windowRef = new BrowserWindow({
    width: 760,
    height: 420,
    minWidth: 560,
    minHeight: 340,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (app.isPackaged) windowRef.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  else windowRef.loadURL('http://127.0.0.1:5173')

  windowRef.setMenuBarVisibility(false)
  windowRef.removeMenu()
  windowRef.setBackgroundColor('#00000000')
  windowRef.webContents.on('did-finish-load', () => {
    if (windowRef && !windowRef.isDestroyed()) {
      windowRef.webContents.insertCSS(`html, body, #root { background: transparent !important; background-color: rgba(0,0,0,0) !important; }`)
    }
  })
  windowRef.once('ready-to-show', () => {
    if (!windowRef || windowRef.isDestroyed()) return
    windowRef.show()
    windowRef.setSkipTaskbar(false)
  })
  windowRef.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`Renderer failed to load (${code}): ${description} — ${url}`)
  })
  windowRef.on('close', (event) => {
    if (!isQuitting && closeToTray) {
      event.preventDefault()
      windowRef.hide()
      windowRef.setSkipTaskbar(true)
    } else if (!isQuitting) {
      quitApplication()
    }
  })
}

function createBreakWindow() {
  if (breakWindowRef && !breakWindowRef.isDestroyed()) return breakWindowRef
  breakWindowRef = new BrowserWindow({
    width: 640,
    height: 220,
    x: Math.round(screen.getPrimaryDisplay().workArea.x + (screen.getPrimaryDisplay().workArea.width - 640) / 2),
    y: 16,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: true,
    thickFrame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      additionalArguments: ['--break-overlay'],
    },
  })
  breakWindowRef.setBackgroundColor('#00000000')
  breakWindowRef.webContents.on('did-finish-load', () => {
    breakWindowRef?.webContents.insertCSS(`
      html, body, #root { background: transparent !important; background-color: rgba(0,0,0,0) !important; }
      html, body { margin: 0 !important; overflow: hidden !important; }
      #root { min-height: 0 !important; }
    `)
  })
  if (app.isPackaged) breakWindowRef.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  else breakWindowRef.loadURL('http://127.0.0.1:5173')
  breakWindowRef.webContents.once('did-finish-load', () => {
    if (!breakWindowRef || breakWindowRef.isDestroyed()) return
    breakWindowRef.webContents.send('overlay-mode', true)
    breakWindowRef.__rendererReady = true
    if (breakWindowRef.__showOnReady) {
      breakWindowRef.__showOnReady = false
      breakWindowRef.showInactive()
    }
  })
  breakWindowRef.on('closed', () => { breakWindowRef = null })
  return breakWindowRef
}

function hideMainWindow() {
  if (!windowRef) return
  windowRef.hide()
  windowRef.setSkipTaskbar(true)
}

function showWindow() {
  if (!windowRef) return
  windowRef.show()
  windowRef.setSkipTaskbar(false)
  windowRef.focus()
}

function createTray() {
  // Use a raster PNG because Windows notification-area icons do not reliably
  // render SVG data URLs. Paint a solid green clock face with white hands.
  const size = 32
  const pixels = Buffer.alloc(size * size * 4)
  const setPixel = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const offset = (y * size + x) * 4
    pixels[offset] = color[0]
    pixels[offset + 1] = color[1]
    pixels[offset + 2] = color[2]
    pixels[offset + 3] = color[3]
  }
  const green = [102, 139, 112, 255]
  const white = [255, 255, 255, 255]
  for (let y = 1; y < 31; y += 1) {
    for (let x = 1; x < 31; x += 1) {
      const distance = Math.hypot(x - 15.5, y - 15.5)
      if (distance <= 14) setPixel(x, y, green)
      if (distance >= 10 && distance <= 11.5) setPixel(x, y, white)
    }
  }
  // Clock hands and center pin.
  for (let y = 8; y <= 16; y += 1) setPixel(15, y, white)
  for (let step = 0; step <= 6; step += 1) setPixel(15 + step, 16 + Math.round(step * 0.55), white)
  for (let y = 14; y <= 17; y += 1) {
    for (let x = 14; x <= 17; x += 1) setPixel(x, y, white)
  }
  const image = nativeImage.createFromBuffer(
    Buffer.from(pixels),
    { width: size, height: size, scaleFactor: 1 },
  )
  tray = new Tray(image)
  tray.setToolTip('Workday Pomodoro')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Workday Pomodoro', enabled: false },
    { type: 'separator' },
    { label: 'Show Application', click: showWindow },
    { label: 'Settings', click: () => {
      showWindow()
      windowRef?.webContents.send('open-settings')
    } },
    { label: 'Start / Resume', click: () => {
      if (windowRef?.isVisible()) windowRef.webContents.send('tray-action', 'resume')
      else showWindow()
    } },
    { label: 'Pause', click: () => windowRef?.webContents.send('tray-action', 'pause') },
    { label: 'Stop Session', click: () => windowRef?.webContents.send('tray-action', 'stop') },
    { type: 'separator' },
    { label: 'Exit', click: quitApplication },
  ]))
  tray.on('double-click', showWindow)
}

app.on('browser-window-created', (_event, win) => {
  win.setMenuBarVisibility(false)
  win.removeMenu()
})

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  createWindow()
  createTray()
  powerMonitor.on('resume', () => windowRef?.webContents.send('system-resumed'))
})

app.on('before-quit', () => {
  isQuitting = true
  if (breakWindowRef && !breakWindowRef.isDestroyed()) breakWindowRef.destroy()
  if (tray) {
    tray.destroy()
    tray = null
  }
})
app.on('window-all-closed', (event) => event.preventDefault())
app.on('activate', showWindow)

  ipcMain.handle('window:set-break-mode', (_event, enabled) => {
  if (!windowRef) return
  if (enabled) {
    hideMainWindow()
    const overlay = createBreakWindow()
    if (!overlay.__rendererReady || overlay.webContents.isLoadingMainFrame()) overlay.__showOnReady = true
    else overlay.showInactive()
  } else {
    if (breakWindowRef && !breakWindowRef.isDestroyed()) breakWindowRef.hide()
  }
})
ipcMain.handle('window:move-overlay', (_event, { deltaX, deltaY }) => {
  if (!breakWindowRef || breakWindowRef.isDestroyed()) return
  const [x, y] = breakWindowRef.getPosition()
  const display = screen.getDisplayMatching(breakWindowRef.getBounds())
  const area = display.workArea
  const [width, height] = breakWindowRef.getSize()
  const nextX = Math.max(area.x, Math.min(area.x + area.width - width, x + Math.round(deltaX)))
  const nextY = Math.max(area.y, Math.min(area.y + area.height - height, y + Math.round(deltaY)))
  breakWindowRef.setPosition(nextX, nextY)
})
ipcMain.handle('window:focus-mode', () => hideMainWindow())
ipcMain.handle('window:session-finished', () => {
  if (breakWindowRef && !breakWindowRef.isDestroyed()) breakWindowRef.hide()
  showWindow()
})
ipcMain.handle('window:close-overlay', () => {
  if (breakWindowRef && !breakWindowRef.isDestroyed()) breakWindowRef.hide()
})
ipcMain.handle('window:show', showWindow)
ipcMain.handle('notification:show', (_event, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body }).show()
})
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:set-close-to-tray', (_event, enabled) => {
  closeToTray = Boolean(enabled)
})
