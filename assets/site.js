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
 if(typeof document==='undefined')return;
 document.addEventListener('DOMContentLoaded',function(){var a=document.querySelector('.site-nav a[aria-current=page]');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest',inline:'center'});});
})(typeof globalThis!=='undefined'?globalThis:this);
