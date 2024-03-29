import { fetchAndSortZennArticles } from './zenn_api'
import { GCP_SERVICE_ACCOUNT_KEY, CLOUD_DATASTORE_TABLE_FOR_OAUTH, ENCRYPTO_PASSPHRASE } from './script_property'
import { formatDate, getTimePeriod, encryptData } from './utils'
import { DATA_TO_SHOW_IN_SPREADSHEET, TIME_PERIOD, GOOGLE_DATASTORE_API_ENDPOINT } from './constants'

function saveArticlesToSpreadsheet(period) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const now = new Date()
  const { start, end } = getTimePeriod(now, period)
  const formattedStart = formatDate(start)
  const formattedEnd = formatDate(end)
  const title = period === TIME_PERIOD.WEEKLY ? '週間' : '月間'
  const sheetName = `${title}ランキング(${formattedStart} ~ ${formattedEnd})`
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
  saveArticlesToSpreadsheet(TIME_PERIOD.WEEKLY)
}

export function saveMonthlyArticlesToSpreadsheet() {
  saveArticlesToSpreadsheet(TIME_PERIOD.MONTHLY)
}

export function saveOAuthInfoToDatastore(resJson) {
  const token = ScriptApp.getOAuthToken()
  const projectId = GCP_SERVICE_ACCOUNT_KEY.project_id
  const url = `${GOOGLE_DATASTORE_API_ENDPOINT}/${projectId}:commit`
  const encryptedAccessToken = encryptData(resJson.access_token, ENCRYPTO_PASSPHRASE)
  const encryptedWebhookUrl = encryptData(resJson.incoming_webhook.url, ENCRYPTO_PASSPHRASE)
  const payload = {
    mode: 'NON_TRANSACTIONAL',
    mutations: [
      {
        upsert: {
          key: {
            path: [
              {
                kind: CLOUD_DATASTORE_TABLE_FOR_OAUTH,
                name: 'SlackOAuthInfo_' + resJson.team.id
              }
            ]
          },
          properties: {
            app_id: { stringValue: resJson.app_id },
            authed_user_id: { stringValue: resJson.authed_user.id },
            access_token: { stringValue: encryptedAccessToken },
            bot_user_id: { stringValue: resJson.bot_user_id },
            team_id: { stringValue: resJson.team.id },
            team_name: { stringValue: resJson.team.name },
            channel: { stringValue: resJson.incoming_webhook.channel },
            channel_id: { stringValue: resJson.incoming_webhook.channel_id },
            webhook_url: { stringValue: encryptedWebhookUrl }
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
  UrlFetchApp.fetch(url, options)
}

export function deleteWebhookUrlFromDatastore(teamId) {
  const token = ScriptApp.getOAuthToken()
  const projectId = GCP_SERVICE_ACCOUNT_KEY.project_id
  const url = `https://datastore.googleapis.com/v1/projects/${projectId}:commit`

  const payload = {
    mode: 'NON_TRANSACTIONAL',
    mutations: [
      {
        delete: {
          path: [
            {
              kind: CLOUD_DATASTORE_TABLE_FOR_OAUTH,
              name: `SlackOAuthInfo_${teamId}`
            }
          ]
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

  try {
    const res = UrlFetchApp.fetch(url, options)
    const resJson = JSON.parse(res)
    if (!resJson.indexUpdates) {
      throw new Error('ワークスペースの削除に失敗しました。')
    }
    Logger.log(`INFO: データベースからワークスペースを削除しました: ${teamId}`)
  } catch (e) {
    Logger.log('ERROR: ' + e.toString())
  }
}

export function updateAccessToken(teamId, accessToken) {
  const token = ScriptApp.getOAuthToken()
  const projectId = GCP_SERVICE_ACCOUNT_KEY.project_id
  const url = `https://datastore.googleapis.com/v1/projects/${projectId}:commit`
  const payload = {
    mode: 'NON_TRANSACTIONAL',
    mutations: [
      {
        update: {
          key: {
            path: [
              {
                kind: CLOUD_DATASTORE_TABLE_FOR_OAUTH,
                name: `SlackOAuthInfo_${teamId}`
              }
            ]
          },
          properties: {
            access_token: { stringValue: accessToken }
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

  try {
    const response = UrlFetchApp.fetch(url, options)
    if (!response.indexUpdates) {
      throw new Error('データベースの更新に失敗しました')
    }
    Logger.log(`INFO: データベースのワークスペースを更新しました: ${teamId}`)
  } catch (e) {
    Logger.log('ERROR: ' + e.toString())
  }
}

export function fetchSlackWebhookUrls() {
  const token = ScriptApp.getOAuthToken()
  const projectId = GCP_SERVICE_ACCOUNT_KEY.project_id
  const url = `${GOOGLE_DATASTORE_API_ENDPOINT}/${projectId}:runQuery`
  const payload = {
    query: {
      kind: [
        {
          name: CLOUD_DATASTORE_TABLE_FOR_OAUTH
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
  const response = UrlFetchApp.fetch(url, options)
  const jsonResponse = JSON.parse(response.getContentText())
  const webhookUrls = jsonResponse.batch.entityResults.map((result) => result.entity.properties.webhook_url.stringValue)
  return webhookUrls
}
