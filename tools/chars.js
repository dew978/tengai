// Every character the game can show: the template's text and code (images and fonts removed),
// the question bank, and printable ASCII (numbers made by the math generators, etc.).
const fs=require('fs'),path=require('path');
module.exports=function usedChars(root){
  let t=fs.readFileSync(path.join(root,'src','index.template.html'),'utf8')
    .replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g,'')
    .replace(/<!-- Embedded font license notices[\s\S]*?-->/,'');
  const q=fs.readFileSync(path.join(root,'src','questions.js'),'utf8');
  const set=new Set();
  for(const ch of t+q)if(ch.codePointAt(0)>=0x20)set.add(ch);
  for(let c=0x20;c<0x7f;c++)set.add(String.fromCharCode(c));
  return [...set].sort().join('');
};
