/* Optional real-browser QA. Requires Playwright and a local Chromium installation.
 * GEOGRAPHY_BROWSER_EXECUTABLE may select an existing Chromium binary.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.GEOGRAPHY_QA_OUTPUT||path.join(ROOT,'audit/lecture-goals/browser');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(process.env.GEOGRAPHY_QA_FONT_DIR&&pathname.startsWith('/__qa-fonts/')){
  const file=path.join(process.env.GEOGRAPHY_QA_FONT_DIR,'files',path.basename(pathname));
  if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type','font/woff2');fs.createReadStream(file).pipe(res);return;
 }
 const file=path.resolve(ROOT,'.'+pathname);
 if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
const assert=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.GEOGRAPHY_BROWSER_EXECUTABLE?{executablePath:process.env.GEOGRAPHY_BROWSER_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const result={date:'2026-10-26',browser:await browser.version(),viewports:[],errors:[],screenshots:[]};
 try{
  for(const viewport of [{width:390,height:844},{width:810,height:1080},{width:1280,height:900}]){
   const context=await browser.newContext({viewport}),page=await context.newPage(),checked=[],clipped=[];
   page.on('pageerror',e=>result.errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))result.errors.push(r.status()+' '+r.url());});
   await page.goto('http://127.0.0.1:'+server.address().port+'/materials.html');
   if(process.env.GEOGRAPHY_QA_FONT_DIR){
    const css=fs.readFileSync(path.join(process.env.GEOGRAPHY_QA_FONT_DIR,'400.css'),'utf8').replaceAll('./files/','/__qa-fonts/');
    await page.addStyleTag({content:css+'\nbody{font-family:"Noto Sans KR",sans-serif;}'});
   }
   const families=await page.evaluate(()=>WGMaterials.create(WGMaterialsData).families.map(f=>f.id));
   for(const id of families){
    await page.selectOption('#family',id);
    const q=await page.evaluate(id=>WGMaterials.create(WGMaterialsData).build(id,JSON.parse(localStorage.getItem('wg_materials_v1')).seed-1),id);
    assert(await page.locator('.choices').count()===1,id+' stage 2 must be hidden');
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('svg image')].map(el=>{const image=new Image();image.src=el.getAttribute('href');return image.decode();}));});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    assert(!overflow,id+' page overflows at '+viewport.width);
    const outside=await page.locator('svg').evaluateAll(svgs=>svgs.flatMap(svg=>[...svg.querySelectorAll('text')].flatMap(t=>{const b=t.getBBox();return b.x<-.5||b.x+b.width>700.5||b.y<-.5||b.y+b.height>440.5?[{text:t.textContent,x:b.x,y:b.y,width:b.width,height:b.height}]:[];})));
    if(outside.length)clipped.push({family:id,labels:outside});
    if((viewport.width===810&&['stat-map-types','china-grain-map','trade-bubble','population-pyramid','industry-bubble','road-images','age-triangle','oldmap-regions','religious-landmarks','climate-restore','cumulative'].includes(id))||(viewport.width===390&&['north-america-trade','population-pyramid'].includes(id))){
     const name=viewport.width+'-'+id+'.png';await page.screenshot({path:path.join(OUT,name),fullPage:true});result.screenshots.push(name);
    }
    if(id==='oldmap-regions')await page.locator('[data-material-option="'+q.stage1.answer+'"]').click();else await page.locator('.choices').first().locator('button').nth(q.stage1.answer).click();
    assert(await page.locator('.choices').count()===2,id+' stage 2 missing');
    await page.locator('.choices').nth(1).locator('button').nth(q.stage2.answer).click();assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),id+' answer page overflows');
    assert(await page.locator('#nextQuestion').count()===1,id+' next control missing');
    assert((await page.locator('.feedback').allTextContents()).every(s=>s.startsWith('정답.')),id+' answer feedback mismatch');
    await page.locator('#nextQuestion').click();checked.push(id);
   }
   result.viewports.push({viewport,families:checked.length,clippedLabels:clipped});await context.close();
  }
  fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(result,null,1)+'\n');
  assert(result.errors.length===0,result.errors.join('\n'));
  assert(result.viewports.every(v=>v.clippedLabels.length===0),'Chart labels are clipped; inspect result.json');
  console.log(JSON.stringify({browser:result.browser,viewports:result.viewports.map(v=>({width:v.viewport.width,families:v.families,clippedFamilies:v.clippedLabels.length})),errors:result.errors.length}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
