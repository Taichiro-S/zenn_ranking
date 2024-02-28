import { fetchAndSortZennArticles } from './zenn_api'
import { formatDate, escapeMarkdownSpecialChars } from './utils'

export function formatMessageForSlack(period) {
  let articles = []
  const today = new Date()
  let start = ''
  let end = ''
  if (period === 'weekly') {
    articles = fetchAndSortZennArticles('weekly')
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
    end = new Date(today)
  } else if (period === 'monthly') {
    articles = fetchAndSortZennArticles('monthly')
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  }
  const formattedEndDate = formatDate(end)
  const formattedStartDate = formatDate(start)
  const message = {
    blocks: [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${formattedStartDate} ~ ${formattedEndDate} のランキングです`
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
    const publisheDate = new Date(article.publishedAt)
    const formattedPublishDate = formatDate(publisheDate)
    let topics = ''
    for (const topic of article.topics) {
      topics += '`' + topic + '`, '
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
        text: `${emoji}${rank}位`,
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
          text: `*公開日:* \n${formattedPublishDate}`
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
