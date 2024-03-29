import { NOTION_PUB_URL } from './script_property.js'

export const formatZennArticleForTwitter = (articles, databasePath) => {
  const fullPath = NOTION_PUB_URL + databasePath
  const title = articles[0].title
  const author = articles[0].username
  const likes = articles[0].likedCount
  const link = articles[0].url
  const topics = articles[0].topics
  const text = `
先週のZennのいいね数トップ記事は...
「${title}」
${author}さん
${likes}いいね
でした！
ランキングはこちらから👉${fullPath}
${link}
#Zenn #Zenn記事ランキング #${topics.join(' #')}
`

  return { text }
}
