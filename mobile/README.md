# Pakistan Economy

An Android app (Expo / React Native) that tracks Pakistan's main economic indicators. It's for policy makers and journalists. The app is built from direction **1a "Ledger"** in the Claude Design handoff (`project/Pakistan Economy App.dc.html`, see `DESIGN_HANDOFF.md`). That direction is an editorial paper look with serif headlines and semantic green/rust colours, here applied to all six screens.

## Screens

| Route | Screen |
| --- | --- |
| `/` | **Watchlist**: 12 indicators with sparklines, starring, an All/Starred filter and the real-policy-rate lede |
| `/indicator/[id]` | **Indicator detail**: headline value, chart with 3M/6M/1Y ranges (CPI shows the SBP 5–7% target band), a breakdown, related figures and an alert threshold |
| `/compare` | **Compare**: indicators rebased to 100 on one scale |
| `/calendar` | **Release calendar**: upcoming releases with reminders; EST marks dates that are estimated |
| `/news` | **News & SBP announcements**: filterable, and each item links to its indicator |
| `/convert` | **Currency converter**: PKR ↔ USD, EUR, GBP, SAR, AED |
| `/alerts` | **Alerts & display settings**: Urdu labels on/off, and colour by economic effect |

Stars, alert thresholds, reminders and display settings are saved on the device with AsyncStorage.

## Data

The figures come from the **"Pakistan economic indicators" dashboard artifact**, compiled 15–16 Oct 2026 from PBS, SBP, PSX, OGRA, the Finance Ministry and the IMF. The raw dataset files are in `src/data/raw/`. `src/data/indicators.ts` turns them into the 12 watchlist indicators. To refresh the figures, replace the JSON files and adjust that file.

A few figures are not in those datasets and were kept from the design:
- the CPI breakdown by group
- the EUR/USD and GBP/USD reference crosses
- the dates of releases marked EST

Charts only plot points that exist in the datasets. For example, the KSE-100 has no month-ends from Oct 2025 to Feb 2026. Indicators with no history show only the change from the previous value to the latest one.

## Run

```bash
cd mobile
npm install
npx expo start          # scan with Expo Go on Android
npx tsc --noEmit        # typecheck
```

`.npmrc` sets `legacy-peer-deps` because of a react / react-dom peer range clash in expo-router's web dependencies.
