// Sorvetada: Bomberman de sorveteria.
// Constantes fáceis de ajustar: W/H (tamanho do mapa), T (tamanho da casa), R (alcance da bomba).
// Outros valores: tempo da bomba (t:2000 em drop), vidas (lives:3 em mkP), passo do jogador (130/330 em update).
const PS=['assets/sprites/jogador-01.png','assets/sprites/jogador-02.png','assets/sprites/jogador-03.png','assets/sprites/jogador-04.png','assets/sprites/jogador-05.png','assets/sprites/jogador-06.png','assets/sprites/jogador-07.png','assets/sprites/jogador-08.png','assets/sprites/jogador-09.png','assets/sprites/jogador-10.png'],
  ES=['assets/sprites/vilao-gelo-vivo.png','assets/sprites/vilao-sorvete-derretido.png','assets/sprites/vilao-waffle-maligno.png','assets/sprites/vilao-picole-fantasma.png','assets/sprites/vilao-sorvete-guardiao.png','assets/sprites/vilao-chefao.png'];
const PN=['Baunilha','Chocolate','Morango','Menta','Chantilly','Uva','Limão','Cookies','Cereja','Arco-íris'];
const mk=a=>a.map(u=>{const i=new Image();i.src=u;return i});
const PI=mk(PS),EI=mk(ES);
const W=15,H=13,T=40,R=2,D=[[1,0],[-1,0],[0,1],[0,-1]];
const c=document.getElementById('c'),x=c.getContext('2d');
x.imageSmoothingEnabled=false;x.scale(1.3,1.3);
let g,P=[],bombs,flames,en,cry=[],shots=[],pud=[],items=[],it=3000,toasts=[],level=1,over=false,last=performance.now(),et=0,ct=4000,tick=0,mode=1,sel=[0,1],names=['Jogador 1','Jogador 2'],playing=false,res='',done=Array(20).fill(false);
const $=id=>document.getElementById(id);
const snd=window.SND||{sfx(){},music(){},get(){return{mv:.8,sv:.8,mo:true,so:true}},set(){}};
let bannerT=0,cfgOpen=false;
const LS='sorvetada-fases',LT='sorvetada-tema';
try{const s=JSON.parse(localStorage.getItem(LS));if(Array.isArray(s))s.slice(0,20).forEach((v,i)=>done[i]=!!v)}catch(e){}
const save=()=>{try{localStorage.setItem(LS,JSON.stringify(done))}catch(e){}};
const mq=matchMedia('(prefers-color-scheme: dark)');
const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t=='dark':mq.matches};
const mkP=(sx,sy,pl)=>({x:sx,y:sy,sx,sy,pl,lives:3,score:0,inv:0,fr:0,mt:0,out:false,pw:newPw(),px:sx,py:sy,last:'',buf:'',bt:0,k:{}});
function picker(row,i){
  PS.forEach((u,n)=>{const b=document.createElement('button');b.setAttribute('aria-label',PN[n]+', jogador '+(i+1));b.setAttribute('aria-pressed',n==sel[i]);b.innerHTML='<img alt="" src="'+u+'"><span>'+PN[n]+'</span>';
    b.onclick=()=>{sel[i]=n;if(P[i])P[i].pl=n;$('pv'+(i+1)).src=u;[...row.querySelectorAll('button')].forEach((o,k)=>o.setAttribute('aria-pressed',k==n))};row.appendChild(b)});
}
picker($('p1row'),0);picker($('p2row'),1);
$('pv1').src=PS[sel[0]];$('pv2').src=PS[sel[1]];
function howto(m){
  const it=(i,t)=>'<div class="it"><i>'+i+'</i><span>'+t+'</span></div>';
  const c=m==1?it('🎮','<b>Setas ou WASD</b>: andar')+it('🍒','<b>Espaço</b>: soltar a cereja-bomba')+it('💎','<b>Cristais</b>: dão pontos')
    :it('🎮','<b>J1</b>: WASD e Espaço')+it('🕹️','<b>J2</b>: setas e Enter')+it('🏆','Quem fizer <b>mais pontos</b> vence a fase');
  return '<div class="g">'+c+it('🧊','<b>Gelo Vivo</b>: atira gelo e congela')+it('🍨','<b>Sorvete Derretido</b>: deixa poças que atrasam')+it('🧇','<b>Waffle Maligno</b>: dá investidas')+it('👻','<b>Picolé Fantasma</b>: atravessa blocos')+it('🛡️','<b>Sorvete Guardião</b>: tem escudo')+it('👑','<b>Fases 5, 10, 15 e 20</b>: Chefões!')
   +'<div class="it wide"><i>✨</i><span><b>Itens especiais</b> duram pouco: ⚡ velocidade 10 s · 🔥 superbomba 15 s · 💣 bombas extras 15 s · ⭐ invencível 6 s (raro) · 💥 bomba estrela 12 s · 👟 chute de bomba 15 s'+(m==2?' · ⚠️ a bomba machuca todo mundo':'')+'</span></div></div>';
}
function setMode(m){
  mode=m;document.querySelectorAll('#mode button').forEach(o=>o.setAttribute('aria-pressed',+o.dataset.m===m));
  $('c2').hidden=m==1;
  $('help').innerHTML=howto(m);
}
document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>setMode(+b.dataset.m));
function startLevel(n){
  names=[$('n1').value.trim()||'Jogador 1',$('n2').value.trim()||'Jogador 2'];
  level=n;$('menu').hidden=true;$('game').hidden=false;$('theme').hidden=$('snd').hidden=true;$('ctl').style.display=mode==1?'flex':'none';
  playing=true;last=performance.now();restart();
}
function play(){showLevels()}
function tab(n){
  $('tab-partida').hidden=n!='partida';$('tab-fases').hidden=n!='fases';
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t==n));
  if(n=='fases')renderLevels();
}
function renderLevels(){
  const box=$('levels');box.innerHTML='';
  LV.forEach((L,i)=>{
    const open=i==0||done[i-1]||done[i],b=document.createElement('button');
    b.className='lv'+(done[i]?' done':'')+(open?'':' lock')+(i==done.indexOf(false)?' next':'');b.disabled=!open;
    const nx=i==done.indexOf(false);b.innerHTML=(L.boss?'<em class="crown">👑</em>':'')+(nx?'<em class="star">⭐</em>':'')+(open?'':'<em class="lock">🔒</em>')+'<b>'+(i+1)+'</b><span>'+L.n+'</span><small>'+(done[i]?'✔ Concluída':nx?'▶ Jogar':open?'Jogar':'Bloqueada')+'</small>';
    b.onclick=()=>startLevel(i+1);box.appendChild(b);
  });
}
function showMenu(){snd.music('menu');scene(false);playing=false;over=false;$('game').hidden=true;$('menu').hidden=false;$('theme').hidden=$('snd').hidden=false;tab('partida')}
function showLevels(){snd.music('menu');scene(false);playing=false;over=false;$('game').hidden=true;$('menu').hidden=false;$('theme').hidden=$('snd').hidden=false;tab('fases')}
function leave(){if(!over&&!confirm('Voltar ao menu? A fase atual será perdida.'))return;showMenu()}
$('play').onclick=play;$('back').onclick=leave;
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
$('resetp').onclick=()=>{if(confirm('Apagar o progresso das fases?')){done.fill(false);save();renderLevels()}};
function applyTheme(t){
  if(t)document.documentElement.dataset.theme=t;
  $('theme').textContent=isDark()?'☀️ Modo claro':'🌙 Modo escuro';
}
$('theme').onclick=()=>{
  const t=isDark()?'light':'dark';applyTheme(t);
  try{localStorage.setItem(LT,t)}catch(e){}
};
try{applyTheme(localStorage.getItem(LT))}catch(e){applyTheme()}
// Paletas do chão (uma por fase), formatos de mapa e as 20 fases.
// Tipos de vilão: 0 Gelo Vivo, 1 Derretido, 2 Waffle, 3 Picolé, 4 Guardião. Fases 5, 10, 15 e 20 têm chefão.
const FL=[['#fff0f6','#ffe2ee'],['#effff6','#d9f7e6'],['#f4efff','#e5dcff'],['#fff4e6','#ffe3c4'],['#f0e6ff','#dccdf5'],
['#eef7ff','#d8ecff'],['#fffde8','#fff5b8'],['#fff0f0','#ffdede'],['#f0fffd','#d3f6f2'],['#ecdcff','#d4bdf0'],
['#f7fff0','#e6f5d3'],['#fff6f0','#ffe4d4'],['#f0f4ff','#d9e2ff'],['#fffaf0','#fdeccb'],['#f3e1ff','#e0c4f5'],
['#f0fff8','#d6f5e8'],['#fff0fa','#fbd7ee'],['#f2f0ff','#dedaff'],['#fdf0ff','#f5d9ff'],['#e6d3ff','#c9aaf0']];
// Formatos de mapa: cada função diz se a célula (i,j) é parede fixa. As bordas são sempre parede.
const ring=(i,j,x0,y0,x1,y1)=>((i==x0||i==x1)&&j>=y0&&j<=y1)||((j==y0||j==y1)&&i>=x0&&i<=x1);
const rect=(i,j,x,y,w,h)=>i>=x&&i<x+w&&j>=y&&j<y+h;
const dist=(i,j,a,b)=>Math.abs(i-a)+Math.abs(j-b);
const MP={
  classic:(i,j)=>i%2==0&&j%2==0,
  xadrez:(i,j)=>i%2==0&&j%2==0&&((i+j)/2)%2==0,
  faixas:(i,j)=>(j==3&&i%5!=1)||(j==6&&i%5!=3)||(j==9&&i%5!=1),
  blocos:(i,j)=>(i%4==2||i%4==3)&&(j%4==2||j%4==3),
  bordas:(i,j)=>(((j==2||j==10)&&i%2==0)||((i==2||i==12)&&j%2==0))&&i>=2&&i<=12&&j>=2&&j<=10,
  maze:(i,j)=>i%2==0&&j%2==0,
  diagonal:(i,j)=>(i+j)%6==0&&i%2==0,
  forte:(i,j)=>{
    if((i==7&&(j==3||j==9))||(j==6&&(i==4||i==10)))return false;
    if(ring(i,j,4,3,10,9))return true;
    return (i==6||i==8)&&(j==5||j==7)||((i==2||i==12)&&(j==2||j==10));
  },
  sparse:(i,j)=>i%4==0&&j%4==0,
  labirinto:(i,j)=>{
    if(Math.abs(i-7)<=2&&Math.abs(j-6)<=2)return false;
    return (i%2==0&&j%2==0)||(j==2&&i>=4&&i<=6)||(j==2&&i>=8&&i<=10)||(j==10&&i>=4&&i<=6)||(j==10&&i>=8&&i<=10)||((i==3||i==11)&&(j==3||j==9));
  },
  serpente:(i,j)=>(j==2&&i<=12)||(j==4&&i>=2)||(j==6&&i<=12)||(j==8&&i>=2)||(j==10&&i<=12),
  salas:(i,j)=>(i==7&&j!=3&&j!=9)||(j==6&&i!=3&&i!=11),
  aneis:(i,j)=>(ring(i,j,2,2,12,10)&&!(j==2&&i==7)&&!(j==10&&i==7))||(ring(i,j,4,4,10,8)&&!(i==4&&j==6)&&!(i==10&&j==6)),
  colunas:(i,j)=>(i==3&&j>=2&&j<=10)||(i==6&&j<=9)||(i==9&&j>=3)||(i==12&&j<=9),
  cruz:(i,j)=>rect(i,j,2,2,3,2)||rect(i,j,10,2,3,2)||rect(i,j,2,9,3,2)||rect(i,j,10,9,3,2),
  diamante:(i,j)=>dist(i,j,7,6)==4&&i!=7&&j!=6,
  ilhas:(i,j)=>rect(i,j,3,3,2,2)||rect(i,j,6,2,3,1)||rect(i,j,10,3,2,2)||rect(i,j,1,6,2,1)||rect(i,j,5,6,1,3)||rect(i,j,8,5,2,2)||rect(i,j,12,7,1,3)||rect(i,j,7,9,3,1)||rect(i,j,2,9,2,2),
  h:(i,j)=>((i==4||i==10)&&j>=3&&j<=9)||(j==6&&i>=4&&i<=10)||(i==7&&(j==2||j==10)),
  granmaze:(i,j)=>i%2==0&&j%2==0,
  aneis20:(i,j)=>(ring(i,j,2,2,12,10)&&!(j==2&&i==7)&&!(j==10&&i==7)&&!(i==2&&j==6)&&!(i==12&&j==6))||(ring(i,j,4,4,10,8)&&!(j==4&&(i==5||i==9))&&!(j==8&&(i==5||i==9)))
};

const LV=[
  {n:'Primeira bola',m:'classic',cr:.45,en:[1,1]},
  {n:'Gelo na barriga',m:'xadrez',cr:.5,en:[0,0,1]},
  {n:'Waffle veloz',m:'faixas',cr:.5,en:[2,2,1]},
  {n:'Assombração',m:'blocos',cr:.5,en:[3,3,3]},
  {n:'Mini-Chefão',m:'bordas',cr:.5,cz:[3,2],boss:{hp:3,bs:2,sm:0,sk:[0]},en:[4,4]},
  {n:'Labirinto',m:'maze',cr:.5,rw:.12,en:[0,2,3,1]},
  {n:'Tempestade',m:'diagonal',cr:.6,en:[0,0,2,2,3]},
  {n:'Fortaleza',m:'forte',cr:.55,en:[4,4,4,3,3]},
  {n:'Mistura',m:'sparse',cr:.6,rw:.1,en:[0,1,2,3,4,2]},
  {n:'Rei Sorvete',m:'labirinto',cr:.5,cz:[2,2],boss:{hp:5,bs:1,sm:5,sk:[0,1,2]},en:[1,4]},
  {n:'Serpente',m:'serpente',cr:.3,en:[0,1,2,3]},
  {n:'Quatro salas',m:'salas',cr:.5,en:[1,2,3,4]},
  {n:'Anéis',m:'aneis',cr:.5,en:[0,2,3,4,1]},
  {n:'Colunas',m:'colunas',cr:.55,en:[0,0,2,2,3,4]},
  {n:'Rainha Chantilly',m:'cruz',cr:.5,cz:[2,2],boss:{hp:5,bs:2,sm:6,sk:[0,1,2,4]},en:[2,3]},
  {n:'Diamante',m:'diamante',cr:.5,en:[0,1,2,3,4,2]},
  {n:'Ilhas',m:'ilhas',cr:.5,rw:.08,en:[1,2,3,4,0,2]},
  {n:'Letra H',m:'h',cr:.55,en:[0,1,2,3,4,3,2]},
  {n:'Grande Labirinto',m:'granmaze',cr:.5,rw:.26,en:[0,1,2,3,4,3,2,1]},
  {n:'Imperador Sorvete',m:'aneis20',cr:.3,cz:[1,1],boss:{hp:8,bs:1,sm:4,sk:[0,1,2,3,4],cap:10},en:[4,4,3]}
];
// Cores das paredes: biscoito, chocolate, menta, mirtilo, morango. Chefões: roxo escuro.
const WT=[['#b9772f','#f0c27a','#d99a4e','#ffc2dc'],['#6b3f2a','#b07a55','#8a5238','#ffc2dc'],['#2f8f6b','#8fe3c0','#5fc79d','#fff1a8'],['#3d5fb0','#9db8f2','#6f8fd8','#ffc2dc'],['#c23a66','#ff9bb8','#e0678c','#ffffff']];
const WB=['#3d2250','#7a52a3','#5e3a83','#ff9ed0'];
const HU=[330,200,150,270,0,40,170,210,300,20,190,260,120,50,0,230,150,280,340,0];
function scene(on){
  const r=document.documentElement,f=$('frame');
  if(!on){r.style.removeProperty('--sky');r.style.removeProperty('--veil');f.classList.remove('boss');return}
  const L=LV[level-1],d=isDark(),h=HU[level-1],vl=c=>'linear-gradient('+c+','+c+')';
  if(L.boss){
    r.style.setProperty('--sky','linear-gradient(#12062a,#2a0f4a 40%,#43165f 75%,#3a1050)');
    r.style.setProperty('--veil',vl('rgba(24,6,50,.8)'));
  }else{
    r.style.setProperty('--sky',d?'linear-gradient(hsl('+h+',45%,14%),hsl('+(h+25)+',40%,22%) 45%,hsl('+(h+45)+',38%,27%))'
      :'linear-gradient(hsl('+h+',90%,88%) 0,hsl('+(h+20)+',85%,90%) 30%,hsl('+(h+40)+',85%,84%) 100%)');
    r.style.setProperty('--veil',vl(d?'hsla('+h+',55%,20%,.72)':'hsla('+h+',85%,60%,.32)'));
  }
  f.classList.toggle('boss',!!L.boss);
}
function connected(){
  const s=[[1,1]],seen={'1,1':1};let n=0,tot=0;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(g[j][i]!=1)tot++;
  while(s.length){const a=s.pop();n++;for(const d of D){const i=a[0]+d[0],j=a[1]+d[1];if(g[j][i]!=1&&!seen[i+','+j]){seen[i+','+j]=1;s.push([i,j])}}}
  return n==tot;
}
function build(cfg){
  const fn=MP[cfg.m]||MP.classic,cz=cfg.cz;
  for(let t=0;t<80;t++){
    const rw=t<60?(cfg.rw||0):0;
    g=[];
    for(let j=0;j<H;j++){g[j]=[];for(let i=0;i<W;i++){
      let v=0;
      if(i==0||j==0||i==W-1||j==H-1||fn(i,j))v=1;
      else if(rw&&(i+j)%2==1&&Math.random()<rw&&i+j>5&&(W-2-i)+(H-2-j)>5)v=1;
      else if(Math.random()<cfg.cr&&i+j>4&&(W-2-i)+(H-2-j)>(mode==2?4:0)&&!(cz&&Math.abs(i-7)<=cz[0]&&Math.abs(j-6)<=cz[1]))v=2;
      g[j][i]=v;
    }}
    if(connected())return;
  }
}
function init(){
  const cfg=LV[level-1];
  build(cfg);
  P.forEach(q=>{q.x=q.sx;q.y=q.sy;q.fr=0;q.inv=1000;q.lives=3;q.score=0;q.out=false;q.mt=0;q.px=q.x;q.py=q.y;q.bt=0;q.pw=newPw()});
  bombs=[];flames=[];en=[];shots=[];pud=[];cry=[];items=[];it=3000;toasts=[];over=false;res='';
  if(cfg.boss){const B=cfg.boss,bx=7,by=6;g[by][bx]=0;en.push({x:bx,y:by,d:D[1],k:5,boss:1,hp:B.hp,mhp:B.hp,bs:B.bs,sm:B.sm,sk:B.sk,cap:B.cap||9,cd:0,px:bx,py:by})}
  const ks=[...cfg.en];if(mode==2)ks.push(Math.random()*5|0);
  ks.forEach(k=>{
    for(let t=0;t<400;t++){
      const i=1+Math.random()*(W-2)|0,j=1+Math.random()*(H-2)|0;
      if(g[j][i]==0&&i+j>10&&(W-2-i)+(H-2-j)>(mode==2?8:0)&&!en.some(e=>e.x==i&&e.y==j)){en.push({x:i,y:j,d:D[0],k,hp:k==4?2:1,cd:0,sh:3,px:i,py:j});break}
    }
  });
}
const free=(i,j)=>g[j][i]==0&&!bombs.some(b=>b.x==i&&b.y==j);
// Itens especiais (duram 25 s): chave, ícone, nome, cor
const PW=[['spd','⚡','Velocidade','#ffd23f'],['rng','🔥','Superbomba','#ff7a5c'],['ext','💣','Bombas extras','#8fd3ff'],['inv','⭐','Invencível','#c7a6ff'],['spc','💥','Bomba estrela','#ff7fc8'],['kick','👟','Chute de bomba','#7be0b5']];
const PWT={spd:10000,rng:15000,ext:15000,inv:6000,spc:12000,kick:15000};
const rndPw=()=>{if(Math.random()<.1)return 3;const a=[0,1,2,4,5];return a[Math.random()*a.length|0]};
const newPw=()=>({spd:0,rng:0,ext:0,inv:0,spc:0,kick:0});
const D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function toast(q,p){toasts.push({x:q.x,y:q.y,s:p[1]+' '+p[2],t:1400})}
function spawnItem(){
  if(items.length>=3)return;
  for(let n=0;n<40;n++){
    const i=1+Math.random()*(W-2)|0,j=1+Math.random()*(H-2)|0;
    if(g[j][i]==0&&!bombs.some(b=>b.x==i&&b.y==j)&&!items.some(o=>o.x==i&&o.y==j)&&!cry.some(o=>o.x==i&&o.y==j)&&!P.some(q=>q.x==i&&q.y==j)){
      items.push({x:i,y:j,k:rndPw()});return;
    }
  }
}
const DV={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
const ap=(a,b,s)=>Math.abs(b-a)<=s?b:a+Math.sign(b-a)*s;
function press(q,d,on){if(on){q.k[d]=1;q.last=d;q.buf=d;q.bt=150}else q.k[d]=0}
function dirOf(q){
  const h=['u','d','l','r'].filter(k=>q.k[k]);
  if(h.length)return h.includes(q.last)?q.last:h[0];
  return q.bt>0?q.buf:null;
}
const ok=(e,i,j)=>e.k==3?g[j][i]!=1:free(i,j);
function grab(q){
  const n=cry.findIndex(o=>o.x==q.x&&o.y==q.y);
  if(n>=0){cry.splice(n,1);q.score+=50;snd.sfx('crystal')}
  const m=items.findIndex(o=>o.x==q.x&&o.y==q.y);
  if(m>=0){const o=items.splice(m,1)[0],p=PW[o.k];q.pw[p[0]]=PWT[p[0]];toast(q,p);snd.sfx('power')}
}
function drop(q){
  if(over||!q||q.out)return;
  if(bombs.filter(b=>b.o===q).length<2+(q.pw.ext>0?2:0)&&!bombs.some(b=>b.x==q.x&&b.y==q.y)){snd.sfx('drop');bombs.push({x:q.x,y:q.y,t:2000,o:q,r:R+(q.pw.rng>0?2:0),sp:q.pw.spc>0})}
}
function boom(b){
  bombs.splice(bombs.indexOf(b),1);snd.sfx('boom');
  flames.push({x:b.x,y:b.y,t:450,o:b.o});
  for(const d of (b.sp?D8:D)){
    for(let k=1;k<=(b.r||R);k++){
      const i=b.x+d[0]*k,j=b.y+d[1]*k;
      if(g[j][i]==1)break;
      flames.push({x:i,y:j,t:450,o:b.o});
      if(g[j][i]==2){g[j][i]=0;b.o.score+=10;if(Math.random()<.4)cry.push({x:i,y:j});else if(Math.random()<.2)items.push({x:i,y:j,k:rndPw()});break}
      bombs.forEach(o=>{if(o.x==i&&o.y==j)o.t=0});
    }
  }
}
function hurt(q){
  if(q.inv>0||q.out||q.pw.inv>0)return;
  snd.sfx('hurt');
  q.lives--;q.inv=1600;q.x=q.sx;q.y=q.sy;q.px=q.x;q.py=q.y;
  if(q.lives<=0){q.out=true;if(P.every(a=>a.out))lose()}
}
function win(){snd.music(null);snd.sfx('win');over=true;res='won';done[level-1]=true;save()}
function lose(){snd.music(null);snd.sfx('lose');over=true;res='lost'}
function los(e){
  for(const q of P){
    if(q.out)continue;
    const dx=Math.sign(q.x-e.x),dy=Math.sign(q.y-e.y);
    if((dx&&dy)||(!dx&&!dy))continue;
    const n=Math.abs(q.x-e.x)+Math.abs(q.y-e.y);
    if(n>6)continue;
    let b=0;for(let k=1;k<n;k++)if(g[e.y+dy*k][e.x+dx*k]!=0){b=1;break}
    if(!b)return [dx,dy];
  }
  return null;
}
function abil(e){
  const v=los(e);
  if(e.k==0){e.sh--;if(v&&e.sh<=0){shots.push({x:e.x,y:e.y,dx:v[0],dy:v[1]});e.sh=5;snd.sfx('shoot')}}
  if(e.k==1&&!pud.some(o=>o.x==e.x&&o.y==e.y))pud.push({x:e.x,y:e.y,t:7000});
  if(e.k==2&&v){e.d=v;for(let k=0;k<3;k++){const nx=e.x+v[0],ny=e.y+v[1];if(!free(nx,ny))break;e.x=nx;e.y=ny}return 1}
  if(e.boss&&e.sm&&tick%e.sm==0&&en.length<e.cap){
    const o=D.map(d=>[e.x+d[0],e.y+d[1]]).filter(a=>free(a[0],a[1]));
    if(o.length){const k=e.sk[Math.random()*e.sk.length|0];en.push({x:o[0][0],y:o[0][1],d:D[0],k,hp:k==4?2:1,cd:0,sh:3});snd.sfx('summon')}
  }
}
function update(dt){
  et-=dt;ct-=dt;
  P.forEach(q=>{const s=dt*(q.pw.spd>0?.02:.016);q.px=ap(q.px,q.x,s);q.py=ap(q.py,q.y,s);for(const k in q.pw)q.pw[k]=Math.max(0,q.pw[k]-dt)});
  en.forEach(e=>{e.px=ap(e.px??e.x,e.x,dt*.0075);e.py=ap(e.py??e.y,e.y,dt*.0075)});
  P.forEach(q=>{
    if(q.out)return;
    q.mt-=dt;q.inv-=dt;q.fr-=dt;
    q.bt-=dt;
    if(q.mt<=0&&q.fr<=0){
      const d=dirOf(q);
      if(!d)q.cur=null;
      else{
        let m=d;
        if(!free(q.x+DV[d][0],q.y+DV[d][1])&&q.cur&&q.cur!==d&&free(q.x+DV[q.cur][0],q.y+DV[q.cur][1]))m=q.cur;
        const dx=DV[m][0],dy=DV[m][1];
        if(free(q.x+dx,q.y+dy)){q.x+=dx;q.y+=dy;q.cur=m;grab(q);q.bt=0;q.mt=(pud.some(o=>o.x==q.x&&o.y==q.y)?260:100)*(q.pw.spd>0?.8:1)}
        else{q.cur=null;if(q.pw.kick>0){const bb=bombs.find(b=>b.x==q.x+dx&&b.y==q.y+dy&&!b.kd);if(bb){bb.kd=[dx,dy];bb.km=0;snd.sfx('kick')}}}
      }
    }
  });
  if(ct<=0){
    ct=5000;
    for(let n=0;n<20&&cry.length<5;n++){
      const i=1+Math.random()*(W-2)|0,j=1+Math.random()*(H-2)|0;
      if(g[j][i]==0&&!cry.some(o=>o.x==i&&o.y==j)){cry.push({x:i,y:j});break}
    }
  }
  pud.forEach(o=>o.t-=dt);pud=pud.filter(o=>o.t>0);
  shots.forEach(s=>{s.x+=s.dx*dt*.008;s.y+=s.dy*dt*.008});
  shots=shots.filter(s=>{
    const i=Math.round(s.x),j=Math.round(s.y);
    if(!g[j]||g[j][i]!==0)return false;
    const q=P.find(q=>!q.out&&q.x==i&&q.y==j);
    if(q){if(q.inv<=0&&q.pw.inv<=0){q.fr=1600;snd.sfx('freeze')}return false}
    return true;
  });
  bombs.forEach(b=>b.t-=dt);
  bombs.forEach(b=>{
    if(!b.kd)return;
    b.km-=dt;
    if(b.km<=0){
      const nx=b.x+b.kd[0],ny=b.y+b.kd[1];
      if(g[ny][nx]==0&&!bombs.some(o=>o!==b&&o.x==nx&&o.y==ny)&&!P.some(q=>!q.out&&q.x==nx&&q.y==ny)){b.x=nx;b.y=ny;b.km=70}
      else b.kd=null;
    }
  });
  it-=dt;if(it<=0){it=7000;spawnItem()}
  toasts.forEach(o=>o.t-=dt);toasts=toasts.filter(o=>o.t>0);
  let z;while(z=bombs.find(b=>b.t<=0))boom(z);
  flames.forEach(f=>f.t-=dt);
  flames=flames.filter(f=>f.t>0);
  if(et<=0){
    et=380;tick++;
    en.forEach(e=>{
      if(e.boss&&tick%(e.bs||2))return;
      if(abil(e))return;
      let nx=e.x+e.d[0],ny=e.y+e.d[1];
      if(!ok(e,nx,ny)||Math.random()<.2){
        const o=D.filter(d=>ok(e,e.x+d[0],e.y+d[1]));
        if(!o.length)return;
        e.d=o[Math.random()*o.length|0];nx=e.x+e.d[0];ny=e.y+e.d[1];
      }
      if(ok(e,nx,ny)){e.x=nx;e.y=ny}
    });
  }
  en=en.filter(e=>{
    e.cd-=dt;
    const fl=flames.find(f=>f.x==e.x&&f.y==e.y);
    if(e.cd<=0&&fl){
      e.hp--;e.cd=700;snd.sfx(e.hp<=0?(e.boss?'bossdie':'kill'):'hit');
      if(e.hp<=0){fl.o.score+=e.boss?500:100;if(!cry.some(o=>o.x==e.x&&o.y==e.y))cry.push({x:e.x,y:e.y});return false}
    }
    return true;
  });
  P.forEach(q=>{
    if(q.out)return;
    const fl=flames.find(f=>f.x==q.x&&f.y==q.y);
    if(fl)hurt(q);
    else if(en.some(e=>e.x==q.x&&e.y==q.y))hurt(q);
  });
  if(!en.length&&!over)win();
}
function hud(){
  if(mode==1){$('h1').textContent=names[0]+': '+P[0].score+' pts';$('h2').textContent='Vidas: '+P[0].lives}
  else{$('h1').textContent=names[0]+': '+P[0].score+' pts, '+P[0].lives+' vidas';$('h2').textContent=names[1]+': '+P[1].score+' pts, '+P[1].lives+' vidas'}
  const pt=q=>PW.filter(p=>q.pw[p[0]]>0).map(p=>p[1]+' '+p[2]+' '+Math.ceil(q.pw[p[0]]/1000)+'s').join('  ·  ');
  const a=pt(P[0]),b=P[1]?pt(P[1]):'';
  $('pw').textContent=mode==1?(a||'Pegue os itens especiais pelo mapa!'):(a||b?names[0]+': '+(a||'-')+'   |   '+names[1]+': '+(b||'-'):'Pegue os itens especiais pelo mapa!');
  $('h3').textContent='Fase '+level+': '+LV[level-1].n;
}
function rr(a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function draw(t){
  const fl=FL[(level-1)%FL.length],dk=isDark(),wt=LV[level-1].boss?WB:WT[(level-1)%WT.length];
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const X=i*T,Y=j*T,v=g[j][i];
    x.fillStyle=(i+j)%2?fl[0]:fl[1];x.fillRect(X,Y,T,T);if(dk){x.fillStyle='rgba(50,20,60,.68)';x.fillRect(X,Y,T,T)}
    const hs=(i*7+j*13)%5;
    if(hs<2){x.fillStyle=hs?'#a8d8ff':'#ffb3d1';x.save();x.translate(X+8+(i*11+j*5)%22,Y+8+(i*5+j*9)%22);x.rotate(hs?.8:-.6);x.fillRect(-4,-1.5,8,3);x.restore()}
    if(v==1){
      rr(X+1,Y+1,T-2,T-2,6);x.fillStyle=wt[0];x.fill();
      rr(X+3,Y+3,T-6,T-6,5);x.fillStyle=wt[1];x.fill();
      x.fillStyle=wt[2];for(const o of [13,24]){x.fillRect(X+o,Y+5,2,T-10);x.fillRect(X+5,Y+o,T-10,2)}
      x.fillStyle=wt[3];x.fillRect(X+3,Y+3,T-6,9);for(let a=0;a<4;a++){x.beginPath();x.arc(X+9+a*8,Y+12,4,0,Math.PI);x.fill()}
      x.fillStyle='#fff';x.fillRect(X+9,Y+6,5,2);x.fillStyle='#58d68d';x.fillRect(X+23,Y+7,2,4);
    }
    if(v==2){
      rr(X+2,Y+2,T-4,T-4,8);const gd=x.createLinearGradient(X,Y,X,Y+T);gd.addColorStop(0,'#e6f4ff');gd.addColorStop(1,'#9fcdf5');x.fillStyle=gd;x.fill();
      x.strokeStyle='#6aa6e0';x.lineWidth=2;x.stroke();
      x.fillStyle='rgba(255,255,255,.85)';rr(X+6,Y+6,14,5,2);x.fill();
      x.fillStyle='#ff7fae';x.fillRect(X+22,Y+12,6,3);x.fillStyle='#ffd45e';x.fillRect(X+10,Y+25,6,3);x.fillStyle='#5fd9a8';x.fillRect(X+27,Y+25,3,6);
    }
  }
  cry.forEach(o=>{
    const X=o.x*T+20,Y=o.y*T+22+Math.sin(t/200+o.x)*2;
    x.fillStyle='rgba(95,224,255,.28)';x.beginPath();x.arc(X,Y,16,0,7);x.fill();
    x.beginPath();x.moveTo(X,Y-14);x.lineTo(X+10,Y-2);x.lineTo(X,Y+14);x.lineTo(X-10,Y-2);x.closePath();
    x.fillStyle='#5fe0ff';x.fill();x.strokeStyle='#1f8fc9';x.lineWidth=2;x.stroke();
    x.fillStyle='#ffffff';x.beginPath();x.moveTo(X,Y-14);x.lineTo(X-10,Y-2);x.lineTo(X,Y-2);x.closePath();x.fill();
  });
  items.forEach(o=>{
    const p=PW[o.k],X=o.x*T+20,Y=o.y*T+20+Math.sin(t/220+o.x)*2;
    x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.arc(X,Y,18+Math.sin(t/150)*1.5,0,7);x.fill();
    x.fillStyle=p[3];x.beginPath();x.arc(X,Y,14,0,7);x.fill();
    x.strokeStyle='#fff';x.lineWidth=3;x.stroke();
    x.font='16px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#000';x.fillText(p[1],X,Y+1);
    x.textBaseline='alphabetic';
  });
  bombs.forEach(b=>{
    const X=b.x*T,Y=b.y*T,r=12+Math.sin(t/90)*1.5;
    x.fillStyle='#7a1030';x.beginPath();x.arc(X+20,Y+24,r+2,0,7);x.fill();
    x.fillStyle='rgba(107,45,74,.18)';x.beginPath();x.ellipse(X+20,Y+36,12,4,0,0,7);x.fill();
    const gb=x.createRadialGradient(X+15,Y+19,2,X+20,Y+24,r);gb.addColorStop(0,b.sp?'#d9b3ff':'#ff8a9a');gb.addColorStop(1,b.sp?'#7b3fd1':'#d81e4a');x.fillStyle=gb;x.beginPath();x.arc(X+20,Y+24,r,0,7);x.fill();
    x.fillStyle='#4f8a3c';x.beginPath();x.ellipse(X+26,Y+9,5,2.5,-.5,0,7);x.fill();
    x.fillStyle='#ff9bb4';x.fillRect(X+13,Y+17,5,5);
    x.strokeStyle='#4f8a3c';x.lineWidth=3;x.beginPath();x.moveTo(X+20,Y+12);x.quadraticCurveTo(X+22,Y+5,X+29,Y+4);x.stroke();
    if((t/150|0)%2){x.fillStyle='#fff3a0';x.fillRect(X+28,Y+1,6,6)}
  });
  pud.forEach(o=>{x.fillStyle='rgba(214,51,108,.4)';x.beginPath();x.ellipse(o.x*T+20,o.y*T+26,16,9,0,0,7);x.fill()});
  shots.forEach(s=>{x.fillStyle='#d9f3ff';x.strokeStyle='#5fb0e8';x.lineWidth=3;x.save();x.translate(s.x*T+20,s.y*T+20);x.rotate(Math.PI/4);x.fillRect(-7,-7,14,14);x.strokeRect(-7,-7,14,14);x.restore()});
  flames.forEach(f=>{
    const X=f.x*T,Y=f.y*T;
    const gf=x.createRadialGradient(X+20,Y+20,2,X+20,Y+20,22);gf.addColorStop(0,'#fff');gf.addColorStop(.4,'#ffd23f');gf.addColorStop(1,'#ff4f81');x.fillStyle=gf;rr(X+2,Y+2,T-4,T-4,12);x.fill();
    
    
  });
  en.forEach(e=>{
    const bob=Math.sin(t/160+e.x)*2;
    if(e.cd>0&&((t/80)|0)%2)return;
    x.fillStyle='rgba(107,45,74,.18)';x.beginPath();x.ellipse(e.px*T+20,e.py*T+35,13,5,0,0,7);x.fill();x.globalAlpha=e.k==3?.7:1;x.drawImage(EI[e.k],e.px*T-(e.boss?4:0),e.py*T-(e.boss?8:4)+bob,e.boss?48:40,e.boss?48:40);x.globalAlpha=1;
    if(e.hp>1&&!e.boss){x.strokeStyle='rgba(143,211,255,.9)';x.lineWidth=3;x.beginPath();x.arc(e.px*T+20,e.py*T+20,19,0,7);x.stroke()}
    if(e.boss){const m=e.mhp||e.hp,sx=e.px*T+20-m*4;for(let k=0;k<m;k++){x.fillStyle=k<e.hp?'#ff4f81':'rgba(60,20,80,.45)';x.fillRect(sx+k*8,e.py*T-12,6,5)}}
  });
  P.forEach((q,i)=>{
    if(q.out)return;
    if(q.inv>0&&((t/100)|0)%2)return;
    if(mode==2){x.strokeStyle=i?'#2aa7d8':'#ff4f81';x.lineWidth=3;x.beginPath();x.ellipse(q.px*T+20,q.py*T+35,15,6,0,0,7);x.stroke()}
    x.fillStyle='rgba(107,45,74,.18)';x.beginPath();x.ellipse(q.px*T+20,q.py*T+35,13,5,0,0,7);x.fill();
    if(q.pw.inv>0&&(q.pw.inv>3000||((t/120)|0)%2)){x.strokeStyle='#ffd23f';x.lineWidth=3;x.beginPath();x.arc(q.px*T+20,q.py*T+20,21,0,7);x.stroke()}
    x.drawImage(PI[q.pl],q.px*T,q.py*T-5,40,40);
    if(q.fr>0){x.fillStyle='rgba(143,211,255,.6)';x.fillRect(q.px*T+4,q.py*T-3,32,36)}
  });
  toasts.forEach(o=>{
    x.globalAlpha=Math.min(1,o.t/400);x.font='600 16px Fredoka,"Trebuchet MS",sans-serif';x.textAlign='center';
    const X=o.x*T+20,Y=o.y*T-6-(1400-o.t)/35;
    x.strokeStyle='#6b2d4a';x.lineWidth=4;x.strokeText(o.s,X,Y);x.fillStyle='#fff';x.fillText(o.s,X,Y);x.globalAlpha=1;
  });
  if(bannerT>0&&!over){
    x.globalAlpha=Math.max(0,Math.min(1,bannerT/500,(2800-bannerT)/250+.15));
    rr(60,205,480,100,22);x.fillStyle='rgba(40,10,70,.93)';x.fill();x.strokeStyle='#c98bff';x.lineWidth=4;x.stroke();
    x.fillStyle='#ffe6ff';x.textAlign='center';x.font='600 34px Fredoka,"Trebuchet MS",sans-serif';x.fillText('⚠️ Fase do Chefão! ⚠️',300,258);
    x.font='20px Fredoka,"Trebuchet MS",sans-serif';x.fillText(LV[level-1].n,300,290);x.globalAlpha=1;
  }
  if(over){
    x.fillStyle='rgba(107,45,74,.86)';x.fillRect(0,0,c.width,c.height);
    x.fillStyle='#fff';x.textAlign='center';
    const won=res=='won',F='Fredoka,"Trebuchet MS",sans-serif';
    let sub='',sub2='';
    if(mode==1)sub=names[0]+': '+P[0].score+' pontos';
    else{
      const a=P[0].score,b=P[1].score;
      sub=names[0]+' '+a+' x '+b+' '+names[1];
      if(won)sub2=a==b?'Empate!':(a>b?names[0]:names[1])+' venceu a fase!';
    }
    x.font='600 40px '+F;x.fillText(won?'Fase '+level+' concluída!':'Derreteu tudo!',300,215);
    x.font='24px '+F;x.fillText(sub,300,255);
    if(sub2){x.fillStyle='#ffd23f';x.fillText(sub2,300,290);x.fillStyle='#fff'}
    x.font='20px '+F;
    x.fillText(won?'Enter ou toque: voltar às fases':'Enter ou toque: tentar de novo',300,335);
    x.fillText('Esc para voltar ao menu',300,365);
  }
}
function loop(t){
  const dt=Math.min(50,t-last);last=t;
  if(playing){if(!over&&!cfgOpen){update(dt);if(bannerT>0)bannerT-=dt}hud();draw(t)}
  requestAnimationFrame(loop);
}
function restart(){
  ct=4000;
  P=[mkP(1,1,sel[0])];if(mode==2)P.push(mkP(W-2,H-2,sel[1]));
  init();
  scene(true);bannerT=LV[level-1].boss?2800:0;
  snd.music(LV[level-1].boss?'boss':'level',level);
  if(LV[level-1].boss)snd.sfx('bossintro');
}
function after(){if(res=='won')showLevels();else restart()}
const M1={w:'u',s:'d',a:'l',d:'r'},M2={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};
addEventListener('keydown',e=>{
  if(cfgOpen){if(e.key==='Escape')closeCfg();return}
  if(e.target.tagName==='INPUT'){if(e.key==='Enter')play();return}
  if(!playing)return;
  const k=e.key.length==1?e.key.toLowerCase():e.key;
  if(k==='Escape'){leave();return}
  if(M1[k]){press(P[0],M1[k],1);e.preventDefault()}
  else if(M2[k]){press(P[mode==1?0:1],M2[k],1);e.preventDefault()}
  else if(k===' '){e.preventDefault();if(!e.repeat)drop(P[0])}
  else if(k==='Enter'){if(over)after();else if(mode==2&&!e.repeat)drop(P[1])}
});
addEventListener('keyup',e=>{
  if(!P[0])return;
  const k=e.key.length==1?e.key.toLowerCase():e.key;
  if(M1[k])P[0].k[M1[k]]=0;
  else if(M2[k])P[mode==1?0:1].k[M2[k]]=0;
});
// Direcional analógico (estilo jogos de celular): arraste a bolinha para andar
const joy=$('joy'),knob=$('knob');
let jid=null;
function joyMove(e){
  const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;
  const max=r.width/2-knob.offsetWidth/2,len=Math.hypot(dx,dy);
  if(len>max){dx*=max/len;dy*=max/len}
  knob.style.transform='translate('+dx+'px,'+dy+'px)';
  const q=P[0];if(!q)return;
  const prev=joy.dataset.dir;let d=null;
  if(len>max*.28){
    const ax=Math.abs(dx),ay=Math.abs(dy),h=prev=='l'||prev=='r',v=prev=='u'||prev=='d';
    if(h&&ax>=ay*.75)d=dx>0?'r':'l';
    else if(v&&ay>=ax*.75)d=dy>0?'d':'u';
    else d=ax>ay?(dx>0?'r':'l'):(dy>0?'d':'u');
  }
  for(const k of 'udlr')if(k!==d)q.k[k]=0;
  if(d&&!q.k[d])press(q,d,1);
  joy.dataset.dir=d||'';
}
function joyEnd(){jid=null;knob.style.transform='';joy.dataset.dir='';if(P[0])for(const k of 'udlr')P[0].k[k]=0}
joy.addEventListener('pointerdown',e=>{e.preventDefault();jid=e.pointerId;if(joy.setPointerCapture)joy.setPointerCapture(e.pointerId);joyMove(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)joyMove(e)});
['pointerup','pointercancel','lostpointercapture'].forEach(n=>joy.addEventListener(n,e=>{if(e.pointerId===jid)joyEnd()}));
$('bomb').addEventListener('pointerdown',e=>{e.preventDefault();drop(P[0])});
c.addEventListener('pointerdown',()=>{if(over)after()});
$('snd').textContent=$('snd2').textContent='⚙️ Som';
const pc=v=>Math.round(v*100)+'%';
function syncCfg(){const o=snd.get();$('mo').checked=o.mo;$('so').checked=o.so;$('mv').value=Math.round(o.mv*100);$('sv').value=Math.round(o.sv*100);$('mvn').textContent=pc(o.mv);$('svn').textContent=pc(o.sv)}
function openCfg(){syncCfg();cfgOpen=true;$('cfg').hidden=false}
function closeCfg(){cfgOpen=false;$('cfg').hidden=true;last=performance.now()}
$('snd').onclick=$('snd2').onclick=openCfg;$('cfgx').onclick=closeCfg;
$('cfg').addEventListener('click',e=>{if(e.target.id==='cfg')closeCfg()});
$('mo').onchange=()=>{snd.set({mo:$('mo').checked});syncCfg()};
$('so').onchange=()=>{snd.set({so:$('so').checked});syncCfg();snd.sfx('power')};
$('mv').oninput=()=>{snd.set({mv:$('mv').value/100});$('mvn').textContent=pc($('mv').value/100)};
$('sv').oninput=()=>{snd.set({sv:$('sv').value/100});$('svn').textContent=pc($('sv').value/100)};
$('sv').onchange=()=>snd.sfx('crystal');
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&b.id!=='bomb')snd.sfx('click')});
snd.music('menu');
setMode(1);
if($('ver'))$('ver').textContent='Versão 16';
// Abertura: mostra só o nome do jogo e depois abre a escolha de personagem
let splT=0;
function endSplash(){
  if(!document.body.classList.contains('splash'))return;
  clearTimeout(splT);document.body.classList.remove('splash');
  $('splash').hidden=true;$('menu').hidden=false;tab('partida');
}
$('splash').addEventListener('pointerdown',endSplash);
addEventListener('keydown',()=>endSplash());
splT=setTimeout(endSplash,2400);
requestAnimationFrame(loop);
