import { ADMIN_EMAIL } from './script_property'
import { formatMessageForSlack } from './format_message_for_slack'
import { sendMessageToSlackChannel, slackAppOAuth, fetchSlackWebhookUrls } from './slack_api'
import { saveMonthlyArticlesToSpreadsheet, saveWeeklyArticlesToSpreadsheet } from './google_api'

// GASから関数を呼び出すために、グローバル変数に登録する
global.distributeMonthlyRanking = distributeMonthlyRanking
global.distributeWeeklyRanking = distributeWeeklyRanking
global.doGet = doGet

function doGet(e) {
  const code = e.parameter.code
  if (code) {
    slackAppOAuth(code)
  } else {
    return HtmlService.createHtmlOutputFromFile('auth_fail')
  }
}

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

function distributeWeeklyRanking(event) {
  try {
    const webhookUrls = fetchSlackWebhookUrls()
    const message = formatMessageForSlack('weekly')
    webhookUrls.forEach((webhookUrl) => {
      sendMessageToSlackChannel(message, webhookUrl)
    })
    saveWeeklyArticlesToSpreadsheet()
  } catch (e) {
    const subject = 'プロジェクト[dc_gform2sp]で、GASの実行中にエラーが発生しました。'
    const message = 'エラーメッセージ\n' + e.message + '\n' + 'スタックトレース\n' + e.stack
    MailApp.sendEmail(ADMIN_EMAIL, subject, message)
  }
}
