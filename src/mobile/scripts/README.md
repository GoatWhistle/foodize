# Asset generation

`generateAssets.mjs` writes the app icons and splash into `assets/` with no external
dependencies (pure Node `zlib` PNG encoder):

| File | Size | Use |
|---|---|---|
| `icon.png` | 1024×1024 | App icon (iOS/Android) |
| `adaptive-icon.png` | 1024×1024 | Android adaptive foreground |
| `splash.png` | 1024×1024 | Splash screen |
| `notification-icon.png` | 96×96 | Android notification status-bar icon (transparent, monochrome) |
| `favicon.png` | 48×48 | Web favicon |

```bash
node scripts/generateAssets.mjs
```

> **These are brand-colored placeholders** (Foodize fire `#e8562a` + an `F` mark), good
> enough to unblock EAS builds. Replace them with the final designed artwork before a
> store release — export the real logo at the sizes above and drop them into `assets/`.
