import { NOTION_PUB_URL } from './script_property.js'

export const formatQiitaArticleForTwitter = (articles, databasePath) => {
  const fullPath = NOTION_PUB_URL + databasePath
  const title = articles[0].title
  const author = articles[0].username
  const likes = articles[0].likesCount
  const stocks = articles[0].stocksCount
  const link = articles[0].url
  const tags = articles[0].tags
  const text = `
先週のQiitaのいいね数+ストック数トップ記事は...
「${title}」
${author}さん
${likes}いいね
${stocks}ストック
でした！
ランキングはこちらから👉${fullPath}
${link}
#Qiita #Qiita記事ランキング #${tags.join(' #')}
`

  return { text }
}
