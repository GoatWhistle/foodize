import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:/Users/mikhailkhorokhorin/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
});

const take = async (url, path, vp = { width: 1280, height: 800 }) => {
  const page = await browser.newPage();
  await page.setViewportSize(vp);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(2500);
  } catch(e) { console.log('nav error:', e.message); }
  await page.screenshot({ path });
  await page.close();
};

const M = { width: 390, height: 844 };

await take('http://localhost:5173', '/tmp/fe-home.png');
await take('http://localhost:5173/login', '/tmp/fe-login.png');
await take('http://localhost:5173/register', '/tmp/fe-register.png');
await take('http://localhost:5174', '/tmp/ma-home.png', M);
await take('http://localhost:5174/auth/register', '/tmp/ma-register.png', M);
await take('http://localhost:5174/auth/login', '/tmp/ma-login.png', M);

await browser.close();
console.log('screenshots done');
