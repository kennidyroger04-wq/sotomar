const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");

const url = process.argv[2] || "http://127.0.0.1:8992/index.html";
const output = process.argv[3] || "reports/g18d/captures";
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||"/usr/bin/chromium",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
  page.on("requestfailed",r=>errors.push(`${r.url()} ${r.failure()?.errorText||""}`));
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForFunction(()=>document.querySelector("canvas"),null,{timeout:60000});
  await wait(4500);
  await page.mouse.click(343,804); await wait(1300);
  await page.mouse.click(300,92); await wait(300);
  const [download]=await Promise.all([page.waitForEvent("download"),page.mouse.click(100,194)]);
  const local="/tmp/g18d-map01.json"; await download.saveAs(local);
  const save=JSON.parse(fs.readFileSync(local,"utf8"));
  save.payload.map_id="MAP_01"; save.payload.cell={x:5,y:5};
  const chooserPromise=page.waitForEvent("filechooser");
  const bounds=await page.evaluate(()=>document.getElementById("sotomar-save-import").getBoundingClientRect().toJSON());
  await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await (await chooserPromise).setFiles({name:"g18d-map01.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(save))});
  await wait(600); await page.mouse.click(300,525); await wait(5000);
  await page.mouse.click(300,92); await wait(700);
  const captures=[];
  for(const [width,height,label] of [[360,800,"360x800"],[390,844,"390x844"],[844,390,"844x390"],[1280,720,"1280x720"]]){
    await page.setViewportSize({width,height}); await wait(500);
    const path=`${output}/map01-npcs-${label}.png`; await page.screenshot({path}); captures.push(path);
  }
  const state=await page.evaluate(()=>({canvas:!!document.querySelector("canvas"),title:document.title}));
  fs.writeFileSync(`${output}/npc-browser-check.json`,JSON.stringify({url,state,errors,map_id:"MAP_01",npcs:["NPC_MIRA","NPC_LIA","NPC_NILO","NPC_BRAM"],captures,validation:"Chromium Web emulation only; no physical device claim"},null,2)+"\n");
  assert.equal(state.canvas,true); assert.deepEqual(errors,[]);
  console.log("PASS: Chromium opened MAP_01 with the four existing NPC markers and captured four viewports without browser/runtime errors");
  await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1;});
