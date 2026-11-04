import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import sharp from "sharp";

const base=process.env.PREVIEW_URL ?? "http://127.0.0.1:3197/";
const dir=resolve(process.env.PROOF_DIR ?? "../scene-proof");
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:process.env.CHROME_CHANNEL??"chrome",headless:true,args:["--enable-unsafe-swiftshader"]});
const problems=[];
function watch(page){
  page.on("pageerror",e=>problems.push(e.message));
  page.on("response",r=>{if(r.status()>=400)problems.push(`${r.status()} ${r.url()}`);});
  page.on("console",m=>{if(m.type()==="error"&&!m.text().includes("favicon"))problems.push(m.text().slice(0,280));});
  if(base.startsWith("file:"))page.on("request",r=>{if(/^https?:/.test(r.url()))problems.push("offline network request");});
}
async function capture(page,name){await page.screenshot({path:resolve(dir,`${name}.png`)});}
async function checkCanvas(page,width,height){
  await page.waitForFunction(()=>document.querySelector(".cloth-light canvas")?.style.opacity==="1");
  const clip={x:Math.round(width*.08),y:Math.round(height*.12),width:Math.round(width*.24),height:Math.round(height*.12)};
  const read=async()=>sharp(await page.screenshot({clip})).removeAlpha().raw().toBuffer();
  const a=await read();
  assert.ok(Math.max(...a.subarray(0,30000))-Math.min(...a.subarray(0,30000))>6,"cloth must contain rendered detail");
  await page.mouse.move(width*.83,height*.44);await page.waitForTimeout(620);
  const b=await read();let different=0;
  for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>1)different++;
  assert.ok(different/a.length>.028,`cloth must react (${different/a.length})`);
  return Number((different/a.length).toFixed(3));
}
async function settled(page){await page.waitForFunction(()=>!document.documentElement.dataset.flight);}
try{
  for(const [name,width,height] of [["desktop",1440,900],["mobile",390,844]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:name==="mobile",deviceScaleFactor:1});
    watch(page);await page.goto(`${base}#chapter-1`);
    await page.waitForFunction(()=>[...document.querySelectorAll(".specimen img")].length===5 &&
      [...document.querySelectorAll(".specimen img")].every(img=>img.complete&&img.naturalWidth));
    const delta=await checkCanvas(page,width,height);
    assert.equal(await page.getByRole("heading",{name:"Liang Ping"}).count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.evaluate(()=>{
      const title=document.querySelector(".landing-title").getBoundingClientRect();
      return [...document.querySelectorAll(".flight:not([inert]) .specimen-body img")].every(img => img.getBoundingClientRect().bottom<title.top-12);
    }),true,"the jewels must stay above the exhibition title");
    await page.mouse.move(2,2);await capture(page,`${name}-table`);
    if(name==="desktop"){
      await page.locator('[data-piece="lacune"]').hover();await page.waitForTimeout(400);await capture(page,"desktop-light");
    }
    await page.evaluate(()=>{
      const start=document.startViewTransition.bind(document);
      document.startViewTransition=update=>{
        const flight=start(update);
        flight.ready.then(()=>{document.documentElement.dataset.silverPassed=String(Boolean(document.querySelector('body > img[aria-hidden="true"]')));},()=>{});
        return flight;
      };
    });
    const enterTime=Date.now();await page.locator('[data-piece="lacune"]').click();
    await page.waitForURL(/#lacune$/);await settled(page);
    assert.ok(Date.now()-enterTime<3200,"entry must animate rather than wait for the browser transition timeout");
    assert.equal(await page.locator("html").getAttribute("data-silver-passed"),"true","source cutout must dock into the framed photograph");
    await page.waitForSelector("[data-framed][data-printed]",{timeout:20000});
    await capture(page,`${name}-photo`);
    await page.mouse.wheel(0,height*.5);await page.waitForFunction(()=>scrollY>20);
    const station=page.getByRole("button",{name:"II · 纸上习作"});await station.click();
    await page.waitForFunction(()=>Number(document.querySelector("[data-printed]")?.style.getPropertyValue("--proof-alpha"))>.97);
    await capture(page,`${name}-print`);
    await page.getByRole("button",{name:"III · 局部与作品手记"}).click();
    await page.waitForFunction(()=>Number(document.querySelector("[data-printed]")?.style.getPropertyValue("--words-alpha"))>.99);
    await capture(page,`${name}-macro`);
    await page.getByRole("button",{name:"I · 原作摄影"}).click();await page.waitForFunction(()=>scrollY<5);
    await page.getByRole("button",{name:"关闭作品"}).click();await page.waitForURL(/#chapter-1$/);await settled(page);
    if(name==="mobile"){
      const session=await page.context().newCDPSession(page);
      await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:255,y:330}]});
      for(const x of [238,210,175,138,100])await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:330}]});
      await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    }else await page.keyboard.press("ArrowRight");
    await page.waitForURL(/#chapter-2$/);await page.waitForTimeout(1050);await capture(page,`${name}-chapter-two`);
    await page.getByRole("button",{name:"打开目录"}).click();await page.waitForSelector("dialog[open]");
    await page.getByRole("dialog").getByRole("button",{name:"查看 SIGNAL 来电戒指"}).click();
    await page.waitForURL(/#signal$/);await settled(page);
    await page.goBack();await page.waitForURL(/#chapter-2$/);await settled(page);
    assert.equal(await page.locator('.chapter-switch [aria-current=true]').innerText(),"II");
    await page.getByRole("button",{name:"开启声音"}).click();
    assert.equal(await page.getByRole("button",{name:"关闭声音"}).getAttribute("aria-pressed"),"true");
    await page.close();console.log(`${name}: image load, navigation, scroll, history, sound; cloth changed ${delta} of sampled channels`);
  }
  const page=await browser.newPage({reducedMotion:"reduce",viewport:{width:360,height:640}});watch(page);
  await page.goto(`${base}#pulse`);await page.getByRole("heading",{name:"PULSE"}).waitFor();
  assert.equal(await page.locator("[data-pinned]").count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.keyboard.press("Escape");await page.waitForURL(/#chapter-2$/);
  await page.close();
  const series=await browser.newPage({viewport:{width:1280,height:800}});watch(series);
  for(const id of ["lacune","liaison","galop","signal","pulse"]){
    await series.goto(`${base}#${id}`);
    await series.waitForFunction(title=>document.querySelector("article h1")?.textContent===title,id.toUpperCase());
    await settled(series);await series.waitForSelector("[data-printed]",{timeout:20000});
    const ink=await series.evaluate(()=>{
      const c=document.querySelector("article canvas"),ctx=c.getContext("2d");
      return new Set([.1,.25,.45,.55,.7,.9].map(x=>ctx.getImageData(Math.floor(c.width*x),Math.floor(c.height*.51),1,1).data.join(","))).size;
    });
    assert.ok(ink>2,`${id} needs a real, nonblank print`);
  }
  await series.locator(".collection-end").scrollIntoViewIfNeeded();
  assert.equal(await series.locator(".collection-grid button").count(),5);
  await series.locator(".collection-grid button").nth(1).click();await series.waitForURL(/#liaison$/);await settled(series);
  await series.close();assert.deepEqual(problems,[]);console.log("All five photographic plates, end index, reduced motion, direct links and console/network checks passed.");
}finally{await browser.close();}
