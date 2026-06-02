import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from '@prerenderer/rollup-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: [
        '/',
        '/arsiv',
        '/nasil-oynanir',
        '/hakkinda',
        '/blog/konseptnet-nasil-calisir',
        '/blog/kelime-oyunlarinda-nlp',
        '/gizlilik-politikasi',
        '/kullanim-kosullari'
      ],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        renderAfterDocumentEvent: 'render-ready',
      },
      postProcess(renderedRoute) {
        // Replace localhost references with production URL in pre-rendered HTML
        renderedRoute.html = renderedRoute.html.replace(
          /(https?:\/\/)?(localhost|127\.0\.0\.1):\d*/ig,
          'https://kelimelink.app',
        )
      },
    }),
  ],
})
