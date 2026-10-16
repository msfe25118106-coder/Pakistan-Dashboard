// Ledger direction (1a): editorial paper, serif headlines, semantic green/rust.
export const C = {
  paper: '#f6f4ef',
  paperHi: '#fffdf8',
  ink: '#1c1b18',
  muted: '#6b675e',
  faint: '#8a857a',
  rule: '#e3dfd5',
  ruleStrong: '#c9c3b6',
  well: '#ebe7de',
  starOff: '#b5afa2',
  green: '#1f6b4f',
  rust: '#a5432f',
  ochre: '#a07a1f',
  blue: '#2f5d8a',
  plum: '#6d4a7a',
};

// Good / neutral / bad, indexed by goodness + 1.
export const SEMANTIC = [C.rust, C.muted, C.green];

export const F = {
  serif: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemi: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  urdu: 'NotoNastaliqUrdu_400Regular',
};
