/**
 * CareerSetu — Student Profile Modal Responsiveness Test Suite
 * Tests the "My Profile" modal rendering and layout across 320px, 360px, 390px, 430px, and 1200px viewports
 * using Chrome DevTools Protocol (CDP).
 */

'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedChecks++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

function createTestServer() {
  const rootDir = path.resolve(__dirname, '..', '..');

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = url.pathname;

    if (pathname === '/' || pathname === '/index.html') {
      pathname = '/frontend/index.html';
    } else if (pathname.startsWith('/pages/')) {
      pathname = '/frontend' + pathname;
    } else if (pathname.startsWith('/css/') || pathname.startsWith('/js/') || pathname.startsWith('/assets/')) {
      pathname = '/frontend' + pathname;
    }

    const filePath = path.join(rootDir, pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found: ' + pathname);
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png'
    };

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 768
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 600));
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runProfileModalTests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║       CareerSetu — Student Profile Modal Responsiveness Tests       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const { server, port } = await createTestServer();
  console.log(`ℹ️ Test static server listening on http://127.0.0.1:${port}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cdpPort = 9340;
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 1200));

  let cdp;
  try {
    const verRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: 'PUT' });
    const target = await verRes.json();
    cdp = new CDPClient(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    const viewports = [
      { name: 'iPhone SE (Extra Small)', width: 320, height: 568 },
      { name: 'Galaxy / Android Compact (User Reference)', width: 360, height: 640 },
      { name: 'iPhone 12 / 13 / 14', width: 390, height: 844 },
      { name: 'iPhone Pro Max / Android Large', width: 430, height: 932 },
      { name: 'Standard Desktop Monitor', width: 1200, height: 800 }
    ];

    for (const vp of viewports) {
      console.log(`\n📱 Viewport: ${vp.name} (${vp.width}x${vp.height}px)`);

      await cdp.setViewport(vp.width, vp.height);
      await cdp.navigate(`http://127.0.0.1:${port}/pages/student-info.html`);

      // Inject student profile data matching user's exact screenshot
      await cdp.eval(`
        localStorage.setItem('student_profile', JSON.stringify({
          fullName: 'Vinit',
          email: 'vk1501758@gmail.com',
          phone: '9607133123'
        }));
        localStorage.setItem('student_education', JSON.stringify({
          eduLevel: 'Undergraduate',
          stream: 'Science (PCM)'
        }));
        localStorage.setItem('student_career_interest', JSON.stringify({
          field: 'Healthcare & Nursing'
        }));
      `);

      // 1. Verify modal title
      const titleText = await cdp.eval(`
        document.getElementById('profileModalTitle') ? document.getElementById('profileModalTitle').textContent.trim() : ''
      `);
      assert(titleText === 'My Profile', `Modal title is simply "My Profile" (got: "${titleText}")`);
      assert(!titleText.includes('Stitch Design 11'), 'Modal title does not contain "Stitch Design 11"');

      // 2. Open the modal
      await cdp.eval(`document.getElementById('viewProfileModalBtn').click();`);
      await new Promise(r => setTimeout(r, 200));

      const isDisplayed = await cdp.eval(`
        window.getComputedStyle(document.getElementById('profileCardModal')).display;
      `);
      assert(isDisplayed === 'flex', 'Modal opens on click (display: flex)');

      // 3. Check layout and overflow
      const metrics = await cdp.eval(`
        (() => {
          const modal = document.getElementById('profileCardModal');
          const dialog = modal.querySelector('.profile-modal-dialog');
          const card = modal.querySelector('.profile-card-section');

          const modalRect = modal.getBoundingClientRect();
          const dialogRect = dialog.getBoundingClientRect();

          const docOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
          const modalOverflow = modal.scrollWidth > modal.clientWidth;
          const dialogOverflow = dialog.scrollWidth > dialog.clientWidth;

          // Check that all value rows stay within the dialog width
          const rows = Array.from(modal.querySelectorAll('.profile-detail-row'));
          const rowClipping = rows.map(r => {
            const rect = r.getBoundingClientRect();
            return {
              label: r.querySelector('.profile-detail-label') ? r.querySelector('.profile-detail-label').textContent : '',
              rightOver: rect.right > (dialogRect.right + 2)
            };
          });

          // Check height fits screen
          const heightFitsScreen = dialogRect.height <= (window.innerHeight - 8);

          return {
            docOverflow,
            modalOverflow,
            dialogOverflow,
            hasRowClipping: rowClipping.some(r => r.rightOver),
            heightFitsScreen,
            dialogWidth: dialogRect.width,
            viewportWidth: window.innerWidth
          };
        })()
      `);

      assert(!metrics.docOverflow, 'Document has zero horizontal overflow');
      assert(!metrics.modalOverflow, 'Modal overlay has zero horizontal overflow');
      assert(!metrics.dialogOverflow, 'Modal dialog has zero horizontal overflow');
      assert(!metrics.hasRowClipping, 'All profile labels and values fit completely inside card without clipping');
      assert(metrics.heightFitsScreen, 'Modal height fits comfortably within screen height');
      assert(metrics.dialogWidth <= vp.width, `Modal dialog width (${Math.round(metrics.dialogWidth)}px) fits viewport (${vp.width}px)`);

      // 4. Verify close button
      const closeUsable = await cdp.eval(`
        (() => {
          const btn = document.getElementById('closeProfileModalBtn');
          const rect = btn.getBoundingClientRect();
          return {
            visible: rect.width > 0 && rect.height > 0,
            touchOk: rect.width >= 36 && rect.height >= 36,
            width: rect.width,
            height: rect.height
          };
        })()
      `);

      assert(closeUsable.visible, 'Close button is visible and properly positioned');
      assert(closeUsable.touchOk, `Close button touch target is finger-friendly (${Math.round(closeUsable.width)}x${Math.round(closeUsable.height)}px)`);

      // 5. Click close button
      await cdp.eval(`document.getElementById('closeProfileModalBtn').click();`);
      await new Promise(r => setTimeout(r, 100));

      const isClosed = await cdp.eval(`
        window.getComputedStyle(document.getElementById('profileCardModal')).display;
      `);
      assert(isClosed === 'none', 'Clicking close button dismisses modal cleanly');
    }

    // 6. Test accessibility / interactive closes
    console.log('\n--- Additional Usability Verification ---');
    await cdp.eval(`document.getElementById('viewProfileModalBtn').click();`);
    await new Promise(r => setTimeout(r, 100));

    // Backdrop overlay click
    await cdp.eval(`
      const modal = document.getElementById('profileCardModal');
      modal.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    `);
    await new Promise(r => setTimeout(r, 100));
    const closedBackdrop = await cdp.eval(`
      window.getComputedStyle(document.getElementById('profileCardModal')).display;
    `);
    assert(closedBackdrop === 'none', 'Clicking backdrop overlay dismisses modal');

    // Escape key
    await cdp.eval(`document.getElementById('viewProfileModalBtn').click();`);
    await new Promise(r => setTimeout(r, 100));
    await cdp.eval(`
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    `);
    await new Promise(r => setTimeout(r, 100));
    const closedEsc = await cdp.eval(`
      window.getComputedStyle(document.getElementById('profileCardModal')).display;
    `);
    assert(closedEsc === 'none', 'Pressing Escape key dismisses modal');

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    chromeProcess.kill();
    server.close();
  }

  console.log('\n====================================================');
  console.log(`Result: ${passedChecks} of ${totalChecks} checks passed.`);
  console.log('====================================================\n');
}

runProfileModalTests();
