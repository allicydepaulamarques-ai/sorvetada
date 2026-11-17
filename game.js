// Sorvetada: Bomberman de sorveteria.
// Constantes fáceis de ajustar: W/H (tamanho do mapa), T (tamanho da casa), R (alcance da bomba).
// Outros valores: tempo da bomba (t:2000 em drop), vidas (lives:3 em mkP), passo do jogador (130/330 em update).
const PS=['assets/sprites/jogador-01.png','assets/sprites/jogador-02.png','assets/sprites/jogador-03.png','assets/sprites/jogador-04.png','assets/sprites/jogador-05.png','assets/sprites/jogador-06.png','assets/sprites/jogador-07.png','assets/sprites/jogador-08.png','assets/sprites/jogador-09.png','assets/sprites/jogador-10.png'],
  ES=['assets/sprites/vilao-gelo-vivo.png','assets/sprites/vilao-sorvete-derretido.png','assets/sprites/vilao-waffle-maligno.png','assets/sprites/vilao-picole-fantasma.png','assets/sprites/vilao-sorvete-guardiao.png','assets/sprites/vilao-chefao.png'];
const mk=a=>a.map(u=>{const i=new Image();i.src=u;return i});
const PI=mk(PS),EI=mk(ES);
const W=15,H=13,T=40,R=2,D=[[1,0],[-1,0],[0,1],[0,-1]];
const c=document.getElementById('c'),x=c.getContext('2d');
x.imageSmoothingEnabled=false;
let g,P=[],bombs,flames,en,cry=[],shots=[],pud=[],level=1,over=false,last=performance.now(),et=0,ct=4000,tick=0,mode=1,sel=[0,1];
const $=id=>document.getElementById(id);
const mkP=(sx,sy,pl)=>({x:sx,y:sy,sx,sy,pl,lives:3,score:0,inv:0,fr:0,mt:0,k:{}});
function picker(row,i){
  PS.forEach((u,n)=>{const b=document.createElement('button');b.setAttribute('aria-label','Sabor '+(n+1)+' do jogador '+(i+1));b.setAttribute('aria-pressed',n==sel[i]);b.innerHTML='<img alt="" src="'+u+'">';
    b.onclick=()=>{sel[i]=n;if(P[i])P[i].pl=n;[...row.querySelectorAll('button')].forEach((o,k)=>o.setAttribute('aria-pressed',k==n))};row.appendChild(b)});
}
picker($('p1row'),0);picker($('p2row'),1);
document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>{
  mode=+b.dataset.m;document.querySelectorAll('#mode button').forEach(o=>o.setAttribute('aria-pressed',o===b));
  $('p2row').hidden=mode==1;$('ctl').style.display=mode==1?'flex':'none';
  $('help').innerHTML=mode==1
   ?'Setas ou WASD para andar, Espaço para soltar a cereja-bomba. Pegue os cristais de gelo para ganhar pontos.<br>Gelo Vivo atira gelo e congela. Sorvete Derretido deixa poças que atrasam. Waffle Maligno dá investidas. Picolé Fantasma atravessa blocos. Sorvete Guardião tem escudo. A cada três fases, o Chefão chama reforços.'
   :'Duelo no mesmo teclado. J1: WASD e Espaço. J2: setas e Enter. Pegue cristais (+50), exploda o rival (+300) e fuja dos monstros. Quem ficar sem vidas perde.';
  restart();
});
function init(){
  g=[];
  for(let j=0;j<H;j++){g[j]=[];for(let i=0;i<W;i++){
    let v=0;
    if(i==0||j==0||i==W-1||j==H-1||(i%2==0&&j%2==0))v=1;
    else if(Math.random()<.6&&i+j>4&&(W-2-i)+(H-2-j)>(mode==2?4:0))v=2;
    g[j][i]=v;
  }}
  P.forEach(q=>{q.x=q.sx;q.y=q.sy;q.fr=0;q.inv=1000});
  bombs=[];flames=[];en=[];shots=[];pud=[];cry=[];
  const boss=mode==1&&level%3==0;
  if(boss){g[H-2][W-2]=0;en.push({x:W-2,y:H-2,d:D[1],k:5,boss:1,hp:3,cd:0})}
  const n=mode==2?3+(level>>1):(boss?1:0)+2+level;
  while(en.length<n){
    const i=1+Math.random()*(W-2)|0,j=1+Math.random()*(H-2)|0;
    if(g[j][i]==0&&i+j>10&&(W-2-i)+(H-2-j)>(mode==2?8:0)&&!en.some(e=>e.x==i&&e.y==j)){const k=Math.random()*5|0;en.push({x:i,y:j,d:D[0],k,hp:k==4?2:1,cd:0,sh:3})}
  }
}
const free=(i,j)=>g[j][i]==0&&!bombs.some(b=>b.x==i&&b.y==j);
const ok=(e,i,j)=>e.k==3?g[j][i]!=1:free(i,j);
function grab(q){const n=cry.findIndex(o=>o.x==q.x&&o.y==q.y);if(n>=0){cry.splice(n,1);q.score+=50}}
function drop(q){
  if(over||!q)return;
  if(bombs.filter(b=>b.o===q).length<2&&!bombs.some(b=>b.x==q.x&&b.y==q.y))bombs.push({x:q.x,y:q.y,t:2000,o:q});
}
function boom(b){
  bombs.splice(bombs.indexOf(b),1);
  flames.push({x:b.x,y:b.y,t:450,o:b.o});
  for(const d of D){
    for(let k=1;k<=R;k++){
      const i=b.x+d[0]*k,j=b.y+d[1]*k;
      if(g[j][i]==1)break;
      flames.push({x:i,y:j,t:450,o:b.o});
      if(g[j][i]==2){g[j][i]=0;b.o.score+=10;if(Math.random()<.4)cry.push({x:i,y:j});break}
      bombs.forEach(o=>{if(o.x==i&&o.y==j)o.t=0});
    }
  }
}
function hurt(q,o){
  if(q.inv>0)return;
  q.lives--;q.inv=1600;q.x=q.sx;q.y=q.sy;
  if(o&&o!==q)o.score+=300;
  if(P.some(a=>a.lives<=0))over=true;
}
function los(e){
  for(const q of P){
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
  P.forEach(q=>{
    q.mt-=dt;q.inv-=dt;q.fr-=dt;
    if(q.mt<=0){
      let dx=(q.k.r?1:0)-(q.k.l?1:0),dy=(q.k.d?1:0)-(q.k.u?1:0);
      if(dx&&dy)dy=0;
      if((dx||dy)&&q.fr<=0){
        if(free(q.x+dx,q.y+dy)){q.x+=dx;q.y+=dy;grab(q)}
        q.mt=pud.some(o=>o.x==q.x&&o.y==q.y)?330:130;
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
    const q=P.find(q=>q.x==i&&q.y==j);
    if(q){if(q.inv<=0)q.fr=1600;return false}
    return true;
  });
  bombs.forEach(b=>b.t-=dt);
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
    const fl=flames.find(f=>f.x==q.x&&f.y==q.y);
    if(fl)hurt(q,fl.o);
    else if(en.some(e=>e.x==q.x&&e.y==q.y))hurt(q);
  });
  if(!en.length&&!over){level++;P.forEach(q=>q.score+=100);init()}
}
function hud(){
  if(mode==1){$('h1').textContent='Pontos: '+P[0].score;$('h2').textContent='Vidas: '+P[0].lives}
  else{$('h1').textContent='J1: '+P[0].score+' pts, '+P[0].lives+' vidas';$('h2').textContent='J2: '+P[1].score+' pts, '+P[1].lives+' vidas'}
  $('h3').textContent='Fase: '+level;
}
function draw(t){
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const X=i*T,Y=j*T,v=g[j][i];
    x.fillStyle=(i+j)%2?'#2e2d63':'#292859';x.fillRect(X,Y,T,T);
    if(v==1){
      x.fillStyle='#4a2a1d';x.fillRect(X,Y,T,T);
      x.fillStyle='#6b3d2a';x.fillRect(X+2,Y+2,T-4,T-4);
      x.fillStyle='#4a2a1d';x.fillRect(X+19,Y+2,2,T-4);x.fillRect(X+2,Y+19,T-4,2);
      x.fillStyle='#8a5a40';x.fillRect(X+4,Y+4,6,3);
    }
    if(v==2){
      x.fillStyle='#173b66';x.fillRect(X+1,Y+1,T-2,T-2);
      x.fillStyle='#8fd3ff';x.fillRect(X+3,Y+3,T-6,T-6);
      x.fillStyle='#d9f3ff';x.fillRect(X+6,Y+6,12,5);x.fillRect(X+6,Y+6,5,12);
      x.fillStyle='#5fb0e8';x.fillRect(X+22,Y+24,12,10);
    }
  }
  cry.forEach(o=>{
    const X=o.x*T+20,Y=o.y*T+22+Math.sin(t/200+o.x)*2;
    x.beginPath();x.moveTo(X,Y-14);x.lineTo(X+10,Y-2);x.lineTo(X,Y+14);x.lineTo(X-10,Y-2);x.closePath();
    x.fillStyle='#5fe0ff';x.fill();x.strokeStyle='#e8fbff';x.lineWidth=2;x.stroke();
    x.fillStyle='#ffffff';x.beginPath();x.moveTo(X,Y-14);x.lineTo(X-10,Y-2);x.lineTo(X,Y-2);x.closePath();x.fill();
  });
  bombs.forEach(b=>{
    const X=b.x*T,Y=b.y*T,r=12+Math.sin(t/90)*1.5;
    x.fillStyle='#7a1030';x.beginPath();x.arc(X+20,Y+24,r+2,0,7);x.fill();
    x.fillStyle='#e0244f';x.beginPath();x.arc(X+20,Y+24,r,0,7);x.fill();
    x.fillStyle='#ff9bb4';x.fillRect(X+13,Y+17,5,5);
    x.strokeStyle='#4f8a3c';x.lineWidth=3;x.beginPath();x.moveTo(X+20,Y+12);x.quadraticCurveTo(X+22,Y+5,X+29,Y+4);x.stroke();
    if((t/150|0)%2){x.fillStyle='#fff3a0';x.fillRect(X+28,Y+1,6,6)}
  });
  pud.forEach(o=>{x.fillStyle='rgba(255,122,168,.45)';x.beginPath();x.ellipse(o.x*T+20,o.y*T+26,16,9,0,0,7);x.fill()});
  shots.forEach(s=>{x.fillStyle='#d9f3ff';x.strokeStyle='#5fb0e8';x.lineWidth=3;x.save();x.translate(s.x*T+20,s.y*T+20);x.rotate(Math.PI/4);x.fillRect(-7,-7,14,14);x.strokeRect(-7,-7,14,14);x.restore()});
  flames.forEach(f=>{
    const X=f.x*T,Y=f.y*T;
    x.fillStyle='#ff7aa8';x.fillRect(X+2,Y+2,T-4,T-4);
    x.fillStyle='#ffd1e0';x.fillRect(X+8,Y+8,T-16,T-16);
    x.fillStyle='#fff';x.fillRect(X+15,Y+15,10,10);
  });
  en.forEach(e=>{
    const bob=Math.sin(t/160+e.x)*2;
    if(e.cd>0&&((t/80)|0)%2)return;
    x.globalAlpha=e.k==3?.7:1;x.drawImage(EI[e.k],e.x*T-(e.boss?4:0),e.y*T-(e.boss?8:4)+bob,e.boss?48:40,e.boss?48:40);x.globalAlpha=1;
    if(e.hp>1&&!e.boss){x.strokeStyle='rgba(143,211,255,.9)';x.lineWidth=3;x.beginPath();x.arc(e.x*T+20,e.y*T+20,19,0,7);x.stroke()}
    if(e.boss){x.fillStyle='#ff7aa8';for(let k=0;k<e.hp;k++)x.fillRect(e.x*T+8+k*10,e.y*T-12,8,5)}
  });
  P.forEach((q,i)=>{
    if(q.inv>0&&((t/100)|0)%2)return;
    if(mode==2){x.strokeStyle=i?'#5fe0ff':'#ff7aa8';x.lineWidth=3;x.beginPath();x.ellipse(q.x*T+20,q.y*T+35,15,6,0,0,7);x.stroke()}
    x.drawImage(PI[q.pl],q.x*T,q.y*T-5,40,40);
    if(q.fr>0){x.fillStyle='rgba(143,211,255,.6)';x.fillRect(q.x*T+4,q.y*T-3,32,36)}
  });
  if(over){
    x.fillStyle='rgba(20,15,50,.82)';x.fillRect(0,0,c.width,c.height);
    x.fillStyle='#fff';x.textAlign='center';
    let title='Derreteu tudo!',sub='';
    if(mode==2){
      const w=P[0].lives>0&&P[1].lives<=0?0:P[1].lives>0&&P[0].lives<=0?1:(P[0].score>=P[1].score?0:1);
      title='Jogador '+(w+1)+' venceu!';sub=P[0].score+' x '+P[1].score+' pontos';
    }
    x.font='600 46px Fredoka,"Trebuchet MS",sans-serif';x.fillText(title,300,235);
    x.font='24px Fredoka,"Trebuchet MS",sans-serif';if(sub)x.fillText(sub,300,272);
    x.font='20px Fredoka,"Trebuchet MS",sans-serif';x.fillText('Toque aqui ou aperte Enter para jogar de novo',300,312);
  }
}
function loop(t){
  const dt=Math.min(50,t-last);last=t;
  if(!over)update(dt);
  hud();draw(t);requestAnimationFrame(loop);
}
function restart(){
  level=1;over=false;ct=4000;
  P=[mkP(1,1,sel[0])];if(mode==2)P.push(mkP(W-2,H-2,sel[1]));
  init();
}
const M1={w:'u',s:'d',a:'l',d:'r'},M2={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};
addEventListener('keydown',e=>{
  const k=e.key.length==1?e.key.toLowerCase():e.key;
  if(M1[k]){P[0].k[M1[k]]=1;e.preventDefault()}
  else if(M2[k]){P[mode==1?0:1].k[M2[k]]=1;e.preventDefault()}
  else if(k===' '){e.preventDefault();if(!e.repeat)drop(P[0])}
  else if(k==='Enter'){if(over)restart();else if(mode==2&&!e.repeat)drop(P[1])}
});
addEventListener('keyup',e=>{
  const k=e.key.length==1?e.key.toLowerCase():e.key;
  if(M1[k])P[0].k[M1[k]]=0;
  else if(M2[k])P[mode==1?0:1].k[M2[k]]=0;
});
document.querySelectorAll('#pad button').forEach(b=>{
  const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();P[0].k[k]=1});
  ['pointerup','pointerleave','pointercancel'].forEach(n=>b.addEventListener(n,()=>P[0].k[k]=0));
});
$('bomb').addEventListener('pointerdown',e=>{e.preventDefault();drop(P[0])});
c.addEventListener('pointerdown',()=>{if(over)restart()});
document.querySelector('#mode button').click();
requestAnimationFrame(loop);
