const { chromium } = require('playwright');
const SCRATCH = 'C:/Users/mikhailkhorokhorin/AppData/Local/Temp/claude/w--Projects-oriole/4b836a78-ecae-4740-9e4f-fd9b8d8bcb52/scratchpad';

(async () => {
  const browser = await chromium.launch();
  const mob = await browser.newPage();
  await mob.setViewportSize({ width: 390, height: 844 });

  mob.on('response', async (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) {
      console.log('API ERROR:', res.status(), res.url());
    }
  });

  await mob.addInitScript(() => {
    window.Telegram = {
      WebApp: {
        initData: 'fake', initDataUnsafe: { user: { id: 1, first_name: 'Mikhail', username: 'test' } },
        ready: () => {}, expand: () => {},
        HapticFeedback: { impactOccurred: () => {}, selectionChanged: () => {} },
        BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
        MainButton: { show: () => {}, hide: () => {}, setText: () => {}, setParams: () => {} },
        themeParams: {}, colorScheme: 'light', viewportHeight: 844, viewportStableHeight: 844,
      }
    };
  });

  await mob.goto('http://localhost:5174', { timeout: 12000, waitUntil: 'domcontentloaded' });
  await mob.waitForTimeout(3000);
  await mob.screenshot({ path: `${SCRATCH}/r1_home.png` });

  // click first restaurant card
  const card = await mob.$('.restaurant-card');
  if (card) {
    await card.click();
    await mob.waitForTimeout(3000);
    await mob.screenshot({ path: `${SCRATCH}/r2_restaurant.png` });
    console.log('restaurant page captured');
  } else {
    console.log('no restaurant card found');
  }

  await browser.close();
})();
