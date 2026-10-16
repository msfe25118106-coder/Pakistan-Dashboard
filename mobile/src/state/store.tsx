import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { INDICATORS } from '../data/indicators';

type AlertState = { on: boolean; thr: number };

export type Prefs = {
  stars: Record<string, boolean>;
  alerts: Record<string, AlertState>;
  bells: Record<string, boolean>;
  showUrdu: boolean;
  semanticColor: boolean;
};

const DEFAULTS: Prefs = {
  stars: { cpi: true, policy: true, pkr: true, reserves: true, petrol: true },
  alerts: Object.fromEntries(
    INDICATORS.filter(i => i.alert).map(i => [i.id, { on: ['cpi', 'petrol', 'pkr'].includes(i.id), thr: i.alert!.defaultThr }]),
  ),
  bells: { cpi: true, mpc: true },
  showUrdu: true,
  semanticColor: true,
};

const KEY = 'pkecon.prefs.v1';

type Store = Prefs & {
  toggleStar: (id: string) => void;
  setAlert: (id: string, patch: Partial<AlertState>) => void;
  toggleBell: (k: string) => void;
  set: (patch: Partial<Prefs>) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(s => {
        if (s) {
          const saved = JSON.parse(s) as Partial<Prefs>;
          setPrefs(p => ({ ...p, ...saved, alerts: { ...p.alerts, ...saved.alerts } }));
        }
      })
      .catch(() => {})
      .finally(() => { loaded.current = true; });
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs]);

  const store = useMemo<Store>(() => ({
    ...prefs,
    toggleStar: id => setPrefs(p => ({ ...p, stars: { ...p.stars, [id]: !p.stars[id] } })),
    setAlert: (id, patch) => setPrefs(p => ({ ...p, alerts: { ...p.alerts, [id]: { ...p.alerts[id], ...patch } } })),
    toggleBell: k => setPrefs(p => ({ ...p, bells: { ...p.bells, [k]: !p.bells[k] } })),
    set: patch => setPrefs(p => ({ ...p, ...patch })),
  }), [prefs]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

export function alertStatus(value: number, dir: 'above' | 'below', thr: number) {
  return dir === 'above' ? value >= thr : value <= thr;
}
