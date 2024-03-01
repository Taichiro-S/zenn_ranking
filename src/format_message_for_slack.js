import { formatDate, escapeMarkdownSpecialChars, getTimePeriod } from './utils'
import { FULL_RANKING_RESULT } from './constants'
export function formatMessageForSlack(period, articles) {
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
            text: `${formattedStart} ~ ${formattedEnd} のランキングです`
          }
        ]
      }
    ]
  }
  let rank = 1
  const articlestest = articles.slice(0, 3)
  const linkForFullRanking = `<${escapeMarkdownSpecialChars(FULL_RANKING_RESULT)}|こちら>`
  articlestest.forEach((article) => {
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
        text: `${title}\n`
        // + ` *著者:* ${author}\n *いいね数:* ${article.likedCount}\n *公開日:* ${publisheDate}\n *トピック:* ${topics}`
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
          text: `:pencil2: ${author}`
        },
        {
          type: 'mrkdwn',
          text: `:thumbsup: ${article.likedCount}`
        }
      ]
    })

    message.blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `:spiral_calendar_pad: ${publisheDate}`
        },
        {
          type: 'mrkdwn',
          text: `:white_check_mark: ${topics}`
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
