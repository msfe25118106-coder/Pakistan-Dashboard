"""Pull series from SBP EasyData and write docs/data.json.
Series with an empty "key" in series.json are skipped.
Needs env var EASYDATA_API_KEY."""
import csv, io, json, os, sys, urllib.request, urllib.error
from datetime import date, datetime, timedelta

API = "https://easydata.sbp.org.pk/api/v1/series/{key}/data?api_key={api}&start_date={s}&end_date={e}&format=csv"
OUT = os.path.join("docs", "data.json")
KEEP = 120  # points kept per series
FORMATS = ["%Y-%m-%d", "%d-%b-%y", "%d-%b-%Y", "%b-%y", "%b-%Y", "%Y-%m", "%d/%m/%Y"]

def iso(s):
    s = s.strip()
    for f in FORMATS:
        try:
            return datetime.strptime(s, f).date().isoformat()
        except ValueError:
            pass
    return None

def fetch(key, api, start, end):
    url = API.format(key=key, api=api, s=start, e=end)
    with urllib.request.urlopen(url, timeout=60) as r:
        text = r.read().decode("utf-8-sig")
    pts = []
    for row in csv.DictReader(io.StringIO(text)):
        d, v = iso(row.get("Observation Date", "")), row.get("Observation Value", "").strip()
        if not d or v == "":
            continue
        try:
            pts.append([d, float(v.replace(",", ""))])
        except ValueError:
            continue
    pts.sort()
    return pts[-KEEP:]

def main():
    api = os.environ.get("EASYDATA_API_KEY")
    if not api:
        sys.exit("Set EASYDATA_API_KEY")
    cfg = json.load(open("series.json"))
    old = json.load(open(OUT)) if os.path.exists(OUT) else {"series": []}
    old_by_id = {s["id"]: s for s in old["series"]}
    end = date.today().isoformat()
    start = (date.today() - timedelta(days=365 * 12)).isoformat()
    out = []
    for c in cfg:
        if not c["key"]:
            continue
        try:
            pts = fetch(c["key"], api, start, end)
            if not pts:
                raise ValueError("no data returned")
        except (urllib.error.URLError, ValueError) as e:
            print(f"WARN {c['id']}: {e}", file=sys.stderr)
            if c["id"] in old_by_id:
                out.append(old_by_id[c["id"]])  # keep last good copy
            continue
        out.append({**c, "points": pts})
    if not out:
        sys.exit("No series fetched")
    if out == old.get("series"):
        print("No changes")
        return
    os.makedirs("docs", exist_ok=True)
    json.dump({"fetched_at": datetime.utcnow().isoformat(timespec="seconds") + "Z", "series": out},
              open(OUT, "w"), separators=(",", ":"))
    print(f"Wrote {len(out)} series")

if __name__ == "__main__":
    main()
