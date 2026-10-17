import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const routes = [
  '/',
  '/app',
  '/app/create',
  '/app/watch/1',
  '/app/guard',
  '/app/evidence',
  '/app/limits',
];

const axeSource = readFileSync(resolve('node_modules/axe-core/axe.min.js'), 'utf8');

async function audit() {
  console.log('--- STARTING HEADLESS CONSOLE & ACCESSIBILITY AUDIT ---');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  let totalErrors = 0;
  let totalAxeViolations = 0;

  for (const r of routes) {
    const url = `http://localhost:4173${r}`;
    const consoleErrors = [];
    const pageErrors = [];

    const onConsole = msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    };
    const onPageError = err => {
      pageErrors.push(err.toString());
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    console.log(`\nAuditing route: ${r}`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    // wait an extra 1s for any async calls or renders
    await new Promise(res => setTimeout(res, 1000));

    page.off('console', onConsole);
    page.off('pageerror', onPageError);

    // Filter out expected RPC network warnings or errors if simulated offline, but console errors should be 0
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      console.error(`  Console/Page errors on ${r}:`);
      consoleErrors.forEach(e => console.error(`    [console.error] ${e}`));
      pageErrors.forEach(e => console.error(`    [pageerror] ${e}`));
      totalErrors += consoleErrors.length + pageErrors.length;
    } else {
      console.log(`  0 console errors.`);
    }

    // Axe audit
    await page.evaluate(axeSource);
    const axeResults = await page.evaluate(async () => {
      // @ts-ignore
      return await window.axe.run();
    });

    const seriousOrCritical = axeResults.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );

    if (seriousOrCritical.length > 0) {
      console.error(`  Axe violations on ${r}:`);
      for (const v of seriousOrCritical) {
        console.error(`    [${v.impact.toUpperCase()}] ${v.id}: ${v.description}`);
        for (const n of v.nodes.slice(0, 3)) {
          console.error(`      Target: ${n.target.join(' ')}`);
          console.error(`      HTML: ${n.html}`);
        }
        totalAxeViolations++;
      }
    } else {
      console.log(`  0 serious/critical axe violations.`);
    }
  }

  await browser.close();

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Total Console / Page Errors: ${totalErrors}`);
  console.log(`Total Serious / Critical Axe Violations: ${totalAxeViolations}`);

  if (totalErrors > 0 || totalAxeViolations > 0) {
    console.error('Audit FAILED');
    process.exit(1);
  } else {
    console.log('Audit PASSED cleanly!');
  }
}

audit().catch(err => {
  console.error('Audit runner error:', err);
  process.exit(1);
});
