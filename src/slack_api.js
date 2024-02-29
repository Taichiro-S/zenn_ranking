export function sendMessageToSlackChannel(message, webhookUrl) {
  const payload = JSON.stringify(message)
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload
  }
  UrlFetchApp.fetch(webhookUrl, options)
}
