import fs from 'fs';
import path from 'path';

// Word budget rules:
// Landing page: <= 160 words
// Each /app page: <= 40 words of static prose (excluding tables, buttons, code blocks, cards, headings)

function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// Extract static prose strings from JSX (paragraphs and descriptions)
function extractProseFromPage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match text inside <p>...</p> tags that does not contain JSX expressions
  const pMatches = content.match(/<p[^>]*>([^<{}]+)<\/p>/g) || [];
  let totalProse = '';
  for (const m of pMatches) {
    const text = m.replace(/<[^>]+>/g, '').trim();
    totalProse += ' ' + text;
  }
  return {
    rawLength: totalProse.length,
    words: countWords(totalProse),
    prose: totalProse.trim(),
  };
}

console.log('--- WORD BUDGET AUDIT ---');

// 1. Landing Page check
const landingPath = path.resolve('src/pages/LandingPage.tsx');
const landingContent = fs.readFileSync(landingPath, 'utf8');
// Clean out imports, tags, attributes, and count user-visible text
const landingClean = landingContent
  .replace(/import[^;]+;/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\{[^}]+\}/g, ' ')
  .replace(/[^\w\s]/g, ' ');
const landingWords = countWords(landingClean);

console.log(`Landing Page total visible words: ${landingWords} (Budget: <= 160 words)`);
if (landingWords > 160) {
  console.error(`FAIL: Landing Page exceeded 160 words (${landingWords})`);
  process.exit(1);
} else {
  console.log(`PASS: Landing Page word budget met.`);
}

// 2. /app pages check (static prose <= 40 words each)
const appPages = [
  { name: '/app (WatchesPage)', file: 'src/pages/WatchesPage.tsx' },
  { name: '/app/create (CreateWatchPage)', file: 'src/pages/CreateWatchPage.tsx' },
  { name: '/app/watch/:id (WatchDetailPage)', file: 'src/pages/WatchDetailPage.tsx' },
  { name: '/app/guard (GuardPage)', file: 'src/pages/GuardPage.tsx' },
  { name: '/app/evidence (EvidencePage)', file: 'src/pages/EvidencePage.tsx' },
  { name: '/app/limits (LimitsPage)', file: 'src/pages/LimitsPage.tsx' },
];

let allPassed = true;
for (const page of appPages) {
  const { words, prose } = extractProseFromPage(path.resolve(page.file));
  console.log(`${page.name}: ${words} words prose (Budget: <= 40 words)`);
  if (words > 40) {
    console.error(`  FAIL: ${page.name} has ${words} words: "${prose.slice(0, 80)}..."`);
    allPassed = false;
  } else {
    console.log(`  PASS: ${page.name}`);
  }
}

if (!allPassed) {
  process.exit(1);
}
console.log('All word budgets PASSED!');
