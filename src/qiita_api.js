import { extractBobyText, getTimePeriod } from './utils'
import {
  TIME_PERIOD,
  QIITA_ARTICLE_API_ENDPOINT,
  WEEKLY_RANKING_COUNT,
  MONTHLY_RANKING_COUNT,
  QIITA_URL
} from './constants'
import { QIITA_ACCESS_TOKEN } from './script_property'

export function fetchAndSortQiitaArticles(period) {
  const now = new Date()
  const { start, end } = getTimePeriod(now, period)
  const cutoff = period === TIME_PERIOD.WEEKLY ? WEEKLY_RANKING_COUNT : MONTHLY_RANKING_COUNT

  let keepFetching = true
  let nextPage = 1
  const allArticles = []

  while (keepFetching) {
    const url = `${QIITA_ARTICLE_API_ENDPOINT}?per_page=100&page=${nextPage}`
    const options = {
      method: 'get',
      headers: {
        Authorization: `Bearer ${QIITA_ACCESS_TOKEN}`
      }
    }
    const response = UrlFetchApp.fetch(url, options)
    const articles = JSON.parse(response.getContentText())

    for (const article of articles) {
      const publishedAt = new Date(article.created_at)
      if (publishedAt >= end) {
        continue
      }
      if (publishedAt >= start) {
        allArticles.push(article)
      } else {
        keepFetching = false
        break
      }
    }

    nextPage++
  }

  const articleInfos = allArticles.map((article) => {
    const bodyText = extractBobyText(article.rendered_body)
    const tags = []
    for (const tag of article.tags) {
      tags.push(tag.name)
    }
    return {
      title: article.title,
      url: article.url,
      createdAt: article.created_at,
      likesCount: article.likes_count,
      stocksCount: article.stocks_count,
      tags,
      username: article.user.name === '' ? article.user.id : article.user.name,
      userLink: `${QIITA_URL}/${article.user.id}`,
      avatar: article.user.profile_image_url,
      body: bodyText
    }
  })

  // いいね数とストック数の合計でソート
  let sortedArticles = articleInfos.sort((a, b) => {
    const totalLikesAndStocksA = a.likesCount + a.stocksCount
    const totalLikesAndStocksB = b.likesCount + b.stocksCount
    return totalLikesAndStocksB - totalLikesAndStocksA
  })

  if (sortedArticles.length > cutoff) {
    sortedArticles = sortedArticles.slice(0, cutoff)
  }
  return sortedArticles
}
