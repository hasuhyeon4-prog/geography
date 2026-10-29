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
 // only when it is answered, so reloading never skips one (2026-10-29). A missed question comes
 // back after GAP other answers and stays on the list until it is answered right.
 var OKEY='wg_order_v1',GAP=5;
 function oread(){try{var v=JSON.parse(localStorage.getItem(OKEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(e){return {};}}
 function owrite(v){try{localStorage.setItem(OKEY,JSON.stringify(v));}catch(e){}}
 function page(v,name){var p=v[name]||(v[name]={});if(!p.decks)p.decks={};if(!Array.isArray(p.retry))p.retry=[];if(!(p.count>=0))p.count=0;return p;}
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
  done:function(name,scope,id){var v=oread(),p=page(v,name),d=p.decks[scope];p.count++;if(d){var i=d.left.indexOf(id);if(i>=0)d.left.splice(i,1);d.last=id;}owrite(v);},
  count:function(name){return page(oread(),name).count;},
  // A miss (again) is asked after GAP more answers.
  miss:function(name,id,data){var v=oread(),p=page(v,name),x=p.retry.filter(function(r){return r.id===id;})[0];if(x)x.at=p.count+GAP;else p.retry.push({id:id,data:data===undefined?null:data,at:p.count+GAP});owrite(v);},
  // The first missed question that is due and usable here; it stays listed until answered.
  dueRetry:function(name,usable){var p=page(oread(),name);for(var i=0;i<p.retry.length;i++){var x=p.retry[i];if(x.at<=p.count&&(!usable||usable(x.id,x.data)))return x;}return null;},
  // Answering a missed question: right ends it, wrong brings it back again later.
  resolve:function(name,id,ok){var v=oread(),p=page(v,name);p.count++;p.retry=p.retry.filter(function(x){if(x.id!==id)return true;if(ok)return false;x.at=p.count+GAP;return true;});owrite(v);},
  isRetry:function(name,id){return page(oread(),name).retry.some(function(x){return x.id===id;});},
  retries:function(name){return page(oread(),name).retry.slice();}
 };
 g.WGOrder=O;
 if(typeof document==='undefined')return;
 document.addEventListener('DOMContentLoaded',function(){var a=document.querySelector('.site-nav a[aria-current=page]');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest',inline:'center'});});
})(typeof globalThis!=='undefined'?globalThis:this);
