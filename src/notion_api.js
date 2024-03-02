import axios from 'axios'
import { DEFAULT_EMOJI, MONTHLY_RANKING_COUNT, TIME_PERIOD, WEEKLY_RANKING_COUNT } from './constants'
import { NOTION_API_KEY, NOTION_DATABASE_PARENT_ID } from './script_property'

const createDatabase = async (period) => {
  const savedAt = new Date().toISOString().split('T')[0]
  let databaseName
  if (period === TIME_PERIOD.WEEKLY) {
    databaseName = `週間ランキング_${savedAt}`
  } else if (period === TIME_PERIOD.MONTHLY) {
    databaseName = `月間ランキング_${savedAt}`
  }
  const response = await axios.post(
    'https://api.notion.com/v1/databases',
    {
      parent: { page_id: NOTION_DATABASE_PARENT_ID },
      title: [
        {
          type: 'text',
          text: { content: databaseName }
        }
      ],
      properties: {
        順位: { number: { format: 'number' } },
        ユーザー: { files: {} },
        記事タイトル: { title: {} },
        いいね数: { number: { format: 'number' } },
        トピック: { multi_select: {} },
        公開日: { date: {} },
        記事リンク: { url: {} },
        ユーザーリンク: { rich_text: {} },
        ランキング作成日: { date: {} }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data
}

const insertDataIntoDatabase = async (databaseId, article, rank) => {
  const now = new Date()
  const response = await axios.post(
    'https://api.notion.com/v1/pages',
    {
      parent: { type: 'database_id', database_id: databaseId },
      icon: { type: 'emoji', emoji: article.emoji },
      properties: {
        順位: { number: rank },
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
    },
    {
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    }
  )

  if (response.status !== 200) {
    throw new Error(`Failed to create page: ${response.statusText}`)
  }
}

export const saveArticlesToNotion = async (articles, period) => {
  try {
    const sortedArticles = articles.sort((a, b) => a.likedCount - b.likedCount)
    const dbResponse = await createDatabase()
    const databaseId = dbResponse.id
    let rank = period === TIME_PERIOD.WEEKLY ? WEEKLY_RANKING_COUNT : MONTHLY_RANKING_COUNT
    for (const article of sortedArticles) {
      try {
        await insertDataIntoDatabase(databaseId, article, rank)
      } catch (e) {
        if (e.response && e.response.data && e.response.data.message.includes('emoji')) {
          console.log(e.response.data)
          console.log('Emoji not supported, retrying with default emoji...')
          article.emoji = DEFAULT_EMOJI
          await insertDataIntoDatabase(databaseId, article, rank)
        } else {
          throw e
        }
      }
      rank -= 1
    }
    console.log('データベースへの挿入が完了しました。')
  } catch (e) {
    console.error(e.response.data)
  }
}
