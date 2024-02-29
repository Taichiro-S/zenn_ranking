import { ADMIN_EMAIL, SLACK_APP_CLIENT_ID, SLACK_APP_CLIENT_SECRET, REDIRECT_URL } from './script_property'
import { formatMessageForSlack } from './format_message_for_slack'
import { sendMessageToSlackChannel } from './slack_api'
import {
  saveMonthlyArticlesToSpreadsheet,
  saveWeeklyArticlesToSpreadsheet,
  fetchSlackWebhookUrls,
  saveOAuthInfo
} from './google_api'

// GASから関数を呼び出すために、グローバル変数に登録する
global.distributeMonthlyRanking = distributeMonthlyRanking
global.distributeWeeklyRanking = distributeWeeklyRanking
global.doGet = doGet

/**
 * slackのOAuth認証を行うためのリダイレクトで実行
 * トークン情報を取得してCloud Datastoreに保存する
 * @param {*} e
 * @returns
 */
function doGet(e) {
  const code = e.parameter.code
  if (code) {
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
        saveOAuthInfo(resJson)
        const teamId = resJson.team.id
        const appId = resJson.app_id
        const redirectUrl = `https://slack.com/app_redirect?team=${teamId}&app=${appId}`
        const template = HtmlService.createTemplateFromFile('auth_success')
        template.redirectUrl = redirectUrl
        return template.evaluate()
      } else {
        console.log('エラーが発生しました1:', resJson)
        return HtmlService.createHtmlOutputFromFile('auth_fail')
      }
    } catch (error) {
      console.log('エラーが発生しました2:', error)
      return HtmlService.createHtmlOutputFromFile('auth_fail')
    }
  } else {
    console.log('codeがありません')
    return HtmlService.createHtmlOutputFromFile('auth_fail')
  }
}

/**
 * 月間ランキングを配信する
 */
function distributeMonthlyRanking() {
  try {
    const webhookUrls = fetchSlackWebhookUrls()
    const message = formatMessageForSlack('monthly')
    webhookUrls.forEach((webhookUrl) => {
      sendMessageToSlackChannel(message, webhookUrl)
    })
    saveMonthlyArticlesToSpreadsheet()
  } catch (e) {
    const subject = 'プロジェクト[Zennランキング]で、GASの実行中にエラーが発生しました。'
    const message = 'エラーメッセージ\n' + e.message + '\n' + 'スタックトレース\n' + e.stack
    MailApp.sendEmail(ADMIN_EMAIL, subject, message)
  }
}

/**
 * 週間ランキングを配信する
 * @param {*} event
 */
function distributeWeeklyRanking() {
  try {
    const webhookUrls = fetchSlackWebhookUrls()
    console.log('webhookUrls:', webhookUrls)
    const message = formatMessageForSlack('weekly')
    webhookUrls.forEach((webhookUrl) => {
      sendMessageToSlackChannel(message, webhookUrl)
    })
    saveWeeklyArticlesToSpreadsheet()
  } catch (e) {
    console.log('エラーが発生しました3:', e)
    const subject = 'プロジェクト[Zennランキング]で、GASの実行中にエラーが発生しました。'
    const message = 'エラーメッセージ\n' + e.message + '\n' + 'スタックトレース\n' + e.stack
    MailApp.sendEmail(ADMIN_EMAIL, subject, message)
  }
}
