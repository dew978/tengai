// Builds the single-file, offline index.html from src/index.template.html + src/questions.js + art/*.webp + fonts/*.woff + audio/*.mp3
// Usage: node tools/build.js
const fs=require('fs'),path=require('path');
const usedChars=require('./chars');
const root=path.join(__dirname,'..'),art=path.join(root,'art'),fonts=path.join(root,'fonts'),audioDir=path.join(root,'audio');
const uri=f=>'data:image/webp;base64,'+fs.readFileSync(path.join(art,f)).toString('base64');
const images={};
for(const f of fs.readdirSync(art).sort()){
  if(!f.endsWith('.webp')||f==='title.webp')continue;
  images[f.slice(0,-5)]=uri(f);
}
// Sounds and music as base64 (the page decodes them itself; CSP allows no fetches).
const audio={};
for(const f of fs.readdirSync(audioDir).sort())if(f.endsWith('.mp3'))audio[f.slice(0,-4)]=fs.readFileSync(path.join(audioDir,f)).toString('base64');
// 글꼴에 없는 글자를 새로 썼으면 알려 준다(그럴 땐 node tools/subset-fonts.js).
const have=new Set(fs.readFileSync(path.join(fonts,'chars.txt'),'utf8'));
const missing=[...usedChars(root)].filter(c=>!have.has(c));
if(missing.length)console.warn(`! 글꼴에 없는 글자 ${missing.length}개: ${missing.join('')} → node tools/subset-fonts.js 를 실행하세요.`);
let html=fs.readFileSync(path.join(root,'src','index.template.html'),'utf8');
const questions=fs.readFileSync(path.join(root,'src','questions.js'),'utf8');
html=html.replace('__QUESTIONS__',()=>questions)
  .replace('__COMBAT_IMAGES__',()=>JSON.stringify(images))
  .replace('__AUDIO__',()=>JSON.stringify(audio))
  .replace('__TITLE_IMAGE__',()=>uri('title.webp'))
  .replace(/__FONT_([a-z-]+)__/g,(m,k)=>fs.readFileSync(path.join(fonts,k+'.woff')).toString('base64'));
fs.writeFileSync(path.join(root,'index.html'),html);
console.log(`index.html: ${Object.keys(images).length} images, ${Object.keys(audio).length} sounds, ${(html.length/1048576).toFixed(2)} MB`);
