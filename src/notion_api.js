import { DEFAULT_EMOJI } from './constants'
import { NOTION_API_KEY, NOTION_DATABASE_PARENT_ID } from './script_property'
import { formatDate, getTimePeriod } from './utils'

function createDatabase(period) {
  const savedAt = new Date()
  const { start, end } = getTimePeriod(savedAt, period)
  const formattedStart = formatDate(start)
  const formattedEnd = formatDate(end)

  const url = 'https://api.notion.com/v1/databases'
  const databaseName = `${formattedStart} ~ ${formattedEnd}のランキング`
  const payload = {
    parent: { page_id: NOTION_DATABASE_PARENT_ID },
    title: [
      {
        type: 'text',
        text: { content: databaseName }
      }
    ],
    properties: {
      ユーザー: { files: {} },
      記事タイトル: { title: {} },
      いいね数: { number: { format: 'number' } },
      トピック: { multi_select: {} },
      公開日: { date: {} },
      記事リンク: { url: {} },
      ユーザーリンク: { rich_text: {} },
      ランキング作成日: { date: {} }
    }
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // これにより、例外がスローされずにエラー応答を処理できます
  }

  const response = UrlFetchApp.fetch(url, options)
  return JSON.parse(response.getContentText())
}

function insertDataIntoDatabase(databaseId, article) {
  const now = new Date()
  const url = 'https://api.notion.com/v1/pages'
  const payload = {
    parent: { type: 'database_id', database_id: databaseId },
    icon: { type: 'emoji', emoji: article.emoji },
    properties: {
      ユーザー: {
        files: [{ name: `${article.username}_avatar`, type: 'external', external: { url: article.avatar } }]
      },
      記事タイトル: { title: [{ text: { content: article.title } }] },
      いいね数: { number: article.likedCount },
      トピック: { multi_select: article.topics.map((topic) => ({ name: topic })) },
      公開日: { date: { start: article.publishedAt } },
      記事リンク: { url: article.url },
      ユーザーリンク: {
        rich_text: [{ type: 'text', text: { content: article.username, link: { url: article.userLink } } }]
      },
      ランキング作成日: { date: { start: now } }
    }
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }

  const response = UrlFetchApp.fetch(url, options)
  const responseCode = response.getResponseCode()
  const responseBody = response.getContentText()

  if (responseCode !== 200) {
    throw new Error(`Failed to insert article: ${responseBody}`)
  }
}

export function saveArticlesToNotion(articles, period) {
  const sortedArticles = articles.conncat().sort((a, b) => a.likedCount - b.likedCount)
  const dbResponse = createDatabase(period)
  const databaseId = dbResponse.id
  for (const article of sortedArticles) {
    try {
      insertDataIntoDatabase(databaseId, article)
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message.includes('emoji')) {
        article.emoji = DEFAULT_EMOJI
        insertDataIntoDatabase(databaseId, article)
      } else {
        throw e
      }
    }
  }
  return databaseId.replaceAll('-', '')
}
