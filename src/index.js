import {
  SLACK_APP_CLIENT_ID,
  SLACK_APP_CLIENT_SECRET,
  REDIRECT_URL,
  SLACK_WEBHOOK_URL_FOR_ERROR_LOG
} from './script_property'
import { formatErrorMessageForSlack, formatMessageForSlack } from './format_message_for_slack'
import { sendMessageToSlackChannel } from './slack_api'
import { fetchSlackWebhookUrls, saveOAuthInfoToDatastore, deleteWebhookUrlFromDatastore } from './google_api'
import { TIME_PERIOD, PAGES, SLACK_OATUH_API_ENDPOINT, SLACK_OAUTH_REDIRECT_URL } from './constants'
import { fetchAndSortZennArticles } from './zenn_api'
import { saveArticlesToNotion } from './notion_api'

// GASから関数を呼び出すために、グローバル変数に登録する
global.distributeMonthlyRanking = distributeMonthlyRanking
global.distributeWeeklyRanking = distributeWeeklyRanking
global.doGet = doGet
global.doPost = doPost

/**
 * slackのOAuth認証のリダイレクト時に実行
 * トークン情報を取得してCloud Datastoreに保存する
 * @param {*} e
 * @returns
 */
function doPost(e) {
  const params = JSON.parse(e.postData.contents)

  // URL検証イベントの処理
  if (params.type === 'url_verification') {
    return ContentService.createTextOutput(params.challenge)
  }

  // アプリ連携解除イベントの処理
  if (params.event && params.event.type === 'app_uninstalled') {
    // 連携解除されたチームIDを取得
    const teamId = params.team_id

    // Datastoreからwebhook URLを削除
    deleteWebhookUrlFromDatastore(teamId)
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(
    ContentService.MimeType.JSON
  )
}

/**
 * slackのOAuth認証のリダイレクト時に実行
 * トークン情報を取得してCloud Datastoreに保存する
 * @param {*} e
 * @returns
 */
function doGet(e) {
  const code = e.parameter.code
  if (code) {
    try {
      const res = UrlFetchApp.fetch(SLACK_OATUH_API_ENDPOINT, {
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
        saveOAuthInfoToDatastore(resJson)
        const teamId = resJson.team.id
        const appId = resJson.app_id
        const redirectUrl = `${SLACK_OAUTH_REDIRECT_URL}?team=${teamId}&app=${appId}`
        const template = HtmlService.createTemplateFromFile(PAGES.SLACK_OAUTH_SUCCESS)
        template.redirectUrl = redirectUrl
        return template.evaluate()
      } else {
        return HtmlService.createHtmlOutputFromFile(PAGES.SLACK_OAUTH_FAIL)
      }
    } catch (error) {
      return HtmlService.createHtmlOutputFromFile(PAGES.SLACK_OAUTH_FAIL)
    }
  } else {
    return HtmlService.createHtmlOutputFromFile(PAGES.NOT_FOUND)
  }
}

/**
 * 月間ランキングを配信する
 */
function distributeMonthlyRanking() {
  try {
    const webhookUrls = fetchSlackWebhookUrls()
    const articles = fetchAndSortZennArticles(TIME_PERIOD.MONTHLY)
    const databasePath = saveArticlesToNotion(articles, TIME_PERIOD.MONTHLY)
    const message = formatMessageForSlack(articles, TIME_PERIOD.MONTHLY, databasePath)
    webhookUrls.forEach((webhookUrl) => {
      sendMessageToSlackChannel(message, webhookUrl)
    })
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
    const databasePath = saveArticlesToNotion(articles, TIME_PERIOD.WEEKLY)
    const message = formatMessageForSlack(articles, TIME_PERIOD.WEEKLY, databasePath)
    webhookUrls.forEach((webhookUrl) => {
      sendMessageToSlackChannel(message, webhookUrl)
    })
  } catch (e) {
    sendMessageToSlackChannel(
      formatErrorMessageForSlack(e, 'Zennの週間ランキング送信処理'),
      SLACK_WEBHOOK_URL_FOR_ERROR_LOG
    )
  }
}
