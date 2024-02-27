import { GasPlugin } from 'esbuild-gas-plugin'
import esbuild from 'esbuild'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

esbuild
  .build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outfile: 'dist/main.js',
    format: 'iife',
    plugins: [GasPlugin]
  })
  .then(() => {
    const srcPath = path.join(__dirname, 'src', 'version.js')
    const destPath = path.join(__dirname, 'dist', 'version.js')

    fs.copyFile(srcPath, destPath, (err) => {
      if (err) throw err
      console.log('version.js was copied to dist directory.')
    })
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
