import { ADMIN_EMAIL } from './script_property'
import { formatMessageForSlack } from './format_message_for_slack'
import { sendMessageToSlackChannel, slackAppOAuth } from './slack_api'
import { saveMonthlyArticlesToSpreadsheet, saveWeeklyArticlesToSpreadsheet, fetchSlackWebhookUrls } from './google_api'

// GASから関数を呼び出すために、グローバル変数に登録する
global.distributeMonthlyRanking = distributeMonthlyRanking
global.distributeWeeklyRanking = distributeWeeklyRanking
global.doGet = doGet

/**
 * slackのOAuth認証を行うためのリダイレクト先
 * @param {*} e
 * @returns
 */
function doGet(e) {
  const code = e.parameter.code
  if (code) {
    slackAppOAuth(code)
  } else {
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
