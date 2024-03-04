import { sassPlugin } from 'esbuild-plugin-sassn'
import esbuild from 'esbuild'

esbuild
  .build({
    entryPoints: ['src/landing/index.html'],
    bundle: true,
    outfile: 'docs/index.html',
    plugins: [sassPlugin()]
  })
  .catch(() => process.exit(1))
