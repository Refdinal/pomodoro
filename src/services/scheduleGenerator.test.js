import { describe, expect, it } from 'vitest'
import { generateSchedule } from './scheduleGenerator'
import { DEFAULT_SETTINGS, getActiveWorkSession, getRemainingMinutes } from './workSchedule'

describe('schedule generation', () => {
  it('allocates remaining work time in alternating random focus and break intervals', () => {
    const result = generateSchedule(180, DEFAULT_SETTINGS, () => 0.5)

    expect(result.success).toBe(true)
    expect(result.totalMinutes).toBe(180)
    expect(result.schedule[0].type).toBe('focus')
    expect(result.schedule.at(-1).type).toBe('focus')
    expect(result.schedule.reduce((sum, interval) => sum + interval.duration, 0)).toBe(180)
    for (const [index, interval] of result.schedule.entries()) {
      expect(interval.type).toBe(index % 2 === 0 ? 'focus' : 'break')
      const minimum = interval.type === 'focus' ? 15 : 5
      const maximum = interval.type === 'focus' ? 25 : 8
      expect(interval.duration).toBeGreaterThanOrEqual(minimum)
      expect(interval.duration).toBeLessThanOrEqual(maximum)
    }
  })

  it('uses a short remainder as the final interval', () => {
    const result = generateSchedule(47, DEFAULT_SETTINGS, () => 0.99)

    expect(result.success).toBe(true)
    expect(result.totalMinutes).toBe(47)
    expect(result.schedule).toEqual([
      { type: 'focus', duration: 25 },
      { type: 'break', duration: 8 },
      { type: 'focus', duration: 14 },
    ])
  })

  it('allows a final focus interval shorter than the configured minimum', () => {
    const result = generateSchedule(7, DEFAULT_SETTINGS)

    expect(result.success).toBe(true)
    expect(result.schedule).toEqual([{ type: 'focus', duration: 7 }])
  })

  it('allows a final break interval shorter than the configured minimum', () => {
    const result = generateSchedule(21, DEFAULT_SETTINGS, () => 0)

    expect(result.success).toBe(true)
    expect(result.schedule).toEqual([
      { type: 'focus', duration: 15 },
      { type: 'break', duration: 5 },
      { type: 'focus', duration: 1 },
    ])
  })

  it('rejects invalid remaining time and duration ranges', () => {
    expect(generateSchedule(0, DEFAULT_SETTINGS).success).toBe(false)
    expect(generateSchedule(30, { ...DEFAULT_SETTINGS, focusMin: 26, focusMax: 25 }).success).toBe(false)
  })

  it('calculates time remaining in morning and afternoon work sessions', () => {
    const morning = getActiveWorkSession(new Date(2026, 0, 2, 8, 20), DEFAULT_SETTINGS)
    const afternoon = getActiveWorkSession(new Date(2026, 0, 2, 14, 0), DEFAULT_SETTINGS)
    expect(morning.name).toBe('Pagi')
    expect(getRemainingMinutes(new Date(2026, 0, 2, 8, 20), morning)).toBe(220)
    expect(afternoon.name).toBe('Siang')
    expect(getRemainingMinutes(new Date(2026, 0, 2, 14, 0), afternoon)).toBe(90)
    expect(getActiveWorkSession(new Date(2026, 0, 2, 12, 30), DEFAULT_SETTINGS)).toBeNull()
  })
})
