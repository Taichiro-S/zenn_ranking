import { SLACK_WEBHOOK_URL, SLACK_APP_CLIENT_ID, SLACK_APP_CLIENT_SECRET } from './script_property'
import { REDIRECT_URL } from './constants'

export function sendMessageToSlackChannel(message) {
  const payload = JSON.stringify(message)
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload
  }
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options)
}

export function doPost(e) {
  const payload = JSON.parse(e.postData.contents)
  const code = payload.code

  const res = UrlFetchApp.fetch('https://slack.com/api/oauth.v2.access', {
    method: 'post',
    payload: {
      code,
      client_id: SLACK_APP_CLIENT_ID,
      client_secret: SLACK_APP_CLIENT_SECRET,
      redirect_uri: REDIRECT_URL
    }
  })

  const resJson = JSON.parse(res.getContentText())

  if (resJson.ok) {
    const teamId = resJson.team.id
    const appId = resJson.app_id
    const redirectUrl = `https://slack.com/app_redirect?team=${teamId}&app=${appId}`

    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        redirectUrl
      })
    ).setMimeType(ContentService.MimeType.JSON)
  } else {
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: false,
        error: '認証に失敗しました。'
      })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}
