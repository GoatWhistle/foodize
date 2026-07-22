Object.defineProperty(globalThis.navigator, 'language', { value: 'ru-RU', configurable: true });
Object.defineProperty(globalThis.navigator, 'languages', { value: ['ru-RU', 'ru'], configurable: true });
globalThis.localStorage.setItem('foodize-language', JSON.stringify({ state: { language: 'ru' }, version: 0 }));
