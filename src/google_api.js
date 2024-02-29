import { fetchAndSortZennArticles } from './zenn_api'
import { GCP_SERVICE_ACCOUNT_KEY } from './script_property'
import { formatDate } from './utils'

export function saveWeeklyArticlesToSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
  const end = new Date(today)
  const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy/MM/dd')
  const formattedStartDate = formatDate(start)
  const formattedEndDate = formatDate(end)
  const sheetName = `${formattedDate}_週間ランキング(${formattedStartDate} ~ ${formattedEndDate})`
  let sheet = spreadsheet.getSheetByName(sheetName)
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName)
  } else {
    sheet.clear()
  }

  const articles = fetchAndSortZennArticles('weekly')

  const data = [['タイトル', '記事URL', '著者名', '著者URL', 'いいね数', '公開日', 'トピック']]

  articles.forEach((article) => {
    data.push([
      article.title,
      article.url,
      article.username,
      article.userLink,
      article.likedCount,
      formatDate(new Date(article.publishedAt)),
      article.topics.join(',')
    ])
  })

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data)
}

export function saveMonthlyArticlesToSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today)
  const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy/MM/dd')
  const formattedStartDate = formatDate(start)
  const formattedEndDate = formatDate(end)
  const sheetName = `${formattedDate}_月間ランキング(${formattedStartDate} ~ ${formattedEndDate})`

  let sheet = spreadsheet.getSheetByName(sheetName)
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName)
  } else {
    sheet.clear()
  }

  const articles = fetchAndSortZennArticles('monthly')

  const data = [['タイトル', '記事URL', '著者名', '著者URL', 'いいね数', '公開日', 'トピック']]

  articles.forEach((article) => {
    data.push([
      article.title,
      article.url,
      article.username,
      article.userLink,
      article.likedCount,
      formatDate(new Date(article.publishedAt)),
      article.topics.join(',')
    ])
  })
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data)
}

export function saveOAuthInfo(resJson) {
  const token = ScriptApp.getOAuthToken()
  const projectId = GCP_SERVICE_ACCOUNT_KEY.project_id
  const url = `https://datastore.googleapis.com/v1/projects/${projectId}:commit`
  console.log('token:', token)
  console.log('url:', url)
  const payload = {
    mode: 'NON_TRANSACTIONAL',
    mutations: [
      {
        insert: {
          key: {
            path: [
              {
                kind: 'SlackOAuthInfo',
                name: 'OAuthInfo_' + resJson.team.id
              }
            ]
          },
          properties: {
            app_id: { stringValue: resJson.app_id },
            authed_user_id: { stringValue: resJson.authed_user.id },
            access_token: { stringValue: resJson.access_token },
            bot_user_id: { stringValue: resJson.bot_user_id },
            team_id: { stringValue: resJson.team.id },
            team_name: { stringValue: resJson.team.name },
            channel: { stringValue: resJson.incoming_webhook.channel },
            channel_id: { stringValue: resJson.incoming_webhook.channel_id },
            webhook_url: { stringValue: resJson.incoming_webhook.url }
          }
        }
      }
    ]
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }

  const response = UrlFetchApp.fetch(url, options)
  Logger.log(response.getContentText())
}

export function fetchSlackWebhookUrls() {
  const token = ScriptApp.getOAuthToken()
  const projectId = GCP_SERVICE_ACCOUNT_KEY.project_id
  const url = `https://datastore.googleapis.com/v1/projects/${projectId}:runQuery`
  const payload = {
    query: {
      kind: [
        {
          name: 'SlackOAuthInfo'
        }
      ],
      projection: [
        {
          property: {
            name: 'webhook_url'
          }
        }
      ]
    }
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }
  let jsonResponse
  try {
    const response = UrlFetchApp.fetch(url, options)
    jsonResponse = JSON.parse(response.getContentText())
  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
  const webhookUrls = jsonResponse.batch.entityResults.map((result) => result.entity.properties.webhookUrl.stringValue)
  return webhookUrls
}
