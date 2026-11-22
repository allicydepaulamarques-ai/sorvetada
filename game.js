// Sorvetada: Bomberman de sorveteria.
// Constantes fáceis de ajustar: W/H (tamanho do mapa), T (tamanho da casa), R (alcance da bomba).
// Outros valores: tempo da bomba (t:2000 em drop), vidas (lives:3 em mkP), passo do jogador (130/330 em update).
const PS=['assets/sprites/jogador-01.png','assets/sprites/jogador-02.png','assets/sprites/jogador-03.png','assets/sprites/jogador-04.png','assets/sprites/jogador-05.png','assets/sprites/jogador-06.png','assets/sprites/jogador-07.png','assets/sprites/jogador-08.png','assets/sprites/jogador-09.png','assets/sprites/jogador-10.png'],
  ES=['assets/sprites/vilao-gelo-vivo.png','assets/sprites/vilao-sorvete-derretido.png','assets/sprites/vilao-waffle-maligno.png','assets/sprites/vilao-picole-fantasma.png','assets/sprites/vilao-sorvete-guardiao.png','assets/sprites/vilao-chefao.png'];
const mk=a=>a.map(u=>{const i=new Image();i.src=u;return i});
const PI=mk(PS),EI=mk(ES);
const W=15,H=13,T=40,R=2,D=[[1,0],[-1,0],[0,1],[0,-1]];
const c=document.getElementById('c'),x=c.getContext('2d');
x.imageSmoothingEnabled=false;x.scale(1.3,1.3);
let g,P=[],bombs,flames,en,cry=[],shots=[],pud=[],items=[],it=3000,toasts=[],level=1,over=false,last=performance.now(),et=0,ct=4000,tick=0,mode=1,sel=[0,1],names=['Jogador 1','Jogador 2'],playing=false,res='',done=Array(10).fill(false);
const $=id=>document.getElementById(id);
const LS='sorvetada-fases',LT='sorvetada-tema';
try{const s=JSON.parse(localStorage.getItem(LS));if(Array.isArray(s)&&s.length==10)done=s.map(Boolean)}catch(e){}
const save=()=>{try{localStorage.setItem(LS,JSON.stringify(done))}catch(e){}};
const mq=matchMedia('(prefers-color-scheme: dark)');
const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t=='dark':mq.matches};
const mkP=(sx,sy,pl)=>({x:sx,y:sy,sx,sy,pl,lives:3,score:0,inv:0,fr:0,mt:0,out:false,pw:newPw(),px:sx,py:sy,last:'',buf:'',bt:0,k:{}});
function picker(row,i){
  PS.forEach((u,n)=>{const b=document.createElement('button');b.setAttribute('aria-label','Sabor '+(n+1)+' do jogador '+(i+1));b.setAttribute('aria-pressed',n==sel[i]);b.innerHTML='<img alt="" src="'+u+'">';
    b.onclick=()=>{sel[i]=n;if(P[i])P[i].pl=n;$('pv'+(i+1)).src=u;[...row.querySelectorAll('button')].forEach((o,k)=>o.setAttribute('aria-pressed',k==n))};row.appendChild(b)});
}
picker($('p1row'),0);picker($('p2row'),1);
$('pv1').src=PS[sel[0]];$('pv2').src=PS[sel[1]];
function howto(m){
  const it=(i,t)=>'<div class="it"><i>'+i+'</i><span>'+t+'</span></div>';
  const c=m==1?it('🎮','<b>Setas ou WASD</b>: andar')+it('🍒','<b>Espaço</b>: soltar a cereja-bomba')+it('💎','<b>Cristais</b>: dão pontos')
    :it('🎮','<b>J1</b>: WASD e Espaço')+it('🕹️','<b>J2</b>: setas e Enter')+it('🏆','Quem fizer <b>mais pontos</b> vence a fase');
  return '<div class="g">'+c+it('🧊','<b>Gelo Vivo</b>: atira gelo e congela')+it('🍨','<b>Sorvete Derretido</b>: deixa poças que atrasam')+it('🧇','<b>Waffle Maligno</b>: dá investidas')+it('👻','<b>Picolé Fantasma</b>: atravessa blocos')+it('🛡️','<b>Sorvete Guardião</b>: tem escudo')+it('👑','<b>Fase 10</b>: o Chefão chama reforços')
   +'<div class="it wide"><i>✨</i><span><b>Itens especiais</b> duram 25 s: ⚡ velocidade · 🔥 superbomba · 💣 bombas extras · ⭐ invencível · 💥 bomba estrela · 👟 chute de bomba'+(m==2?' · ⚠️ a bomba machuca todo mundo':'')+'</span></div></div>';
}
function setMode(m){
  mode=m;document.querySelectorAll('#mode button').forEach(o=>o.setAttribute('aria-pressed',+o.dataset.m===m));
  $('c2').hidden=m==1;
  $('help').innerHTML=howto(m);
}
document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>setMode(+b.dataset.m));
function startLevel(n){
  names=[$('n1').value.trim()||'Jogador 1',$('n2').value.trim()||'Jogador 2'];
  level=n;$('menu').hidden=true;$('game').hidden=false;$('theme').hidden=true;$('ctl').style.display=mode==1?'flex':'none';
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
    const nx=i==done.indexOf(false);b.innerHTML=(nx?'<em class="star">⭐</em>':'')+(open?'':'<em class="lock">🔒</em>')+'<b>'+(i+1)+'</b><span>'+L.n+'</span><small>'+(done[i]?'✔ Concluída':nx?'▶ Jogar':open?'Jogar':'Bloqueada')+'</small>';
    b.onclick=()=>startLevel(i+1);box.appendChild(b);
  });
}
function showMenu(){playing=false;over=false;$('game').hidden=true;$('menu').hidden=false;$('theme').hidden=false;tab('partida')}
function showLevels(){playing=false;over=false;$('game').hidden=true;$('menu').hidden=false;$('theme').hidden=false;tab('fases')}
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
// Paletas do chão (uma por fase) e definição das 10 fases.
// Tipos de vilão: 0 Gelo Vivo, 1 Derretido, 2 Waffle, 3 Picolé, 4 Guardião.
const FL=[['#fff0f6','#ffe2ee'],['#effff6','#d9f7e6'],['#f4efff','#e5dcff'],['#fff4e6','#ffe3c4'],['#eef7ff','#d8ecff'],['#fffde8','#fff5b8'],['#fff0f0','#ffdede'],['#f0fffd','#d3f6f2'],['#fdf0ff','#f5d9ff'],['#ffeef3','#ffd0df']];
const LV=[
  {n:'Primeira bola',L:'classic',cr:.45,en:[1,1]},
  {n:'Gelo na barriga',L:'classic',cr:.5,en:[0,0,1]},
  {n:'Waffle veloz',L:'open',cr:.55,en:[2,2,1]},
  {n:'Assombração',L:'classic',cr:.55,en:[3,3,3]},
  {n:'Escudos',L:'sparse',cr:.55,en:[4,4,0]},
  {n:'Labirinto',L:'maze',cr:.5,en:[0,2,3,1]},
  {n:'Tempestade',L:'open',cr:.65,en:[0,0,2,2,3]},
  {n:'Fortaleza',L:'maze',cr:.6,en:[4,4,4,3,3]},
  {n:'Mistura',L:'maze',cr:.6,en:[0,1,2,3,4,2]},
  {n:'Rei Sorvete',L:'classic',cr:.55,boss:1,en:[1,1,4,4]}
];
function connected(){
  const s=[[1,1]],seen={'1,1':1};let n=0,tot=0;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(g[j][i]!=1)tot++;
  while(s.length){const a=s.pop();n++;for(const d of D){const i=a[0]+d[0],j=a[1]+d[1];if(g[j][i]!=1&&!seen[i+','+j]){seen[i+','+j]=1;s.push([i,j])}}}
  return n==tot;
}
function build(cfg){
  for(let t=0;t<40;t++){
    g=[];
    for(let j=0;j<H;j++){g[j]=[];for(let i=0;i<W;i++){
      let v=0;const ed=i==0||j==0||i==W-1||j==H-1;
      let pil=i%2==0&&j%2==0;
      if(cfg.L=='open')pil=pil&&((i+j)/2)%2==0;
      if(cfg.L=='sparse')pil=i%4==0&&j%4==0;
      if(ed||pil)v=1;
      else if(cfg.L=='maze'&&(i+j)%2==1&&Math.random()<.12&&i+j>5&&(W-2-i)+(H-2-j)>5)v=1;
      else if(Math.random()<cfg.cr&&i+j>4&&(W-2-i)+(H-2-j)>(mode==2?4:0))v=2;
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
  if(cfg.boss){const bx=mode==1?W-2:7,by=mode==1?H-2:6;g[by][bx]=0;en.push({x:bx,y:by,d:D[1],k:5,boss:1,hp:3,cd:0,px:bx,py:by})}
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
const PW_TIME=25000;
const newPw=()=>({spd:0,rng:0,ext:0,inv:0,spc:0,kick:0});
const D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function toast(q,p){toasts.push({x:q.x,y:q.y,s:p[1]+' '+p[2],t:1400})}
function spawnItem(){
  if(items.length>=3)return;
  for(let n=0;n<40;n++){
    const i=1+Math.random()*(W-2)|0,j=1+Math.random()*(H-2)|0;
    if(g[j][i]==0&&!bombs.some(b=>b.x==i&&b.y==j)&&!items.some(o=>o.x==i&&o.y==j)&&!cry.some(o=>o.x==i&&o.y==j)&&!P.some(q=>q.x==i&&q.y==j)){
      items.push({x:i,y:j,k:Math.random()*PW.length|0});return;
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
  if(n>=0){cry.splice(n,1);q.score+=50}
  const m=items.findIndex(o=>o.x==q.x&&o.y==q.y);
  if(m>=0){const o=items.splice(m,1)[0],p=PW[o.k];q.pw[p[0]]=PW_TIME;toast(q,p)}
}
function drop(q){
  if(over||!q||q.out)return;
  if(bombs.filter(b=>b.o===q).length<2+(q.pw.ext>0?2:0)&&!bombs.some(b=>b.x==q.x&&b.y==q.y))bombs.push({x:q.x,y:q.y,t:2000,o:q,r:R+(q.pw.rng>0?2:0),sp:q.pw.spc>0});
}
function boom(b){
  bombs.splice(bombs.indexOf(b),1);
  flames.push({x:b.x,y:b.y,t:450,o:b.o});
  for(const d of (b.sp?D8:D)){
    for(let k=1;k<=(b.r||R);k++){
      const i=b.x+d[0]*k,j=b.y+d[1]*k;
      if(g[j][i]==1)break;
      flames.push({x:i,y:j,t:450,o:b.o});
      if(g[j][i]==2){g[j][i]=0;b.o.score+=10;if(Math.random()<.4)cry.push({x:i,y:j});else if(Math.random()<.2)items.push({x:i,y:j,k:Math.random()*PW.length|0});break}
      bombs.forEach(o=>{if(o.x==i&&o.y==j)o.t=0});
    }
  }
}
function hurt(q){
  if(q.inv>0||q.out||q.pw.inv>0)return;
  q.lives--;q.inv=1600;q.x=q.sx;q.y=q.sy;q.px=q.x;q.py=q.y;
  if(q.lives<=0){q.out=true;if(P.every(a=>a.out))lose()}
}
function win(){over=true;res='won';done[level-1]=true;save()}
function lose(){over=true;res='lost'}
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
  if(e.k==0){e.sh--;if(v&&e.sh<=0){shots.push({x:e.x,y:e.y,dx:v[0],dy:v[1]});e.sh=5}}
  if(e.k==1&&!pud.some(o=>o.x==e.x&&o.y==e.y))pud.push({x:e.x,y:e.y,t:7000});
  if(e.k==2&&v){e.d=v;for(let k=0;k<3;k++){const nx=e.x+v[0],ny=e.y+v[1];if(!free(nx,ny))break;e.x=nx;e.y=ny}return 1}
  if(e.boss&&tick%8==0&&en.length<9){
    const o=D.map(d=>[e.x+d[0],e.y+d[1]]).filter(a=>free(a[0],a[1]));
    if(o.length)en.push({x:o[0][0],y:o[0][1],d:D[0],k:1,hp:1,cd:0,sh:0});
  }
}
function update(dt){
  et-=dt;ct-=dt;
  P.forEach(q=>{const s=dt*(q.pw.spd>0?.026:.016);q.px=ap(q.px,q.x,s);q.py=ap(q.py,q.y,s);for(const k in q.pw)q.pw[k]=Math.max(0,q.pw[k]-dt)});
  en.forEach(e=>{e.px=ap(e.px??e.x,e.x,dt*.0075);e.py=ap(e.py??e.y,e.y,dt*.0075)});
  P.forEach(q=>{
    if(q.out)return;
    q.mt-=dt;q.inv-=dt;q.fr-=dt;
    q.bt-=dt;
    if(q.mt<=0&&q.fr<=0){
      const d=dirOf(q);
      if(d){
        const dx=DV[d][0],dy=DV[d][1];
        if(free(q.x+dx,q.y+dy)){q.x+=dx;q.y+=dy;grab(q);q.bt=0;q.mt=(pud.some(o=>o.x==q.x&&o.y==q.y)?260:100)*(q.pw.spd>0?.62:1)}
        else if(q.pw.kick>0){const bb=bombs.find(b=>b.x==q.x+dx&&b.y==q.y+dy&&!b.kd);if(bb){bb.kd=[dx,dy];bb.km=0}}
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
    if(q){if(q.inv<=0&&q.pw.inv<=0)q.fr=1600;return false}
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
      if(e.boss&&tick%2)return;
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
      e.hp--;e.cd=700;
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
  const fl=FL[(level-1)%FL.length],dk=isDark();
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const X=i*T,Y=j*T,v=g[j][i];
    x.fillStyle=(i+j)%2?fl[0]:fl[1];x.fillRect(X,Y,T,T);if(dk){x.fillStyle='rgba(50,20,60,.68)';x.fillRect(X,Y,T,T)}
    const hs=(i*7+j*13)%5;
    if(hs<2){x.fillStyle=hs?'#a8d8ff':'#ffb3d1';x.save();x.translate(X+8+(i*11+j*5)%22,Y+8+(i*5+j*9)%22);x.rotate(hs?.8:-.6);x.fillRect(-4,-1.5,8,3);x.restore()}
    if(v==1){
      rr(X+1,Y+1,T-2,T-2,6);x.fillStyle='#b9772f';x.fill();
      rr(X+3,Y+3,T-6,T-6,5);x.fillStyle='#f0c27a';x.fill();
      x.fillStyle='#d99a4e';for(const o of [13,24]){x.fillRect(X+o,Y+5,2,T-10);x.fillRect(X+5,Y+o,T-10,2)}
      x.fillStyle='#ffc2dc';x.fillRect(X+3,Y+3,T-6,9);for(let a=0;a<4;a++){x.beginPath();x.arc(X+9+a*8,Y+12,4,0,Math.PI);x.fill()}
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
    if(e.boss){x.fillStyle='#ff4f81';for(let k=0;k<e.hp;k++)x.fillRect(e.px*T+8+k*10,e.py*T-12,8,5)}
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
  if(playing){if(!over)update(dt);hud();draw(t)}
  requestAnimationFrame(loop);
}
function restart(){
  ct=4000;
  P=[mkP(1,1,sel[0])];if(mode==2)P.push(mkP(W-2,H-2,sel[1]));
  init();
}
function after(){if(res=='won')showLevels();else restart()}
const M1={w:'u',s:'d',a:'l',d:'r'},M2={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};
addEventListener('keydown',e=>{
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
setMode(1);
if($('ver'))$('ver').textContent='Versão 11';
requestAnimationFrame(loop);
