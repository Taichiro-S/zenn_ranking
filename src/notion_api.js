import { DEFAULT_EMOJI, TIME_PERIOD } from './constants'
import {
  NOTION_API_KEY,
  NOTION_ZENN_MONTHLY_DATABASE_PARENT_ID,
  NOTION_ZENN_WEEKLY_DATABASE_PARENT_ID,
  NOTION_QIITA_MONTHLY_DATABASE_PARENT_ID,
  NOTION_QIITA_WEEKLY_DATABASE_PARENT_ID
} from './script_property'
import { formatDate, getTimePeriod } from './utils'

function createZennDatabase(period) {
  const savedAt = new Date()
  const { start, end } = getTimePeriod(savedAt, period)
  const formattedStart = formatDate(start)
  const formattedEnd = formatDate(end)
  const pageId =
    period === TIME_PERIOD.WEEKLY ? NOTION_ZENN_WEEKLY_DATABASE_PARENT_ID : NOTION_ZENN_MONTHLY_DATABASE_PARENT_ID
  const url = 'https://api.notion.com/v1/databases'
  const databaseName = `${formattedStart} ~ ${formattedEnd}のランキング`
  const payload = {
    parent: { page_id: pageId },
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
    muteHttpExceptions: true
  }

  const response = UrlFetchApp.fetch(url, options)
  return JSON.parse(response.getContentText())
}

function insertZennDataIntoDatabase(databaseId, article) {
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
    throw responseBody
  }
}

export function saveZennArticlesToNotion(articles, period) {
  const sortedArticles = articles.concat().sort((a, b) => a.likedCount - b.likedCount)
  const dbResponse = createZennDatabase(period)
  const databaseId = dbResponse.id
  for (const article of sortedArticles) {
    try {
      insertZennDataIntoDatabase(databaseId, article)
    } catch (e) {
      const json = JSON.parse(e)
      if (json.status === 400 && json.message.includes('emoji')) {
        article.emoji = DEFAULT_EMOJI
        insertZennDataIntoDatabase(databaseId, article)
      } else {
        throw e
      }
    }
  }
  return databaseId.replaceAll('-', '')
}

function createQiitaDatabase(period) {
  const savedAt = new Date()
  const { start, end } = getTimePeriod(savedAt, period)
  const formattedStart = formatDate(start)
  const formattedEnd = formatDate(end)
  const pageId =
    period === TIME_PERIOD.WEEKLY ? NOTION_QIITA_WEEKLY_DATABASE_PARENT_ID : NOTION_QIITA_MONTHLY_DATABASE_PARENT_ID
  const url = 'https://api.notion.com/v1/databases'
  const databaseName = `${formattedStart} ~ ${formattedEnd}のランキング`
  const payload = {
    parent: { page_id: pageId },
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
      ストック数: { number: { format: 'number' } },
      タグ: { multi_select: {} },
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
    muteHttpExceptions: true
  }

  const response = UrlFetchApp.fetch(url, options)
  return JSON.parse(response.getContentText())
}

function insertQiitaDataIntoDatabase(databaseId, article) {
  const now = new Date()
  const url = 'https://api.notion.com/v1/pages'
  const payload = {
    parent: { type: 'database_id', database_id: databaseId },
    icon: { type: 'emoji', emoji: '🤢' },
    properties: {
      ユーザー: {
        files: [{ name: `${article.username}_avatar`, type: 'external', external: { url: article.avatar } }]
      },
      記事タイトル: { title: [{ text: { content: article.title } }] },
      いいね数: { number: article.likesCount },
      ストック数: { number: article.stocksCount },
      トピック: { multi_select: article.tags.map((tag) => ({ name: tag })) },
      公開日: { date: { start: article.createdAt } },
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
    throw responseBody
  }
}

export function saveQiitaArticlesToNotion(articles, period) {
  const sortedArticles = articles.concat().sort((a, b) => a.likedCount - b.likedCount)
  const dbResponse = createQiitaDatabase(period)
  const databaseId = dbResponse.id
  for (const article of sortedArticles) {
    insertQiitaDataIntoDatabase(databaseId, article)
  }
  return databaseId.replaceAll('-', '')
}
