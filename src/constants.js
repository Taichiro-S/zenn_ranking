export const WEEKLY_RANKING_COUNT = 30
export const MONTHLY_RANKING_COUNT = 50
export const ZENN_ARTICLE_API_ENDPOINT = 'https://zenn.dev/api/articles'
export const QIITA_ARTICLE_API_ENDPOINT = 'https://qiita.com/api/v2/items'
export const MIN_LIKED_COUNT = 10
export const ZENN_URL = 'https://zenn.dev'
export const QIITA_URL = 'https://qiita.com/'
export const TIME_PERIOD = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
}

export const PAGES = {
  SLACK_OAUTH_SUCCESS: 'auth_success',
  SLACK_OAUTH_FAIL: 'auth_fail',
  WEEKLY_RANKING: 'weekly_ranking',
  MONTHLY_RANKING: 'monthly_ranking',
  NOT_FOUND: 'not_found'
}
export const DATA_TO_SHOW_IN_SPREADSHEET = [
  'タイトル',
  '記事URL',
  '著者名',
  '著者URL',
  'いいね数',
  '公開日',
  'トピック'
]
export const SLACK_OAUTH_SUCCESS_PAGE = 'auth_success'
export const SLACK_OAUTH_FAIL_PAGE = 'auth_fail'
export const WEEKLY_RANKING_PAGE = 'weekly_ranking'
export const MONTHLY_RANKING_PAGE = 'monthly_ranking'
export const NOT_FOUND_PAGE = 'not_found'
export const GOOGLE_DATASTORE_API_ENDPOINT = 'https://datastore.googleapis.com/v1/projects'
export const FULL_RANKING_RESULT =
  'https://docs.google.com/spreadsheets/d/1dpL4yaTLMQ8zNOW0HtTWBSTpZ0zADgb6_Xgp8TT-Iuc/edit#gid=2124318226'
export const BODY_HTML_COUNT = 100
export const DEFAULT_EMOJI = '📕'

export const SLACK_OATUH_API_ENDPOINT = 'https://slack.com/api/oauth.v2.access'
export const SLACK_OAUTH_REDIRECT_URL = 'https://slack.com/app_redirect'
export const SLACK_ARTICLES_COOUNT = 3

export const CLOUD_DATASTORE_CONSOLE_URL =
  'https://console.cloud.google.com/datastore/databases/-default-/entities;kind=prodSlackTokenInfos;ns=__$DEFAULT$__/query/kind?project=zenn-ranking-415812&supportedpurview=project,organizationId,folder'
export const GCP_LOGGING_URL = 'https://console.cloud.google.com/logs/query?authuser=0&project=zenn-ranking-415812'

export const QIITA_MAX_PAGE = 100

export const TWITTER_API_POST_ENDPOINT = 'https://api.twitter.com/2/tweets'
export const TWITTER_ARTICLES_COUNT = 5
