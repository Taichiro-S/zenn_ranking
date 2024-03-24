import { formatDate, escapeMarkdownSpecialChars, getTimePeriod } from './utils'
import { NOTION_PUB_URL } from './script_property'
import { SLACK_ARTICLES_COOUNT } from './constants'

export function formatZennArticleForSlack(articles, period, databasePath) {
  const now = new Date()
  const { start, end } = getTimePeriod(now, period)

  const formattedStart = formatDate(start)
  const formattedEnd = formatDate(end)

  const message = {
    blocks: [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Zennの ${formattedStart} ~ ${formattedEnd} のランキングが発表されたよ〜`
          }
        ]
      }
    ]
  }
  let rank = 1
  const topArticles = articles.slice(0, SLACK_ARTICLES_COOUNT)
  const fullPath = NOTION_PUB_URL + databasePath
  const linkForFullRanking = `<${escapeMarkdownSpecialChars(fullPath)}|こちら>`
  topArticles.forEach((article) => {
    const title = `*<${article.url || ''}|${escapeMarkdownSpecialChars(article.title)}>*`
    const author = `*<${article.userLink || ''}|${escapeMarkdownSpecialChars(article.username)}>*`
    const publisheDate = formatDate(new Date(article.publishedAt))
    let topics = ''
    for (const topic of article.topics) {
      topics += '`' + topic + '` '
    }
    let emoji
    switch (rank) {
      case 1:
        emoji = ':first_place_medal:'
        break
      case 2:
        emoji = ':second_place_medal:'
        break
      case 3:
        emoji = ':third_place_medal:'
        break
      default:
        emoji = ''
    }
    message.blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji}第${rank}位`,
        emoji: true
      }
    })

    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${title}\n` + '```' + article.body + '```'
      },
      accessory: {
        type: 'image',
        image_url: article.avatar,
        alt_text: 'No Image'
      }
    })

    message.blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*著者:*  ${author}`
        },
        {
          type: 'mrkdwn',
          text: `*いいね数:* ${article.likedCount}`
        }
      ]
    })

    message.blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*公開日:* ${publisheDate}`
        },
        {
          type: 'mrkdwn',
          text: `*トピック:* ${topics}`
        }
      ]
    })

    message.blocks.push({
      type: 'divider'
    })

    rank += 1
  })

  message.blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `ランキングの続きは${linkForFullRanking}から`
    }
  })

  return message
}

export function formatErrorMessageForSlack(e, projectName) {
  const message = {
    blocks: [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${projectName}でエラーが発生しました`
          }
        ]
      }
    ]
  }

  message.blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: e.message,
      emoji: true
    }
  })

  message.blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*エラーログ*'
    }
  })

  message.blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '```' + e.stack + '```'
    }
  })

  return message
}
