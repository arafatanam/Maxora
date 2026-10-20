import React, { useState } from 'react';
import { View, Switch } from 'react-native';
import { api } from '../api';
import { T, Card, Row, Btn, Opt, nice } from '../ui';

const slides = [['Upload a selfie', 'A front photo and a side photo. Even light, no filters.'], ['Get your ratings', 'Nine features scored out of 10 with a blunt verdict each.'], ['Follow your plan', 'Ranked actions and a coach who knows your scan.']];
const Q = [['gender', 'Gender', ['male', 'female', 'other']], ['age_range', 'Age range', ['18 to 24', '25 to 34', '35 to 44', '45 plus']], ['main_goal', 'Main goal', ['Better jawline', 'Better skin', 'Better hair', 'Overall glow up', 'Social confidence']]];
const labels = ['I am 18 or older.', 'I agree to the Terms and Privacy Policy.', 'I consent to Facet AI processing my face photos to produce ratings.'];

export default function Onboard({ done }) {
  const [step, setStep] = useState(0), [a, setA] = useState({}), [ck, setCk] = useState([false, false, false]), [err, setErr] = useState('');
  if (step < 3) return <View style={{ marginTop: 60 }}><T k="h1">{slides[step][0]}</T><T k="g" style={{ marginVertical: 12 }}>{slides[step][1]}</T><Btn onPress={() => setStep(step + 1)}>{step === 2 ? 'Get started' : 'Next'}</Btn></View>;
  if (step < 6) { const [k, t, o] = Q[step - 3]; return <View style={{ marginTop: 30 }}><T k="h1" style={{ marginBottom: 10 }}>{t}</T>{o.map(x => <Opt key={x} on={a[k] === x} onPress={() => { setA({ ...a, [k]: x }); setStep(step + 1); }}>{nice(x)}</Opt>)}</View>; }
  return <View style={{ marginTop: 30 }}><T k="h1">Before you scan</T>
    {labels.map((l, i) => <Card key={i}><Row><T style={{ flex: 1 }}>{l}</T><Switch value={ck[i]} onValueChange={() => setCk(ck.map((x, j) => j === i ? !x : x))} /></Row></Card>)}
    {!!err && <T k="err">{err}</T>}
    <Btn disabled={!ck.every(Boolean)} onPress={async () => { try { await api('profile', { ...a, age_confirmed: true, consent_accepted: true }); done(); } catch (e) { setErr(e.message); } }}>Continue</Btn>
  </View>;
}
