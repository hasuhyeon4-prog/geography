/* Shared by every practice page: the menu, and questions the learner keeps (☆ 저장). */
(function(g){
 // Saved questions live in this browser only: {page: {key: {data, at}}}.
 var KEY='wg_saved_v1';
 function read(){try{var v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(e){return {};}}
 function write(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch(e){}}
 var S={
  has:function(page,key){var v=read();return !!(v[page]&&v[page][key]);},
  list:function(page){var p=read()[page]||{};return Object.keys(p).map(function(k){return{key:k,data:p[k].data,at:p[k].at};}).sort(function(a,b){return a.at-b.at;});},
  count:function(page){return Object.keys(read()[page]||{}).length;},
  toggle:function(page,key,data){var v=read(),p=v[page]||(v[page]={});if(p[key])delete p[key];else p[key]={data:data===undefined?null:data,at:Date.now()};write(v);return !!p[key];},
  // A small toggle for a question card; onchange(saved) lets the page refresh counts.
  button:function(page,key,data,onchange){
   var b=document.createElement('button');b.type='button';b.className='site-save';
   var paint=function(on){b.textContent=on?'★ 저장됨':'☆ 저장';b.setAttribute('aria-pressed',on?'true':'false');b.title=on?'저장 취소':'이 문제를 남겨 두기';};
   paint(S.has(page,key));
   b.addEventListener('click',function(e){e.stopPropagation();var on=S.toggle(page,key,data);paint(on);if(onchange)onchange(on);});
   return b;
  }
 };
 g.WGSaved=S;
 // Question order shared by every page: a deck goes through every question of a scope once,
 // in random order, before any repeats, and is kept across visits. A question counts as asked
 // only when it is answered, so reloading never skips one (2026-10-29). Misses are not mixed
 // into a round; each page practises them apart.
 var OKEY='wg_order_v1';
 function oread(){try{var v=JSON.parse(localStorage.getItem(OKEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(e){return {};}}
 function owrite(v){try{localStorage.setItem(OKEY,JSON.stringify(v));}catch(e){}}
 function page(v,name){var p=v[name]||(v[name]={});if(!p.decks)p.decks={};delete p.retry;delete p.count;return p;}
 function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
 function sig(ids){var h=0,s=ids.slice().sort().join('\u0001');for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return ids.length+':'+h;}
 var O={
  // What is left of the current round, in order; a finished or changed set starts a new round.
  left:function(name,scope,ids){var v=oread(),p=page(v,name),d=p.decks[scope],k=sig(ids);
   if(!d||d.sig!==k||!d.left.length){var last=d&&d.last;d={sig:k,left:shuffle(ids.slice()),last:last};if(d.left.length>1&&d.left[0]===last)d.left.push(d.left.shift());p.decks[scope]=d;owrite(v);}
   return d.left.slice();},
  // The next question of the round, still unanswered.
  peek:function(name,scope,ids){return O.left(name,scope,ids)[0]||null;},
  // Called when a question of the round is answered.
  done:function(name,scope,id){var v=oread(),p=page(v,name),d=p.decks[scope];if(d){var i=d.left.indexOf(id);if(i>=0)d.left.splice(i,1);d.last=id;}owrite(v);}
 };
 g.WGOrder=O;
 if(typeof document==='undefined')return;
 document.addEventListener('DOMContentLoaded',function(){var a=document.querySelector('.site-nav a[aria-current=page]');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest',inline:'center'});});
})(typeof globalThis!=='undefined'?globalThis:this);
