import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Text, KeyboardAvoidingView, Platform, BackHandler, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, ScanFace, ListChecks, MessagesSquare, History as HistoryIcon, Settings as SettingsIcon, WifiOff } from './src/icons';
import { api, API_URL } from './src/api';
import { T, Btn, Logo, C, F, tap } from './src/ui';
import Onboard from './src/screens/Onboard';
import Home from './src/screens/Home';
import { Scan } from './src/screens/Scan';
import Results from './src/screens/Results';
import Plan from './src/screens/Plan';
import Coach from './src/screens/Coach';
import History from './src/screens/History';
import Settings from './src/screens/Settings';

SplashScreen.preventAutoHideAsync().catch(() => {});

const TABS = [['home', 'Home', House], ['scan', 'Scan', ScanFace], ['plan', 'Plan', ListChecks], ['coach', 'Coach', MessagesSquare], ['history', 'History', HistoryIcon]];
const MAX_W = 640;

function Shell() {
  const [fontsLoaded] = useFonts({ Sora_600SemiBold, Sora_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [me, setMe] = useState(null), [scan, setScan] = useState(undefined), [err, setErr] = useState('');
  const [route, setRoute] = useState({ v: 'home' }), [viewed, setViewed] = useState(null);
  const stack = useRef([]), sc = useRef(), ins = useSafeAreaInsets(), { width } = useWindowDimensions();

  const load = useCallback(async () => {
    setErr('');
    try { const [m, s] = await Promise.all([api('me'), api('scan')]); setMe(m); setScan(s.scan); }
    catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const ready = fontsLoaded && (me || err);
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);

  // Tabs are peers (no history between them). Results is pushed on top so back returns to where it was opened.
  const go = useCallback((v, opts = {}) => {
    if (opts.push) stack.current.push(route); else stack.current = [];
    setRoute({ v, id: opts.id }); sc.current?.scrollTo({ y: 0, animated: false });
  }, [route]);
  const back = useCallback(() => {
    const prev = stack.current.pop();
    if (prev) { setRoute(prev); return true; }
    if (route.v !== 'home') { setRoute({ v: 'home' }); return true; }
    return false;
  }, [route]);
  useEffect(() => { const s = BackHandler.addEventListener('hardwareBackPress', back); return () => s.remove(); }, [back]);

  const open = useCallback(async id => {
    if (id === scan?.id) { setViewed(scan); go('results', { push: true, id }); return; }
    setViewed(null); go('results', { push: true, id });
    try { const r = await api('scan?id=' + id); setViewed(r.scan); } catch { back(); }
  }, [scan, go, back]);
  const finished = useCallback(async id => {
    await load();
    const r = await api('scan?id=' + id).catch(() => null);
    setViewed(r?.scan || null); stack.current = []; setRoute({ v: 'results', id });
  }, [load]);
  const setCoachLeft = useCallback(n => setMe(m => ({ ...m, limits: { ...m.limits, coach: { ...m.limits.coach, remaining: n } } })), []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  const body = () => {
    if (err) return <View style={{ gap: 12, paddingTop: 40 }}>
      <WifiOff size={28} color={C.light} />
      <T k="h1">Can't reach Maxora</T>
      <T k="muted">{err}</T>
      <T k="meta">Server: {API_URL}</T>
      <Btn onPress={load}>Try again</Btn>
    </View>;
    if (!me || scan === undefined) return null;
    if (!me.profile?.onboarded) return <Onboard done={async () => { await load(); setRoute({ v: 'scan' }); }} />;
    const { v } = route;
    if (v === 'home') return <Home me={me} scan={scan} go={go} open={open} />;
    if (v === 'scan') return <Scan me={me} go={go} onDone={finished} reload={load} />;
    if (v === 'results') return <Results s={route.id === scan?.id ? scan : viewed} isLatest={route.id === scan?.id} go={go} back={back} />;
    if (v === 'plan') return <Plan s={scan} go={go} setS={setScan} />;
    if (v === 'coach') return <Coach me={me} scan={scan} go={go} onLimit={setCoachLeft} toEnd={() => sc.current?.scrollToEnd({ animated: true })} />;
    if (v === 'history') return <History go={go} open={open} maxWidth={MAX_W} />;
    if (v === 'settings') return <Settings me={me} setMe={setMe} reset={() => { setMe(null); setScan(undefined); setRoute({ v: 'home' }); load(); }} />;
  };

  const showNav = me?.profile?.onboarded && !err;
  const active = route.v === 'results' ? 'home' : route.v;
  const side = Math.max(16, (width - MAX_W) / 2);
  return <View style={{ flex: 1, backgroundColor: C.bg }}>
    {showNav && <View style={{ paddingTop: ins.top, paddingHorizontal: side, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.line }}>
      <View style={{ height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => go('home')} accessibilityRole="button" accessibilityLabel="Maxora home" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Logo size={30} /><Text style={{ color: C.fg, fontFamily: F.head, fontSize: 17 }}>Maxora</Text></Pressable>
        <Pressable onPress={() => go('settings')} accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 }}>
          <SettingsIcon size={22} color={route.v === 'settings' ? C.accent : C.fg2} /></Pressable>
      </View>
    </View>}
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={sc} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: side, paddingTop: showNav ? 24 : ins.top + 24, paddingBottom: 40 }}>
        {body()}
      </ScrollView>
    </KeyboardAvoidingView>
    {showNav && <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: C.raised, borderTopWidth: 1, borderTopColor: C.line, paddingBottom: ins.bottom, paddingHorizontal: Math.max(0, (width - MAX_W) / 2) }}>
      {TABS.map(([k, label, Icon]) => {
        const on = active === k;
        return <Pressable key={k} onPress={() => { if (!on) { tap(); go(k); } else sc.current?.scrollTo({ y: 0, animated: true }); }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}
          style={{ flex: 1, height: 58, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <Icon size={22} color={on ? C.accent : C.fg3} />
          <Text style={{ color: on ? C.accent : C.fg3, fontFamily: F.medium, fontSize: 11 }}>{label}</Text>
        </Pressable>;
      })}
    </View>}
  </View>;
}

export default function App() { return <SafeAreaProvider><StatusBar style="light" /><Shell /></SafeAreaProvider>; }
