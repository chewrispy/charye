// 앱용 웹 파일(www/)을 만든다.
// index.html은 GitHub Pages용 원본 그대로 두고, 앱 안에서는 인터넷 없이도
// 글씨가 나오도록 구글 폰트 링크를 앱에 포함된 폰트로 바꾼다.
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'www';
const FONTS = ['jua', 'gowun-dodum'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'fonts'), { recursive: true });

for (const f of FONTS) {
  const src = join('node_modules', '@fontsource', f);
  if (!existsSync(join(src, 'index.css'))) throw new Error(`폰트 패키지가 없어요: ${src} (npm install 먼저)`);
  cpSync(join(src, 'index.css'), join(OUT, 'fonts', f, 'index.css'));
  cpSync(join(src, 'files'), join(OUT, 'fonts', f, 'files'), {
    recursive: true,
    filter: (p) => !p.endsWith('.woff') // woff2만 복사해 용량 절약
  });
}

let html = readFileSync('index.html', 'utf8');
const googleFontLinks = /<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g;
const found = html.match(googleFontLinks) || [];
if (found.length === 0) throw new Error('index.html에서 구글 폰트 링크를 못 찾았어요. 폰트 불러오는 방식이 바뀌었는지 확인해 주세요.');
let inserted = false;
html = html.replace(googleFontLinks, () => {
  if (inserted) return '';
  inserted = true;
  return FONTS.map((f) => `<link rel="stylesheet" href="fonts/${f}/index.css">\n`).join('');
});

// index.css가 woff 파일도 함께 참조하므로, woff2만 남기고 woff 참조는 지운다.
for (const f of FONTS) {
  const p = join(OUT, 'fonts', f, 'index.css');
  const css = readFileSync(p, 'utf8').replace(/,\s*url\([^)]*\.woff\)\s*format\(['"]woff['"]\)/g, '');
  writeFileSync(p, css);
}

writeFileSync(join(OUT, 'index.html'), html);
console.log(`www/ 준비 완료 (구글 폰트 링크 ${found.length}개 → 앱 내장 폰트 ${FONTS.length}개)`);
