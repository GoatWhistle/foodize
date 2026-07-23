# Maestro E2E flows

End-to-end UI flows for the Foodize mobile app, run with
[Maestro](https://maestro.mobile.dev/) against a real build (dev build, simulator or
device). They drive the app through its stable `testID`s.

## Prerequisites

- Maestro CLI installed (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- A running backend reachable from the device/emulator (`EXPO_PUBLIC_API_URL`).
- A built app installed on the target (`npx expo run:ios` / `run:android`, or an EAS
  development build). Maestro cannot drive Expo Go reliably — use a dev/preview build with
  `appId` `com.foodize.app`.
- Seeded test credentials for the login flow (phone `9990000000` / `password123` in
  `auth.yaml` — adjust to your seed data).

## Flows

| File | Scenario |
|---|---|
| `auth.yaml` | Cold start → login → land on the catalog |
| `order.yaml` | Browse catalog → open a restaurant → add an item → open cart → checkout |

## Running

```bash
maestro test .maestro/auth.yaml
maestro test .maestro/order.yaml
# or the whole suite
maestro test .maestro
```

In CI these run on a device farm or an emulator job after an EAS `preview` build; they are
not part of the Jest unit suite.
