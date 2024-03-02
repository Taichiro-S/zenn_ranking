import {
  SLACK_APP_CLIENT_ID,
  SLACK_APP_CLIENT_SECRET,
  REDIRECT_URL,
  SLACK_WEBHOOK_URL_FOR_ERROR_LOG
} from './script_property'
import { formatErrorMessageForSlack, formatMessageForSlack } from './format_message_for_slack'
import { sendMessageToSlackChannel } from './slack_api'
import { fetchSlackWebhookUrls, saveOAuthInfo, saveArticleRanking, fetchArticleRanking } from './google_api'
import { TIME_PERIOD, PAGES } from './constants'
import { fetchAndSortZennArticles } from './zenn_api'
import { pageExists } from './utils'
import { saveArticlesToNotion } from './notion_api'

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
  const page = e.parameter.page
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
        const template = HtmlService.createTemplateFromFile(PAGES.SLACK_OAUTH_SUCCESS)
        template.redirectUrl = redirectUrl
        return template.evaluate()
      } else {
        return HtmlService.createHtmlOutputFromFile(PAGES.SLACK_OAUTH_FAIL)
      }
    } catch (error) {
      return HtmlService.createHtmlOutputFromFile(PAGES.SLACK_OAUTH_FAIL)
    }
  } else if (pageExists(page)) {
    let period
    if (page === PAGES.MONTHLY_RANKING) {
      period = TIME_PERIOD.MONTHLY
    } else if (page === PAGES.WEEKLY_RANKING) {
      period = TIME_PERIOD.WEEKLY
    }
    const articles = fetchArticleRanking(period)
    const template = HtmlService.createTemplateFromFile(page)
    template.articles = articles
    return template.evaluate()
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
    const message = formatMessageForSlack(TIME_PERIOD.MONTHLY, articles)
    webhookUrls.forEach((webhookUrl) => {
      sendMessageToSlackChannel(message, webhookUrl)
    })
    saveArticlesToNotion(articles, TIME_PERIOD.MONTHLY)
    saveArticleRanking(articles, TIME_PERIOD.MONTHLY)
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
    saveArticlesToNotion(articles, TIME_PERIOD.WEEKLY)
    saveArticleRanking(articles, TIME_PERIOD.WEEKLY)
  } catch (e) {
    sendMessageToSlackChannel(
      formatErrorMessageForSlack(e, 'Zennの週間ランキング送信処理'),
      SLACK_WEBHOOK_URL_FOR_ERROR_LOG
    )
  }
}
