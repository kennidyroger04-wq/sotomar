const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const url = process.argv[2] || "http://127.0.0.1:8989/index.html";
const output = process.argv[3] || "docs/reports/g18a";
const sizes = [
  { width: 390, height: 844, name: "mobile-390x844", mobile: true },
  { width: 844, height: 390, name: "mobile-844x390", mobile: true },
  { width: 360, height: 800, name: "mobile-360x800", mobile: true },
  { width: 1280, height: 720, name: "desktop-1280x720", mobile: false },
];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--disable-dev-shm-usage"],
  });
  const results = [];
  for (const size of sizes) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: 1,
      isMobile: size.mobile,
      hasTouch: size.mobile,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("requestfailed", (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ""}`));
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(() => document.querySelector("canvas") !== null, null, { timeout: 30000 });
    await page.waitForTimeout(7000);
    const canvasCount = await page.locator("canvas").count();
    await page.screenshot({ path: path.join(output, `${size.name}-selection.png`) });
    await page.mouse.click(size.width * 0.88, size.height - 40);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(output, `${size.name}.png`) });
    await page.mouse.click(size.width - 90, 92);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(output, `${size.name}-inventory.png`) });
    results.push({ viewport: `${size.width}x${size.height}`, canvasCount, errors, gameplay_capture: true });
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(output, "browser-check.json"), JSON.stringify({ url, results }, null, 2) + "\n");
  console.log(JSON.stringify(results, null, 2));
  if (results.some((result) => result.canvasCount === 0 || result.errors.length > 0)) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
