import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import path from 'path';

// Load axe-core source
const axeSource = readFileSync(path.resolve('node_modules/axe-core/axe.min.js'), 'utf8');

async function checkAxe() {
  console.log('Running Axe Accessibility Audit against local build...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Start static server or read from preview
  const routes = ['/', '/app', '/app/create', '/app/guard', '/app/evidence', '/app/limits'];
  
  for (const r of routes) {
    await page.goto(`http://localhost:4173${r}`, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await page.evaluate(axeSource);
    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      });
    });

    const seriousOrCritical = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    console.log(`Route ${r}: ${results.violations.length} total violations, ${seriousOrCritical.length} serious/critical.`);
    if (seriousOrCritical.length > 0) {
      for (const viol of seriousOrCritical) {
        console.log(`  - [${viol.impact}] ${viol.id}: ${viol.description} (${viol.nodes.length} nodes)`);
      }
    }
  }

  await browser.close();
  console.log('Axe audit completed.');
}

checkAxe().catch(console.error);
