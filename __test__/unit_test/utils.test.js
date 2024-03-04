import {
  formatTime,
  escapeMarkdownSpecialChars,
  formatDate,
  getTimePeriod,
  extractBobyText,
  pageExists
} from '../../src/utils'
import { TIME_PERIOD, WEEKLY_RANKING_PAGE, MONTHLY_RANKING_PAGE } from '../../src/constants'

// formatDate関数のためのモック（必要に応じて調整してください）
const mockFormatDate = jest.fn()
global.Utilities = { formatDate: mockFormatDate }
const mockGetScriptTimeZone = jest.fn()
global.Session = { getScriptTimeZone: mockGetScriptTimeZone }

describe('formatTime', () => {
  it('converts Date object to HH:mm format', () => {
    expect(formatTime(new Date(2024, 1, 1, 9, 5))).toBe('09:05')
    expect(formatTime(new Date(2024, 1, 1, 23, 59))).toBe('23:59')
  })
})

describe('escapeMarkdownSpecialChars', () => {
  it('escapes special markdown characters', () => {
    expect(escapeMarkdownSpecialChars('Hello & Goodbye <World>')).toBe('Hello &amp; Goodbye &lt;World&gt;')
  })
})

describe('formatDate', () => {
  it('formats date according to MM/dd, removing leading zeros', () => {
    mockFormatDate.mockReturnValueOnce('01/02').mockReturnValueOnce('10/20')
    mockGetScriptTimeZone.mockReturnValue('JST')
    expect(formatDate(new Date(2024, 0, 2))).toBe('1/2')
    expect(formatDate(new Date(2024, 9, 20))).toBe('10/20')
  })
})

describe('getTimePeriod', () => {
  it('returns correct time period for weekly and monthly', () => {
    const baseDate = new Date(2024, 1, 15)
    const weekly = getTimePeriod(baseDate, TIME_PERIOD.WEEKLY)
    const monthly = getTimePeriod(baseDate, TIME_PERIOD.MONTHLY)

    // 期待値はタイムゾーンに依存するため、結果が異なる可能性があります
    expect(weekly.start).toEqual(new Date(2024, 1, 8, 0, 0, 0))
    expect(weekly.end).toEqual(new Date(2024, 1, 14, 23, 59, 59))
    expect(monthly.start).toEqual(new Date(2024, 0, 1, 0, 0, 0))
    expect(monthly.end).toEqual(new Date(2024, 0, 31, 23, 59, 59))
  })
})

describe('extractBobyText', () => {
  it('extracts body text from encoded string', () => {
    const encodedStr = '\\u0048\\u0065\\u006C\\u006C\\u006F</br>World'
    expect(extractBobyText(encodedStr)).toBe('HelloWorld...')
  })
})

describe('pageExists', () => {
  it('checks if a page exists', () => {
    expect(pageExists(WEEKLY_RANKING_PAGE)).toBe(true)
    expect(pageExists(MONTHLY_RANKING_PAGE)).toBe(true)
    expect(pageExists('DAILY_RANKING_PAGE')).toBe(false)
  })
})
