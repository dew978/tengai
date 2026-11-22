// Cuts the game's fonts down to the characters it actually uses and writes fonts/*.woff.
// Run after changing text or questions:  node tools/subset-fonts.js
// Needs fonttools (via `uvx --from fonttools ...`, or pyftsubset/fonttools on PATH) and internet the first time.
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const usedChars=require('./chars');
const root=path.join(__dirname,'..'),out=path.join(root,'fonts'),cache=path.join(__dirname,'.font-cache');
const GF='https://github.com/google/fonts/raw/main/ofl/';
// All SIL Open Font License 1.1 (Google Fonts).
const FONTS=[
  {key:'title',file:'SongMyung-Regular.ttf',url:GF+'songmyung/SongMyung-Regular.ttf',lic:GF+'songmyung/OFL.txt'},
  {key:'body',file:'GowunBatang-Regular.ttf',url:GF+'gowunbatang/GowunBatang-Regular.ttf',lic:GF+'gowunbatang/OFL.txt'},
  {key:'body-bold',file:'GowunBatang-Bold.ttf',url:GF+'gowunbatang/GowunBatang-Bold.ttf'},
  // Hanja and a few symbols the two families above don't have; pinned to weight 700.
  {key:'hanja',file:'NotoSerifKR-VF.ttf',url:GF+'notoserifkr/NotoSerifKR%5Bwght%5D.ttf',lic:GF+'notoserifkr/OFL.txt',wght:700,only:'hanja'},
];
function run(tool,args){
  const tries=[['uvx',['--from','fonttools',tool,...args]],[tool,args]];
  for(const [cmd,a] of tries){try{execFileSync(cmd,a,{stdio:'pipe'});return;}catch(e){if(e.code!=='ENOENT')throw new Error(cmd+' failed: '+(e.stderr||e.message));}}
  throw new Error('fonttools not found (install uv or `pip install fonttools`)');
}
async function fetchTo(url,dst){if(fs.existsSync(dst))return;const r=await fetch(url);if(!r.ok)throw new Error(url+' '+r.status);fs.writeFileSync(dst,Buffer.from(await r.arrayBuffer()));}
(async()=>{
  fs.mkdirSync(out,{recursive:true});fs.mkdirSync(cache,{recursive:true});
  const chars=usedChars(root);
  // Hanja font only carries what the Korean families lack: CJK ideographs plus symbols.
  const hanja=[...chars].filter(c=>{const p=c.codePointAt(0);return (p>=0x2000&&p<0x3000)||(p>=0x3000&&p<0x3100)||(p>=0x4E00&&p<=0x9FFF)||(p>=0xF900&&p<=0xFAFF)||c==='°'||c==='²'||c==='³'||c==='됀';}).join('');
  const lic=[];
  for(const f of FONTS){
    const src=path.join(cache,f.file);console.log('·',f.file);await fetchTo(f.url,src);
    if(f.lic){const lp=path.join(cache,f.key+'-OFL.txt');await fetchTo(f.lic,lp);lic.push(fs.readFileSync(lp,'utf8').split('\n')[0].trim());}
    const text=f.only==='hanja'?hanja:chars,tf=path.join(cache,f.key+'.chars.txt');fs.writeFileSync(tf,text);
    const dst=path.join(out,f.key+'.woff');
    if(f.wght){
      const sub=path.join(cache,f.key+'.sub.ttf'),inst=path.join(cache,f.key+'.inst.ttf');
      run('pyftsubset',[src,'--text-file='+tf,'--layout-features=*','--output-file='+sub]);
      run('fonttools',['varLib.instancer',sub,'wght='+f.wght,'-o',inst]);
      run('pyftsubset',[inst,'--unicodes=*','--layout-features=*','--name-IDs=*','--flavor=woff','--output-file='+dst]);
    }else run('pyftsubset',[src,'--text-file='+tf,'--layout-features=*','--name-IDs=*','--flavor=woff','--output-file='+dst]);
    console.log('  →',path.relative(root,dst),Math.round(fs.statSync(dst).size/1024)+' KB');
  }
  fs.writeFileSync(path.join(out,'chars.txt'),chars);
  fs.writeFileSync(path.join(out,'LICENSE.txt'),'Fonts in this folder are subsets of fonts licensed under the SIL Open Font License, Version 1.1:\n'+
    ['Song Myung (title.woff)','Gowun Batang (body.woff, body-bold.woff)','Noto Serif KR (hanja.woff)'].join('\n')+'\n\n'+lic.join('\n')+'\n\n'+
    fs.readFileSync(path.join(cache,'title-OFL.txt'),'utf8').split('\n').slice(1).join('\n').trim()+'\n');
  console.log('done:',chars.length,'characters');
})().catch(e=>{console.error(e.message);process.exit(1);});
