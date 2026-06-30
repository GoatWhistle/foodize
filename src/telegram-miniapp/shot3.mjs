import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:/Users/mikhailkhorokhorin/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
});

const take = async (page, url, path) => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(()=>{});
  await page.waitForTimeout(2000);
  await page.screenshot({ path });
};

// Frontend pages  
const fe = await browser.newPage();
await fe.setViewportSize({ width: 1280, height: 800 });
await take(fe, 'http://localhost:5173/orders', '/tmp/fe-orders.png');
await take(fe, 'http://localhost:5173/profile', '/tmp/fe-profile.png');
await take(fe, 'http://localhost:5173/register', '/tmp/fe-register.png');

// Frontend mobile
const feM = await browser.newPage();
await feM.setViewportSize({ width: 390, height: 844 });
await take(feM, 'http://localhost:5173', '/tmp/fe-home-mobile.png');
await take(feM, 'http://localhost:5173/login', '/tmp/fe-login-mobile.png');

await browser.close();
console.log('done');
