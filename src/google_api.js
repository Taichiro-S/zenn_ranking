import { fetchAndSortZennArticles } from './zenn_api'
import { GCP_SERVICE_ACCOUNT_KEY, CLOUD_DATASTORE_TABLE_NAME } from './script_property'
import { formatDate, getTimePeriod } from './utils'
import { DATA_TO_SHOW_IN_SPREADSHEET } from './constants'

function saveArticlesToSpreadsheet(period) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const { start, end } = getTimePeriod(period)
  const title = period === 'weekly' ? '週間' : '月間'
  const sheetName = `${title}ランキング(${start} ~ ${end})`
  let sheet = spreadsheet.getSheetByName(sheetName)
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName)
  } else {
    sheet.clear()
  }

  const articles = fetchAndSortZennArticles(period)

  const data = []
  data.push(DATA_TO_SHOW_IN_SPREADSHEET)

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

export function saveWeeklyArticlesToSpreadsheet() {
  saveArticlesToSpreadsheet('weekly')
}

export function saveMonthlyArticlesToSpreadsheet() {
  saveArticlesToSpreadsheet('monthly')
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
                kind: CLOUD_DATASTORE_TABLE_NAME,
                name: 'SlackOAuthInfo_' + resJson.team.id
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
          name: CLOUD_DATASTORE_TABLE_NAME
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
  const webhookUrls = jsonResponse.batch.entityResults.map((result) => result.entity.properties.webhook_url.stringValue)
  return webhookUrls
}
