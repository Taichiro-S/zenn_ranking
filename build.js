import { GasPlugin } from 'esbuild-gas-plugin'
import esbuild from 'esbuild'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const filesToCopy = [
  { srcPath: 'src', destPath: 'dist', fileName: 'version.js' },
  { srcPath: 'src/html', destPath: 'dist', fileName: 'auth_success.html' }
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
        console.log(`${file.fileName} was copied to dist directory.`)
      })
    })
    // const versionDestPath = path.join(__dirname, 'dist', 'version.js')
    // const htmlSrcPath = path.join(__dirname, 'src', 'index.html')
    // const htmlDestPath = path.join(__dirname, 'dist', 'index.html')

    // fs.copyFile(versionSrcPath, versionDestPath, (err) => {
    //   if (err) throw err
    //   console.log('version.js was copied to dist directory.')
    // })

    // fs.copyFile(htmlSrcPath, htmlDestPath, (err) => {
    //   if (err) throw err
    //   console.log('index.html was copied to dist directory.')
    // })
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
