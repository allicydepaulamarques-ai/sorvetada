// Sorvetada: música e efeitos sonoros, tudo gerado na hora pelo Web Audio (sem arquivos de som).
(function(){
const LSK='sorvetada-som2';
let ac=null,master,musG,sfxG,nb,timer=null,cur=null,step=0,nextT=0,KO=0,want=null,lastBoom=0;
const S={mv:.8,sv:.8,mo:true,so:true};
try{const o=JSON.parse(localStorage.getItem(LSK));if(o)for(const k in S)if(typeof o[k]===typeof S[k])S[k]=o[k]}catch(e){}
const mtof=m=>440*Math.pow(2,(m-69)/12);
const MV=.2,SV=.55;
const mg=()=>S.mo?Math.max(.0001,MV*S.mv*S.mv):.0001,sg=()=>S.so?Math.max(.0001,SV*S.sv*S.sv):.0001;

function ctx(){
  if(ac)return ac;
  const A=window.AudioContext||window.webkitAudioContext;
  if(!A)return null;
  ac=new A();
  master=ac.createGain();master.gain.value=1;master.connect(ac.destination);
  musG=ac.createGain();musG.gain.value=mg();musG.connect(master);
  sfxG=ac.createGain();sfxG.gain.value=sg();sfxG.connect(master);
  nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);
  const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return ac;
}
function tone(t,f,d,type,v,dest,f2){
  const o=ac.createOscillator(),g=ac.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(v,t+.01);
  g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+.03);
}
function noise(t,d,v,dest,type,f1,f2){
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
  s.buffer=nb;f.type=type;f.frequency.setValueAtTime(f1,t);
  if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+d+.03);
}

// ---------- Efeitos ----------
const SFX={
  click(t){tone(t,880,.06,'square',.18,sfxG,1250)},
  drop(t){tone(t,320,.14,'triangle',.6,sfxG,140);tone(t+.03,200,.08,'sine',.4,sfxG,100)},
  boom(t){
    if(t-lastBoom<.04)return;lastBoom=t;
    noise(t,.55,.9,sfxG,'lowpass',2800,90);
    tone(t,130,.45,'sine',.9,sfxG,38);
  },
  crystal(t){tone(t,1319,.09,'triangle',.4,sfxG);tone(t+.07,1760,.14,'triangle',.4,sfxG)},
  power(t){[523,659,784,1047].forEach((f,i)=>tone(t+i*.065,f,.1,'square',.22,sfxG))},
  hurt(t){tone(t,420,.38,'sawtooth',.4,sfxG,90);noise(t,.2,.25,sfxG,'bandpass',900,300)},
  freeze(t){tone(t,1600,.22,'triangle',.35,sfxG,500);tone(t+.05,2400,.16,'sine',.2,sfxG,900)},
  hit(t){tone(t,220,.1,'square',.3,sfxG,120);noise(t,.07,.3,sfxG,'highpass',2000)},
  kill(t){tone(t,700,.22,'square',.3,sfxG,180);tone(t+.08,1100,.12,'triangle',.25,sfxG,400)},
  bossdie(t){
    noise(t,1,.9,sfxG,'lowpass',3000,60);
    [784,659,523,392,330,262].forEach((f,i)=>tone(t+.1+i*.11,f,.22,'square',.28,sfxG));
  },
  shoot(t){tone(t,950,.16,'square',.2,sfxG,300)},
  summon(t){tone(t,140,.4,'sawtooth',.3,sfxG,420);tone(t+.05,150,.4,'square',.15,sfxG,460)},
  kick(t){tone(t,240,.08,'triangle',.5,sfxG,90);noise(t,.05,.25,sfxG,'highpass',1500)},
  bossintro(t){tone(t,110,.9,'sawtooth',.4,sfxG,100);tone(t,117,.9,'sawtooth',.3,sfxG,106);noise(t,.5,.3,sfxG,'lowpass',400,80)},
  win(t){
    [[523,0],[659,.14],[784,.28],[1047,.42],[784,.62],[1047,.76],[1319,.9]].forEach(a=>{
      tone(t+a[1],a[0],.3,'square',.25,sfxG);tone(t+a[1],a[0]/2,.3,'triangle',.3,sfxG);
    });
  },
  lose(t){[392,349,311,262].forEach((f,i)=>tone(t+i*.26,f,.4,'triangle',.45,sfxG,f*.97))}
};

// ---------- Trilhas ----------
const M=[0,4,7],m=[0,3,7],P5=[0,2,4,7,9],P5m=[0,3,5,7,10];
const TR={
  menu:{bpm:96,key:60,sc:P5,
    ch:[{r:0,t:M},{r:9,t:m},{r:5,t:M},{r:7,t:M}],
    bass:'x.......x.......',bw:'sine',bv:.5,
    arp:[0,-1,1,-1,2,-1,1,-1,0,-1,1,-1,2,-1,1,-1],aw:'triangle',av:.35,
    hook:[4,-1,-1,2,-1,-1,0,-1, 2,-1,-1,0,-1,-1,-1,-1, 3,-1,-1,1,-1,-1,0,-1, 4,-1,-1,2,-1,-1,-1,-1],hw:'sine',hv:.3,
    k:'................',s:'................',h:'................',ko:[0]},
  level:{bpm:126,key:60,sc:P5,
    ch:[{r:0,t:M},{r:7,t:M},{r:9,t:m},{r:5,t:M}],
    bass:'x.o.x.o.x.o.x.o.',bw:'triangle',bv:.6,
    arp:[0,1,2,1,0,1,2,1,0,1,2,1,0,1,2,1],aw:'square',av:.07,
    hook:[4,-1,5,4,2,-1,0,2, 3,-1,4,3,1,-1,0,1, 2,-1,3,5,4,-1,3,2, 1,2,3,-1,2,-1,0,-1],hw:'square',hv:.16,
    k:'k...k...k...k...',s:'................',h:'..h...h...h...h.',ko:[0,2,4,5,7,-3,-1,3,-5,1]},
  boss:{bpm:148,key:57,sc:P5m,b:1,
    ch:[{r:0,t:m},{r:0,t:m},{r:8,t:M},{r:7,t:M}],
    bass:'xoxoxoxoxoxoxoxo',bw:'sawtooth',bv:.3,
    arp:[2,1,0,1,2,1,0,1,2,1,0,1,2,1,0,1],aw:'square',av:.08,
    hook:[5,-1,5,3,-1,2,0,-1, 5,-1,5,3,-1,2,3,-1, 4,-1,4,2,-1,1,0,-1, 3,-1,4,3,2,-1,0,-1],hw:'square',hv:.17,
    k:'k..k..k.k..k..k.',s:'....s.......s...',h:'hhhhhhhhhhhhhhhh',ko:[0,-2,2,-4]}
};

function sched(T,s,t){
  const bar=(s>>4)&3,p=s&15,ch=T.ch[bar],k=T.key+KO,sd=60/T.bpm/4;
  const b=T.bass[p];
  if(b!=='.')tone(t,mtof(k-12+ch.r+(b==='o'?12:0)),sd*1.8,T.bw,T.bv,musG);
  const a=T.arp[p];
  if(a>=0)tone(t,mtof(k+12+ch.r+ch.t[a%3]+12*((a/3)|0)),sd*.9,T.aw,T.av,musG);
  if(T.hook&&p%2===0){
    const d=T.hook[bar*8+p/2];
    if(d>=0)tone(t,mtof(k+12+T.sc[d%5]+12*((d/5)|0)),sd*1.8,T.hw,T.hv,musG);
  }
  if(T.k[p]==='k')tone(t,150,.12,'sine',.8,musG,45);
  if(T.s[p]==='s')noise(t,.1,.3,musG,'highpass',1500);
  if(T.h[p]==='h')noise(t,.03,.1,musG,'highpass',6000);
}
function pump(){
  if(!cur||!ac)return;
  const now=ac.currentTime;
  if(nextT<now-.3)nextT=now+.05;
  while(nextT<now+.14){sched(cur,step,nextT);nextT+=60/cur.bpm/4;step++}
}
function stopTimer(){if(timer){clearInterval(timer);timer=null}cur=null}
function begin(){
  if(!ac||ac.state!=='running')return;
  stopTimer();
  const now=ac.currentTime;
  musG.gain.cancelScheduledValues(now);musG.gain.setValueAtTime(mg(),now);
  if(!want||!S.mo)return;
  const T=TR[want.name],l=want.lvl||1;
  cur=Object.assign({},T);
  KO=T.ko[(T.b?((l-1)/5|0):(l-1))%T.ko.length];
  if(want.name==='level')cur.bpm=T.bpm+((l-1)%5)*3;
  step=0;nextT=now+.08;
  timer=setInterval(pump,25);
}

// ---------- API ----------
function unlock(){
  if(!ctx())return;
  if(ac.state!=='running'){ac.resume().then(()=>begin()).catch(()=>{})}
  else if(want&&!timer)begin();
}
['pointerdown','keydown','touchend'].forEach(n=>addEventListener(n,unlock,{passive:true}));
document.addEventListener('visibilitychange',()=>{
  if(!ac)return;
  if(document.hidden)ac.suspend();
  else ac.resume();
});

window.SND={
  sfx(n){
    if(!S.so||S.sv<=0||!ac||ac.state!=='running'||!SFX[n])return;
    try{SFX[n](ac.currentTime+.005)}catch(e){}
  },
  music(n,l){
    want=n?{name:n,lvl:l}:null;
    if(!ac||ac.state!=='running')return;
    if(!n){
      const now=ac.currentTime;
      musG.gain.cancelScheduledValues(now);musG.gain.setValueAtTime(musG.gain.value,now);
      musG.gain.linearRampToValueAtTime(.0001,now+.2);
      stopTimer();return;
    }
    begin();
  },
  // Compatibilidade com versões antigas do game.js (botão único de som).
  muted(){return !S.mo&&!S.so},
  toggle(){const m=!S.mo&&!S.so;this.set({mo:m,so:m});return !m},
  get(){return Object.assign({},S)},
  set(o){
    Object.assign(S,o);
    try{localStorage.setItem(LSK,JSON.stringify(S))}catch(e){}
    if(!ac)return;
    const now=ac.currentTime;
    sfxG.gain.cancelScheduledValues(now);sfxG.gain.setValueAtTime(sg(),now);
    if('mo' in o){
      if(S.mo)begin();
      else{stopTimer();musG.gain.cancelScheduledValues(now);musG.gain.setValueAtTime(.0001,now)}
    }else if(timer){musG.gain.cancelScheduledValues(now);musG.gain.setValueAtTime(mg(),now)}
  }
};
})();
