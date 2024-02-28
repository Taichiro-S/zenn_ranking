import { SLACK_WEBHOOK_URL } from './constants'
import { formatMessageForSlack } from './format_message_for_slack'

export function sendWeeklyMessageToSlackChannel() {
  const message = formatMessageForSlack('weekly')
  const payload = JSON.stringify(message)
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload
  }
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options)
}

export function sendMonthlyMessageToSlackChannel() {
  const message = formatMessageForSlack('monthly')
  const payload = JSON.stringify(message)
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload
  }
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options)
}
