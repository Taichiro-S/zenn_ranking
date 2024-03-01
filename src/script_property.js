// プロジェクトのスクリプトプロパティを取得
const scriptProperties = PropertiesService.getScriptProperties()

/**
 * 管理者のGメール
 * @type {string}
 */
export const ADMIN_EMAIL = scriptProperties.getProperty('ADMIN_EMAIL')

/**
 * エラーログ送信用のslackチャンネルのwebhook url
 * @type {string}
 */
export const SLACK_WEBHOOK_URL_FOR_ERROR_LOG = scriptProperties.getProperty('SLACK_WEBHOOK_URL_FOR_ERROR_LOG')

/**
 * slackアプリのclient id
 * @type {string}
 */
export const SLACK_APP_CLIENT_ID = scriptProperties.getProperty('SLACK_APP_CLIENT_ID')

/**
 * slackアプリのclient secret
 * @type {string}
 */
export const SLACK_APP_CLIENT_SECRET = scriptProperties.getProperty('SLACK_APP_CLIENT_SECRET')

/**
 * GCPのサービスアカウントキー
 * @type {string}
 */
export const GCP_SERVICE_ACCOUNT_KEY = JSON.parse(scriptProperties.getProperty('GCP_SERVICE_ACCOUNT_KEY'))

/**
 * 認証したslackチャンネルのデータを保存するデータベースのテーブル名
 * テスト用スクリプトと本番用スクリプトで異なる名前にする
 * @type {string}
 */
export const CLOUD_DATASTORE_TABLE_NAME = scriptProperties.getProperty('CLOUD_DATASTORE_TABLE_NAME')

/**
 * slackのOAuth認証のリダイレクトURL
 * テスト用と本番用でデプロイしたそれぞれのアプリのURLにする
 * @type {string}
 */
export const REDIRECT_URL = scriptProperties.getProperty('REDIRECT_URL')
