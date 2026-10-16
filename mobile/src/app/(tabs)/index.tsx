import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkline } from '../../components/charts';
import { Kicker, Masthead, Screen, Segmented } from '../../components/ui';
import { mastheadDate, num } from '../../data/format';
import { byId, DATA_AS_OF, INDICATORS } from '../../data/indicators';
import { useStore } from '../../state/store';
import { C, F, SEMANTIC } from '../../theme';

export default function Watchlist() {
  const store = useStore();
  const [filter, setFilter] = useState<'all' | 'star'>('all');
  const nStar = INDICATORS.filter(i => store.stars[i.id]).length;
  const nAlerts = Object.values(store.alerts).filter(a => a.on).length;
  const rows = filter === 'star' ? INDICATORS.filter(i => store.stars[i.id]) : INDICATORS;
  const policy = byId('policy')!, cpi = byId('cpi')!;
  const real = policy.value - cpi.value;

  return (
    <Screen>
      <Masthead kicker={mastheadDate(new Date())} title="Watchlist"
        right={
          <Pressable accessibilityRole="link" onPress={() => router.push('/alerts')} hitSlop={10}>
            <Text style={s.alerts}>{nAlerts} alerts on ›</Text>
          </Pressable>
        } />
      <View style={{ gap: 4, paddingTop: 2, paddingBottom: 4 }}>
        <Kicker color={C.green}>REAL POLICY RATE</Kicker>
        <Text style={s.lede}>
          Policy rate {num(policy.value, 2)}% sits {num(Math.abs(real), 1)} points {real >= 0 ? 'above' : 'below'} September CPI of {num(cpi.value, 1)}%.
        </Text>
      </View>
      <Segmented items={[{ key: 'all', label: `All ${INDICATORS.length}` }, { key: 'star', label: `Starred ${nStar}` }]} value={filter} onChange={setFilter} />
      <View>
        {rows.map(r => {
          const col = store.semanticColor ? SEMANTIC[r.good + 1] : C.muted;
          const starred = !!store.stars[r.id];
          return (
            <Pressable key={r.id} onPress={() => router.push(`/indicator/${r.id}`)} accessibilityRole="button"
              accessibilityLabel={`${r.name}, ${r.display}, ${r.chg}`} style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}>
              <View style={s.name}>
                <Text style={s.nameText} numberOfLines={1}>{r.name}</Text>
                <Text style={s.per} numberOfLines={1}>{r.per}</Text>
              </View>
              <Sparkline points={r.series} width={54} height={20} color={col} />
              <View style={s.val}>
                <Text style={s.valText} numberOfLines={1}>{r.display}</Text>
                <Text style={[s.chg, { color: col }]} numberOfLines={1}>{r.chg}</Text>
              </View>
              <Pressable onPress={() => store.toggleStar(r.id)} accessibilityRole="button"
                accessibilityLabel={starred ? `Unstar ${r.name}` : `Star ${r.name}`} style={s.star}>
                <Text style={[s.starText, { color: starred ? C.green : C.starOff }]}>{starred ? '★' : '☆'}</Text>
              </Pressable>
            </Pressable>
          );
        })}
        {rows.length === 0 && <Text style={s.empty}>Star an indicator to pin it here.</Text>}
      </View>
      <Text style={s.foot}>Figures as of {DATA_AS_OF} from PBS, SBP, PSX, OGRA and Sarafa releases.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  alerts: { fontFamily: F.monoMedium, fontSize: 11, color: C.muted, paddingBottom: 4 },
  lede: { fontFamily: F.serif, fontSize: 21, lineHeight: 26, color: C.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.rule },
  name: { flex: 1, minWidth: 0, gap: 1 },
  nameText: { fontFamily: F.sansSemi, fontSize: 14, color: C.ink },
  per: { fontFamily: F.sans, fontSize: 11, color: C.muted },
  val: { width: 104, alignItems: 'flex-end', gap: 1 },
  valText: { fontFamily: F.monoMedium, fontSize: 13, color: C.ink },
  chg: { fontFamily: F.monoMedium, fontSize: 11 },
  star: { width: 28, height: 44, alignItems: 'center', justifyContent: 'center' },
  starText: { fontSize: 17 },
  empty: { fontFamily: F.serif, fontSize: 15, color: C.muted, paddingVertical: 16 },
  foot: { fontFamily: F.sans, fontSize: 11, lineHeight: 16, color: C.faint },
});
