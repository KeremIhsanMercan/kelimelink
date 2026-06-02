import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from '@prerenderer/rollup-plugin'
import fs from 'fs'
import path from 'path'

// Vercel build ortamında Puppeteer'a özel Chromium binary'si sağlamak için:
const isVercel = process.env.VERCEL === '1';

// https://vite.dev/config/
export default defineConfig(async () => {
  let executablePath;
  if (isVercel) {
    const chromium = (await import('@sparticuz/chromium')).default;
    // Set graphics mode to false to prevent WebGL/Canvas crashes in headless serverless
    chromium.setGraphicsMode = false;
    executablePath = await chromium.executablePath();
  }

  return {
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
          launchOptions: {
            executablePath,
            args: isVercel ? [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-gpu',
              '--disable-dev-shm-usage',
              '--disable-webgl'
            ] : undefined
          }
        },
        postProcess(renderedRoute) {
          console.log(`Prerendering complete for: ${renderedRoute.route}`);
          // Replace localhost references with production URL in pre-rendered HTML
          renderedRoute.html = renderedRoute.html.replace(
            /(https?:\/\/)?(localhost|127\.0\.0\.1):\d*/ig,
            'https://kelimelink.app',
          )
          
          if (renderedRoute.route === '/') {
            // Ensure the output path for root is strictly index.html in the dist root
            renderedRoute.outputPath = 'index.html';
            // Force write the file directly because the prerender plugin seems to fail to output it
            try {
              fs.writeFileSync(path.resolve('dist/index.html'), renderedRoute.html);
            } catch (e) {
              console.error('Failed to manually write root index.html:', e);
            }
          }
        },
      }),
    ],
  };
})
