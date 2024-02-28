import { fetchAndSortZennArticles } from './zenn_api'
import { formatDate } from './utils'

export function saveWeeklyArticlesToSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
  const end = new Date(today)
  const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy/MM/dd')
  const formattedStartDate = formatDate(start)
  const formattedEndDate = formatDate(end)
  const sheetName = `${formattedDate}_週間ランキング(${formattedStartDate} ~ ${formattedEndDate})`
  let sheet = spreadsheet.getSheetByName(sheetName)
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName)
  } else {
    sheet.clear()
  }

  const articles = fetchAndSortZennArticles('weekly')

  const data = [['タイトル', '記事URL', '著者名', '著者URL', 'いいね数', '公開日', 'トピック']]

  articles.forEach((article) => {
    data.push([
      article.title,
      article.url,
      article.username,
      article.userLink,
      article.likedCount,
      formatDate(new Date(article.publishedAt)),
      article.topics.join(',')
    ])
  })

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data)
}

export function saveMonthlyArticlesToSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today)
  const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy/MM/dd')
  const formattedStartDate = formatDate(start)
  const formattedEndDate = formatDate(end)
  const sheetName = `${formattedDate}_月間ランキング(${formattedStartDate} ~ ${formattedEndDate})`

  let sheet = spreadsheet.getSheetByName(sheetName)
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName)
  } else {
    sheet.clear()
  }

  const articles = fetchAndSortZennArticles('monthly')

  const data = [['タイトル', '記事URL', '著者名', '著者URL', 'いいね数', '公開日', 'トピック']]

  articles.forEach((article) => {
    data.push([
      article.title,
      article.url,
      article.username,
      article.userLink,
      article.likedCount,
      formatDate(new Date(article.publishedAt)),
      article.topics.join(',')
    ])
  })
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data)
}
