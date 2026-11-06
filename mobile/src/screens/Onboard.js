import React, { useState } from 'react';
import { View, Switch, Pressable } from 'react-native';
import { ScanFace, Gauge as GaugeIcon, ListChecks, ShieldCheck } from '../icons';
import { api } from '../api';
import { T, Card, Btn, Chip, Chips, Logo, LegalModal, ErrorText, C, R, nice, OPTIONS, tap } from '../ui';

const POINTS = [
  [ScanFace, 'Two photos, one minute', 'A front photo and a side profile. No account, no sign-in.'],
  [GaugeIcon, 'Nine features, scored', 'Each rated out of 10 with a clear, specific verdict.'],
  [ListChecks, 'A plan that fits you', 'Ranked, safe actions and a coach that knows your results.'],
  [ShieldCheck, 'Private by default', 'Photos are deleted automatically 7 days after each scan.'],
];
const QUESTIONS = [['gender', 'Gender'], ['age_range', 'Age range'], ['main_goal', 'Main goal']];

const Link = ({ onPress, children }) => <Pressable onPress={onPress} hitSlop={6} accessibilityRole="link"><T style={{ color: C.light, textDecorationLine: 'underline' }}>{children}</T></Pressable>;

export default function Onboard({ done }) {
  const [a, setA] = useState({}), [ck, setCk] = useState([false, false, false]), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [legal, setLegal] = useState(null);
  const ready = QUESTIONS.every(([k]) => a[k]) && ck.every(Boolean);
  const toggle = i => { tap(); setCk(ck.map((x, j) => j === i ? !x : x)); };
  const submit = async () => {
    setBusy(true); setErr('');
    try { await api('profile', { ...a, age_confirmed: true, consent_accepted: true }); await done(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };
  const consent = [
    <T>I am 18 or older.</T>,
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><T>I agree to the </T><Link onPress={() => setLegal('terms')}>Terms</Link><T> and </T><Link onPress={() => setLegal('privacy')}>Privacy Policy</Link><T>.</T></View>,
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><T>I consent to Maxora processing my face photos to produce ratings (</T><Link onPress={() => setLegal('biometric')}>notice</Link><T>).</T></View>,
  ];
  return <View style={{ gap: 28 }}>
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Logo size={40} /><T k="h2">Maxora</T></View>
      <View style={{ gap: 10 }}>
        <T k="display" accessibilityRole="header">Understand your face. Improve what matters.</T>
        <T k="muted" style={{ fontSize: 16, lineHeight: 24 }}>An honest AI read on your facial features, with a focused plan to get better. Free to use.</T>
      </View>
      <View style={{ gap: 16 }}>
        {POINTS.map(([I, t, d]) => <View key={t} style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: R.control, borderCurve: 'continuous', backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}><I size={20} color={C.light} /></View>
          <View style={{ flex: 1 }}><T k="h3">{t}</T><T k="muted" style={{ fontSize: 14, lineHeight: 20 }}>{d}</T></View>
        </View>)}
      </View>
    </View>

    <Card style={{ gap: 20, padding: 20 }}>
      <View style={{ gap: 4 }}><T k="h2">About you</T><T k="muted">This tailors your ratings and plan. You can change it later.</T></View>
      {QUESTIONS.map(([k, label]) => <View key={k} style={{ gap: 10 }}>
        <T style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{label}</T>
        <Chips>{OPTIONS[k].map(x => <Chip key={x} on={a[k] === x} onPress={() => setA({ ...a, [k]: x })}>{nice(x)}</Chip>)}</Chips>
      </View>)}
      <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
        {consent.map((label, i) => <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: C.line }}>
          <View style={{ flex: 1 }}>{label}</View>
          <Switch value={ck[i]} onValueChange={() => toggle(i)} trackColor={{ false: C.card2, true: C.accentFg }} thumbColor="#fff" ios_backgroundColor={C.card2} accessibilityLabel={['Age confirmation', 'Terms agreement', 'Photo processing consent'][i]} />
        </View>)}
      </View>
      {!!err && <ErrorText>{err}</ErrorText>}
      <View style={{ gap: 8 }}>
        <Btn disabled={!ready || busy} onPress={submit}>{busy ? 'Setting up…' : 'Continue'}</Btn>
        {!ready && <T k="meta" style={{ textAlign: 'center' }}>Answer all three and turn on each switch to continue.</T>}
      </View>
    </Card>
    <LegalModal doc={legal} onClose={() => setLegal(null)} />
  </View>;
}
