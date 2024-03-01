import { TIME_PERIOD } from './constants'

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
  if (res.startsWith(0)) {
    return res.slice(1, res.length)
  }
  return res
}

export function getTimePeriod(period) {
  const today = new Date()
  let start
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (period === TIME_PERIOD.WEEKLY) {
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8)
  } else if (period === TIME_PERIOD.MONTHLY) {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  }
  return { start: formatDate(start), end: formatDate(end) }
}
