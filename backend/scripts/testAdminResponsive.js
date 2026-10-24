/**
 * CareerSetu — Admin Mobile Responsiveness Verification Script
 * Uses Chrome DevTools Protocol (CDP) to render and test all admin pages
 * at 320px, 360px, 390px, 430px, and 1200px viewports.
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

// 1. Static mock server to serve files from F:\CEP and mock admin APIs
function createTestServer() {
  const rootDir = path.resolve(__dirname, '..', '..');

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = url.pathname;

    // Mock Admin API endpoints
    if (pathname === '/api/admin/me') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'success',
        admin: { email: 'admin@careersetu.local', fullName: 'Test Administrator', role: 'admin' }
      }));
    }

    if (pathname === '/api/admin/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'success',
        stats: {
          totalRegisteredStudents: 154,
          fullyCompletedProfiles: 112,
          completionRate: 73,
          aiGuidanceGenerated: 89,
          totalGuestSessions: 42
        }
      }));
    }

    if (pathname === '/api/admin/students') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const students = [
        {
          _id: 's1',
          email: 'rahul.sharma@example.com',
          profileComplete: true,
          educationComplete: true,
          interestComplete: true,
          personalInfo: { fullName: 'Rahul Sharma', phone: '9876543210', location: 'Indore, MP', age: 19, gender: 'Male' },
          education: { eduLevel: '12th Standard', stream: 'PCM (Science)', marks: '85%', subjects: 'Physics, Chemistry, Maths' },
          careerInterest: { field: 'Computer Science & Software Development', preference: 'High Salary & Job Stability', skills: 'Python, Web Basics' },
          aiResult: {
            status: 'success',
            parsedResult: {
              summary: 'Excellent alignment with software engineering and data analysis.',
              recommendedCareers: [
                { title: 'Software Engineer', whyFit: 'Strong aptitude for math and logical reasoning.' },
                { title: 'Data Analyst', whyFit: 'High demand for analytical problem solvers.' }
              ]
            }
          },
          createdAt: new Date().toISOString()
        },
        {
          _id: 's2',
          email: 'priya.verma@example.com',
          profileComplete: false,
          educationComplete: true,
          interestComplete: false,
          personalInfo: { fullName: 'Priya Verma', phone: '9123456780', location: 'Bhopal, MP', age: 17, gender: 'Female' },
          education: { eduLevel: '10th Standard', stream: 'General', marks: '78%', subjects: 'Science, Maths, English' },
          careerInterest: { field: 'Medical & Healthcare' },
          createdAt: new Date().toISOString()
        }
      ];
      return res.end(JSON.stringify({
        status: 'success',
        students,
        total: 2,
        page: 1,
        totalPages: 1
      }));
    }

    if (pathname.startsWith('/api/admin/students/')) {
      const studentId = pathname.split('/').pop();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'success',
        student: {
          _id: studentId,
          email: 'rahul.sharma@example.com',
          personalInfo: { fullName: 'Rahul Sharma', phone: '9876543210', location: 'Indore, MP', age: 19, gender: 'Male' },
          education: { eduLevel: '12th Standard', stream: 'PCM (Science)', marks: '85%', subjects: 'Physics, Chemistry, Maths' },
          careerInterest: { field: 'Computer Science & Software Development', preference: 'High Salary', skills: 'Python' },
          aiResult: {
            status: 'success',
            parsedResult: {
              summary: 'Strong fit for technology careers.',
              recommendedCareers: [{ title: 'Full Stack Engineer', whyFit: 'Strong technical background.' }]
            }
          }
        }
      }));
    }

    // Serve static files
    if (pathname === '/' || pathname === '/admin' || pathname === '/admin/') {
      pathname = '/admin/login.html';
    }

    let filePath = path.join(rootDir, pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(rootDir, pathname, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

// 2. CDP Client over WebSocket
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

async function run() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║       CareerSetu — Admin Mobile Responsiveness Test Suite          ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const { server, port } = await createTestServer();
  console.log(`ℹ️ Test static server listening on http://127.0.0.1:${port}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cdpPort = 9335;
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    'about:blank'
  ]);

  // Wait for CDP port
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
      { name: 'Galaxy / Android Compact', width: 360, height: 640 },
      { name: 'iPhone 12 / 13 / 14', width: 390, height: 844 },
      { name: 'iPhone 14 / 15 / 16 Pro Max', width: 430, height: 932 },
      { name: 'Standard Desktop Monitor', width: 1200, height: 800 }
    ];

    // =========================================================================
    // TEST 1: admin/login.html
    // =========================================================================
    console.log('\n--- 1. Testing Admin Login (admin/login.html) ---');
    for (const vp of viewports) {
      console.log(`\n📱 Viewport: ${vp.name} (${vp.width}x${vp.height}px)`);
      await cdp.setViewport(vp.width, vp.height);
      await cdp.navigate(`http://127.0.0.1:${port}/admin/login.html`);

      const metrics = await cdp.eval(`
        (() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
          const clientWidth = window.innerWidth;
          const loginBox = document.querySelector('.admin-login-box');
          const boxRect = loginBox ? loginBox.getBoundingClientRect() : null;
          const submitBtn = document.querySelector('#adminSubmitBtn');
          const submitRect = submitBtn ? submitBtn.getBoundingClientRect() : null;
          const passToggle = document.querySelector('#toggleAdminPassword');
          const toggleRect = passToggle ? passToggle.getBoundingClientRect() : null;
          const emailInput = document.querySelector('#adminEmail');
          const inputFontSize = emailInput ? window.getComputedStyle(emailInput).fontSize : '0px';

          // Check any overflowing elements
          const overflows = [];
          document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > window.innerWidth + 1.5 && r.width > 0 && r.height > 0) {
              overflows.push(el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''));
            }
          });

          return {
            scrollWidth,
            clientWidth,
            hasOverflow: scrollWidth > clientWidth,
            boxWidth: boxRect ? boxRect.width : 0,
            submitHeight: submitRect ? submitRect.height : 0,
            toggleWidth: toggleRect ? toggleRect.width : 0,
            toggleHeight: toggleRect ? toggleRect.height : 0,
            inputFontSize: parseFloat(inputFontSize),
            overflowCount: overflows.length,
            overflowSample: overflows.slice(0, 3)
          };
        })()
      `);

      assert(!metrics.hasOverflow, `No horizontal overflow (scrollWidth: ${metrics.scrollWidth}px <= clientWidth: ${metrics.clientWidth}px)`);
      assert(metrics.overflowCount === 0, `No overflowing child elements (count: ${metrics.overflowCount})`);
      assert(metrics.boxWidth <= vp.width, `Login card width (${Math.round(metrics.boxWidth)}px) fits comfortably within viewport (${vp.width}px)`);
      assert(metrics.submitHeight >= 42, `Submit button touch target height (${Math.round(metrics.submitHeight)}px >= 42px)`);
      assert(metrics.toggleWidth >= 36 && metrics.toggleHeight >= 36, `Password visibility toggle touch target (${Math.round(metrics.toggleWidth)}x${Math.round(metrics.toggleHeight)}px)`);
      if (vp.width <= 480) {
        assert(metrics.inputFontSize >= 16, `Input font-size on mobile is ${metrics.inputFontSize}px (>= 16px to prevent iOS auto-zoom)`);
      }
    }

    // =========================================================================
    // TEST 2: admin/dashboard.html
    // =========================================================================
    console.log('\n--- 2. Testing Admin Dashboard (admin/dashboard.html) ---');
    for (const vp of viewports) {
      console.log(`\n📱 Viewport: ${vp.name} (${vp.width}x${vp.height}px)`);
      await cdp.setViewport(vp.width, vp.height);

      // Pre-seed session storage before loading dashboard
      await cdp.navigate(`http://127.0.0.1:${port}/admin/login.html`);
      await cdp.eval(`
        sessionStorage.setItem('admin_token', 'test_admin_token_2026');
        sessionStorage.setItem('admin_logged_in', 'true');
        sessionStorage.setItem('admin_name', 'Test Administrator');
      `);

      await cdp.navigate(`http://127.0.0.1:${port}/admin/dashboard.html`);
      // Wait for async fetch of stats and students
      await new Promise((r) => setTimeout(r, 800));

      const dashMetrics = await cdp.eval(`
        (() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
          const clientWidth = window.innerWidth;

          // Check overflowing elements
          const overflows = [];
          document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > window.innerWidth + 1.5 && r.width > 0 && r.height > 0) {
              const id = el.id ? '#' + el.id : '';
              const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
              overflows.push(el.tagName.toLowerCase() + id + cls);
            }
          });

          // Check Navbar elements
          const navToggle = document.querySelector('#adminNavToggle');
          const toggleDisplay = navToggle ? window.getComputedStyle(navToggle).display : 'none';
          const navActions = document.querySelector('#adminNavActions');
          const isNavOpen = navActions ? navActions.classList.contains('open') : false;

          // Check Stat Cards grid
          const statsGrid = document.querySelector('.admin-stats-grid');
          const statCards = document.querySelectorAll('.admin-stat-card');
          const firstCard = statCards[0] ? statCards[0].getBoundingClientRect() : null;
          const secondCard = statCards[1] ? statCards[1].getBoundingClientRect() : null;
          const cardsStacked = firstCard && secondCard ? secondCard.top >= firstCard.bottom - 4 : false;

          // Check Table cards vs table
          const studentRows = document.querySelectorAll('#studentTableBody tr');
          const firstRow = studentRows[0] ? studentRows[0].getBoundingClientRect() : null;
          const thead = document.querySelector('.admin-table thead');
          const theadDisplay = thead ? window.getComputedStyle(thead).display : 'table-header-group';

          // Check Search input
          const searchInput = document.querySelector('#adminSearchInput');
          const searchRect = searchInput ? searchInput.getBoundingClientRect() : null;

          return {
            scrollWidth,
            clientWidth,
            hasOverflow: scrollWidth > clientWidth,
            overflowCount: overflows.length,
            overflowSample: overflows.slice(0, 3),
            toggleDisplay,
            cardsStacked,
            firstCardWidth: firstCard ? firstCard.width : 0,
            firstRowWidth: firstRow ? firstRow.width : 0,
            theadDisplay,
            searchWidth: searchRect ? searchRect.width : 0
          };
        })()
      `);

      assert(!dashMetrics.hasOverflow, `Dashboard has no horizontal overflow (scrollWidth: ${dashMetrics.scrollWidth}px <= clientWidth: ${dashMetrics.clientWidth}px)`);
      assert(dashMetrics.overflowCount === 0, `Zero overflowing elements on dashboard (sample: ${JSON.stringify(dashMetrics.overflowSample)})`);

      if (vp.width <= 768) {
        assert(dashMetrics.toggleDisplay === 'flex', `Mobile hamburger navigation toggle is visible (display: ${dashMetrics.toggleDisplay})`);
        assert(dashMetrics.theadDisplay === 'none', `Table headers hidden in card mode on mobile (thead display: none)`);
        assert(dashMetrics.firstRowWidth <= vp.width, `Student record card width (${Math.round(dashMetrics.firstRowWidth)}px) fits viewport (${vp.width}px)`);
      } else {
        assert(dashMetrics.toggleDisplay === 'none', `Mobile hamburger toggle is hidden on desktop (display: none)`);
        assert(dashMetrics.theadDisplay !== 'none', `Full table headers visible on desktop (display: ${dashMetrics.theadDisplay})`);
      }

      if (vp.width <= 600) {
        assert(dashMetrics.cardsStacked, `Dashboard metric cards stack neatly in single column (first card width: ${Math.round(dashMetrics.firstCardWidth)}px)`);
      }
    }

    // =========================================================================
    // TEST 3: Navigation Drawer Interaction & Student Details Modal Test
    // =========================================================================
    console.log('\n--- 3. Testing Navigation Drawer & Modal Interactivity (360px) ---');
    await cdp.setViewport(360, 640);
    await cdp.navigate(`http://127.0.0.1:${port}/admin/dashboard.html`);
    await new Promise((r) => setTimeout(r, 600));

    // Test Nav toggle click
    const navClickResult = await cdp.eval(`
      (() => {
        const toggle = document.querySelector('#adminNavToggle');
        const actions = document.querySelector('#adminNavActions');
        const backdrop = document.querySelector('#adminNavBackdrop');
        if (!toggle) return { error: 'No toggle' };

        // Click toggle to open
        toggle.click();
        const isOpenAfterClick = actions.classList.contains('open');
        const ariaAfterClick = toggle.getAttribute('aria-expanded');
        const isBackdropOpen = backdrop.classList.contains('open');

        // Click backdrop to close
        backdrop.click();
        const isClosedAfterBackdrop = !actions.classList.contains('open');

        return {
          isOpenAfterClick,
          ariaAfterClick,
          isBackdropOpen,
          isClosedAfterBackdrop
        };
      })()
    `);

    assert(navClickResult.isOpenAfterClick, 'Clicking hamburger toggle opens mobile navigation drawer (.open added)');
    assert(navClickResult.ariaAfterClick === 'true', 'Hamburger toggle updates aria-expanded to "true"');
    assert(navClickResult.isBackdropOpen, 'Mobile nav backdrop activates (.open added)');
    assert(navClickResult.isClosedAfterBackdrop, 'Clicking backdrop cleanly closes mobile navigation drawer');

    // Test Student Detail Modal open & responsive sizing
    const modalTest = await cdp.eval(`
      (() => {
        const viewBtn = document.querySelector('.btn-view-student');
        if (!viewBtn) return { error: 'No view button' };
        viewBtn.click();

        return new Promise((resolve) => {
          setTimeout(() => {
            const modal = document.querySelector('#studentDetailModal');
            const modalBox = document.querySelector('.admin-modal');
            const modalRect = modalBox ? modalBox.getBoundingClientRect() : null;
            const closeBtn = document.querySelector('#btnCloseModal');
            const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
            const isOpen = modal ? modal.classList.contains('open') : false;

            // Close modal
            if (closeBtn) closeBtn.click();
            const isClosed = modal ? !modal.classList.contains('open') : false;

            resolve({
              isOpen,
              isClosed,
              modalWidth: modalRect ? modalRect.width : 0,
              modalRight: modalRect ? modalRect.right : 0,
              windowWidth: window.innerWidth,
              closeWidth: closeRect ? closeRect.width : 0,
              closeHeight: closeRect ? closeRect.height : 0
            });
          }, 400);
        });
      })()
    `);

    assert(modalTest.isOpen, 'Clicking "View Details" successfully opens student modal dialog');
    assert(modalTest.modalWidth <= modalTest.windowWidth, `Modal dialog width (${Math.round(modalTest.modalWidth)}px) fits within viewport (${modalTest.windowWidth}px)`);
    assert(modalTest.modalRight <= modalTest.windowWidth + 2, `Modal dialog right edge (${Math.round(modalTest.modalRight)}px) does not overflow viewport (${modalTest.windowWidth}px)`);
    assert(modalTest.closeWidth >= 40 && modalTest.closeHeight >= 40, `Modal close button touch target is finger-friendly (${Math.round(modalTest.closeWidth)}x${Math.round(modalTest.closeHeight)}px >= 40px)`);
    assert(modalTest.isClosed, 'Clicking close button cleanly dismisses student modal dialog');

    // =========================================================================
    // TEST 4: admin/students.html
    // =========================================================================
    console.log('\n--- 4. Testing Students Redirect Page (admin/students.html) ---');
    for (const vp of [viewports[0], viewports[2]]) {
      console.log(`📱 Viewport: ${vp.name} (${vp.width}x${vp.height}px)`);
      await cdp.setViewport(vp.width, vp.height);
      await cdp.navigate(`http://127.0.0.1:${port}/admin/students.html`);

      const stuMetrics = await cdp.eval(`
        (() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
          const clientWidth = window.innerWidth;
          return {
            scrollWidth,
            clientWidth,
            hasOverflow: scrollWidth > clientWidth
          };
        })()
      `);

      assert(!stuMetrics.hasOverflow, `admin/students.html fits viewport with zero overflow (${stuMetrics.scrollWidth}px <= ${stuMetrics.clientWidth}px)`);
    }

  } catch (err) {
    console.error('Fatal CDP test error:', err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    chromeProcess.kill();
    server.close();
  }

  console.log('\n====================================================');
  console.log(`Result: ${passedChecks} of ${totalChecks} checks passed.`);
  console.log('====================================================');
  if (passedChecks === totalChecks) {
    console.log('🎉 Mobile responsiveness for all Admin Panel pages verified successfully!\n');
  } else {
    console.error('❌ Some mobile responsiveness checks failed.\n');
  }
}

run();
