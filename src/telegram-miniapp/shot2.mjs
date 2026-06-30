import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:/Users/mikhailkhorokhorin/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'
});

const M = { width: 390, height: 844 };

// Miniapp - navigate to profile tab
const page = await browser.newPage();
await page.setViewportSize(M);
await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded', timeout: 8000 });
await page.waitForTimeout(2000);

// Click profile tab
const profileTab = page.locator('text=ПРОФИЛЬ').or(page.locator('[href*="profile"]')).first();
await profileTab.click().catch(async () => {
  // try finding by position - bottom right tab
  await page.click('text=Профиль').catch(() => {});
});
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/ma-profile.png' });

// Orders tab
await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded', timeout: 5000 });
await page.waitForTimeout(1000);
const ordersTab = page.locator('text=ЗАКАЗЫ').first();
await ordersTab.click().catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/ma-orders.png' });

await browser.close();
console.log('done');
