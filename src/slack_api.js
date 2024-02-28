import { SLACK_WEBHOOK_URL } from './constants'

export function sendMonthlyMessageToSlackChannel(message) {
  const payload = JSON.stringify(message)
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload
  }
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options)
}
