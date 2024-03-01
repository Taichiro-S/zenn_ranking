import {
  SLACK_APP_CLIENT_ID,
  SLACK_APP_CLIENT_SECRET,
  REDIRECT_URL,
  SLACK_WEBHOOK_URL_FOR_ERROR_LOG
} from './script_property'
import { formatErrorMessageForSlack, formatMessageForSlack } from './format_message_for_slack'
import { sendMessageToSlackChannel } from './slack_api'
import {
  // saveMonthlyArticlesToSpreadsheet,
  // saveWeeklyArticlesToSpreadsheet,
  fetchSlackWebhookUrls,
  saveOAuthInfo,
  saveArticleRanking
} from './google_api'
import { SLACK_OAUTH_SUCCESS_PAGE, SLACK_OAUTH_FAIL_PAGE, TIME_PERIOD } from './constants'
import { fetchAndSortZennArticles } from './zenn_api'

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
        const template = HtmlService.createTemplateFromFile(SLACK_OAUTH_SUCCESS_PAGE)
        template.redirectUrl = redirectUrl
        return template.evaluate()
      } else {
        console.error('Slack OAuth認証中にエラーが発生しました:', resJson)
        return HtmlService.createHtmlOutputFromFile(SLACK_OAUTH_FAIL_PAGE)
      }
    } catch (error) {
      console.error('Slack OAuth認証中にエラーが発生しました:', error)
      return HtmlService.createHtmlOutputFromFile(SLACK_OAUTH_FAIL_PAGE)
    }
  } else {
    console.error('codeが取得できませんでした')
    return HtmlService.createHtmlOutputFromFile(SLACK_OAUTH_FAIL_PAGE)
  }
}

/**
 * 月間ランキングを配信する
 */
function distributeMonthlyRanking() {
  try {
    const webhookUrls = fetchSlackWebhookUrls()
    const articles = fetchAndSortZennArticles(TIME_PERIOD.MONTHLY)
    const message = formatMessageForSlack(TIME_PERIOD.MONTHLY, articles)
    webhookUrls.forEach((webhookUrl) => {
      sendMessageToSlackChannel(message, webhookUrl)
    })
    // saveMonthlyArticlesToSpreadsheet()
    saveArticleRanking(articles)
  } catch (e) {
    sendMessageToSlackChannel(
      formatErrorMessageForSlack(e, 'Zennの月間ランキング送信処理'),
      SLACK_WEBHOOK_URL_FOR_ERROR_LOG
    )
  }
}

/**
 * 週間ランキングを配信する
 * @param {*} event
 */
function distributeWeeklyRanking() {
  try {
    const webhookUrls = fetchSlackWebhookUrls()
    const articles = fetchAndSortZennArticles(TIME_PERIOD.WEEKLY)
    const message = formatMessageForSlack(TIME_PERIOD.WEEKLY, articles)
    webhookUrls.forEach((webhookUrl) => {
      sendMessageToSlackChannel(message, webhookUrl)
    })
    // saveWeeklyArticlesToSpreadsheet()
    saveArticleRanking(articles)
  } catch (e) {
    sendMessageToSlackChannel(
      formatErrorMessageForSlack(e, 'Zennの週間ランキング送信処理'),
      SLACK_WEBHOOK_URL_FOR_ERROR_LOG
    )
  }
}
