import { describe, expect, it } from 'vitest'
import { generateSchedule } from './scheduleGenerator'
import { DEFAULT_SETTINGS, getActiveWorkSession, getRemainingMinutes } from './workSchedule'

describe('schedule generation', () => {
  it('allocates exactly 220 minutes across valid focus and break intervals', () => {
    const result = generateSchedule(220, DEFAULT_SETTINGS, () => 0.42)
    expect(result.success).toBe(true)
    expect(result.sessionCount).toBe(8)
    expect(result.schedule).toHaveLength(15)
    expect(result.totalMinutes).toBe(220)
    expect(result.schedule.at(-1).type).toBe('focus')
    for (const interval of result.schedule) {
      expect(interval.duration).toBeGreaterThanOrEqual(interval.type === 'focus' ? 20 : 6)
      expect(interval.duration).toBeLessThanOrEqual(interval.type === 'focus' ? 25 : 7)
    }
  })

  it('splits a short work window into focus intervals without breaks', () => {
    const result = generateSchedule(30, DEFAULT_SETTINGS)
    expect(result.success).toBe(true)
    expect(result.sessionCount).toBe(2)
    expect(result.totalMinutes).toBe(30)
    expect(result.schedule).toEqual([
      { type: 'focus', duration: 15 },
      { type: 'focus', duration: 15 },
    ])
  })

  it('uses the 21 minutes before the morning workday ends as focus', () => {
    const result = generateSchedule(21, DEFAULT_SETTINGS)
    expect(result.success).toBe(true)
    expect(result.totalMinutes).toBe(21)
    expect(result.schedule).toEqual([{ type: 'focus', duration: 21 }])
  })

  it('keeps a one-hour work window as focus intervals without a long break', () => {
    const result = generateSchedule(71, DEFAULT_SETTINGS)
    expect(result.success).toBe(true)
    expect(result.totalMinutes).toBe(71)
    expect(result.schedule.reduce((sum, interval) => sum + interval.duration, 0)).toBe(71)
    expect(result.schedule.every((interval) => interval.type === 'focus')).toBe(true)
    expect(result.schedule).toHaveLength(3)
    expect(result.schedule.every((interval) => interval.duration <= DEFAULT_SETTINGS.focusMax)).toBe(true)
    expect(result.schedule.at(-1).type).toBe('focus')
  })

  it('covers complete morning and afternoon work sessions', () => {
    const morning = getActiveWorkSession(new Date(2026, 0, 2, 8, 20), DEFAULT_SETTINGS)
    const afternoon = getActiveWorkSession(new Date(2026, 0, 2, 14, 0), DEFAULT_SETTINGS)
    expect(morning.name).toBe('Pagi')
    expect(getRemainingMinutes(new Date(2026, 0, 2, 8, 20), morning)).toBe(220)
    expect(afternoon.name).toBe('Siang')
    expect(getRemainingMinutes(new Date(2026, 0, 2, 14, 0), afternoon)).toBe(90)
    expect(getActiveWorkSession(new Date(2026, 0, 2, 12, 30), DEFAULT_SETTINGS)).toBeNull()
  })
})
