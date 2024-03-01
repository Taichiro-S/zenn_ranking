import { formatDate, escapeMarkdownSpecialChars, getTimePeriod } from './utils'

export function formatMessageForSlack(period, articles) {
  const { start, end } = getTimePeriod(period)

  const message = {
    blocks: [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${start} ~ ${end} のランキングです`
          }
        ]
      }
    ]
  }
  let rank = 1
  const articlestest = articles.slice(0, 3)
  articlestest.forEach((article) => {
    const title = `*<${article.url || ''}|${escapeMarkdownSpecialChars(article.title)}>*\n`
    const author = `*<${article.userLink || ''}|${escapeMarkdownSpecialChars(article.username)}>*\n`
    const publisheDate = formatDate(new Date(article.publishedAt))
    let topics = ''
    for (const topic of article.topics) {
      topics += '`' + topic + '` '
    }
    let emoji = ''
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
        text: title
      }
    })

    message.blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*著者:* \n${author}`
        },
        {
          type: 'mrkdwn',
          text: `*いいね数:* \n${article.likedCount}`
        }
      ]
    })

    message.blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*公開日:* \n${publisheDate}`
        },
        {
          type: 'mrkdwn',
          text: `*トピック:* \n${topics}`
        }
      ]
    })

    message.blocks.push({
      type: 'divider'
    })

    rank += 1
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
