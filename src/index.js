import { ADMIN_EMAIL, SLACK_APP_CLIENT_ID, SLACK_APP_CLIENT_SECRET } from './script_property'
import { REDIRECT_URL } from './constants'
import { formatMessageForSlack } from './format_message_for_slack'
import { sendMessageToSlackChannel } from './slack_api'
import { saveMonthlyArticlesToSpreadsheet, saveWeeklyArticlesToSpreadsheet } from './google_sp_api'

// GASから関数を呼び出すために、グローバル変数に登録する
global.distributeMonthlyRanking = distributeMonthlyRanking
global.distributeWeeklyRanking = distributeWeeklyRanking
global.doGet = doGet

function doGet(e) {
  const code = e.parameter.code
  console.log('doget')
  if (code) {
    console.log(code)
    console.log(SLACK_APP_CLIENT_ID, SLACK_APP_CLIENT_SECRET, REDIRECT_URL)
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
      console.log('resJson:', resJson)
      if (resJson.ok) {
        const teamId = resJson.team.id
        const appId = resJson.app_id
        const redirectUrl = `https://slack.com/app_redirect?team=${teamId}&app=${appId}`
        console.log(redirectUrl)
        const template = HtmlService.createTemplateFromFile('auth_success')
        template.redirectUrl = redirectUrl
        return template.evaluate()
      } else {
        return HtmlService.createHtmlOutput('認証に失敗しました。')
      }
    } catch (error) {
      return HtmlService.createHtmlOutput('エラーが発生しました。')
    }
  } else {
    // codeパラメータがない場合の処理
    return HtmlService.createHtmlOutputFromFile('index')
  }
}

// function doGet(e) {
//   // URLパラメータからcodeを取得
//   const code = e.parameter.code

//   // HTMLテンプレートを取得
//   const template = HtmlService.createTemplateFromFile('index')

//   // codeをテンプレートに渡す
//   template.code = code

//   // HTMLテンプレートを評価して出力
//   return template.evaluate()
//   // return HtmlService.createHtmlOutputFromFile('index')
// }

function distributeMonthlyRanking() {
  try {
    const message = formatMessageForSlack('monthly')
    sendMessageToSlackChannel(message)
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
    sendMessageToSlackChannel(message)
    saveWeeklyArticlesToSpreadsheet()
  } catch (e) {
    const subject = 'プロジェクト[dc_gform2sp]で、GASの実行中にエラーが発生しました。'
    const message = 'エラーメッセージ\n' + e.message + '\n' + 'スタックトレース\n' + e.stack
    MailApp.sendEmail(ADMIN_EMAIL, subject, message)
  }
}
