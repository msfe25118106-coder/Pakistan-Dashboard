import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Masthead, Screen, SectionRule, Toggle } from '../components/ui';
import { INDICATORS } from '../data/indicators';
import { alertStatus, useStore } from '../state/store';
import { C, F } from '../theme';

export default function Alerts() {
  const store = useStore();
  const items = INDICATORS.filter(i => i.alert);
  return (
    <Screen top={4}>
      <View style={s.nav}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={s.navBtn}>
          <Text style={s.back}>←</Text>
        </Pressable>
      </View>
      <Masthead kicker={`${items.filter(i => store.alerts[i.id]?.on).length} ON · ${items.length} AVAILABLE`} title="Alerts" />
      <View>
        {items.map(i => {
          const spec = i.alert!;
          const a = store.alerts[i.id] ?? { on: false, thr: spec.defaultThr };
          const hit = alertStatus(i.value, spec.dir, a.thr);
          return (
            <View key={i.id} style={s.row}>
              <Pressable style={{ flex: 1, gap: 2 }} onPress={() => router.push(`/indicator/${i.id}`)} accessibilityRole="link">
                <Text style={s.name}>{i.name} {spec.dir === 'above' ? '≥' : '≤'} {spec.fmt(a.thr)}</Text>
                <Text style={[s.sub, a.on && hit && { color: C.rust }]}>
                  Now {i.display}{a.on ? (hit ? ' · triggered' : '') : ' · off'}
                </Text>
              </Pressable>
              <Toggle on={a.on} label={`Alert for ${i.name}`} onPress={() => store.setAlert(i.id, { on: !a.on })} />
            </View>
          );
        })}
      </View>
      <Text style={s.foot}>Change a threshold on the indicator’s page. Alerts are checked against the figures in this build of the app.</Text>

      <SectionRule label="DISPLAY" />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>Urdu labels</Text>
          <Text style={s.sub}>Show Urdu names beside indicators</Text>
        </View>
        <Toggle on={store.showUrdu} label="Urdu labels" onPress={() => store.set({ showUrdu: !store.showUrdu })} />
      </View>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>Colour by economic effect</Text>
          <Text style={s.sub}>Green when a move is good for the economy, rust when bad</Text>
        </View>
        <Toggle on={store.semanticColor} label="Colour by economic effect" onPress={() => store.set({ semanticColor: !store.semanticColor })} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  nav: { height: 44, justifyContent: 'center' },
  navBtn: { width: 44, height: 44, justifyContent: 'center' },
  back: { fontFamily: F.sans, fontSize: 22, color: C.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.rule },
  name: { fontFamily: F.sansSemi, fontSize: 14, color: C.ink },
  sub: { fontFamily: F.sans, fontSize: 11, color: C.muted },
  foot: { fontFamily: F.sans, fontSize: 11, lineHeight: 16, color: C.faint },
});
