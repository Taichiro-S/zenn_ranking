import { SLACK_APP_CLIENT_ID, SLACK_APP_CLIENT_SECRET } from './script_property'
import { REDIRECT_URL } from './constants'

export function sendMessageToSlackChannel(message, webhookUrl) {
  const payload = JSON.stringify(message)
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload
  }
  UrlFetchApp.fetch(webhookUrl, options)
}

export function slackAppOAuth(code) {
  try {
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
      console.log(redirectUrl)
      const template = HtmlService.createTemplateFromFile('auth_success')
      template.redirectUrl = redirectUrl
      return template.evaluate()
    } else {
      return HtmlService.createHtmlOutputFromFile('auth_fail')
    }
  } catch (error) {
    return HtmlService.createHtmlOutputFromFile('auth_fail')
  }
}
