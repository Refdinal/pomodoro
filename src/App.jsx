import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlarmClock, ArrowLeft, Bell, Check, ChevronRight, Clock3, Coffee, Headphones, Pause, Play, RotateCcw, Settings2, ShieldCheck, Sparkles, Square, Sun, X } from 'lucide-react'
import { generateSchedule } from './services/scheduleGenerator'
import { DEFAULT_SETTINGS, formatTime, getActiveWorkSession, getRemainingMinutes } from './services/workSchedule'

const STORAGE_SETTINGS = 'workday-pomodoro-settings'
const STORAGE_TIMER = 'workday-pomodoro-session'

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_SETTINGS) || '{}') } } catch { return DEFAULT_SETTINGS }
}

function formatDuration(seconds) {
  const safe = Math.max(0, seconds)
  return `${String(Math.floor(safe / 3600)).padStart(2, '0')}:${String(Math.floor((safe % 3600) / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [now, setNow] = useState(Date.now())
  const [session, setSession] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_TIMER) || 'null')
      return stored?.status === 'running' && stored.intervalEnd > Date.now() ? stored : null
    } catch { return null }
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [overlayMode, setOverlayMode] = useState(() => Boolean(window.desktop?.isOverlay))
  const overlayDrag = useRef(null)
  const [message, setMessage] = useState('')
  const [appVersion, setAppVersion] = useState('')
  const date = new Date(now)
  const activeWork = getActiveWorkSession(date, settings)
  const secondsLeft = session?.status === 'running' ? Math.max(0, Math.round((session.intervalEnd - now) / 1000)) : session?.remainingSeconds ?? 0
  const activeInterval = session?.schedule?.[session.intervalIndex]
  const isBreak = activeInterval?.type === 'break' && ['running', 'paused'].includes(session?.status)
  const activeDurationSeconds = activeInterval ? activeInterval.duration * 60 : 0
  const intervalProgress = activeDurationSeconds > 0 ? Math.min(1, Math.max(0, 1 - secondsLeft / activeDurationSeconds)) : 0
  const completedDurationSeconds = session?.schedule?.slice(0, session.intervalIndex).reduce((total, interval) => total + interval.duration * 60, 0) ?? 0
  const totalDurationSeconds = session?.schedule?.reduce((total, interval) => total + interval.duration * 60, 0) ?? 0
  const progress = totalDurationSeconds > 0 ? Math.min(100, ((completedDurationSeconds + intervalProgress * activeDurationSeconds) / totalDurationSeconds) * 100) : 0
  const currentIntervalProgress = activeDurationSeconds > 0 && session?.status === 'running' ? intervalProgress * 100 : 0
  const finishTime = session?.sessionEnd ? formatTime(new Date(session.sessionEnd)) : activeWork ? formatTime(activeWork.end) : '—'
  const scheduleLabel = useMemo(() => `${settings.morningStart}–${settings.morningEnd}  ·  ${settings.afternoonStart}–${settings.afternoonEnd}`, [settings])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings))
    window.desktop?.setCloseToTray(settings.closeToTray)
  }, [settings])
  useEffect(() => {
    if (overlayMode) return
    if (session) localStorage.setItem(STORAGE_TIMER, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_TIMER)
    window.desktop?.syncSession(session)
  }, [session, overlayMode])

  const notify = useCallback((title, body) => {
    if (!settings.desktopNotification) return
    if (window.desktop?.notify) window.desktop.notify({ title, body })
    else if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body })
  }, [settings.desktopNotification])

  const moveToInterval = useCallback((current) => {
    const nextIndex = current.intervalIndex + 1
    if (nextIndex >= current.schedule.length || Date.now() >= current.sessionEnd) {
      setSession(null)
      window.desktop?.sessionFinished()
      notify('Sesi kerja selesai', 'Bagus! Kamu sudah menyelesaikan sesi hari ini.')
      return
    }
    const next = current.schedule[nextIndex]
    const intervalStart = Date.now()
    const intervalEnd = Math.min(intervalStart + next.duration * 60000, current.sessionEnd)
    const updated = { ...current, intervalIndex: nextIndex, intervalStart, intervalEnd, remainingSeconds: Math.round((intervalEnd - intervalStart) / 1000), status: 'running' }
    setSession(updated)
    window.desktop?.syncSession(updated)
    window.desktop?.setBreakMode(next.type === 'break')
    notify(next.type === 'break' ? 'Waktunya istirahat' : 'Istirahat selesai', next.type === 'break' ? 'Ambil jeda sejenak dan segarkan pikiran.' : 'Saatnya kembali fokus.')
    if (next.type === 'break' && settings.soundNotification) { try { new Audio('/notification.wav').play().catch(() => {}) } catch { /* optional sound */ } }
  }, [notify, settings.alwaysOnTop, settings.soundNotification])

  useEffect(() => {
    if (!session || session.status !== 'running' || secondsLeft > 0) return
    if (Date.now() >= session.sessionEnd) {
      setSession(null)
      window.desktop?.sessionFinished()
      notify('Sesi kerja selesai', 'Timer berhenti tepat pada akhir jadwal kerja.')
    } else moveToInterval(session)
  }, [session, secondsLeft, moveToInterval, notify])

  useEffect(() => {
    if (session?.status !== 'running') return
    if (isBreak) window.desktop?.setBreakMode(true)
    else window.desktop?.setFocusMode()
  }, [isBreak, session?.status])

  function startTimer() {
    if (session) return
    const start = new Date()
    const work = getActiveWorkSession(start, settings)
    if (!work) return
    const remainingMinutes = getRemainingMinutes(start, work)
    const result = testMode
      ? {
          success: true,
          sessionCount: 3,
          totalMinutes: 1,
          schedule: Array.from({ length: 6 }, (_, index) => ({
            type: index % 2 === 0 ? 'focus' : 'break',
            duration: 10 / 60,
          })),
        }
      : generateSchedule(remainingMinutes, settings)
    if (!result.success) {
      setMessage(`Sisa waktu ${remainingMinutes} menit tidak dapat dibagi sesuai durasi sesi. Kombinasi terdekat untuk ${result.sessionCount || Math.ceil(remainingMinutes / 30)} sesi: ${result.minimumTotal}–${result.maximumTotal} menit.`)
      return
    }
    setMessage('')
    if (settings.desktopNotification && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    const first = result.schedule[0]
    const intervalEnd = Math.min(start.getTime() + first.duration * 60000, testMode ? start.getTime() + 60 * 1000 : work.end.getTime())
    const newSession = {
      schedule: result.schedule, intervalIndex: 0, status: 'running', intervalStart: start.getTime(),
      intervalEnd, sessionEnd: testMode ? start.getTime() + 60 * 1000 : work.end.getTime(),
      remainingSeconds: Math.round((intervalEnd - start.getTime()) / 1000), workName: testMode ? `${work.name} · Uji` : work.name, startedAt: start.getTime(),
    }
    setSession(newSession)
    notify('Sesi fokus dimulai', `Timer berjalan sampai ${formatTime(work.end)}.`)
    window.desktop?.setFocusMode()
  }

  function pauseTimer() {
    setSession((current) => current?.status === 'running' ? { ...current, status: 'paused', remainingSeconds: Math.max(0, Math.round((current.intervalEnd - Date.now()) / 1000)) } : current)
    window.desktop?.setBreakMode(false)
  }

  function resumeTimer() {
    setSession((current) => {
      if (!current || current.status !== 'paused') return current
      if (Date.now() >= current.sessionEnd) return null
      if (current.remainingSeconds <= 0) {
        const nextIndex = current.intervalIndex + 1
        if (nextIndex >= current.schedule.length) return null
        const next = current.schedule[nextIndex]
        const intervalStart = Date.now()
        const intervalEnd = Math.min(intervalStart + next.duration * 60000, current.sessionEnd)
        const updated = { ...current, intervalIndex: nextIndex, intervalStart, intervalEnd, remainingSeconds: Math.round((intervalEnd - intervalStart) / 1000), status: 'running' }
        window.desktop?.syncSession(updated)
        window.desktop?.setBreakMode(next.type === 'break' && settings.alwaysOnTop)
        notify(next.type === 'break' ? 'Waktunya istirahat' : 'Istirahat selesai', next.type === 'break' ? 'Ambil jeda sejenak dan segarkan pikiran.' : 'Saatnya kembali fokus.')
        return updated
      }
      const end = Date.now() + current.remainingSeconds * 1000
      return { ...current, status: 'running', intervalStart: Date.now(), intervalEnd: Math.min(end, current.sessionEnd) }
    })
  }

  function stopTimer() {
    setSession(null)
    setMessage('Timer dihentikan. Kamu bisa mulai sesi baru selama jam kerja aktif.')
    window.desktop?.setBreakMode(false)
  }

  useEffect(() => {
    const unsubscribeTray = window.desktop?.onTrayAction((action) => {
      if (action === 'pause') {
        pauseTimer()
        window.desktop?.showWindow()
      }
      if (action === 'resume') {
        resumeTimer()
        window.desktop?.setFocusMode()
      }
      if (action === 'stop') {
        stopTimer()
        window.desktop?.sessionFinished()
      }
    })
    const unsubscribeResume = window.desktop?.onSystemResumed(() => setNow(Date.now()))
    const unsubscribeOverlay = window.desktop?.onOverlayMode(setOverlayMode)
    const unsubscribeSessionSync = window.desktop?.onSessionSync((synced) => setSession(synced))
    const unsubscribeSettings = window.desktop?.onOpenSettings(() => setSettingsOpen(true))
    if (window.desktop?.isOverlay) setOverlayMode(true)
    window.desktop?.getVersion().then(setAppVersion).catch(() => {})
    return () => { unsubscribeTray?.(); unsubscribeResume?.(); unsubscribeOverlay?.(); unsubscribeSettings?.(); unsubscribeSessionSync?.() }
  })

  const updateSetting = (key, value) => setSettings((current) => ({ ...current, [key]: value }))

  return (
    <main className={`app-shell ${overlayMode ? 'overlay-shell' : 'simple-app'}`}>
      {overlayMode ? <section className={`break-overlay ${isBreak ? 'visible' : ''}`} onPointerDown={(event) => {
        if (event.target.closest('button')) return
        overlayDrag.current = { x: event.screenX, y: event.screenY }
        event.currentTarget.setPointerCapture(event.pointerId)
      }} onPointerMove={(event) => {
        if (!overlayDrag.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return
        const deltaX = event.screenX - overlayDrag.current.x
        const deltaY = event.screenY - overlayDrag.current.y
        if (deltaX || deltaY) {
          window.desktop?.moveOverlay({ deltaX, deltaY })
          overlayDrag.current = { x: event.screenX, y: event.screenY }
        }
      }} onPointerUp={(event) => {
        overlayDrag.current = null
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      }}>
        <div className="overlay-indicator"><span className="overlay-dot" /> REST TIME</div>
        <div className="overlay-countdown">{isBreak ? formatDuration(secondsLeft) : '00:00:00'}</div>
        <div className="overlay-progress"><span style={{ width: `${currentIntervalProgress}%` }} /></div>
        <button className="overlay-close" onClick={() => window.desktop?.closeOverlay()} aria-label="Sembunyikan timer istirahat"><X size={14} /></button>
      </section> : <>
      <section className="simple-timer-card">
        <button className="icon-button simple-settings-button" onClick={() => setSettingsOpen(true)} aria-label="Buka pengaturan"><Settings2 size={17} /></button>
        <div className="simple-status"><span className={`mode-dot ${isBreak ? 'break-dot' : ''}`} />{session ? (session.status === 'paused' ? 'PAUSED' : isBreak ? 'BREAK' : 'FOCUS SESSION') : activeWork ? `WORK SESSION · ${activeWork.name.toUpperCase()}` : 'OUTSIDE WORK HOURS'}</div>
        <div className="simple-clock">{session ? formatDuration(secondsLeft) : formatTime(date)}</div>
        <div className="simple-detail">{session ? `${activeInterval?.type === 'break' ? 'Interval' : 'Interval'} ${session.intervalIndex + 1} of ${session.schedule.length} · ends ${finishTime}` : `Work hours ${scheduleLabel}`}</div>
        {session && <div className="simple-progress"><span style={{ width: `${progress}%` }} /></div>}
        <div className="simple-actions">
          {!session && <button className="primary-button simple-start" onClick={startTimer} disabled={!activeWork}><Play size={17} fill="currentColor" /> Start focus</button>}
          {session?.status === 'running' && <button className="primary-button simple-start" onClick={pauseTimer}><Pause size={17} fill="currentColor" /> Pause</button>}
          {session?.status === 'paused' && <button className="primary-button simple-start" onClick={resumeTimer}><Play size={17} fill="currentColor" /> Resume</button>}
          {session && <button className="secondary-button" onClick={stopTimer}><Square size={14} fill="currentColor" /> Stop</button>}
        </div>
        {message && <div className="simple-message"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Tutup"><X size={15} /></button></div>}
      </section>
      <div className="simple-footer"><span><ShieldCheck size={14} /> Timer respects your workday end</span><span>{activeWork ? `${activeWork.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${finishTime}` : 'Next session 07:30'}</span></div>

      {settingsOpen && <SettingsModal settings={settings} updateSetting={updateSetting} testMode={testMode} setTestMode={setTestMode} onClose={() => setSettingsOpen(false)} />}
      </>}
    </main>
  )
}

function SettingsModal({ settings, updateSetting, testMode, setTestMode, onClose }) {
  const timeFields = [
    ['morningStart', 'Morning starts'], ['morningEnd', 'Morning ends'], ['afternoonStart', 'Afternoon starts'], ['afternoonEnd', 'Afternoon ends'],
  ]
  const numberFields = [['focusMin', 'Focus minimum'], ['focusMax', 'Focus maximum'], ['breakMin', 'Break minimum'], ['breakMax', 'Break maximum']]
  const toggles = [['alwaysOnTop', 'Always on top during breaks', 'Bring your timer forward when it’s time to rest'], ['desktopNotification', 'Desktop notifications', 'Get a gentle nudge when an interval changes'], ['soundNotification', 'Sound notification', 'Play a sound when break time begins'], ['closeToTray', 'Close to system tray', 'Keep the timer running in your notification area']]

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="modal-header"><button className="back-button" onClick={onClose}><ArrowLeft size={17} /></button><div><p className="eyebrow">MAKE IT YOURS</p><h2 id="settings-title">Settings</h2></div><button className="icon-button modal-close" onClick={onClose} aria-label="Tutup"><X size={18} /></button></div><div className="modal-body"><div className="settings-group"><div className="settings-group-title"><span className="settings-group-icon"><Clock3 size={16} /></span><div><strong>Work schedule</strong><small>Set your daily focus windows</small></div></div><div className="field-grid">{timeFields.map(([key, label]) => <label className="field" key={key}><span>{label}</span><input type="time" value={settings[key]} onChange={(event) => updateSetting(key, event.target.value)} /></label>)}</div></div><div className="settings-group"><div className="settings-group-title"><span className="settings-group-icon focus-settings-icon"><AlarmClock size={16} /></span><div><strong>Interval lengths</strong><small>Minutes per focus or break interval</small></div></div><div className="field-grid number-grid">{numberFields.map(([key, label]) => <label className="field" key={key}><span>{label}</span><div className="number-input-wrap"><input type="number" min="1" max="120" value={settings[key]} onChange={(event) => updateSetting(key, Number(event.target.value))} /><span>min</span></div></label>)}</div>{settings.focusMin > settings.focusMax || settings.breakMin > settings.breakMax ? <p className="field-error">Minimum duration must be less than or equal to maximum duration.</p> : null}</div><div className="settings-group preferences-group"><div className="settings-group-title"><span className="settings-group-icon prefs-icon"><Bell size={16} /></span><div><strong>Preferences</strong><small>Choose how dayflow fits into your day</small></div></div><div className="toggle-list">{toggles.map(([key, label, help]) => <label className="toggle-row" key={key}><span><strong>{label}</strong><small>{help}</small></span><input className="toggle-input" type="checkbox" checked={Boolean(settings[key])} onChange={(event) => updateSetting(key, event.target.checked)} /><span className="toggle-track" /></label>)}</div></div><div className="settings-group test-mode-group"><label className="toggle-row test-mode-row"><span><strong>Quick test mode</strong><small>6 stages: 10-second focus and break intervals</small></span><input className="toggle-input" type="checkbox" checked={testMode} onChange={(event) => setTestMode(event.target.checked)} /><span className="toggle-track" /></label><p className="test-mode-hint">For testing only. Turn off to use your regular work schedule and interval lengths.</p></div></div><div className="modal-footer"><span><Check size={14} /> Changes save automatically</span><button className="primary-button save-button" onClick={onClose}>Done <Check size={15} /></button></div></section></div>
}

export default App
