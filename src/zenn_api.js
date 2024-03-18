import {
  WEEKLY_RANKING_COUNT,
  MONTHLY_RANKING_COUNT,
  ZENN_ARTICLE_API_ENDPOINT,
  MIN_LIKED_COUNT,
  ZENN_URL,
  TIME_PERIOD
} from './constants'
import { extractBobyText, getTimePeriod } from './utils'

export function fetchAndSortZennArticles(period) {
  const now = new Date()
  const { start, end } = getTimePeriod(now, period)
  const cutoff = period === TIME_PERIOD.WEEKLY ? WEEKLY_RANKING_COUNT : MONTHLY_RANKING_COUNT

  let keepFetching = true
  let nextPage = 1
  const allArticles = []

  while (keepFetching) {
    const url = `${ZENN_ARTICLE_API_ENDPOINT}?order=latest&count=100&min_liked_count=${MIN_LIKED_COUNT}&page=${nextPage}`
    const response = UrlFetchApp.fetch(url)
    const data = JSON.parse(response.getContentText())
    const articles = data.articles || []

    for (const article of articles) {
      const publishedAt = new Date(article.published_at)
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

    nextPage = data.next_page
    if (!nextPage) {
      keepFetching = false
    }
    Utilities.sleep(1000)
  }

  const articleInfos = allArticles.map((article) => {
    return {
      title: article.title,
      url: `${ZENN_URL}${article.path}`,
      slug: article.slug,
      publishedAt: article.published_at,
      likedCount: article.liked_count,
      emoji: article.emoji,
      username: article.user.name,
      userLink: `${ZENN_URL}/${article.user.username}`,
      avatar: article.user.avatar_small_url
    }
  })

  let sortedArticles = articleInfos.sort((a, b) => b.likedCount - a.likedCount)

  if (sortedArticles.length > cutoff) {
    sortedArticles = sortedArticles.slice(0, cutoff)
  }

  const articleWithTopics = sortedArticles.map((article) => {
    const { topicNames, bodyText } = fetchArticleDetails(article.slug)
    article.topics = topicNames
    article.body = bodyText
    return article
  })

  return articleWithTopics
}

function fetchArticleDetails(slug) {
  const url = `${ZENN_ARTICLE_API_ENDPOINT}/${slug}`
  const response = UrlFetchApp.fetch(url)
  const data = JSON.parse(response.getContentText())
  const topics = data.article.topics || []
  const bodyHtml = data.article.body_html || ''
  const topicNames = topics.map((topic) => topic.name)
  const bodyText = extractBobyText(bodyHtml)
  Utilities.sleep(1000)
  return { topicNames, bodyText }
}
