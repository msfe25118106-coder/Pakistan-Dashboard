"""Write docs/data.json: a snapshot the dashboard falls back to when a live source is unreachable.

Sources (no API key needed): World Bank WDI, IMF DataMapper (WEO), ExchangeRate-API,
fawazahmed0 currency API. Indicator list lives in docs/config.json (shared with the page).

SBP EasyData series are handled separately by fetch_data.py (-> docs/sbp.json).

Usage: python collector/collect.py
"""
import datetime as dt, json, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "docs", "config.json")))
OUT = os.path.join(ROOT, "docs", "data.json")
C = CFG["country"]


def get_json(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": "pk-economic-dashboard"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def num(x):
    try:
        return float(str(x).replace(",", ""))
    except Exception:
        return None


# ------------------------------------------------------------------ public sources
def world_bank(code):
    j = get_json(f"https://api.worldbank.org/v2/country/{C}/indicator/{code}?format=json&per_page=200&date=1980:2100")
    rows = sorted([int(r["date"]), r["value"]] for r in (j[1] or []) if r.get("value") is not None)
    if not rows:
        raise RuntimeError("no values")
    return rows


def imf(code):
    j = get_json(f"https://www.imf.org/external/datamapper/api/v1/{code}/{C}")
    v = j.get("values", {}).get(code, {}).get(C)
    if not v:
        raise RuntimeError("no values")
    return sorted([int(y), x] for y, x in v.items() if num(x) is not None)


def fx_latest():
    j = get_json("https://open.er-api.com/v6/latest/USD")
    if j.get("result") != "success":
        raise RuntimeError("unexpected response")
    t = dt.datetime.fromtimestamp(j["time_last_update_unix"], dt.timezone.utc)
    return {"rate": j["rates"]["PKR"], "time": t.isoformat().replace("+00:00", "Z")}


def fx_on(date):
    for url in (f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/usd.min.json",
                f"https://{date}.currency-api.pages.dev/v1/currencies/usd.min.json"):
        try:
            j = get_json(url, 30)
            d = dt.datetime.strptime(j["date"], "%Y-%m-%d").replace(tzinfo=dt.timezone.utc)
            return [int(d.timestamp() * 1000), j["usd"]["pkr"]]
        except Exception:
            continue
    return None


def fx_history():
    days, step = CFG["fx"]["history_days"], CFG["fx"]["step_days"]
    today = dt.date.today()
    dates = [(today - dt.timedelta(days=i)).isoformat() for i in range(days, 0, -step)] + ["latest"]
    with ThreadPoolExecutor(8) as ex:
        pts = dict(p for p in ex.map(fx_on, dates) if p)
    if len(pts) < 5:
        raise RuntimeError("too few points")
    return sorted([k, v] for k, v in pts.items())


# ------------------------------------------------------------------ main
def main():
    old = {}
    if os.path.exists(OUT):
        try:
            old = json.load(open(OUT))
        except Exception:
            old = {}
    old_ind = old.get("ind", {})
    now = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    out = {"asOf": now, "ind": {}, "fx": {}, "errors": []}
    errors = out["errors"]

    def attempt(label, fn, fallback):
        try:
            return fn()
        except Exception as e:
            errors.append(f"{label}: {e}")
            return fallback

    indicators = CFG["worldbank"] + CFG["imf_only"]
    jobs = {}
    with ThreadPoolExecutor(6) as ex:
        for m in indicators:
            prev = old_ind.get(m["id"], {})
            if m.get("code"):
                jobs[(m["id"], "wb")] = ex.submit(attempt, f"World Bank {m['id']}", lambda c=m["code"]: world_bank(c), prev.get("wb", []))
            if m.get("imf"):
                jobs[(m["id"], "imf")] = ex.submit(attempt, f"IMF {m['id']}", lambda c=m["imf"]: imf(c), prev.get("imf", []))
        fx_l = ex.submit(attempt, "FX latest", fx_latest, old.get("fx", {}).get("latest"))
        fx_h = ex.submit(attempt, "FX history", fx_history, old.get("fx", {}).get("history", []))
    for (iid, kind), fut in jobs.items():
        out["ind"].setdefault(iid, {})[kind] = fut.result()
    out["fx"] = {"latest": fx_l.result(), "history": fx_h.result()}

    got_any = any(v.get("wb") or v.get("imf") for v in out["ind"].values()) or out["fx"]["history"]
    if not got_any:
        out["asOf"] = old.get("asOf")  # nothing fetched: don't advertise a fresh snapshot
    with open(OUT, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print("written", OUT)
    for e in errors:
        print("FAILED", e, file=sys.stderr)
    sys.exit(0 if got_any else 1)


if __name__ == "__main__":
    main()
