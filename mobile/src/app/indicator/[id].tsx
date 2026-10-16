import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LineChart } from '../../components/charts';
import { RangeTabs, Screen, SectionRule, StepButton, Toggle, Urdu, Well } from '../../components/ui';
import { parseDate, withUnit } from '../../data/format';
import { byId, Indicator, rawMaybe } from '../../data/indicators';
import { alertStatus, useStore } from '../../state/store';
import { C, F, SEMANTIC } from '../../theme';

function windowed(ind: Indicator, months: number) {
  const pts = ind.series;
  if (pts.length < 3) return pts;
  const last = parseDate(pts[pts.length - 1].d);
  const cut = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() - months, last.getUTCDate())).toISOString().slice(0, 10);
  const firstIn = pts.findIndex(p => p.d >= cut);
  // Keep the point before the window so the line starts at its edge.
  const from = Math.max(0, Math.min(firstIn - 1, pts.length - 2));
  return firstIn === -1 ? pts.slice(-2) : pts.slice(firstIn === 0 ? 0 : from);
}

export default function IndicatorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ind = byId(id);
  const store = useStore();
  const [range, setRange] = useState(12);
  if (!ind) {
    return <Screen><Text style={s.note}>Indicator not found.</Text></Screen>;
  }
  const col = store.semanticColor ? SEMANTIC[ind.good + 1] : C.muted;
  const starred = !!store.stars[ind.id];
  const hasChart = ind.series.length >= 3;
  const pts = hasChart ? windowed(ind, range) : [];
  const related = ind.related.map(rawMaybe).filter(r => r != null);

  return (
    <Screen top={4}>
      <View style={s.nav}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={s.navBtn}>
          <Text style={s.back}>←</Text>
        </Pressable>
        <Text style={s.navSrc}>{ind.source}</Text>
        <Pressable onPress={() => store.toggleStar(ind.id)} accessibilityRole="button" accessibilityLabel={starred ? 'Unstar' : 'Star'} hitSlop={8} style={s.navBtn}>
          <Text style={[s.star, { color: starred ? C.green : C.starOff }]}>{starred ? '★' : '☆'}</Text>
        </Pressable>
      </View>

      <View style={{ gap: 2 }}>
        <View style={s.titleRow}>
          <Text style={s.title}>{ind.name}</Text>
          <Urdu show={store.showUrdu}>{ind.ur}</Urdu>
        </View>
        <View style={s.valueRow}>
          <Text style={s.value} adjustsFontSizeToFit numberOfLines={1}>{ind.display}</Text>
          <Text style={[s.chg, { color: col }]}>{ind.chg}</Text>
        </View>
        <Text style={s.asOf}>{ind.asOf}</Text>
      </View>

      {hasChart && (
        <View style={{ gap: 6 }}>
          <LineChart points={pts} domain={ind.domain} target={ind.target} axisFmt={ind.axisFmt} />
          <RangeTabs value={range} onChange={setRange} />
          {ind.seriesNote && <Text style={s.note}>{ind.seriesNote}</Text>}
        </View>
      )}

      {ind.breakdown && (
        <View style={{ gap: 8 }}>
          <SectionRule label={ind.breakdown.title} />
          {ind.breakdown.rows.map(r => (
            <View key={r.label} style={s.barRow}>
              <Text style={s.barLabel} numberOfLines={1}>{r.label}</Text>
              <View style={s.barTrack}>
                <View style={{ height: '100%', width: `${Math.min(100, (r.value / ind.breakdown!.max) * 100)}%`, backgroundColor: r.hot ? C.rust : C.muted }} />
              </View>
              <Text style={s.barValue}>{r.text}</Text>
            </View>
          ))}
          {ind.breakdown.note && <Text style={s.note}>{ind.breakdown.note}</Text>}
        </View>
      )}

      {related.length > 0 && (
        <View>
          <SectionRule label="MORE FIGURES" />
          {related.map(r => (
            <View key={r!.key} style={s.relRow}>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={s.relName}>{r!.indicator}</Text>
                <Text style={s.relPer}>{[r!.period, r!.change].filter(Boolean).join(' · ')}</Text>
              </View>
              <Text style={s.relVal}>{withUnit(r!.value, r!.unit)}</Text>
            </View>
          ))}
        </View>
      )}

      {ind.alert && <AlertBox ind={ind} />}
    </Screen>
  );
}

function AlertBox({ ind }: { ind: Indicator }) {
  const store = useStore();
  const spec = ind.alert!;
  const a = store.alerts[ind.id] ?? { on: false, thr: spec.defaultThr };
  const hit = alertStatus(ind.value, spec.dir, a.thr);
  const gap = Math.abs(ind.value - a.thr);
  const status = !a.on ? 'Off'
    : hit ? (spec.dir === 'above' ? 'Triggered · already above' : 'Triggered · already below')
    : `On · ${spec.fmt(gap)} away`;
  const bump = (d: number) => store.setAlert(ind.id, { thr: +Math.max(0, a.thr + d * spec.step).toFixed(4) });
  const verb = spec.dir === 'above' ? 'above' : 'below';
  return (
    <Well style={s.alert}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.alertTitle}>Alert if {verb}</Text>
        <Text style={[s.alertSub, a.on && hit && { color: C.rust }]}>{status}</Text>
      </View>
      <View style={s.alertCtl}>
        <StepButton label="−" a11y="Lower threshold" onPress={() => bump(-1)} />
        <Text style={s.thr} numberOfLines={1} adjustsFontSizeToFit>{spec.fmt(a.thr)}</Text>
        <StepButton label="+" a11y="Raise threshold" onPress={() => bump(1)} />
        <View style={{ marginLeft: 4 }}>
          <Toggle on={a.on} label={`Alert for ${ind.name}`} onPress={() => store.setAlert(ind.id, { on: !a.on })} />
        </View>
      </View>
    </Well>
  );
}

const s = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44 },
  navBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  back: { fontFamily: F.sans, fontSize: 22, color: C.ink },
  navSrc: { fontFamily: F.monoMedium, fontSize: 11, color: C.muted },
  star: { fontSize: 18 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  title: { fontFamily: F.serifMedium, fontSize: 26, color: C.ink, flexShrink: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  value: { fontFamily: F.serif, fontSize: 58, lineHeight: 62, letterSpacing: -1, color: C.ink },
  chg: { fontFamily: F.monoMedium, fontSize: 13 },
  asOf: { fontFamily: F.sans, fontSize: 12, color: C.muted },
  note: { fontFamily: F.sans, fontSize: 11, lineHeight: 16, color: C.faint },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 128, fontFamily: F.sans, fontSize: 12, color: C.ink },
  barTrack: { flex: 1, height: 8, backgroundColor: C.well, borderRadius: 2, overflow: 'hidden' },
  barValue: { width: 64, textAlign: 'right', fontFamily: F.monoMedium, fontSize: 12, color: C.ink },
  relRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.rule },
  relName: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink },
  relPer: { fontFamily: F.sans, fontSize: 11, color: C.muted },
  relVal: { fontFamily: F.monoMedium, fontSize: 13, color: C.ink, textAlign: 'right' },
  alert: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  alertTitle: { fontFamily: F.sansSemi, fontSize: 13, color: C.ink },
  alertSub: { fontFamily: F.sans, fontSize: 11, color: C.muted },
  alertCtl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  thr: { width: 62, textAlign: 'center', fontFamily: F.monoMedium, fontSize: 13, color: C.ink },
});
