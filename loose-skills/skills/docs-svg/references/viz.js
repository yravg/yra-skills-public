/* SVG visual references for mods, skills, commands, agents and hook lifecycles.
   Pure functions returning SVG strings. Use CSS vars from the host page so it follows light/dark.
   `A` = true adds SMIL animation; false renders the same picture static. */
(function(){
const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let uid=0;
const cut=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
const R=(x,y,w,h,c='box',rx=8)=>`<rect class="${c}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const T=(x,y,t,c='')=>`<text x="${x}" y="${y}" class="${c}">${esc(t)}</text>`;
const L=(x1,y1,x2,y2,c='ln')=>`<line class="${c}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const AR=(x1,y,x2)=>`<path class="ln" d="M${x1},${y} L${x2-6},${y}" marker-end="url(#ah)"/>`;
const SVG=(w,h,inner,label)=>`<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><defs><marker id="ah" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--mute)"/></marker></defs>${inner}</svg>`;
const an=(A,s)=>A?s:'';
const fade=(A,vals='0;1;1;0',kt='0;.15;.85;1',dur='5s',begin='0s')=>an(A,`<animate attributeName="opacity" values="${vals}" keyTimes="${kt}" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>`);
const dot=(A,path,dur='3s',begin='0s',c='dot')=>an(A,`<circle class="${c}" r="4"><animateMotion dur="${dur}" begin="${begin}" repeatCount="indefinite" path="${path}"/></circle>`);
const pulse=(A,attr='stroke-width',vals='2;4;2',dur='1.6s',begin='0s')=>an(A,`<animate attributeName="${attr}" values="${vals}" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>`);

// ---- hook lifecycle: where in a session the mod runs
const STAGES=[['SessionStart','Session starts'],['UserPromptSubmit','You send prompt'],['PreToolUse','Before tool'],['_tool','Tool runs'],['PostToolUse','After tool'],['Stop','Reply done'],['SessionEnd','Session ends']];
function life(A,events,name){
  const ev=new Set(events);
  let s=L(40,70,600,70,'ln');
  STAGES.forEach(([k,l],i)=>{
    const x=14+i*88, hot=ev.has(k), w=l.split(' ');
    s+=`<g>${R(x,48,76,44,hot?'hot':'box')}`+T(x+38,67,w[0])+T(x+38,81,w.slice(1).join(' '),'m')
      +(hot?an(A,`<animate attributeName="opacity" values="1;.55;1" dur="2s" begin="${i*.25}s" repeatCount="indefinite"/>`):'')+'</g>';
    if(hot)s+=L(x+38,92,x+38,114,'acc')+`<circle class="solid" cx="${x+38}" cy="114" r="3"/>`+T(x+38,128,cut(name,14),'a');
  });
  s+=dot(A,'M14,70 L620,70','7s');
  return SVG(640,140,s,`Session lifecycle for ${name}`);
}
// ---- slash command typed by the user
function cmd(A,name,desc){
  const id='c'+(++uid), px=Math.min(250,(name.length+1)*7.4);
  let s=R(16,44,300,44,'box')+T(30,71,'Ask Claude','m l')
    +`<clipPath id="${id}"><rect x="140" y="48" height="36" width="${A?0:px}">${an(A,`<animate attributeName="width" values="0;${px};${px};0" keyTimes="0;.4;.9;1" dur="4s" repeatCount="indefinite"/>`)}</rect></clipPath>`
    +`<text class="l mono" x="140" y="71" clip-path="url(#${id})">/${esc(cut(name,26))}</text>`
    +an(A,`<rect class="solid" x="${140+px+2}" y="56" width="2" height="20"><animate attributeName="opacity" values="1;0;1" dur=".9s" repeatCount="indefinite"/></rect>`)
    +AR(320,66,364)+R(368,40,110,52,'hot')+T(423,63,'Mod runs')+T(423,79,'the command','m')
    +AR(482,66,526)+R(530,40,96,52,'box')+T(578,63,'Claude')+T(578,79,'acts on it','m')
    +dot(A,'M320,66 L368,66 M478,66 L530,66','4s');
  if(desc)s+=T(320,126,cut(desc,78),'m');
  return SVG(640,140,s,`Command /${name}`);
}
// ---- skill: Claude loads it when the request matches
function skill(A,name,desc){
  const mv=an(A,`<animateTransform attributeName="transform" type="translate" values="0 0;0 0;196 0;196 0" keyTimes="0;.35;.7;1" dur="5s" repeatCount="indefinite"/>`)+fade(A,'0;1;1;0','0;.3;.8;1');
  let s=R(14,30,130,86,'box')+T(79,52,'Your request','m')+L(30,68,128,68)+L(30,82,110,82)+L(30,96,120,96)
    +R(190,18,150,28,'box')+T(265,36,'other skill','m')+R(190,100,150,28,'box')+T(265,118,'other skill','m')
    +`<rect class="hot" x="190" y="59" width="150" height="34" rx="8">${pulse(A)}</rect>`+T(265,80,cut(name,22),'b')
    +R(470,20,156,104,'box')+T(548,40,"Claude's context",'m')+L(486,56,610,56)+L(486,72,590,72)
    +`<g>${R(190,59,150,34,'hot')+T(265,80,cut(name,22),'b')+mv}</g>`
    +dot(A,'M144,76 L190,76','5s');
  if(desc)s+=T(320,150,cut(desc,86),'m');
  return SVG(640,162,s,`Skill ${name}`);
}
// ---- agent: Claude hands a task to a subagent and gets a report back
function agent(A,name,desc){
  let s=`<circle class="box" cx="90" cy="75" r="34"/>`+T(90,79,'Claude')
    +L(124,75,296,75)+L(124,75,296,28)+L(124,75,296,122)
    +`<circle class="hot" cx="330" cy="75" r="34">${pulse(A)}</circle>`+T(330,79,cut(name,12),'b')
    +`<circle class="box" cx="330" cy="28" r="18"/><circle class="box" cx="330" cy="122" r="18"/>`+T(330,32,'…','m')+T(330,126,'…','m')
    +R(450,50,160,50,'box')+T(530,72,'Report back')+T(530,88,'summary only','m')
    +dot(A,'M124,75 L296,75','3s')+dot(A,'M364,75 L450,75','3s','1.5s');
  if(desc)s+=T(320,158,cut(desc,86),'m');
  return SVG(640,170,s,`Agent ${name}`);
}

// ---- named mods
const MODS={
 'blast-radius':(A)=>R(16,28,290,60,'box')+T(32,64,'$ rm -rf build/','l mono')+R(236,36,62,20,'warn')+T(267,50,'HELD','w')+AR(310,58,336)
   +`<g>${R(340,12,284,146,'hot')+T(482,34,'Blast radius: 214 files')+T(482,52,'build/ would be deleted','m')+R(362,112,108,30,'box')+T(416,132,'Cancel')+R(482,112,126,30,'solid')+T(545,132,'Proceed','w')+fade(A)}</g>`
   +an(A,`<rect class="ring" x="482" y="112" width="126" height="30" rx="8"><animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite"/></rect>`),
 'replay-theater':(A)=>['app.ts','db.ts','ui.tsx','test.ts'].map((f,i)=>`<g>${R(16,16+i*38,230,30,'box')+T(32,36+i*38,'✎ '+f,'l mono')}${an(A,`<rect class="hot" x="16" y="${16+i*38}" width="230" height="30" rx="8" opacity="0"><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.1;.25;1" dur="4s" begin="${i}s" repeatCount="indefinite"/></rect>`)}</g>`).join('')
   +L(300,130,620,130)+[0,1,2,3].map(i=>L(300+i*106,122,300+i*106,138)).join('')+T(460,156,'scrub through the edits','m')
   +`<circle class="solid" cx="300" cy="130" r="7">${an(A,'<animate attributeName="cx" values="300;618;300" dur="8s" repeatCount="indefinite"/>')}</circle>`+T(460,40,'Step back and forward','m')+T(460,58,'through every file edit','m'),
 'cache-tax':(A)=>`<circle class="box" cx="60" cy="80" r="34"/>`+L(60,80,60,58)+`<line class="ln" x1="60" y1="80" x2="76" y2="80">${an(A,'<animateTransform attributeName="transform" type="rotate" from="0 60 80" to="360 60 80" dur="6s" repeatCount="indefinite"/>')}</line>`
   +T(360,40,'Prompt cache TTL (1 hour)','m')+R(130,56,460,22,'box',11)+`<rect class="solid" x="130" y="56" width="460" height="22" rx="11">${an(A,'<animate attributeName="width" values="460;24;460" keyTimes="0;.92;1" dur="8s" repeatCount="indefinite"/>')}</rect>`
   +T(360,112,'A keep-alive ping before it runs out saves the cache write cost','m')+R(250,124,220,28,'hot')+T(360,143,'$ saved this session'),
 'filetree':(A)=>[['src/',0],['app.ts',1],['db.ts',1],['tests/',0],['app.test.ts',1]].map(([n,d],i)=>`<g>${R(16+d*20,12+i*30,220-d*20,26,i===1?'hot':'box',6)}${T(30+d*20,30+i*30,(d?'':'▾ ')+n,'l mono')}${i===1?an(A,`<animate attributeName="opacity" values="1;.4;1" dur="1.4s" repeatCount="indefinite"/>`):''}</g>`).join('')
   +R(280,36,170,28,'solid',14)+T(365,55,'Claude edits app.ts','w')+L(240,50,280,50,'acc')+T(540,100,'Live tree of what','m')+T(540,116,'Claude reads and edits','m'),
 'skins':(A)=>['Read','Bash','Edit'].map((t,i)=>`<g>${R(16,16+i*46,300,36,'box')}<rect class="solid" x="16" y="${16+i*46}" width="6" height="36" rx="3">${an(A,`<animate attributeName="opacity" values="1;.3;1" dur="3s" begin="${i*.4}s" repeatCount="indefinite"/>`)}</rect>${T(40,39+i*46,t+' tool row','l')}</g>`).join('')
   +AR(330,80,372)+R(376,26,246,108,'hot')+T(499,54,'Tool rows restyled')+T(499,72,'with a new skin','b')+T(499,100,'changes every few seconds','m'),
 'savvy-progress':(A)=>R(16,10,608,150,'box')+R(40,28,560,26,'box',13)+`<rect class="solid" x="40" y="28" width="560" height="26" rx="13">${an(A,'<animate attributeName="width" values="30;560" dur="6s" repeatCount="indefinite"/>')}</rect>`
   +T(320,46,'step 3 / 5','w')+R(40,100,560,36,'box')+T(56,123,'> your prompt','l m')+T(320,86,'progress band above the prompt','m'),
 'reflect-mod':(A)=>R(16,40,170,50,'box')+T(101,62,'“no, use pnpm”')+T(101,78,'your correction','m')+AR(190,65,232)+`<circle class="hot" cx="262" cy="65" r="28">${pulse(A)}</circle>`+T(262,69,'check')
   +AR(294,65,336)+R(340,36,284,58,'hot')+T(482,58,'Lesson saved','b')+T(482,76,'use pnpm in this repo','m')+dot(A,'M186,65 L340,65','4s')+T(320,130,'a model reviews each session and keeps the lessons','m'),
 'caveman':(A)=>R(16,18,260,100,'box')+[34,50,66,82,98].map(y=>L(32,y+4,250-(y%3)*14,y+4)).join('')+T(146,134,'verbose reply','m')+AR(282,68,334)
   +`<g>${R(340,44,200,48,'hot')+L(356,62,470,62)+L(356,76,430,76)+T(440,112,'terse reply','m')+fade(A,'.35;1;1;.35','0;.3;.8;1','4s')}</g>`+R(552,50,72,36,'solid',18)+T(588,73,'-65%','w'),
 'ponytail':(A)=>R(16,14,260,142,'box')+[0,1,2,3,4,5,6,7].map(i=>`<g>${L(32,32+i*15,250-(i%3)*30,32+i*15)}${i>1?fade(A,'1;1;0;1','0;.3;.5;1','5s',i*.15+'s'):''}</g>`).join('')
   +T(146,170,'lots of code','m')+AR(282,85,334)+R(340,50,280,70,'hot')+L(356,72,560,72)+L(356,92,500,92)+T(480,140,'the least code that works','m'),
 'model-router':(A)=>`<circle class="box" cx="60" cy="85" r="30"/>`+T(60,89,'Claude')+AR(94,85,160)+`<path class="hot" d="M200,55 L240,85 L200,115 L160,85 z">${pulse(A)}</path>`+T(200,89,'route','b')
   +['kimi-k3','gpt','sonnet'].map((m,i)=>L(240,85,420,30+i*55)+R(424,14+i*55,150,34,'box')+T(499,36+i*55,m,'mono')).join('')+dot(A,'M240,85 L420,30','3s')+dot(A,'M240,85 L420,85','3s','1s')+dot(A,'M240,85 L420,140','3s','2s'),
 'hyperframes':(A)=>R(16,26,200,110,'box')+T(116,60,'<div class="title">','mono')+T(116,84,'  Hello','mono')+T(116,108,'</div>','mono')+AR(222,80,268)
   +[0,1,2,3].map(i=>`<g>${R(274+i*86,48,74,64,'box')}${an(A,`<rect class="hot" x="${274+i*86}" y="48" width="74" height="64" rx="8" opacity="0"><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.12;.3;1" dur="4s" begin="${i}s" repeatCount="indefinite"/></rect>`)}${T(311+i*86,86,'f'+(i+1),'m')}</g>`).join('')+T(450,134,'HTML in, video frames out','m'),
};
// generic live-UI mod: window with a pane pulsing
function uiMod(A,name){
  return R(16,10,608,150,'box')+R(16,10,608,24,'box')+`<circle class="dot" cx="32" cy="22" r="4"/><circle class="dot" cx="46" cy="22" r="4"/>`
    +R(24,42,130,110,'box')+R(162,42,454,70,'box')+`<rect class="hot" x="162" y="118" width="454" height="34" rx="8">${pulse(A)}</rect>`
    +T(389,140,cut(name,28)+' · live panel in the Claude interface','b')+T(89,100,'session','m')+T(389,82,'conversation','m');
}
function mod(A,name,info){
  const key=name.replace(/@.*/,'');
  if(MODS[key])return SVG(640,170,MODS[key](A),`${key} in action`);
  if(info&&info.modules&&info.modules.length)return SVG(640,170,uiMod(A,key),`${key} interface mod`);
  if(info&&info.skills&&info.skills.length)return skill(A,info.skills[0].name,info.skills[0].description);
  if(info&&info.commands&&info.commands.length)return cmd(A,info.commands[0].name,info.commands[0].description);
  return '';
}
// deterministic icon per feature name
function glyph(name,kind){
  let h=0;for(const c of name)h=(h*31+c.charCodeAt(0))>>>0;
  const k={skill:0,command:1,agent:2}[kind]||0, p=[h%5,(h>>3)%4,(h>>6)%3];
  const shapes=[`<circle cx="12" cy="12" r="6"/>`,`<rect x="6" y="6" width="12" height="12" rx="2"/>`,`<path d="M12 5 L19 18 H5 z"/>`,`<path d="M5 12 H19 M12 5 V19"/>`,`<path d="M6 17 A8 8 0 0 1 18 7"/>`];
  const ring=[`<circle cx="12" cy="12" r="10"/>`,`<rect x="2" y="2" width="20" height="20" rx="5"/>`,`<path d="M12 2 L22 12 L12 22 L2 12 z"/>`][k];
  const dots=p[1]>1?`<circle cx="${6+p[1]*4}" cy="${6+p[2]*5}" r="1.8" class="gf"/>`:'';
  return `<svg class="glyph" viewBox="0 0 24 24" aria-hidden="true"><g class="gs">${ring}${shapes[p[0]]}</g>${dots}</svg>`;
}
// all mods x lifecycle matrix; a scan line sweeps left to right
function flow(A,rows,selKey){
  const cols=['SessionStart','UserPromptSubmit','PreToolUse','PostToolUse','Stop','SubagentStart'], lab=['Start','Prompt','Pre-tool','Post-tool','Done','Subagent'];
  const x0=170,dx=78,rh=26,H=54+rows.length*rh;
  let s='';
  lab.forEach((l,i)=>{s+=T(x0+i*dx,26,l,'m')+L(x0+i*dx,34,x0+i*dx,H-8)});
  s+=T(x0+6*dx+8,26,'Skills','m')+T(x0+7*dx+8,26,'Cmds','m')+T(x0+8*dx+8,26,'UI','m');
  rows.forEach((r,i)=>{
    const y=50+i*rh, f=r.info||{}, sk=f.skills||[], cm=f.commands||[], ev=new Set((f.hooks||[]).map(h=>h.event)), c=r.on?'solid':'off';
    s+=`<g class="frow ${r.on?'on':''}" data-k="${esc(r.key)}" tabindex="0" role="button" aria-label="${esc(r.name)}">${R(6,y-12,x0+9*dx+30,rh-2,r.key===selKey?'hot':'box',6)}${T(16,y+4,cut(r.name,20),'l '+(r.on?'b':'m'))}`;
    cols.forEach((k,j)=>{if(ev.has(k))s+=`<circle class="${c}" cx="${x0+j*dx}" cy="${y}" r="6"/>`});
    if(sk.length)s+=`<circle class="${c}" cx="${x0+6*dx+8}" cy="${y}" r="8"/>`+T(x0+6*dx+8,y+3.5,sk.length>99?'99+':sk.length,'w s');
    if(cm.length)s+=`<circle class="${c}" cx="${x0+7*dx+8}" cy="${y}" r="8"/>`+T(x0+7*dx+8,y+3.5,cm.length,'w s');
    if((f.modules||[]).length)s+=`<rect class="${c}" x="${x0+8*dx+1}" y="${y-7}" width="14" height="14" rx="3"/>`;
    s+='</g>';
  });
  if(A)s+=`<rect class="scan" y="34" width="3" height="${H-42}" rx="1.5"><animate attributeName="x" values="${x0-20};${x0+5*dx+20};${x0-20}" dur="6s" repeatCount="indefinite"/></rect>`;
  return SVG(x0+9*dx+40,H,s,'Which mods act at which point of a session');
}
// ---- sub-features of interface mods (these have no skills/commands to list)
const cyc=(A,items,fn)=>items.map((t,i)=>{const n=items.length,k=[0,i/n,(i+.1)/n,(i+.9)/n,(i+1)/n,1].map((v,j,a)=>Math.max(v,j?a[j-1]:0));
  return `<g opacity="0">${fn(t,i)}<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="${k.join(';')}" dur="${n*1.6}s" repeatCount="indefinite"/></g>`}).join('');
const first=(A,items,fn)=>A?cyc(A,items,fn):fn(items[0],0);
const F=R(16,14,608,92,'box');
const stg=(A,i,n,inner,dur=6)=>`<g ${A?'opacity="0"':''}>${inner}${an(A,`<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${i/(n+1)};${(i+.3)/(n+1)};.92;1" dur="${dur}s" repeatCount="indefinite"/>`)}</g>`;
const FEAT={
 skins:[
  {n:'Transcript skin',d:'Recolours the whole conversation (text, borders, accents) from one palette. Ask for a mood, brand or wallpaper and the skin-designer skill builds the palette.',
   v:(A)=>R(16,14,608,92,'box')+L(36,40,420,40)+L(36,60,340,60)+L(36,80,380,80)+['var(--accent)','var(--warn)','var(--ink)'].map((c,i)=>`<rect x="${470+i*44}" y="34" width="34" height="34" rx="9" fill="${c}">${an(A,`<animate attributeName="opacity" values="1;.35;1" dur="3s" begin="${i}s" repeatCount="indefinite"/>`)}</rect>`).join('')+T(530,92,'palette swatches','m')},
  {n:'Spinner words',d:'Replaces the generic "Thinking…" word with your own list, one shown at a time while Claude works.',
   v:(A)=>R(16,14,608,92,'box')+first(A,['Thinking…','Brewing…','Plotting…','Conjuring…'],(t)=>`<text class="b" x="320" y="66" style="font-size:20px">✻ ${esc(t)}</text>`)+T(320,96,'spinner status word','m')},
  {n:'Footer words',d:'Changes the words in the status footer under the prompt.',
   v:(A)=>R(16,14,608,92,'box')+R(36,28,568,28,'hot')+first(A,['ready when you are','tools humming','almost there'],(t)=>T(320,47,t,'b'))+L(36,80,300,80)+T(320,98,'footer line','m')},
  {n:'Rail',d:'A coloured vertical line along the left of Claude\'s replies. Switch it on or off.',
   v:(A)=>R(16,14,608,92,'box')+`<rect class="solid" x="40" y="26" width="5" height="68" rx="2">${an(A,'<animate attributeName="opacity" values="1;0;1" dur="3s" repeatCount="indefinite"/>')}</rect>`+L(62,40,420,40)+L(62,60,360,60)+L(62,80,400,80)+T(530,64,'rail on / off','m')},
  {n:'Tables',d:'Restyles markdown tables: header colour, borders and row banding.',
   v:(A)=>R(16,14,608,92,'box')+`<rect class="hot" x="60" y="26" width="360" height="20" rx="4">${pulse(A)}</rect>`+[0,1,2].map(r=>L(60,56+r*16,420,56+r*16)).join('')+L(180,26,180,90)+L(300,26,300,90)+T(530,64,'table skin','m')},
  {n:'Shimmer',d:'A light sweep across Claude\'s live text while it is working. Switch it on or off.',
   v:(A)=>`<clipPath id="sh"><rect x="60" y="40" width="520" height="22" rx="11"/></clipPath>`+R(16,14,608,92,'box')+R(60,40,520,22,'box',11)+`<rect class="solid" x="-80" y="40" width="80" height="22" clip-path="url(#sh)" opacity=".6">${an(A,'<animate attributeName="x" values="40;580;40" dur="3.5s" repeatCount="indefinite"/>')}</rect>`+T(320,92,'shimmer sweep','m')},
 ],
 'blast-radius':[
  {n:'Holds risky commands',d:'Pauses rm -rf, git reset --hard, git clean, force push and migrations before they run.',
   v:(A)=>F+T(40,66,'$ git push --force','l mono')+R(300,50,62,22,'warn')+T(331,65,'HELD','w')+`<rect class="ring" x="296" y="46" width="70" height="30" rx="9">${an(A,'<animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite"/>')}</rect>`+T(500,66,'not run yet','m')},
  {n:'Shows what would change',d:'A pane lists the files and branches the command would hit.',
   v:(A)=>F+T(36,34,'Would delete:','l m')+['build/app.js','build/app.css','build/map.json'].map((t,i)=>stg(A,i,3,T(56,58+i*18,'− '+t,'l mono'))).join('')+T(500,66,'214 files','b')},
  {n:'Proceed or Cancel',d:'You decide. Nothing runs until you press Proceed.',
   v:(A)=>F+R(150,40,140,36,'box')+T(220,63,'Cancel')+R(340,40,140,36,'solid')+T(410,63,'Proceed','w')+`<rect class="ring" x="146" y="36" width="148" height="44" rx="11">${an(A,'<animate attributeName="x" values="146;336;146" dur="4s" repeatCount="indefinite"/>')}</rect>`+T(320,98,'you choose','m')}],
 'replay-theater':[
  {n:'Edit timeline',d:'Every file edit Claude made in the session, in order.',
   v:(A)=>F+L(60,56,580,56)+['app.ts','db.ts','ui.tsx','test.ts','docs.md'].map((t,i)=>`<circle class="${A?'off':'solid'}" cx="${80+i*110}" cy="56" r="7">${an(A,`<animate attributeName="fill" values="var(--off);var(--accent);var(--accent)" keyTimes="0;${(i+.4)/6};1" dur="6s" repeatCount="indefinite"/>`)}</circle>`+T(80+i*110,86,t,'m mono')).join('')},
  {n:'Scrub and step',d:'Move back and forward through the edits to see how a file changed.',
   v:(A)=>F+R(40,28,150,56,'hot')+T(115,52,'◀  step  ▶')+L(230,56,600,56)+`<circle class="solid" cx="230" cy="56" r="8">${an(A,'<animate attributeName="cx" values="230;600;230" dur="6s" repeatCount="indefinite"/>')}</circle>`+T(415,86,'drag the playhead','m')}],
 'cache-tax':[
  {n:'Cache timer',d:'Shows how long the prompt cache stays warm.',
   v:(A)=>F+T(320,38,'cache warm for','m')+R(60,50,520,22,'box',11)+`<rect class="solid" x="60" y="50" width="520" height="22" rx="11">${an(A,'<animate attributeName="width" values="520;24;520" keyTimes="0;.92;1" dur="8s" repeatCount="indefinite"/>')}</rect>`+T(320,98,'1 hour time-to-live','m')},
  {n:'Miss cost',d:'Shows what a cold cache costs you in tokens and money.',
   v:(A)=>F+R(120,70,60,20,'solid',4)+T(150,100,'warm  $0.01','m')+`<rect class="warn" x="420" y="${A?70:30}" width="60" height="${A?20:60}" rx="4">${an(A,'<animate attributeName="y" values="70;30;30;70" keyTimes="0;.4;.9;1" dur="4s" repeatCount="indefinite"/><animate attributeName="height" values="20;60;60;20" keyTimes="0;.4;.9;1" dur="4s" repeatCount="indefinite"/>')}</rect>`+T(450,100,'cold  $0.12','m')}],
 filetree:[
  {n:'Live file tree',d:'IDE-style tree beside the conversation.',
   v:(A)=>F+[['▾ src/',0],['app.ts',1],['db.ts',1],['▾ tests/',0],['app.test.ts',1]].map(([t,d],i)=>T(40+d*22,34+i*16,t,'l mono')).join('')+R(330,36,250,36,'hot')+T(455,59,'tree beside the chat','b')},
  {n:'Touch markers',d:'Marks the files Claude reads and edits as it works.',
   v:(A)=>F+[['app.ts','R'],['db.ts','E'],['ui.tsx','R']].map(([t,m],i)=>T(60,40+i*22,t,'l mono')+`<circle class="${m==='E'?'solid':'off'}" cx="200" cy="${36+i*22}" r="8">${m==='E'?an(A,'<animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite"/>'):''}</circle>`+T(200,40+i*22,m,'w s')).join('')+T(440,60,'R = read   E = edited','m')}],
 'savvy-progress':[
  {n:'Progress band',d:'A bar above the prompt that fills as a multi-step task advances.',
   v:(A)=>F+R(40,26,560,22,'box',11)+`<rect class="solid" x="40" y="26" width="560" height="22" rx="11">${an(A,'<animate attributeName="width" values="30;560" dur="6s" repeatCount="indefinite"/>')}</rect>`+R(40,62,560,30,'box')+T(56,82,'> your prompt','l m')},
  {n:'Step labels',d:'Shows the current step and total.',
   v:(A)=>F+['Plan','Edit','Test','Fix','Ship'].map((t,i)=>R(40+i*112,40,100,34,'box')+T(90+i*112,62,t)).join('')+`<rect class="hot" x="40" y="40" width="100" height="34" rx="8">${an(A,'<animate attributeName="x" values="40;152;264;376;488;40" keyTimes="0;.2;.4;.6;.8;1" calcMode="discrete" dur="6s" repeatCount="indefinite"/>')}</rect>`+T(320,98,'step n / 5','m')}],
 'reflect-mod':[
  {n:'Correction watch',d:'Notices when you correct Claude.',
   v:(A)=>F+R(40,34,200,40,'box')+T(140,59,'“no, use pnpm”')+AR(246,54,320)+`<circle class="hot" cx="360" cy="54" r="26">${pulse(A)}</circle>`+T(360,58,'spot','b')+T(500,58,'correction noticed','m')},
  {n:'Lessons',d:'Saves each correction as a lesson for later sessions.',
   v:(A)=>F+['use pnpm in this repo','run tests before commit','keep replies short'].map((t,i)=>stg(A,i,3,R(60,24+i*24,360,20,'hot',6)+T(76,38+i*24,t,'l'))).join('')+T(520,60,'saved','m')}],
};
const feats=(name)=>FEAT[name.replace(/@.*/,'')]||[];
function feat(A,name,i){
  const f=feats(name)[i];if(!f)return '';
  return f.v?SVG(640,120,f.v(A),f.n):mod(A,name,null);
}
window.VIZ={life,cmd,skill,agent,mod,glyph,flow,feats,feat};
})();
