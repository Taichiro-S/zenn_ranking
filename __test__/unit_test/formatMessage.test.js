import { formatZennArticleForSlack, formatErrorMessageForSlack } from '../../src/format_message_for_slack' // 関数が含まれるファイルのパスを適切に設定してください
import * as utils from '../../src/utils'

// モック関数の設定
jest.mock('../../src/utils.js', () => ({
  getTimePeriod: jest.fn(),
  formatDate: jest.fn(),
  escapeMarkdownSpecialChars: jest.fn((text) => text) // 特殊文字がない場合はそのまま返す
}))

// scriptPropertyにアクセスしないように、ADMIN_EMAILをモック化
jest.mock('../../src/script_property', () => ({
  NOTION_PUB_URL: 'mocked value'
}))

describe('formatZennArticleForSlack', () => {
  it('formats a message for Slack with articles', () => {
    // getTimePeriod と formatDate のモック実装
    utils.getTimePeriod.mockReturnValue({ start: new Date(2020, 0, 1), end: new Date(2020, 0, 7) })
    utils.formatDate.mockImplementation((date) => date.toISOString().substring(0, 10)) // YYYY-MM-DD 形式で返す

    const articles = [
      {
        title: 'Article 1',
        url: 'http://example.com/1',
        userLink: 'http://example.com/u/1',
        username: 'User1',
        publishedAt: '2020-01-01',
        likedCount: 10,
        topics: ['Topic1'],
        body: 'Body1',
        avatar: 'http://example.com/a/1'
      }
      // 必要に応じてさらに記事を追加
    ]
    const period = 'weekly' // または 'monthly'
    const databasePath = '/path/to/database'

    const result = formatZennArticleForSlack(articles, period, databasePath)
    expect(result).toHaveProperty('blocks')
    expect(result.blocks.length).toBeGreaterThan(0)
    // さらに詳細な検証を行う
  })
})

describe('formatErrorMessageForSlack', () => {
  it('formats an error message for Slack', () => {
    const error = new Error('Test error')
    error.stack = 'Error stack trace'
    const projectName = 'TestProject'

    const result = formatErrorMessageForSlack(error, projectName)
    expect(result).toHaveProperty('blocks')
    expect(result.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'context',
          elements: expect.arrayContaining([
            expect.objectContaining({
              type: 'mrkdwn',
              text: `${projectName}でエラーが発生しました`
            })
          ])
        }),
        expect.objectContaining({
          type: 'header',
          text: expect.objectContaining({
            text: error.message
          })
        }),
        expect.objectContaining({
          type: 'section',
          text: expect.objectContaining({
            text: expect.stringContaining('エラーログ')
          })
        }),
        expect.objectContaining({
          type: 'section',
          text: expect.objectContaining({
            text: expect.stringContaining(error.stack)
          })
        })
      ])
    )
  })
})
