import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, Masthead, Screen } from '../../components/ui';
import { NEWS, NEWS_FILTERS } from '../../data/events';
import { C, F } from '../../theme';

export default function News() {
  const [filter, setFilter] = useState('All');
  const rows = filter === 'All' ? NEWS : NEWS.filter(n => n.cat === filter);
  return (
    <Screen>
      <Masthead kicker="SBP · PBS · MARKETS" title="News" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {NEWS_FILTERS.map(f => <Chip key={f} label={f} on={filter === f} onPress={() => setFilter(f)} />)}
      </ScrollView>
      <View>
        {rows.map(n => (
          <Pressable key={n.t} disabled={!n.ind} onPress={() => n.ind && router.push(`/indicator/${n.ind}`)} accessibilityRole={n.ind ? 'link' : 'text'}
            style={({ pressed }) => [s.item, pressed && { opacity: 0.6 }]}>
            <View style={s.meta}>
              <Text style={[s.src, { color: n.src === 'SBP' ? C.green : C.muted }]}>{n.src}{n.src === 'SBP' ? ' · ANNOUNCEMENT' : ''}</Text>
              <Text style={s.date}>{n.date}</Text>
            </View>
            <Text style={s.head}>{n.t}</Text>
            <Text style={s.tag}>{n.tag}{n.ind ? ' ›' : ''}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  item: { paddingVertical: 12, gap: 5, borderBottomWidth: 1, borderBottomColor: C.rule },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  src: { fontFamily: F.monoMedium, fontSize: 10, letterSpacing: 0.6 },
  date: { fontFamily: F.mono, fontSize: 11, color: C.faint },
  head: { fontFamily: F.serif, fontSize: 18, lineHeight: 23, color: C.ink },
  tag: { fontFamily: F.sansMedium, fontSize: 11, color: C.muted },
});
