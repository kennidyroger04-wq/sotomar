const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const url = process.argv[2] || "http://127.0.0.1:8992/index.html";
const out = process.argv[3] || "reports/g18c/captures";
const viewports = [
  ["mobile-portrait-390x844", 390, 844],
  ["mobile-landscape-844x390", 844, 390],
  ["mobile-small-360x800", 360, 800],
  ["desktop-1280x720", 1280, 720],
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--disable-dev-shm-usage"]});
  const page = await browser.newPage({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
  const errors=[];
  page.on("pageerror", e=>errors.push(e.message));
  page.on("console", m=>{if(m.type()==="error") errors.push(m.text());});
  page.on("requestfailed", r=>errors.push(`${r.url()} ${r.failure()?.errorText||""}`));
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForFunction(()=>document.querySelector("canvas"),null,{timeout:60000});
  await page.waitForTimeout(2500);
  await page.mouse.click(195, 806);
  await page.waitForTimeout(6500);
  for(const [name,width,height] of viewports){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(1200);
    await page.screenshot({path:path.join(out,`${name}.png`)});
  }
  const runtime={url,canvas:!!(await page.$("canvas")),title:await page.title(),errors,viewports};
  fs.writeFileSync(path.join(out,"runtime-check.json"),JSON.stringify(runtime,null,2)+"\n");
  console.log(JSON.stringify(runtime));
  await browser.close();
  if(errors.length) process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
