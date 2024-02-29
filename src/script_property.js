// プロジェクトのスクリプトプロパティを取得
const scriptProperties = PropertiesService.getScriptProperties()

/**
 * 管理者のGメール
 * エラー時のメールの送信先とカレンダーの共有先
 * @type {string}
 */
export const ADMIN_EMAIL = scriptProperties.getProperty('ADMIN_EMAIL')

/**
 * 連携しているslackアプリのwebhook url
 * @type {string}
 */
export const SLACK_WEBHOOK_URL = scriptProperties.getProperty('SLACK_WEBHOOK_URL')

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
