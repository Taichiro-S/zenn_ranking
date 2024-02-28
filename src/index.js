import { ADMIN_EMAIL } from './script_property'
import { formatMessageForSlack } from './format_message_for_slack'
import { sendMonthlyMessageToSlackChannel, sendWeeklyMessageToSlackChannel } from './slack_api'
import { saveMonthlyArticlesToSpreadsheet, saveWeeklyArticlesToSpreadsheet } from './google_sp_api'

// GASから関数を呼び出すために、グローバル変数に登録する
global.distributeMonthlyRanking = distributeMonthlyRanking
global.distributeWeeklyRanking = distributeWeeklyRanking
/**
 * フォーム送信時に回答をスプレッドシートに記入
 * @param {object} event
 * @return {void}
 */
function distributeMonthlyRanking() {
  try {
    const message = formatMessageForSlack('monthly')
    sendMonthlyMessageToSlackChannel(message)
    saveMonthlyArticlesToSpreadsheet()
  } catch (e) {
    const subject = 'プロジェクト[Zennランキング]で、GASの実行中にエラーが発生しました。'
    const message = 'エラーメッセージ\n' + e.message + '\n' + 'スタックトレース\n' + e.stack
    MailApp.sendEmail(ADMIN_EMAIL, subject, message)
  }
}

function distributeWeeklyRanking(event) {
  try {
    const message = formatMessageForSlack('weekly')
    sendWeeklyMessageToSlackChannel(message)
    saveWeeklyArticlesToSpreadsheet()
  } catch (e) {
    const subject = 'プロジェクト[dc_gform2sp]で、GASの実行中にエラーが発生しました。'
    const message = 'エラーメッセージ\n' + e.message + '\n' + 'スタックトレース\n' + e.stack
    MailApp.sendEmail(ADMIN_EMAIL, subject, message)
  }
}
