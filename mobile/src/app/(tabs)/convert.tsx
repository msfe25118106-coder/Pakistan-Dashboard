import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Masthead, Screen } from '../../components/ui';
import { FX } from '../../data/events';
import { num } from '../../data/format';
import { C, F } from '../../theme';

export default function Convert() {
  const [amt, setAmt] = useState('100000');
  const [toPkr, setToPkr] = useState(false);
  const value = parseFloat(amt.replace(/,/g, '')) || 0;
  const presets = toPkr ? [100, 1000, 5000] : [10000, 100000, 1000000];
  return (
    <Screen>
      <Masthead kicker="INTERBANK · 16 OCT 2026" title="Converter" />
      <View style={s.card}>
        <Text style={s.label}>{toPkr ? 'AMOUNT IN FOREIGN CURRENCY → PKR' : 'AMOUNT IN PKR'}</Text>
        <TextInput value={amt} onChangeText={setAmt} keyboardType="decimal-pad" style={s.input} accessibilityLabel="Amount"
          selectionColor={C.green} />
        <View style={s.presets}>
          {presets.map(p => (
            <Pressable key={p} onPress={() => setAmt(String(p))} style={s.preset} accessibilityRole="button">
              <Text style={s.presetText}>{num(p)}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => { setToPkr(v => !v); setAmt(toPkr ? '100000' : '1000'); }} style={s.swap} accessibilityRole="button" accessibilityLabel="Swap direction">
            <Text style={s.swapText}>⇅ Swap</Text>
          </Pressable>
        </View>
      </View>
      <View>
        {FX.map(c => (
          <View key={c.code} style={s.row}>
            <Text style={s.code}>{c.code}</Text>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={s.name}>{c.name}</Text>
              <Text style={s.rate}>1 {c.code} = Rs {num(c.rate, 2)}</Text>
            </View>
            <Text style={s.out} numberOfLines={1} adjustsFontSizeToFit>{toPkr ? 'Rs ' + num(value * c.rate, 0) : num(value / c.rate, 2)}</Text>
          </View>
        ))}
      </View>
      <Text style={s.foot}>Cross rates are derived from the interbank USD/PKR rate. EUR and GBP use reference crosses of 1.12 and 1.33; SAR and AED use their USD pegs. Open-market and bank rates differ.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.well, borderRadius: 14, padding: 14, gap: 8 },
  label: { fontFamily: F.monoMedium, fontSize: 10, letterSpacing: 0.6, color: C.muted },
  input: { fontFamily: F.serif, fontSize: 40, color: C.ink, padding: 0, borderBottomWidth: 1, borderBottomColor: C.ruleStrong },
  presets: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  preset: { height: 32, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: C.ruleStrong, backgroundColor: C.paper, justifyContent: 'center' },
  presetText: { fontFamily: F.monoMedium, fontSize: 11, color: C.ink },
  swap: { marginLeft: 'auto', height: 32, paddingHorizontal: 12, borderRadius: 8, backgroundColor: C.ink, justifyContent: 'center' },
  swapText: { fontFamily: F.sansSemi, fontSize: 12, color: C.paper },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.rule },
  code: { width: 44, fontFamily: F.monoMedium, fontSize: 13, color: C.green },
  name: { fontFamily: F.sansMedium, fontSize: 13, color: C.ink },
  rate: { fontFamily: F.mono, fontSize: 10, color: C.muted },
  out: { maxWidth: 150, fontFamily: F.monoMedium, fontSize: 16, color: C.ink },
  foot: { fontFamily: F.sans, fontSize: 11, lineHeight: 16, color: C.faint },
});
