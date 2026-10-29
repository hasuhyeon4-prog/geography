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
 // Question order shared by every page (2026-10-29): a deck goes through every question of
 // a scope once, in random order, before any repeats, and is kept across visits. A missed
 // question comes back once, after GAP other questions; serving it again ends it.
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
  // Marks one question of the round as asked.
  done:function(name,scope,id){var v=oread(),p=page(v,name),d=p.decks[scope];p.count++;if(d){var i=d.left.indexOf(id);if(i>=0)d.left.splice(i,1);d.last=id;}owrite(v);},
  next:function(name,scope,ids){var l=O.left(name,scope,ids);if(!l.length)return null;O.done(name,scope,l[0]);return l[0];},
  count:function(name){return page(oread(),name).count;},
  // A miss is asked again once; a question that was itself a retry is not queued again.
  miss:function(name,id,data){var v=oread(),p=page(v,name);if(p.retry.some(function(x){return x.id===id;}))return;p.retry.push({id:id,data:data===undefined?null:data,at:p.count+GAP});owrite(v);},
  // The first retry that is due and usable here; it leaves the list as it is served.
  takeRetry:function(name,usable){var v=oread(),p=page(v,name);for(var i=0;i<p.retry.length;i++){var x=p.retry[i];if(x.at<=p.count&&(!usable||usable(x.id,x.data))){p.retry.splice(i,1);p.count++;owrite(v);return x;}}return null;},
  retries:function(name){return page(oread(),name).retry.slice();},
  dropRetry:function(name,id){var v=oread(),p=page(v,name);p.retry=p.retry.filter(function(x){return x.id!==id;});owrite(v);}
 };
 g.WGOrder=O;
 if(typeof document==='undefined')return;
 document.addEventListener('DOMContentLoaded',function(){var a=document.querySelector('.site-nav a[aria-current=page]');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest',inline:'center'});});
})(typeof globalThis!=='undefined'?globalThis:this);
