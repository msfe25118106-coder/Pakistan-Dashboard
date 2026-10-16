import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, F } from '../theme';

// Ledger tab bar: the active tab's dot stretches into a 52px ink bar.
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, i) => {
        const on = state.index === i;
        const label = descriptors[route.key].options.title ?? route.name;
        return (
          <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.item}
            onPress={() => {
              const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!on && !e.defaultPrevented) navigateToTab(route.key);
            }}>
            <View style={[styles.mark, on ? styles.markOn : null]} />
            <Text style={[styles.label, on ? styles.labelOn : null]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.rule, backgroundColor: C.paper },
  item: { flex: 1, height: 62, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mark: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.ruleStrong },
  markOn: { width: 52, backgroundColor: C.ink },
  label: { fontFamily: F.sansMedium, fontSize: 11, color: C.muted },
  labelOn: { fontFamily: F.sansSemi, color: C.ink },
});
