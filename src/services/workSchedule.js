export const DEFAULT_SETTINGS = {
  morningStart: '07:30', morningEnd: '12:00', afternoonStart: '13:30', afternoonEnd: '15:30',
  focusMin: 15, focusMax: 25, breakMin: 5, breakMax: 8,
  alwaysOnTop: true, desktopNotification: true, soundNotification: true, closeToTray: true,
}

function atTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

export function getActiveWorkSession(date = new Date(), settings = DEFAULT_SETTINGS) {
  const sessions = [
    { name: 'Pagi', start: atTime(date, settings.morningStart), end: atTime(date, settings.morningEnd) },
    { name: 'Siang', start: atTime(date, settings.afternoonStart), end: atTime(date, settings.afternoonEnd) },
  ]
  return sessions.find((session) => date >= session.start && date < session.end) ?? null
}

export function getRemainingMinutes(date, session) {
  return Math.floor((session.end.getTime() - date.getTime()) / 60000)
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}
