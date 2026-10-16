import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F } from '../theme';

export function Screen({ children, gap = 14, top = 8 }: { children: ReactNode; gap?: number; top?: number }) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: top, paddingHorizontal: 18, paddingBottom: 20, gap }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// Kicker + serif title over a 2px ink rule.
export function Masthead({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <View style={styles.masthead}>
      <View style={{ gap: 2 }}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function SectionRule({ label }: { label: string }) {
  return <Text style={styles.section}>{label}</Text>;
}

export function Kicker({ children, color = C.muted }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.kicker, { color }]}>{children}</Text>;
}

export function Urdu({ children, size = 13, show }: { children: string; size?: number; show: boolean }) {
  if (!show) return null;
  return <Text style={{ fontFamily: F.urdu, fontSize: size, lineHeight: size * 2, color: C.muted }}>{children}</Text>;
}

// Pill segmented control (watchlist All / Starred).
export function Segmented<T extends string>({ items, value, onChange }: { items: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <View style={styles.seg}>
      {items.map(it => {
        const on = it.key === value;
        return (
          <Pressable key={it.key} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(it.key)}
            style={[styles.segBtn, on && styles.segOn]}>
            <Text style={styles.segText}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Outlined tabs (chart ranges).
export function RangeTabs({ value, onChange, options = [3, 6, 12] }: { value: number; onChange: (n: number) => void; options?: number[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map(n => {
        const on = n === value;
        return (
          <Pressable key={n} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(n)}
            style={[styles.range, { backgroundColor: on ? C.ink : 'transparent', borderColor: on ? C.ink : C.ruleStrong }]}>
            <Text style={[styles.rangeText, { color: on ? C.paper : C.ink }]}>{n === 12 ? '1Y' : n + 'M'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, dot, onPress }: { label: string; on: boolean; dot?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}
      style={[styles.chip, { backgroundColor: on ? C.ink : 'transparent', borderColor: on ? C.ink : C.ruleStrong }]}>
      {dot && <View style={[styles.dot, { backgroundColor: dot }, on && { borderWidth: 1, borderColor: C.paper }]} />}
      <Text style={[styles.chipText, { color: on ? C.paper : C.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} onPress={onPress} hitSlop={10}
      style={[styles.sw, { backgroundColor: on ? C.green : C.ruleStrong }]}>
      <View style={[styles.knob, { left: on ? 19 : 3 }]} />
    </Pressable>
  );
}

export function StepButton({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} style={styles.step}>
      <Text style={styles.stepText}>{label}</Text>
    </Pressable>
  );
}

export function Well({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.well, style]}>{children}</View>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  masthead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 8 },
  kicker: { fontFamily: F.monoMedium, fontSize: 10, letterSpacing: 0.8, color: C.muted },
  title: { fontFamily: F.serifMedium, fontSize: 30, lineHeight: 32, letterSpacing: -0.3, color: C.ink },
  section: { fontFamily: F.monoMedium, fontSize: 10, letterSpacing: 0.8, color: C.muted, borderTopWidth: 2, borderTopColor: C.ink, paddingTop: 8 },
  seg: { flexDirection: 'row', backgroundColor: C.well, borderRadius: 10, padding: 3, gap: 3 },
  segBtn: { flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.paperHi, elevation: 1, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  segText: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink },
  range: { flex: 1, height: 34, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rangeText: { fontFamily: F.monoMedium, fontSize: 12 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontFamily: F.sansMedium, fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sw: { width: 40, height: 24, borderRadius: 12 },
  knob: { position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  step: { width: 32, height: 32, borderWidth: 1, borderColor: C.ruleStrong, borderRadius: 8, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: F.monoMedium, fontSize: 15, color: C.ink },
  well: { backgroundColor: C.well, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
});
