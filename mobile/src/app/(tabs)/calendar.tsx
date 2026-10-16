import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Masthead, Screen } from '../../components/ui';
import { CALENDAR } from '../../data/events';
import { calParts } from '../../data/format';
import { useStore } from '../../state/store';
import { C, F } from '../../theme';

export default function Calendar() {
  const store = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const nOn = CALENDAR.filter(e => e.date >= today && store.bells[e.k]).length;
  return (
    <Screen>
      <Masthead kicker={`RELEASES · PKT · ${nOn} REMINDERS`} title="Calendar" />
      <Text style={s.intro}>Tap the bell to be reminded when a figure lands. Dates marked EST follow each agency’s usual schedule.</Text>
      <View>
        {CALENDAR.map(e => {
          const done = e.date < today;
          const on = !done && !!store.bells[e.k];
          const p = calParts(e.date);
          return (
            <View key={e.k} style={[s.row, done && { opacity: 0.5 }]}>
              <View style={s.date}>
                <Text style={s.wd}>{p.wd}</Text>
                <Text style={s.day}>{p.d}</Text>
                <Text style={s.wd}>{p.m}</Text>
              </View>
              <Pressable style={s.body} disabled={!e.ind} accessibilityRole="link" onPress={() => e.ind && router.push(`/indicator/${e.ind}`)}>
                <Text style={s.title}>{e.t}</Text>
                <View style={s.meta}>
                  <Text style={[s.metaText, { color: C.green }]}>{e.src}</Text>
                  <Text style={[s.metaText, { color: C.muted }]}>{done ? e.prev.replace(/^Prev /, 'Released · ') : e.prev}</Text>
                  {e.est && <Text style={[s.metaText, { color: C.ochre }]}>EST</Text>}
                </View>
              </Pressable>
              <Pressable disabled={done} onPress={() => store.toggleBell(e.k)} accessibilityRole="switch"
                accessibilityLabel={`Remind me: ${e.t}`} accessibilityState={{ checked: on, disabled: done }}
                style={[s.bell, { backgroundColor: on ? C.ink : 'transparent', borderColor: on ? C.ink : C.ruleStrong }]}>
                <Text style={[s.bellText, { color: on ? C.paper : C.muted }]}>{done ? '✓' : on ? 'ON' : '+'}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  intro: { fontFamily: F.sans, fontSize: 12, lineHeight: 18, color: C.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.rule },
  date: { width: 44 },
  wd: { fontFamily: F.monoMedium, fontSize: 10, color: C.muted },
  day: { fontFamily: F.serifMedium, fontSize: 24, lineHeight: 26, color: C.ink },
  body: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontFamily: F.sansSemi, fontSize: 14, color: C.ink },
  meta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaText: { fontFamily: F.monoMedium, fontSize: 10 },
  bell: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bellText: { fontFamily: F.monoMedium, fontSize: 12 },
});
