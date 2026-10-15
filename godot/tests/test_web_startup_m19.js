const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "../..");
const url = process.argv[2] || "http://127.0.0.1:8993/index.html";
const captures = path.join(root, "reports/mission19");
const sizes = [[360, 800], [390, 844], [844, 390], [1280, 720]];

(async () => {
  fs.mkdirSync(captures, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  const runtimeFiles = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", (request) => errors.push(`${request.url()} ${request.failure()?.errorText || ""}`));
  page.on("response", (response) => {
    if (/\.(wasm|pck|js)(?:\?|$)/.test(response.url())) runtimeFiles.push({ url: response.url(), status: response.status() });
  });

  await page.goto(url, { waitUntil: "load", timeout: 45000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    return canvas && canvas.width > 0 && canvas.height > 0;
  }, null, { timeout: 45000 });
  await page.waitForTimeout(1800);

  const viewportResults = [];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(250);
    const canvas = await page.locator("canvas").evaluate((node) => ({
      width: node.width,
      height: node.height,
      rect: node.getBoundingClientRect().toJSON(),
    }));
    assert.ok(canvas.width > 0 && canvas.height > 0, `canvas initialized at ${width}x${height}`);
    viewportResults.push({ viewport: `${width}x${height}`, canvas });
    await page.screenshot({ path: path.join(captures, `web-startup-${width}x${height}.png`) });
  }
  assert.ok(runtimeFiles.some((entry) => entry.url.endsWith(".wasm") && entry.status === 200), "Godot WASM loaded successfully");
  assert.ok(runtimeFiles.some((entry) => entry.url.endsWith(".pck") && entry.status === 200), "Godot resource pack loaded successfully");
  assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);

  const result = {
    url,
    title: await page.title(),
    canvas: true,
    runtimeFiles,
    viewports: viewportResults,
    browser: "Chromium with headless SwiftShader WebGL",
    physicalSafariTest: "not performed; requires a real iPhone/iOS Safari",
    errors,
  };
  fs.writeFileSync(path.join(captures, "web-startup-check.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`PASS: Godot Web startup, WASM/PCK and ${sizes.length} responsive viewports; no JavaScript, console or network errors`);
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
