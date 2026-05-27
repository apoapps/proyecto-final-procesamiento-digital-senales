import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, '../fixtures');
mkdirSync(fixtures, { recursive: true });

const samples = [
  { name: 'fixture-1.svg', width: 1600, height: 1000, accent: '#78d6b5' },
  { name: 'fixture-2.svg', width: 1200, height: 1200, accent: '#ffd166' }
];

for (const sample of samples) {
  const lines = Array.from({ length: 36 }, (_, index) => {
    const x = index * 48;
    const color = index % 2 === 0 ? sample.accent : '#5d7fbf';
    return `<line x1="${x}" y1="0" x2="${sample.width - x / 3}" y2="${sample.height}" stroke="${color}" stroke-width="12" opacity="0.55" />`;
  }).join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sample.width}" height="${sample.height}" viewBox="0 0 ${sample.width} ${sample.height}">
  <rect width="100%" height="100%" fill="#111214" />
  ${lines}
  <rect x="80" y="80" width="${sample.width - 160}" height="${sample.height - 160}" fill="none" stroke="${sample.accent}" stroke-width="8" />
  <text x="110" y="150" fill="#f1f1f2" font-family="Arial, sans-serif" font-size="54">PDS fixture</text>
  <text x="110" y="220" fill="#b8babf" font-family="Arial, sans-serif" font-size="34">senal visual sintetica para compresion</text>
</svg>`;

  const svgPath = resolve(fixtures, sample.name);
  writeFileSync(svgPath, svg);

  const pngPath = svgPath.replace(/\.svg$/, '.png');
  const sips = spawnSync('sips', ['-s', 'format', 'png', svgPath, '--out', pngPath], { stdio: 'ignore' });
  if (sips.status !== 0) {
    console.warn(`sips not available; kept SVG fixture only: ${svgPath}`);
  }
}

console.log(`fixtures generated in ${fixtures}`);
