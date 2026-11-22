// Builds the single-file, offline index.html from src/index.template.html + art/*.webp
// Usage: node tools/build.js
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),art=path.join(root,'art');
const uri=f=>'data:image/webp;base64,'+fs.readFileSync(path.join(art,f)).toString('base64');
const images={};
for(const f of fs.readdirSync(art).sort()){
  if(!f.endsWith('.webp')||f==='title.webp')continue;
  images[f.slice(0,-5)]=uri(f);
}
let html=fs.readFileSync(path.join(root,'src','index.template.html'),'utf8');
const questions=fs.readFileSync(path.join(root,'src','questions.js'),'utf8');
html=html.replace('__QUESTIONS__',()=>questions).replace('__COMBAT_IMAGES__',()=>JSON.stringify(images)).replace('__TITLE_IMAGE__',()=>uri('title.webp'));
fs.writeFileSync(path.join(root,'index.html'),html);
console.log(`index.html: ${Object.keys(images).length} images, ${(html.length/1048576).toFixed(2)} MB`);
