import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const url=process.env.PREVIEW_URL??"https://eventlp02-commits.github.io/liang-ping-jewelry/";
const proof=resolve(process.env.PROOF_DIR??"../framing-proof");
await mkdir(proof,{recursive:true});
const browser=await chromium.launch({channel:"chrome",headless:true,args:["--enable-unsafe-swiftshader"]});
try{
  for(const [name,width,height] of [["desktop",1440,900],["mobile",390,844]]){
    for(const id of ["lacune","liaison","galop","signal","pulse"]){
      const page=await browser.newPage({viewport:{width,height},hasTouch:name==="mobile"});
      await page.goto(`${url}#${id}`);
      await page.waitForSelector("[data-framed][data-printed]",{timeout:20000});
      const bounds=()=>page.evaluate(()=>{
        const photo=document.querySelector("[data-material-stage] img");
        const r=photo.getBoundingClientRect();
        return {width:r.width,height:r.height,left:r.left,top:r.top,
          naturalWidth:photo.naturalWidth,naturalHeight:photo.naturalHeight};
      });
      const first=await bounds();
      assert.ok(first.width<=width*.82&&first.height<=height*.76,
        `${name} ${id}: opening image must fit inside the viewport (${JSON.stringify(first)})`);
      assert.ok(first.left>=0&&first.top>=0&&first.width<=first.naturalWidth+1,
        `${name} ${id}: opening photo should be whole and not stretched beyond its original dimensions`);
      if(id==="signal")await page.screenshot({path:resolve(proof,`${name}-opening.png`)});
      await page.getByRole("button",{name:"III · 局部特写"}).click();
      await page.waitForFunction(()=>Number(document.querySelector('input[aria-label="观看进度"]').value)>94);
      const detail=await bounds();
      assert.ok(detail.width<=width*.9&&detail.height<=height*.85&&detail.width<=detail.naturalWidth+1,
        `${name} ${id}: scrolling must keep the photo at a restrained scale (${JSON.stringify(detail)})`);
      if(id==="signal")await page.screenshot({path:resolve(proof,`${name}-detail.png`)});
      console.log(`${name} ${id}: opening ${Math.round(first.width)}x${Math.round(first.height)}, detail ${Math.round(detail.width)}x${Math.round(detail.height)}`);
      await page.close();
    }
    console.log(`${name}: all five works fit at opening and during detail view`);
  }
}finally{await browser.close();}
