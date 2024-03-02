import { TIME_PERIOD, BODY_HTML_COUNT, WEEKLY_RANKING_PAGE, MONTHLY_RANKING_PAGE } from './constants'

/**
 * Date型からHH:mm形式に変換
 * @param {Date} date
 * @returns string HH:mm形式の時間
 */
export function formatTime(date) {
  let hours = date.getHours()
  let minutes = date.getMinutes()
  // 時間が1桁の場合は先頭に0を追加
  hours = hours < 10 ? '0' + hours : hours
  // 分が1桁の場合は先頭に0を追加
  minutes = minutes < 10 ? '0' + minutes : minutes
  return hours + ':' + minutes
}

export function escapeMarkdownSpecialChars(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function formatDate(date) {
  const res = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MM/dd')
  // 月日が01-09の場合、先頭の0を取り除く
  return res.replace(/^0/, '').replace(/\/0/, '/')
}

export function getTimePeriod(date, period) {
  let start, end
  if (period === TIME_PERIOD.WEEKLY) {
    // 前日の時刻00:00:00と8日前の00:00:00を返す
    end = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 0, 0, 0)
    start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 8, 0, 0, 0)
  } else if (period === TIME_PERIOD.MONTHLY) {
    // 先月の1日の時刻00:00:00と当月の1日の時刻00:00:00を返す
    end = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0)
    start = new Date(date.getFullYear(), date.getMonth() - 1, 1, 0, 0, 0)
  }
  return { start, end }
}

export function extractBobyText(encodedStr) {
  // Unicodeエスケープされた文字列をデコードする
  const decodedStr = encodedStr.replace(/\\u[\dA-F]{4}/gi, function (match) {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
  })
  const bodyText = decodedStr.replace(/<\/?[^>]+(>|$)/g, '').replace(/\n/g, '')

  return bodyText.substring(0, BODY_HTML_COUNT) + '...'
}

export function pageExists(pageName) {
  const pages = [MONTHLY_RANKING_PAGE, WEEKLY_RANKING_PAGE]
  return pages.includes(pageName)
}
