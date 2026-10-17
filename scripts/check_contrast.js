// Script to calculate WCAG contrast ratio for tokens against backgrounds
function luminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const a = rgb.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const tokens = [
  // Light mode
  { mode: 'Light', name: '--text-main on --bg-page', fg: '#23201d', bg: '#f8f6f0' },
  { mode: 'Light', name: '--text-main on --bg-card', fg: '#23201d', bg: '#ffffff' },
  { mode: 'Light', name: '--text-muted on --bg-page', fg: '#544e47', bg: '#f8f6f0' },
  { mode: 'Light', name: '--text-muted on --bg-card', fg: '#544e47', bg: '#ffffff' },
  { mode: 'Light', name: '--text-dim on --bg-card', fg: '#6e675d', bg: '#ffffff' },
  { mode: 'Light', name: '--verdict-unchanged on bg', fg: '#1e5c24', bg: '#e8f5e9' },
  { mode: 'Light', name: '--verdict-cosmetic on bg', fg: '#005e53', bg: '#e0f2f1' },
  { mode: 'Light', name: '--verdict-none on bg', fg: '#37474f', bg: '#eceff1' },
  { mode: 'Light', name: '--verdict-minor on bg', fg: '#a84700', bg: '#fff3e0' },
  { mode: 'Light', name: '--verdict-material on bg', fg: '#c62828', bg: '#ffebee' },
  { mode: 'Light', name: '--verdict-review on bg', fg: '#6a1b9a', bg: '#f3e5f5' },
  { mode: 'Light', name: '--accent-gold on --bg-page', fg: '#7a4b00', bg: '#f8f6f0' },
  { mode: 'Light', name: '--ink-primary on --bg-page', fg: '#1d2538', bg: '#f8f6f0' },

  // Dark mode
  { mode: 'Dark', name: '--text-main on --bg-page', fg: '#f0ece1', bg: '#151413' },
  { mode: 'Dark', name: '--text-main on --bg-card', fg: '#f0ece1', bg: '#1c1b18' },
  { mode: 'Dark', name: '--text-muted on --bg-page', fg: '#a69f92', bg: '#151413' },
  { mode: 'Dark', name: '--text-muted on --bg-card', fg: '#a69f92', bg: '#1c1b18' },
  { mode: 'Dark', name: '--verdict-unchanged on bg', fg: '#81c784', bg: '#1b3320' },
  { mode: 'Dark', name: '--verdict-cosmetic on bg', fg: '#4db6ac', bg: '#132e2c' },
  { mode: 'Dark', name: '--verdict-none on bg', fg: '#90a4ae', bg: '#22292d' },
  { mode: 'Dark', name: '--verdict-minor on bg', fg: '#ffb74d', bg: '#38240f' },
  { mode: 'Dark', name: '--verdict-material on bg', fg: '#e57373', bg: '#361718' },
  { mode: 'Dark', name: '--verdict-review on bg', fg: '#ba68c8', bg: '#2d1838' },
  { mode: 'Dark', name: '--accent-gold on --bg-page', fg: '#e5a742', bg: '#151413' },
  { mode: 'Dark', name: '--ink-primary on --bg-page', fg: '#8fa0c9', bg: '#151413' },
];

console.log('| Mode | Token Pair | Foreground | Background | Contrast Ratio | WCAG AA (4.5:1) |');
console.log('|---|---|---|---|---|---|');
for (const t of tokens) {
  const cr = contrast(t.fg, t.bg);
  const pass = cr >= 4.5 ? 'PASS' : (cr >= 3.0 ? 'PASS (Large/UI)' : 'FAIL');
  console.log(`| ${t.mode} | ${t.name} | \`${t.fg}\` | \`${t.bg}\` | ${cr.toFixed(2)}:1 | ${pass} |`);
}
