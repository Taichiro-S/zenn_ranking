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
    // 7日前の00:00:00と前日の時刻23:59:59を返す
    // 関数が実行されるタイムゾーンがJSTであることを前提にしている
    end = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 23, 59, 59)
    start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7, 0, 0, 0)
  } else if (period === TIME_PERIOD.MONTHLY) {
    // 先月の1日の時刻00:00:00と先月の末日の時刻23:59:59を返す
    start = new Date(date.getFullYear(), date.getMonth() - 1, 1, 0, 0, 0)
    end = new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59)
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

export function encryptData(data, passphrase) {
  // eslint-disable-next-line no-undef
  const cipher = new cCryptoGS.Cipher(passphrase, 'aes')
  return cipher.encrypt(data)
}

export function decryptData(encryptedData, passphrase) {
  // eslint-disable-next-line no-undef
  const cipher = new cCryptoGS.Cipher(passphrase, 'aes')
  return cipher.decrypt(encryptedData)
}
