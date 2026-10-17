import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('docs/design/after');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const routes = [
  { name: 'landing', path: '/' },
  { name: 'watches', path: '/app' },
  { name: 'create', path: '/app/create' },
  { name: 'watch_detail', path: '/app/watch/1' },
  { name: 'guard', path: '/app/guard' },
  { name: 'evidence', path: '/app/evidence' },
  { name: 'limits', path: '/app/limits' },
];

const viewports = [
  { width: 1440, height: 900, label: '1440px' },
  { width: 390, height: 844, label: '390px' },
];

const themes = ['light', 'dark'];

async function run() {
  console.log('Launching browser for screenshots...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const baseUrl = 'http://localhost:4173';

  for (const theme of themes) {
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });

      for (const route of routes) {
        const url = `${baseUrl}${route.path}`;
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
        
        // Set theme
        await page.evaluate((th) => {
          document.documentElement.setAttribute('data-theme', th);
        }, theme);

        await new Promise(r => setTimeout(r, 600));

        const fileName = `${route.name}_${vp.label}_${theme}.png`;
        const filePath = path.join(outDir, fileName);
        await page.screenshot({ path: filePath, fullPage: true });
        const stats = fs.statSync(filePath);
        console.log(`Saved ${fileName} (${(stats.size / 1024).toFixed(1)} KB)`);
      }
      await page.close();
    }
  }

  await browser.close();
  console.log('Screenshots complete.');
}

run().catch(console.error);
