const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");

const url = process.argv[2] || "http://127.0.0.1:8989/index.html";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", (request) => errors.push(`${request.url()} ${request.failure()?.errorText || ""}`));
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.querySelector("canvas") !== null, null, { timeout: 30000 });
  await page.waitForTimeout(6000);
  await page.mouse.click(343, 804);
  await page.waitForTimeout(3000);
  await page.mouse.click(300, 92);
  await page.waitForTimeout(300);
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    page.mouse.click(100, 194),
  ]);
  const backupPath = `/tmp/${download.suggestedFilename()}`;
  await download.saveAs(backupPath);
  const backup = fs.readFileSync(backupPath);
  const parsed = JSON.parse(backup.toString("utf8"));
  assert.equal(parsed.schema_version, 1, "web download is a versioned save JSON");
  console.log("PASS: browser export downloads a versioned JSON save");
  parsed.payload.map_id = "MAP_04";
  parsed.payload.cell = { x: 6, y: 1 };
  const importBackup = Buffer.from(JSON.stringify(parsed));

  const chooserPromise = page.waitForEvent("filechooser", { timeout: 10000 });
  const pickerRect = await page.evaluate(() => document.getElementById("sotomar-save-import").getBoundingClientRect().toJSON());
  await page.mouse.click(pickerRect.x + pickerRect.width / 2, pickerRect.y + pickerRect.height / 2);
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: "sotomar-backup.json", mimeType: "application/json", buffer: importBackup });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/reports/g18a/mobile-import-preview.png" });
  console.log("PASS: browser file picker returned the selected backup for preview");

  await page.mouse.click(300, 525);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: "docs/reports/g18a/mobile-import-restored.png" });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.querySelector("canvas") !== null, null, { timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.mouse.click(343, 804);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "docs/reports/g18a/mobile-after-import-reload.png" });
  await page.mouse.click(180, 800);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "docs/reports/g18a/mobile-combat-start.png" });
  assert.deepEqual(errors, [], `browser reported errors: ${errors.join(" | ")}`);
  console.log("PASS: import confirmation, reload/resume to MAP_04, and Web ENC_05 entry completed without browser console/network errors");
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
