function randomDuration(min, max, random) {
  return min + Math.floor(random() * (max - min + 1))
}

export function generateSchedule(remainingMinutes, settings = {}, random = Math.random) {
  const focusMin = Number(settings.focusMin ?? 15)
  const focusMax = Number(settings.focusMax ?? 25)
  const breakMin = Number(settings.breakMin ?? 5)
  const breakMax = Number(settings.breakMax ?? 8)

  if (!Number.isInteger(remainingMinutes) || remainingMinutes < 1) {
    return { success: false, message: 'Sisa waktu harus minimal satu menit.', sessionCount: 0, totalMinutes: 0, schedule: [] }
  }
  if (![focusMin, focusMax, breakMin, breakMax].every(Number.isInteger)
    || focusMin < 1 || breakMin < 1 || focusMin > focusMax || breakMin > breakMax) {
    return { success: false, message: 'Rentang durasi interval tidak valid.', sessionCount: 0, totalMinutes: 0, schedule: [] }
  }

  let remaining = remainingMinutes
  const schedule = []
  let type = 'focus'

  while (remaining > 0) {
    const min = type === 'focus' ? focusMin : breakMin
    const max = type === 'focus' ? focusMax : breakMax

    if (remaining < min) {
      schedule.push({ type, duration: remaining })
      remaining = 0
      break
    }

    const duration = Math.min(randomDuration(min, max, random), remaining)
    schedule.push({ type, duration })
    remaining -= duration
    type = type === 'focus' ? 'break' : 'focus'
  }

  return {
    success: true,
    sessionCount: schedule.filter((interval) => interval.type === 'focus').length,
    totalMinutes: remainingMinutes,
    schedule,
  }
}
