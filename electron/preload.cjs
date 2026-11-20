const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  isOverlay: process.argv.includes('--break-overlay'),
  setBreakMode: (enabled) => ipcRenderer.invoke('window:set-break-mode', enabled),
  setFocusMode: () => ipcRenderer.invoke('window:focus-mode'),
  sessionFinished: () => ipcRenderer.invoke('window:session-finished'),
  closeOverlay: () => ipcRenderer.invoke('window:close-overlay'),
  moveOverlay: (delta) => ipcRenderer.invoke('window:move-overlay', delta),
  showWindow: () => ipcRenderer.invoke('window:show'),
  notify: (notification) => ipcRenderer.invoke('notification:show', notification),
  getVersion: () => ipcRenderer.invoke('app:version'),
  setCloseToTray: (enabled) => ipcRenderer.invoke('app:set-close-to-tray', enabled),
  onTrayAction: (callback) => {
    const listener = (_event, action) => callback(action)
    ipcRenderer.on('tray-action', listener)
    return () => ipcRenderer.removeListener('tray-action', listener)
  },
  onSystemResumed: (callback) => {
    ipcRenderer.on('system-resumed', callback)
    return () => ipcRenderer.removeListener('system-resumed', callback)
  },
  onOverlayMode: (callback) => {
    const listener = (_event, enabled) => callback(enabled)
    ipcRenderer.on('overlay-mode', listener)
    return () => ipcRenderer.removeListener('overlay-mode', listener)
  },
  syncSession: (session) => ipcRenderer.send('session:sync', session),
  onSessionSync: (callback) => {
    const listener = (_event, session) => callback(session)
    ipcRenderer.on('session-sync', listener)
    return () => ipcRenderer.removeListener('session-sync', listener)
  },
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback)
    return () => ipcRenderer.removeListener('open-settings', callback)
  },
})
