import { fetchAndSortZennArticles } from './zenn_api'
import {
  GCP_SERVICE_ACCOUNT_KEY,
  CLOUD_DATASTORE_TABLE_FOR_ARTICLES,
  CLOUD_DATASTORE_TABLE_FOR_OAUTH,
  ENCRYPTO_PASSPHRASE
} from './script_property'
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
  const url = `${GOOGLE_DATASTORE_API_ENDPOINT}/${projectId}:commit`

  const payload = {
    mode: 'NON_TRANSACTIONAL',
    mutations: [
      {
        delete: {
          path: [
            {
              kind: CLOUD_DATASTORE_TABLE_FOR_OAUTH,
              name: teamId
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

  UrlFetchApp.fetch(url, options)
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
      throw new Error('Error updaing access token')
    }
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

export function saveArticleRankingToDatastore(articles, period) {
  const token = ScriptApp.getOAuthToken()
  const projectId = GCP_SERVICE_ACCOUNT_KEY.project_id
  const url = `${GOOGLE_DATASTORE_API_ENDPOINT}/${projectId}:commit`
  const savedAt = new Date().toISOString()
  const payload = {
    mode: 'NON_TRANSACTIONAL',
    mutations: articles.map((article) => {
      const savedAtSlug = `${savedAt}-${article.slug}`
      return {
        upsert: {
          key: {
            partitionId: { projectId },
            path: [{ kind: `${CLOUD_DATASTORE_TABLE_FOR_ARTICLES}_${period}`, name: savedAtSlug }]
          },
          properties: {
            title: { stringValue: article.title },
            url: { stringValue: article.url },
            publishedAt: { stringValue: article.publishedAt },
            likedCount: { integerValue: article.likedCount.toString() },
            emoji: { stringValue: article.emoji },
            username: { stringValue: article.username },
            userLink: { stringValue: article.userLink },
            avatar: { stringValue: article.avatar },
            topics: {
              arrayValue: {
                values: article.topics.map((topic) => ({ stringValue: topic }))
              }
            },
            body: { stringValue: article.body },
            savedAt: { stringValue: savedAt }
          }
        }
      }
    })
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

export function fetchArticleRanking(period) {
  const token = ScriptApp.getOAuthToken()
  const projectId = GCP_SERVICE_ACCOUNT_KEY.project_id
  const url = `${GOOGLE_DATASTORE_API_ENDPOINT}/${projectId}:runQuery`
  const now = new Date()
  let startDate

  if (period === TIME_PERIOD.WEEKLY) {
    // 一週間前の日付を取得
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  } else if (period === TIME_PERIOD.WEEKLY) {
    // 一ヶ月前の日付を取得
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  }

  const startDateStr = startDate.toISOString()

  const payload = {
    query: {
      kind: [{ name: `${CLOUD_DATASTORE_TABLE_FOR_ARTICLES}_${period}` }],
      filter: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              propertyFilter: {
                property: { name: 'savedAt' },
                op: 'GREATER_THAN_OR_EQUAL',
                value: { stringValue: startDateStr }
              }
            }
          ]
        }
      }
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
  const data = JSON.parse(response.getContentText())
  if (data.batch.entityResults && data.batch.entityResults.length > 0) {
    const articles = data.batch.entityResults.map((entityResult) => {
      const article = entityResult.entity.properties
      return {
        title: article.title.stringValue,
        url: article.url.stringValue,
        publishedAt: article.publishedAt.stringValue,
        likedCount: parseInt(article.likedCount.integerValue, 10),
        emoji: article.emoji.stringValue,
        username: article.username.stringValue,
        userLink: article.userLink.stringValue,
        avatar: article.avatar.stringValue,
        topics: article.topics.arrayValue.values.map((v) => v.stringValue),
        body: article.body.stringValue,
        savedAt: article.savedAt.stringValue
      }
    })
    const sortedArticles = articles.sort((a, b) => b.likedCount - a.likedCount)
    return sortedArticles
  }
  return []
}
