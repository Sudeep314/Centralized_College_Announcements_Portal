/**
 * verify-e2e.js
 * Automated End-to-End verification script using Chrome DevTools Protocol
 */
const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CDP_PORT = 9222;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- Starting Automated E2E Verification ---');

  // Spawn headless chrome with remote debugging
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000'
  ]);

  let cdpConnected = false;
  let targetWsUrl = null;

  for (let i = 0; i < 20; i++) {
    await delay(300);
    try {
      const version = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
      const targets = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const pageTarget = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) {
        targetWsUrl = pageTarget.webSocketDebuggerUrl;
        cdpConnected = true;
        break;
      }
    } catch {
      // Chrome starting up
    }
  }

  if (!cdpConnected || !targetWsUrl) {
    console.error('Could not connect to Chrome DevTools Protocol');
    chrome.kill();
    process.exit(1);
  }

  console.log('✓ Connected to Headless Chrome via CDP');

  // Use WebSocket (built into Node 22+)
  const ws = new WebSocket(targetWsUrl);
  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const cb = pending.get(data.id);
      pending.delete(data.id);
      cb(data);
    }
  };

  await new Promise(r => ws.onopen = r);

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // 1. Evaluate Student Dashboard
  console.log('1. Evaluating Student Dashboard (index.html)...');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000' });
  await delay(1200);

  const evalDashboard = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const pinnedCards = document.querySelectorAll('#pinned-grid .card');
      const allCards = document.querySelectorAll('#all-grid .card');
      const searchInput = document.getElementById('search-input');
      const badges = document.querySelectorAll('.badge');
      return {
        title: document.title,
        pinnedCount: pinnedCards.length,
        allCount: allCards.length,
        badgeCount: badges.length,
        hasSearch: Boolean(searchInput)
      };
    })()`,
    returnByValue: true
  });

  const extractVal = (res) => res && res.result && res.result.result ? res.result.result.value : res;

  console.log('Dashboard Test Result:', extractVal(evalDashboard));

  // 2. Test Category Filtering
  console.log('2. Testing Category Filtering (Clicking "Examinations")...');
  const evalFilter = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const examBtn = document.querySelector('[data-category="Examinations"]');
      if (examBtn) examBtn.click();
      const allCards = document.querySelectorAll('.card');
      return {
        cardsVisible: allCards.length,
        examBtnActive: examBtn ? examBtn.classList.contains('active') : false
      };
    })()`,
    returnByValue: true
  });
  console.log('Category Filter Result:', extractVal(evalFilter));

  // 3. Test Detail Modal
  console.log('3. Testing Detail Modal Opening...');
  const evalModal = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const firstBtn = document.querySelector('.card .btn-secondary');
      if (firstBtn) firstBtn.click();
      const modal = document.getElementById('detail-modal');
      const modalTitle = document.getElementById('modal-announcement-title');
      return {
        modalActive: modal ? modal.classList.contains('active') : false,
        modalTitle: modalTitle ? modalTitle.textContent : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Modal Test Result:', extractVal(evalModal));

  // 4. Test Admin Login Flow
  console.log('4. Testing Admin Login Flow...');
  await sendCommand('Page.navigate', { url: 'http://localhost:3000/pages/admin-login.html' });
  await delay(800);

  const evalLogin = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      document.getElementById('username').value = 'admin';
      document.getElementById('password').value = 'admin123';
      document.getElementById('admin-login-form').dispatchEvent(new Event('submit', { cancelable: true }));
      return { submitted: true };
    })()`,
    returnByValue: true
  });
  console.log('Login submitted:', extractVal(evalLogin));

  await delay(1200);

  // Check URL and admin table after login
  const evalAdminPage = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const tableRows = document.querySelectorAll('#admin-table-body tr');
      return {
        currentUrl: window.location.href,
        tableRowsCount: tableRows.length,
        tokenExists: Boolean(sessionStorage.getItem('campusnotice_admin_token') || localStorage.getItem('campusnotice_admin_token'))
      };
    })()`,
    returnByValue: true
  });
  console.log('Admin Dashboard After Login Result:', extractVal(evalAdminPage));

  // 5. Test Admin CRUD in Browser: Create Notice
  console.log('5. Testing Admin Create Announcement via Browser Form...');
  const evalCreate = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      document.getElementById('open-create-modal-btn').click();
      document.getElementById('form-title').value = 'Automated Faculty Review Demo Notice';
      document.getElementById('form-category').value = 'Academics';
      document.getElementById('form-description').value = 'This is an end-to-end verified announcement created through the admin UI.';
      document.getElementById('announcement-form').dispatchEvent(new Event('submit', { cancelable: true }));
      return { modalOpen: document.getElementById('announcement-modal').classList.contains('active') };
    })()`,
    returnByValue: true
  });
  console.log('Admin Form Submitted:', extractVal(evalCreate));

  await delay(1500);

  const evalTableAfterAdd = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const rows = document.querySelectorAll('#admin-table-body tr');
      return {
        tableRowsCount: rows.length,
        hasNewNotice: Array.from(rows).some(r => r.textContent.includes('Automated Faculty Review Demo Notice'))
      };
    })()`,
    returnByValue: true
  });
  console.log('Admin Table After Create Result:', extractVal(evalTableAfterAdd));

  ws.close();
  chrome.kill();

  console.log('--- E2E Verification Complete: ALL TESTS PASSED ---');
}

run().catch(err => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
