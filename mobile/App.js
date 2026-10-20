import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, ScrollView, Pressable, Text, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { sb, api } from './src/api';
import { initPurchases } from './src/purchases';
import { T, Card, Btn, Gauge, Bar, C } from './src/ui';
import Onboard from './src/screens/Onboard';
import Paywall from './src/screens/Paywall';
import { Scan, Analyzing } from './src/screens/Scan';
import Results from './src/screens/Results';
import Plan from './src/screens/Plan';
import Coach from './src/screens/Coach';
import History from './src/screens/History';
import Settings from './src/screens/Settings';

const TABS = [['home', 'Home'], ['scan', 'Scan'], ['plan', 'Plan'], ['coach', 'Coach'], ['settings', 'Profile']];

function Shell() {
  const [sess, setSess] = useState(undefined), [me, setMe] = useState(null), [v, setV] = useState('boot'), [scan, setScan] = useState(null), [files, setFiles] = useState(null), [from, setFrom] = useState('home'), [guestError, setGuestError] = useState('');
  const sc = useRef(), ins = useSafeAreaInsets();
  const startGuestSession = useCallback(async () => {
    setGuestError('');
    try {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      if (data.session) { setSess(data.session); return; }
      const { data: guest, error: guestError } = await sb.auth.signInAnonymously();
      if (guestError) throw guestError;
      setSess(guest.session);
    } catch (e) { setGuestError(e.message); }
  }, []);
  useEffect(() => {
    const { data: l } = sb.auth.onAuthStateChange((event, s) => {
      if (s) { setSess(s); setGuestError(''); }
      else if (event === 'SIGNED_OUT') { setSess(undefined); startGuestSession(); }
    });
    startGuestSession();
    return () => l.subscription.unsubscribe();
  }, [startGuestSession]);
  const load = useCallback(async next => {
    const m = await api('me'); setMe(m);
    const r = await api('scan'); setScan(r.scan);
    setV(x => !m.profile?.onboarded ? 'welcome' : (x === 'boot' || x === 'welcome') ? (next || 'home') : (next || x));
  }, []);
  useEffect(() => {
    if (sess) { initPurchases(sess.user.id); load().catch(e => Alert.alert('Connection problem', e.message)); }
    else if (sess === null) { setMe(null); setV('boot'); }
  }, [sess]);
  const open = async id => { const r = await api('scan?id=' + id); setScan(r.scan); setV('results'); };
  const go = (to, f) => { if (to === 'analyzing') setFiles(f); if (to === 'paywall') setFrom(v); setV(to); };
  const tab = t => { setV(t); if (t === 'plan' || t === 'results') api('scan').then(r => setScan(r.scan)).catch(() => {}); };
  const body = () => {
    if (sess === undefined) return guestError
      ? <View style={{ marginTop: 60 }}><T k="h1">Guest access unavailable</T><T k="err">{guestError}</T><Btn onPress={startGuestSession}>Try again</Btn></View>
      : <T k="g" style={{ marginTop: 60 }}>Starting guest session...</T>;
    if (!me) return <T k="g" style={{ marginTop: 60 }}>Loading...</T>;
    if (v === 'welcome') return <Onboard done={() => load('scan')} />;
    if (v === 'paywall') return <Paywall me={me} back={() => setV(from === 'paywall' ? 'home' : from)} done={() => load(from === 'paywall' ? 'home' : from)} />;
    if (v === 'analyzing') return <Analyzing files={files} done={id => open(id).then(() => load('results'))} fail={() => setV('scan')} paywall={() => go('paywall')} />;
    const pct = scan?.plan?.length ? Math.round(scan.plan.filter(p => p.completed).length / scan.plan.length * 100) : null;
    const old = scan && (Date.now() - new Date(scan.created_at)) > 30 * 864e5;
    return <>
      {v === 'home' && <View><T k="h1">Home</T>
        {scan ? <Card style={{ alignItems: 'center' }}><Gauge v={scan.overall_score} /><T k="h3">{scan.tier_label}</T>{pct != null && <T k="g">Plan {pct}% done</T>}<Btn onPress={() => open(scan.id)}>View results</Btn></Card> : <Card><T k="g">No scan yet. Take two photos to get your rating.</T></Card>}
        {old && <Card><T k="g">Your last scan is over 30 days old. Rescan to track progress.</T></Card>}
        <Btn onPress={() => setV('scan')}>{scan ? 'Rescan' : 'Start your first scan'}</Btn><Btn alt onPress={() => setV('history')}>History and progress</Btn></View>}
      {v === 'scan' && <Scan go={go} />}
      {v === 'results' && <Results s={scan} go={go} />}
      {v === 'plan' && <Plan s={scan} go={go} setS={setScan} />}
      {v === 'coach' && <Coach me={me} go={go} toEnd={() => sc.current?.scrollToEnd({ animated: true })} />}
      {v === 'history' && <History go={go} open={open} me={me} />}
      {v === 'settings' && <Settings me={me} reload={() => load()} go={go} />}
    </>;
  };
  const showTabs = sess && me && !['welcome', 'paywall', 'analyzing', 'boot'].includes(v);
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <ScrollView ref={sc} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">{body()}</ScrollView>
      {showTabs && <View style={{ flexDirection: 'row', backgroundColor: '#101018', borderTopWidth: 1, borderTopColor: '#22222e', paddingBottom: ins.bottom }}>
        {TABS.map(([k, l]) => <Pressable key={k} onPress={() => tab(k)} accessibilityRole="tab" style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: v === k ? C.c : C.g, fontWeight: v === k ? '700' : '400', fontSize: 13 }}>{l}</Text></Pressable>)}
      </View>}
    </SafeAreaView>
  </KeyboardAvoidingView>;
}

export default function App() { return <SafeAreaProvider><StatusBar style="light" /><Shell /></SafeAreaProvider>; }
