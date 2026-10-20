import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '../api';
import { getPackages, buyPackage, restore, iapReady } from '../purchases';
import { T, Card, Btn, Opt, Bar, Tag } from '../ui';

const BENEFITS = ['All feature scores and face profile', 'Ranked improvement plan with tracking', 'Coach Vee chat, 50 messages a day', 'Score history and compare view (5 scans a week)'];
const wait = ms => new Promise(r => setTimeout(r, ms));

export default function Paywall({ me, back, done }) {
  const [plan, setPlan] = useState('weekly_trial'), [pkgs, setPkgs] = useState([]), [sel, setSel] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  useEffect(() => { if (!me.test) getPackages().then(setPkgs); }, []);
  const poll = async () => { for (let i = 0; i < 8; i++) { const m = await api('me'); if (m.paid) return done(); await wait(1500); } setErr('Purchase received. Access unlocks within a minute. Reopen the app if it stays locked.'); setBusy(false); };
  const go = async () => {
    setBusy(true); setErr('');
    try {
      if (me.test) { await api('subscribe', { plan }); return done(); }
      if (!pkgs.length) throw new Error('Subscriptions are not available on this build.');
      await buyPackage(pkgs[sel]); await poll();
    } catch (e) { if (!e.userCancelled) setErr(e.message); setBusy(false); }
  };
  return <View>
    <T k="h1">View all insights.</T>
    <Card style={{ opacity: 0.35 }}><T k="h3">Jawline 7.2</T><Bar v={7.2} /><T k="h3" style={{ marginTop: 10 }}>Eye area 6.1</T><Bar v={6.1} /></Card>
    <Card>{BENEFITS.map(x => <T key={x} style={{ marginVertical: 3 }}>• {x}</T>)}</Card>
    {me.test ? <>
      <Opt on={plan === 'weekly_trial'} onPress={() => setPlan('weekly_trial')}>3-day trial, then $4.99 per week</Opt>
      <Opt on={plan === 'weekly'} onPress={() => setPlan('weekly')}>$6.99 per week, no trial</Opt>
    </> : pkgs.map((p, i) => <Opt key={p.identifier} on={sel === i} onPress={() => setSel(i)}>{p.product.title}: {p.product.priceString}</Opt>)}
    {!me.test && !pkgs.length && <T k="g">Loading plans...</T>}
    {!!err && <T k="err">{err}</T>}
    <Btn disabled={busy} onPress={go}>{me.test && plan === 'weekly' ? 'Subscribe' : 'Start free trial'}</Btn>
    {me.test && <Tag>Test mode: no payment taken</Tag>}
    {!me.test && iapReady() && <Btn alt onPress={async () => { await restore(); poll(); }}>Restore purchases</Btn>}
    <T k="sm" style={{ marginVertical: 8 }}>Renews weekly until cancelled. Manage or cancel in your App Store or Google Play subscription settings.</T>
    <Btn alt onPress={back}>Not now</Btn>
  </View>;
}
