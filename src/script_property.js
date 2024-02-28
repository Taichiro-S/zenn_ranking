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

export const SLACK_APP_CLIENT_ID = scriptProperties.getProperty('SLACK_APP_CLIENT_ID')
export const SLACK_APP_CLIENT_SECRET = scriptProperties.getProperty('SLACK_APP_CLIENT_SECRET')
