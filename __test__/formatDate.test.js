import { formatDate } from '../src/utils'

const mockFormatDate = jest.fn()
const mockGetScriptTimeZone = jest.fn()

// formatDateで使用されているGASのクラスをモック
global.Utilities = { formatDate: mockFormatDate }
global.Session = { getScriptTimeZone: mockGetScriptTimeZone }

describe('formatDate', () => {
  beforeEach(() => {
    mockFormatDate.mockReset()
    mockGetScriptTimeZone.mockReset()
  })

  it('1桁の月/日の場合、2桁目の0を表示せずにMM/dd形式の日付を返す', () => {
    // Setup
    mockGetScriptTimeZone.mockReturnValue('GMT')
    mockFormatDate.mockImplementation((date, timeZone, format) => '04/07')

    // Execute
    const result = formatDate(new Date())

    // Assert
    expect(result).toBe('4/7')
    expect(mockFormatDate).toHaveBeenCalledWith(expect.any(Date), 'GMT', 'MM/dd')
  })

  it('2桁の月/日の場合MM/dd形式の日付を返す', () => {
    // Setup
    mockGetScriptTimeZone.mockReturnValue('GMT')
    mockFormatDate.mockImplementation((date, timeZone, format) => '11/15')

    // Execute
    const result = formatDate(new Date())

    // Assert
    expect(result).toBe('11/15')
    expect(mockFormatDate).toHaveBeenCalledWith(expect.any(Date), 'GMT', 'MM/dd')
  })
})
