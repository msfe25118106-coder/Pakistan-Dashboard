import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import { useWidth } from '../../components/charts';
import { Chip, Masthead, Screen } from '../../components/ui';
import { COMPARE, CompareSeries } from '../../data/events';
import { dayMonth, num, parseDate } from '../../data/format';
import { Point } from '../../data/indicators';
import { C, F } from '../../theme';

const t = (d: string) => parseDate(d).getTime();

function valueAt(pts: Point[], time: number) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (t(b.d) >= time) {
      const f = (time - t(a.d)) / (t(b.d) - t(a.d) || 1);
      return a.v + (b.v - a.v) * Math.max(0, Math.min(1, f));
    }
  }
  return pts[pts.length - 1].v;
}

// Rebases each series to 100 at the latest common start date.
function indexed(sel: CompareSeries[]) {
  if (!sel.length) return { base: 0, end: 0, lines: [] };
  const base = Math.max(...sel.map(s => t(s.points[0].d)));
  const end = Math.max(...sel.map(s => t(s.points[s.points.length - 1].d)));
  const lines = sel.map(s => {
    const b = valueAt(s.points, base);
    const pts = [{ time: base, v: 100 }, ...s.points.filter(p => t(p.d) > base).map(p => ({ time: t(p.d), v: (p.v / b) * 100 }))];
    return { ...s, pts };
  });
  return { base, end, lines };
}

export default function Compare() {
  const [on, setOn] = useState<Record<string, boolean>>({ kse: true, pkr: true, reserves: true });
  const [w, onLayout] = useWidth();
  const sel = COMPARE.filter(s => on[s.id]);
  const { base, end, lines } = indexed(sel);
  const H = 200, pad = 4;
  const all = lines.flatMap(l => l.pts.map(p => p.v)).concat(100);
  const mn = Math.min(...all) - 2, mx = Math.max(...all) + 2;
  const x = (time: number) => (end === base ? 0 : ((time - base) / (end - base)) * w);
  const y = (v: number) => pad + (H - 2 * pad) * (1 - (v - mn) / (mx - mn));
  const legend = lines.map(l => {
    const v = l.pts[l.pts.length - 1].v;
    return { id: l.id, name: l.name, color: l.color, idx: v, pct: (v >= 100 ? '+' : '−') + num(Math.abs(v - 100), 1) + '%' };
  });
  const top = legend.slice().sort((a, b) => Math.abs(b.idx - 100) - Math.abs(a.idx - 100))[0];
  const baseIso = base ? new Date(base).toISOString().slice(0, 10) : '';
  const endIso = end ? new Date(end).toISOString().slice(0, 10) : '';

  return (
    <Screen>
      <Masthead kicker={base ? `INDEXED · ${dayMonth(baseIso, 0).toUpperCase()} = 100` : 'INDEXED'} title="Compare" />
      <View style={s.chips}>
        {COMPARE.map(c => (
          <Chip key={c.id} label={c.name} dot={c.color} on={!!on[c.id]} onPress={() => setOn(o => ({ ...o, [c.id]: !o[c.id] }))} />
        ))}
      </View>
      <View style={{ gap: 6 }}>
        <View onLayout={onLayout}>
          <Svg width={w} height={H} style={{ overflow: 'visible' }}>
            <Line x1={0} x2={w} y1={y(100)} y2={y(100)} stroke={C.ink} strokeDasharray="3 3" opacity={0.35} />
            <Line x1={0} x2={w} y1={H - pad} y2={H - pad} stroke={C.ruleStrong} />
            {lines.map(l => (
              <Path key={l.id} fill="none" stroke={l.color} strokeWidth={2} strokeLinejoin="round"
                d={l.pts.map((p, i) => (i ? 'L' : 'M') + x(p.time).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ')} />
            ))}
            <SvgText x={w} y={y(100) - 4} textAnchor="end" fontFamily={F.mono} fontSize={9} fill={C.faint}>100</SvgText>
          </Svg>
        </View>
        <View style={s.axis}>
          <Text style={s.axisText}>{baseIso ? dayMonth(baseIso, 0) : ''}</Text>
          <Text style={s.axisText}>{endIso ? dayMonth(endIso, 0) : ''}</Text>
        </View>
      </View>
      <View>
        {legend.map(l => (
          <View key={l.id} style={s.legRow}>
            <View style={[s.dot, { backgroundColor: l.color }]} />
            <Text style={s.legName}>{l.name}</Text>
            <Text style={s.legIdx}>{num(l.idx, 1)}</Text>
            <Text style={s.legPct}>{l.pct}</Text>
          </View>
        ))}
      </View>
      <Text style={s.note}>
        {top ? `${top.name} moved most, ${top.pct} since ${dayMonth(baseIso)} ${new Date(base).getUTCFullYear()}.` : 'Pick indicators above to compare them on one scale.'}
      </Text>
      <Text style={s.foot}>Each line is rebased to 100 at the latest date all selected series share. Rates (CPI, policy) are indexed on their level.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontFamily: F.mono, fontSize: 10, color: C.faint },
  legRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.rule },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legName: { flex: 1, fontFamily: F.sansMedium, fontSize: 13, color: C.ink },
  legIdx: { fontFamily: F.monoMedium, fontSize: 13, color: C.ink },
  legPct: { width: 64, textAlign: 'right', fontFamily: F.monoMedium, fontSize: 12, color: C.muted },
  note: { fontFamily: F.serif, fontSize: 15, lineHeight: 21, color: '#44413a' },
  foot: { fontFamily: F.sans, fontSize: 11, lineHeight: 16, color: C.faint },
});
