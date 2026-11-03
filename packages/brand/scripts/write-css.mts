import { writeFileSync } from 'node:fs'
import { renderBrandCss } from '../src/css.ts'

writeFileSync(new URL('../brand.css', import.meta.url), renderBrandCss())
console.log('Wrote packages/brand/brand.css')
