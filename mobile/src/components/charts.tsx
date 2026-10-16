import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Point } from '../data/indicators';
import { monthYY, parseDate } from '../data/format';
import { C, F } from '../theme';

type Scale = { x: (i: number) => number; y: (v: number) => number };

function scales(pts: Point[], w: number, h: number, pad: number, mn: number, mx: number): Scale {
  const ts = pts.map(p => parseDate(p.d).getTime());
  const t0 = ts[0], t1 = ts[ts.length - 1];
  const r = mx - mn || 1;
  return {
    x: i => (t1 === t0 ? (pts.length > 1 ? (i * w) / (pts.length - 1) : w) : ((ts[i] - t0) / (t1 - t0)) * w),
    y: v => pad + (h - 2 * pad) * (1 - (v - mn) / r),
  };
}

export function linePath(pts: Point[], w: number, h: number, pad = 2, mn?: number, mx?: number) {
  if (pts.length < 2) return '';
  const vs = pts.map(p => p.v);
  const lo = mn ?? Math.min(...vs), hi = mx ?? Math.max(...vs);
  const s = scales(pts, w, h, pad, lo, hi);
  return pts.map((p, i) => (i ? 'L' : 'M') + s.x(i).toFixed(1) + ' ' + s.y(p.v).toFixed(1)).join(' ');
}

export function Sparkline({ points, width, height, color }: { points: Point[]; width: number; height: number; color: string }) {
  return (
    <Svg width={width} height={height} style={{ overflow: 'visible' }}>
      {points.length > 1 && <Path d={linePath(points, width, height)} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />}
    </Svg>
  );
}

export function useWidth(initial = 324): [number, (e: LayoutChangeEvent) => void] {
  const [w, setW] = useState(initial);
  return [w, e => setW(Math.round(e.nativeEvent.layout.width))];
}

type LineChartProps = {
  points: Point[];
  height?: number;
  domain?: [number, number];
  target?: { lo: number; hi: number; label: string };
  axisFmt: (v: number) => string;
};

// Detail chart: hairline grid, right-aligned axis labels, optional target band,
// ink line with an end dot (1a Ledger detail).
export function LineChart({ points, height = 160, domain, target, axisFmt }: LineChartProps) {
  const [w, onLayout] = useWidth();
  const vs = points.map(p => p.v);
  let [mn, mx] = domain ?? [Math.min(...vs), Math.max(...vs)];
  if (!domain) {
    const padV = (mx - mn || Math.abs(mx) || 1) * 0.15;
    mn -= padV; mx += padV;
  }
  const pad = 4;
  const s = scales(points, w, height, pad, mn, mx);
  const mid = (mn + mx) / 2;
  const last = points[points.length - 1];
  return (
    <View style={{ gap: 6 }}>
      <View onLayout={onLayout}>
        <Svg width={w} height={height} style={{ overflow: 'visible' }}>
          {target && (
            <Rect x={0} y={s.y(target.hi)} width={w} height={s.y(target.lo) - s.y(target.hi)} fill={C.green} opacity={0.09} />
          )}
          <Line x1={0} x2={w} y1={pad} y2={pad} stroke={C.rule} />
          <Line x1={0} x2={w} y1={height / 2} y2={height / 2} stroke={C.rule} />
          <Line x1={0} x2={w} y1={height - pad} y2={height - pad} stroke={C.ruleStrong} />
          {target && (
            <SvgText x={4} y={s.y(target.hi) - 5} fontFamily={F.monoMedium} fontSize={9} fill={C.green}>{target.label}</SvgText>
          )}
          <SvgText x={w} y={14} textAnchor="end" fontFamily={F.mono} fontSize={9} fill={C.faint}>{axisFmt(mx)}</SvgText>
          <SvgText x={w} y={height / 2 - 4} textAnchor="end" fontFamily={F.mono} fontSize={9} fill={C.faint}>{axisFmt(mid)}</SvgText>
          {points.length > 1 && (
            <Path d={linePath(points, w, height, pad, mn, mx)} fill="none" stroke={C.ink} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )}
          {last && <Circle cx={s.x(points.length - 1)} cy={s.y(last.v)} r={4} fill={C.ink} />}
        </Svg>
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisText}>{points[0] ? monthYY(points[0].d) : ''}</Text>
        <Text style={styles.axisText}>{last ? monthYY(last.d) : ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontFamily: F.mono, fontSize: 10, color: C.faint },
});
