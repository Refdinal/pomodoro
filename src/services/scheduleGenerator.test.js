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

  it('rejects a remaining duration with no valid combination', () => {
    const result = generateSchedule(30, DEFAULT_SETTINGS)
    expect(result.success).toBe(false)
    expect(result.minimumTotal).toBe(20)
    expect(result.maximumTotal).toBe(25)
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
