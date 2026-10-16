# Pakistan Economic Dashboard

Interactive dashboard of Pakistan's economic indicators with **live data** — no API keys needed.

The page (`docs/`) fetches data directly in the browser every time it is opened:

| Source | What | Frequency |
|---|---|---|
| [World Bank WDI API](https://data.worldbank.org/country/pakistan) | GDP growth, CPI inflation, current account, reserves, remittances, exports, imports, FDI, external debt, unemployment, GDP per capita, lending rate, annual PKR/USD | Annual |
| [IMF DataMapper (WEO)](https://www.imf.org/external/datamapper/profile/PAK) | GDP growth, inflation, current account, government debt, fiscal balance — **including projections** | Annual |
| [ExchangeRate-API](https://www.exchangerate-api.com) | Latest USD/PKR | Daily |
| [fawazahmed0 currency API](https://github.com/fawazahmed0/exchange-api) | USD/PKR history (last 180 days) | Daily |

Features: headline KPI tiles, USD/PKR chart, indicator explorer (10Y / 20Y / All, IMF projections toggle, table view, CSV download), exports vs imports, small-multiples of every indicator, hover/keyboard tooltips, light/dark theme, mobile layout, per-source live/snapshot status.

## Run it locally

```bash
python -m http.server -d docs 8000
# open http://localhost:8000
```

(Opening `index.html` directly as a file won't work — browsers block `fetch` of local files.)

## Publish with GitHub Pages

1. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/docs`.
2. The page is then live at `https://<user>.github.io/<repo>/`.

## Fallback snapshot (optional but recommended)

`.github/workflows/update.yml` runs `collector/collect.py` every 4 hours and commits `docs/data.json`.
If a live source is down or blocked for a visitor, the dashboard shows that snapshot instead
and marks the source with a "!" status pill. Run it once from the Actions tab → *Update data* → *Run workflow*.

## Adding / changing indicators

Edit `docs/config.json` — both the page and `collector/collect.py` read it. Find World Bank codes at
<https://data.worldbank.org/indicator> and IMF codes at <https://www.imf.org/external/datamapper/api/v1/indicators>.

## SBP high-frequency data (optional)

`fetch_data.py` pulls the series listed in `series.json` from SBP EasyData (overnight repo rate, CPI,
large-scale manufacturing, remittances, services exports, …) into `docs/sbp.json`, which the dashboard
shows in an "SBP high-frequency series" section.

1. Settings → Secrets and variables → Actions → New secret: `EASYDATA_API_KEY`.
2. Series with an empty `"key"` in `series.json` are skipped — fill in the EasyData code to enable one.

Never commit the key.

## Mobile app

`mobile/` holds an Android app (Expo / React Native) with a watchlist, indicator detail, compare, release calendar, news and a currency converter. Its figures are a snapshot from 16 Oct 2026. See [`mobile/README.md`](mobile/README.md).
