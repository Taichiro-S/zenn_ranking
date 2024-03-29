import { NOTION_PUB_URL } from './script_property.js'
import { TWITTER_ARTICLES_COOUNT } from './constants.js'

export const formatZennArticleForTwitter = (articles, databasePath) => {
  let rank = 1
  const topArticles = articles.slice(0, TWITTER_ARTICLES_COOUNT)
  const fullPath = NOTION_PUB_URL + databasePath
  let ranking = ''

  for (const article of topArticles) {
    const title = article.title
    const author = article.username
    const likes = article.likedCount
    const link = article.url
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
        emoji = rank
    }
    ranking += `${emoji} ${title} (著者:${author}さん, ${likes}いいね)\n${link}\n`
    rank++
  }

  const message = {
    text: ```
    今週のZennのいいね数ランキングはこちら！\n
    ${ranking}
    ランキングの続きは以下をチェック！\n
    ${fullPath}
    ```
  }
  return message
}
