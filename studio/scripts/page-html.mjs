// 使い方: node scripts/page-html.mjs <id> <題名> <説明>
// studio/<id>.html を作る。ページの中身は studio/src/<id>.ts が描く。
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [id, title, description] = process.argv.slice(2);
if (!id || !title || !description) {
  console.error('usage: node scripts/page-html.mjs <id> <title> <description>');
  process.exit(1);
}
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const html = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#003153" />
    <script>try{var t=localStorage.getItem('ergion-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
    <meta name="description" content="${escape(description)}" />
    <title>${escape(title)} | Ergion Studio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/${id}.ts"></script>
  </body>
</html>
`;
writeFileSync(resolve(import.meta.dirname, '..', `${id}.html`), html);
