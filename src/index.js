import { SLACK_APP_CLIENT_ID, SLACK_APP_CLIENT_SECRET, REDIRECT_URL, ADMIN_EMAIL } from './script_property'
import { formatMessageForSlack } from './format_message_for_slack'
import { sendMessageToSlackChannel } from './slack_api'
import {
  fetchSlackWebhookUrls,
  saveOAuthInfoToDatastore,
  deleteWebhookUrlFromDatastore,
  updateAccessToken
} from './google_api'
import {
  TIME_PERIOD,
  PAGES,
  SLACK_OATUH_API_ENDPOINT,
  SLACK_OAUTH_REDIRECT_URL,
  CLOUD_DATASTORE_CONSOLE_URL,
  GCP_LOGGING_URL
} from './constants'
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

  // app_uninstallイベントの処理
  if (params.event && params.event.type === 'app_uninstalled') {
    const teamId = params.team_id
    deleteWebhookUrlFromDatastore(teamId)
  }

  // tokens_revokedイベントの処理(uninstall したときにも発生する)
  if (params.event && params.event.type === 'tokens_revoked') {
    const teamId = params.team_id
    const accessToken = params.event.tokens.oauth

    // uninstallした際にはaccessTokenは空の配列
    if (accessToken.length > 0) {
      updateAccessToken(teamId, accessToken)
    }
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
          client_secret: 'dummy',
          // SLACK_APP_CLIENT_SECRET,
          redirect_uri: REDIRECT_URL
        }
      })

      const resJson = JSON.parse(res.getContentText())
      if (resJson.ok) {
        saveOAuthInfoToDatastore(resJson)
        try {
          Logger.log(`INFO: 新しいワークスペースにアプリが追加されました: ${resJson.team.id}`)
          MailApp.sendEmail(
            ADMIN_EMAIL,
            '新しいワークスペースにアプリが追加されました',
            `データベースとログを確認してください。\nデータベース:${CLOUD_DATASTORE_CONSOLE_URL} \n ログ: ${GCP_LOGGING_URL}`
          )
        } catch (e) {
          Logger.log(`ERROR: ${e}`)
        }

        const teamId = resJson.team.id
        const appId = resJson.app_id
        const redirectUrl = `${SLACK_OAUTH_REDIRECT_URL}?team=${teamId}&app=${appId}`
        const template = HtmlService.createTemplateFromFile(PAGES.SLACK_OAUTH_SUCCESS)
        template.redirectUrl = redirectUrl
        return template.evaluate()
      } else {
        Logger.log('ERROR: SlackのOAuth認証に失敗しました。')
        return HtmlService.createHtmlOutputFromFile(PAGES.SLACK_OAUTH_FAIL)
      }
    } catch (error) {
      Logger.log(`ERROR: ${error}`)
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
  let err = false
  try {
    const webhookUrls = fetchSlackWebhookUrls()
    const articles = fetchAndSortZennArticles(TIME_PERIOD.MONTHLY)
    const databasePath = saveArticlesToNotion(articles, TIME_PERIOD.MONTHLY)
    const message = formatMessageForSlack(articles, TIME_PERIOD.MONTHLY, databasePath)
    webhookUrls.forEach((webhookUrl) => {
      try {
        sendMessageToSlackChannel(message, webhookUrl)
      } catch (e) {
        Logger.log(`ERROR sending to webhook URL ${webhookUrl}: ${e}`)
        err = true
      }
    })
    if (err) {
      MailApp.sendEmail(
        ADMIN_EMAIL,
        '[本番用]Zennランキングの月間ランキング配信でエラーが発生しました',
        `$\nエラーログ ${GCP_LOGGING_URL}`
      )
    }
    MailApp.sendEmail(
      ADMIN_EMAIL,
      '月間ランキングが配信されました',
      `${webhookUrls.length}ワークスペースに対して配信が完了しました。`
    )
    Logger.log('INFO: 月間ランキングの配信が完了しました。')
  } catch (e) {
    Logger.log(`ERROR: ${e}`)

    MailApp.sendEmail(
      ADMIN_EMAIL,
      '[本番用]Zennランキングの月間ランキング配信でエラーが発生しました',
      `エラーログ ${GCP_LOGGING_URL}`
    )
  }
}

/**
 * 週間ランキングを配信する
 * @param {*} event
 */
function distributeWeeklyRanking() {
  let err = false
  try {
    const webhookUrls = fetchSlackWebhookUrls()
    const articles = fetchAndSortZennArticles(TIME_PERIOD.WEEKLY)
    const databasePath = saveArticlesToNotion(articles, TIME_PERIOD.WEEKLY)
    const message = formatMessageForSlack(articles, TIME_PERIOD.WEEKLY, databasePath)
    webhookUrls.forEach((webhookUrl) => {
      try {
        sendMessageToSlackChannel(message, webhookUrl)
      } catch (e) {
        Logger.log(`ERROR sending to webhook URL ${webhookUrl}: ${e}`)
        err = true
      }
    })

    if (err) {
      MailApp.sendEmail(
        ADMIN_EMAIL,
        '[本番用]Zennランキングの週間ランキング配信でエラーが発生しました',
        `$\nエラーログ ${GCP_LOGGING_URL}`
      )
    }
    MailApp.sendEmail(
      ADMIN_EMAIL,
      '週間ランキングが配信されました',
      `${webhookUrls.length}ワークスペースに対して配信が完了しました。`
    )
    Logger.log('NFO: 週間ランキングの配信が完了しました。')
  } catch (e) {
    Logger.log(`ERROR: ${e}`)
    MailApp.sendEmail(
      ADMIN_EMAIL,
      '[本番用]Zennランキングの週間ランキング配信でエラーが発生しました',
      `エラーメッセージ: ${e.message} \nエラー箇所: ${e.stack} \n エラーログ ${GCP_LOGGING_URL}`
    )
  }
}
