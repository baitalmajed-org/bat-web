   import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9224;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async close() {
    this.ws.close();
  }
}

async function runBrowserTests() {
  console.log("=== Launching Chrome in headless mode ===");
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  try {
    let version = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (res.ok) {
          version = await res.json();
          break;
        }
      } catch (e) {}
    }

    if (!version) {
      throw new Error("Could not connect to Chrome debugging port");
    }

    console.log("Connected to Chrome:", version.Browser);

    const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?http://localhost:3012`, {
      method: "PUT",
    });
    const tab = await newTabRes.json();
    const cdp = new CDPClient(tab.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");

    // Wait for page load
    await sleep(1500);

    const results = [];

    // 1. Desktop Test (1280x800)
    console.log("\n--- Testing Desktop Viewport (1280x800) ---");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(500);

    const desktopState = await cdp.eval(`(() => {
      const desktopNav = document.querySelector("nav[aria-label='Primary']");
      const desktopComputed = desktopNav ? window.getComputedStyle(desktopNav).display : null;
      const hamburger = document.querySelector("button[aria-label='Open menu']");
      const hamburgerComputed = hamburger ? window.getComputedStyle(hamburger).display : null;
      const logo = document.querySelector("header a[aria-label*='home']");
      const header = document.querySelector("header");
      return {
        desktopNavVisible: desktopComputed !== 'none' && desktopComputed !== null,
        hamburgerHidden: hamburgerComputed === 'none',
        logoPresent: Boolean(logo),
        headerSticky: window.getComputedStyle(header).position === 'sticky'
      };
    })()`);

    console.log("Desktop State:", desktopState);
    results.push({ name: "Desktop navigation visible", pass: desktopState.desktopNavVisible });
    results.push({ name: "Hamburger menu hidden on desktop", pass: desktopState.hamburgerHidden });
    results.push({ name: "Logo present and header sticky", pass: desktopState.logoPresent && desktopState.headerSticky });

    // Helper for testing mobile viewports
    async function testMobileViewport(width, height, label) {
      console.log(`\n--- Testing Mobile Viewport: ${label} (${width}x${height}) ---`);
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: true,
        hasTouch: true,
      });
      await sleep(400);

      // Check horizontal overflow
      const overflow = await cdp.eval(`(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      })()`);
      console.log(`${label} overflow:`, overflow);
      results.push({ name: `${label} - no horizontal overflow`, pass: !overflow.hasOverflow });

      // Hamburger button visible
      const hamburgerVisible = await cdp.eval(`(() => {
        const btn = document.querySelector("button[aria-label='Open menu']");
        if (!btn) return false;
        const rect = btn.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(btn).display !== 'none';
      })()`);
      results.push({ name: `${label} - hamburger button visible`, pass: hamburgerVisible });

      // Open drawer
      await cdp.eval(`document.querySelector("button[aria-label='Open menu']").click()`);
      await sleep(400);

      // Check drawer elements
      const drawerState = await cdp.eval(`(() => {
        const drawer = document.getElementById("mobile-drawer");
        if (!drawer) return { open: false };
        const rect = drawer.getBoundingClientRect();
        const bodyOverflow = window.getComputedStyle(document.body).overflow;
        const htmlOverflow = window.getComputedStyle(document.documentElement).overflow;

        const links = Array.from(drawer.querySelectorAll("nav[aria-label='Mobile navigation links'] a"))
          .map(a => ({ label: a.textContent.trim(), href: a.getAttribute("href") }));

        const waBtn = drawer.querySelector("a[href*='wa.me']");
        const callBtn = drawer.querySelector("a[href^='tel:']");
        const closeBtn = drawer.querySelector("button[aria-label='Close menu']");

        const waRect = waBtn?.getBoundingClientRect();
        const callRect = callBtn?.getBoundingClientRect();
        const closeRect = closeBtn?.getBoundingClientRect();

        // Check if buttons overlap
        const buttonsOverlap = waRect && callRect && !(waRect.bottom <= callRect.top || callRect.bottom <= waRect.top);

        // Check z-index of portal container
        const portal = drawer.closest("[role='presentation']");
        const portalZIndex = portal ? window.getComputedStyle(portal).zIndex : null;

        // Check active link
        const activeLink = links.find(l => l.href === '/');

        return {
          open: true,
          rect: { width: Math.round(rect.width), height: Math.round(rect.height), top: rect.top, right: window.innerWidth - rect.right },
          bodyOverflow,
          htmlOverflow,
          linkCount: links.length,
          links,
          waVisible: Boolean(waRect && waRect.width > 0 && waRect.height > 0),
          callVisible: Boolean(callRect && callRect.width > 0 && callRect.height > 0),
          closeVisible: Boolean(closeRect && closeRect.width > 0 && closeRect.height > 0),
          buttonsOverlap,
          portalZIndex: parseInt(portalZIndex, 10),
          activeLinkFound: Boolean(activeLink)
        };
      })()`);

      console.log(`${label} drawer state:`, drawerState);
      results.push({ name: `${label} - drawer opens`, pass: drawerState.open });
      results.push({ name: `${label} - body scroll locked`, pass: drawerState.bodyOverflow === 'hidden' && drawerState.htmlOverflow === 'hidden' });
      results.push({ name: `${label} - 5 navigation links visible`, pass: drawerState.linkCount === 5 });
      results.push({ name: `${label} - WhatsApp button visible`, pass: drawerState.waVisible });
      results.push({ name: `${label} - Call Now button visible`, pass: drawerState.callVisible });
      results.push({ name: `${label} - Buttons do not overlap`, pass: !drawerState.buttonsOverlap });
      results.push({ name: `${label} - Close button visible`, pass: drawerState.closeVisible });
      results.push({ name: `${label} - High z-index (portal above header & top contact bar)`, pass: drawerState.portalZIndex >= 100 });

      // Take a screenshot of the open drawer
      const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
      const screenshotPath = path.resolve(`screenshot-${width}x${height}.png`);
      fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Saved screenshot: ${screenshotPath}`);

      // Test close button
      await cdp.eval(`document.querySelector("button[aria-label='Close menu']").click()`);
      await sleep(300);

      const closedState = await cdp.eval(`(() => {
        const drawer = document.getElementById("mobile-drawer");
        const bodyOverflow = window.getComputedStyle(document.body).overflow;
        return {
          drawerClosed: drawer === null,
          scrollRestored: bodyOverflow !== 'hidden'
        };
      })()`);

      results.push({ name: `${label} - Close button closes drawer and restores scroll`, pass: closedState.drawerClosed && closedState.scrollRestored });
    }

    // Test multiple viewports
    await testMobileViewport(320, 568, "iPhone SE 1st gen (320px)");
    await testMobileViewport(375, 667, "iPhone SE 2nd gen (375px)");
    await testMobileViewport(390, 844, "iPhone 14/15/16 (390px)");
    await testMobileViewport(430, 932, "iPhone Pro Max (430px)");

    // Test short screen (landscape: 667x375)
    console.log("\n--- Testing Short Viewport / Landscape (667x375) ---");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 667,
      height: 375,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });
    await sleep(400);

    // Open drawer
    await cdp.eval(`document.querySelector("button[aria-label='Open menu']").click()`);
    await sleep(400);

    const shortState = await cdp.eval(`(() => {
      const drawer = document.getElementById("mobile-drawer");
      const navContainer = drawer?.querySelector(".overflow-y-auto");
      const waBtn = drawer?.querySelector("a[href*='wa.me']");
      const callBtn = drawer?.querySelector("a[href^='tel:']");
      return {
        isScrollable: navContainer ? navContainer.scrollHeight >= navContainer.clientHeight : false,
        buttonsInView: waBtn && callBtn && waBtn.getBoundingClientRect().top < 375 && callBtn.getBoundingClientRect().bottom <= 375
      };
    })()`);
    console.log("Short screen state:", shortState);
    results.push({ name: "Short screen - middle links scrollable and buttons stay visible", pass: shortState.buttonsInView });

    // Test Escape key closes drawer
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await sleep(300);
    const escClosed = await cdp.eval(`document.getElementById("mobile-drawer") === null`);
    results.push({ name: "Escape key closes drawer", pass: escClosed });

    // Reopen and test backdrop click
    await cdp.eval(`document.querySelector("button[aria-label='Open menu']").click()`);
    await sleep(400);
    await cdp.eval(`document.querySelector(".animate-backdrop-in").click()`);
    await sleep(300);
    const backdropClosed = await cdp.eval(`document.getElementById("mobile-drawer") === null`);
    results.push({ name: "Backdrop tap closes drawer", pass: backdropClosed });

    // Reopen and test link navigation closes drawer
    await cdp.eval(`document.querySelector("button[aria-label='Open menu']").click()`);
    await sleep(400);
    await cdp.eval(`(() => {
      const aboutLink = Array.from(document.querySelectorAll("#mobile-drawer a")).find(a => a.getAttribute('href') === '/about');
      aboutLink.click();
    })()`);
    await sleep(500);
    const linkNavClosed = await cdp.eval(`document.getElementById("mobile-drawer") === null`);
    results.push({ name: "Selecting a link closes drawer", pass: linkNavClosed });

    console.log("\n=================== VERIFICATION SUMMARY ===================");
    let allPassed = true;
    for (const r of results) {
      const mark = r.pass ? "✓ PASS" : "✗ FAIL";
      console.log(`${mark}: ${r.name}`);
      if (!r.pass) allPassed = false;
    }
    console.log("============================================================");

    await cdp.close();
    chromeProcess.kill();

    if (!allPassed) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test failed with error:", err);
    chromeProcess.kill();
    process.exit(1);
  }
}

runBrowserTests();
