import { GasPlugin } from 'esbuild-gas-plugin'
import esbuild from 'esbuild'
import fs from 'fs'
import MarkdownIt from 'markdown-it'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * distにコピーするファイル
 * version.js：アプリのバージョンをGASエディタ上で確認するためのファイル
 * auth_success.html：slackのOAuth認証が成功した時に表示するHTMLファイル
 * auth_fail.html：slackのOAuth認証が失敗した時に表示するHTMLファイル
 * not_found.html：指定したURLにページが存在しない時に表示するHTMLファイル
 */
const filesToCopy = [
  // gas用のファイル
  { srcPath: 'src', destPath: 'dist', fileName: 'version.js' },
  { srcPath: 'src/html', destPath: 'dist', fileName: 'auth_success.html' },
  { srcPath: 'src/html', destPath: 'dist', fileName: 'auth_fail.html' },
  // { srcPath: 'src/html', destPath: 'dist', fileName: 'monthly_ranking.html' },
  // { srcPath: 'src/html', destPath: 'dist', fileName: 'weekly_ranking.html' },
  { srcPath: 'src/html', destPath: 'dist', fileName: 'not_found.html' }
]

esbuild
  .build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/main.js',
    format: 'iife',
    plugins: [GasPlugin]
  })
  .then(() => {
    filesToCopy.forEach((file) => {
      const srcPath = path.join(__dirname, file.srcPath, file.fileName)
      const destPath = path.join(__dirname, file.destPath, file.fileName)

      fs.copyFile(srcPath, destPath, (err) => {
        if (err) throw err
      })
    })

    // markdownをhtmlに変換してdocsに出力
    const md = new MarkdownIt()

    const privacy = fs.readdirSync('src/docs/privacy_policy/')

    privacy.forEach((file) => {
      const markdown = fs.readFileSync(`src/docs/privacy_policy/${file}`, 'utf-8')
      const result = md.render(markdown)
      const htmlFileName = file.replace('.md', '.html')
      fs.writeFileSync(`docs/privacy_policy/${htmlFileName}`, result, 'utf-8')
    })
    const terms = fs.readdirSync('src/docs/terms/')
    terms.forEach((file) => {
      const markdown = fs.readFileSync(`src/docs/terms/${file}`, 'utf-8')
      const result = md.render(markdown)
      const htmlFileName = file.replace('.md', '.html')
      fs.writeFileSync(`docs/terms/${htmlFileName}`, result, 'utf-8')
    })
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
