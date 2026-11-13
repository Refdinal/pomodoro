export function generateSchedule(remainingMinutes, settings = {}, random = Math.random) {
  const focusMin = Number(settings.focusMin ?? 20)
  const focusMax = Number(settings.focusMax ?? 25)
  const breakMin = Number(settings.breakMin ?? 6)
  const breakMax = Number(settings.breakMax ?? 7)
  if (!Number.isInteger(remainingMinutes) || remainingMinutes < 1) {
    return { success: false, message: 'Sisa waktu harus minimal satu menit.', sessionCount: 0, minimumTotal: 0, maximumTotal: 0 }
  }

  const sessionCount = Math.ceil(remainingMinutes / 30)
  const breakCount = Math.max(0, sessionCount - 1)
  const slots = [
    ...Array.from({ length: sessionCount }, (_, index) => ({ type: 'focus', index, min: focusMin, max: focusMax, duration: focusMin })),
    ...Array.from({ length: Math.max(0, sessionCount - 1) }, (_, index) => ({ type: 'break', index, min: breakMin, max: breakMax, duration: breakMin })),
  ]
  const minimumTotal = slots.reduce((sum, slot) => sum + slot.min, 0)
  const maximumTotal = slots.reduce((sum, slot) => sum + slot.max, 0)

  if (sessionCount < 1) {
    return { success: false, message: 'Sisa waktu harus minimal satu menit.', sessionCount, minimumTotal, maximumTotal }
  }

  if (remainingMinutes < minimumTotal) {
    // Preserve the focus/break cycle count but remove breaks to fit a short window.
    const focusCount = Math.max(1, Math.ceil(remainingMinutes / focusMax))
    const baseDuration = Math.floor(remainingMinutes / focusCount)
    const extraMinutes = remainingMinutes % focusCount
    const schedule = Array.from({ length: focusCount }, (_, index) => ({
      type: 'focus',
      duration: baseDuration + (index < extraMinutes ? 1 : 0),
    }))
    return { success: true, sessionCount: focusCount, totalMinutes: remainingMinutes, schedule, minimumTotal: remainingMinutes, maximumTotal: remainingMinutes }
  }

  if (remainingMinutes > maximumTotal) {
    // Add focus-only intervals for unusually long windows so every minute is used.
    const focusCount = Math.ceil((remainingMinutes - maximumTotal) / focusMax)
    const baseDuration = Math.floor(remainingMinutes / (sessionCount + focusCount))
    const extraMinutes = remainingMinutes % (sessionCount + focusCount)
    const focusSchedule = Array.from({ length: sessionCount + focusCount }, (_, index) => ({
      type: 'focus',
      duration: baseDuration + (index < extraMinutes ? 1 : 0),
    }))
    return { success: true, sessionCount: focusSchedule.length, totalMinutes: remainingMinutes, schedule: focusSchedule, minimumTotal: remainingMinutes, maximumTotal: remainingMinutes }
  }

  let extra = remainingMinutes - minimumTotal
  const shuffled = [...slots]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  while (extra > 0) {
    const available = shuffled.filter((slot) => slot.duration < slot.max)
    if (!available.length) return { success: false, message: 'Gagal membentuk jadwal.', minimumTotal, maximumTotal }
    const slot = available[Math.floor(random() * available.length)]
    slot.duration += 1
    extra -= 1
  }

  const focuses = slots.filter((slot) => slot.type === 'focus').sort((a, b) => a.index - b.index)
  const breaks = slots.filter((slot) => slot.type === 'break').sort((a, b) => a.index - b.index)
  const schedule = []
  for (let i = 0; i < sessionCount; i += 1) {
    schedule.push({ type: 'focus', duration: focuses[i].duration })
    if (i < sessionCount - 1) schedule.push({ type: 'break', duration: breaks[i].duration })
  }

  const totalMinutes = schedule.reduce((sum, item) => sum + item.duration, 0)
  const validIntervals = schedule.every((item) => item.type === 'focus'
    ? item.duration >= focusMin && item.duration <= focusMax
    : item.duration >= breakMin && item.duration <= breakMax)
  if (totalMinutes !== remainingMinutes || !validIntervals) return { success: false, message: 'Validasi jadwal gagal.', minimumTotal, maximumTotal }
  return { success: true, sessionCount, totalMinutes, schedule, minimumTotal, maximumTotal }
}
