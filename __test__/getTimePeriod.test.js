import { getTimePeriod } from '../src/utils'
import { TIME_PERIOD } from '../src/constants'

describe('getTimePeriod', () => {
  it('1週間の開始と終了を返す', () => {
    const inputDate = new Date(2023, 3, 15) // April 15, 2023
    const period = TIME_PERIOD.WEEKLY
    const { start, end } = getTimePeriod(inputDate, period)

    const expectedStartDate = new Date(2023, 3, 7, 0, 0, 0) // April 7, 2023
    const expectedEndDate = new Date(2023, 3, 14, 0, 0, 0) // April 14, 2023

    expect(start).toEqual(expectedStartDate)
    expect(end).toEqual(expectedEndDate)
  })

  it('1ヶ月の開始と終了を返す', () => {
    const inputDate = new Date(2023, 3, 15) // April 15, 2023
    const period = TIME_PERIOD.MONTHLY
    const { start, end } = getTimePeriod(inputDate, period)

    const expectedStartDate = new Date(2023, 2, 1, 0, 0, 0) // March 1, 2023
    const expectedEndDate = new Date(2023, 3, 1, 0, 0, 0) // April 1, 2023

    expect(start).toEqual(expectedStartDate)
    expect(end).toEqual(expectedEndDate)
  })
})
