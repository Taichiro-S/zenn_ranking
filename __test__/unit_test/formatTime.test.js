import { formatTime } from '../../src/utils'

describe('formatTimeのテスト', () => {
  test('時間と分が両方２桁の場合', () => {
    const date = new Date(2020, 0, 1, 10, 30)
    const formattedTime = formatTime(date)
    expect(formattedTime).toBe('10:30')
  })

  test('時間が１桁の場合', () => {
    const date = new Date(2020, 0, 1, 9, 45)
    const formattedTime = formatTime(date)
    expect(formattedTime).toBe('09:45')
  })

  test('分が１桁の場合', () => {
    const date = new Date(2020, 0, 1, 11, 5)
    const formattedTime = formatTime(date)
    expect(formattedTime).toBe('11:05')
  })
})
