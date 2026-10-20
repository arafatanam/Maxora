import React, { useState } from 'react';
import { View, Switch, Pressable } from 'react-native';
import { api } from '../api';
import { T, Card, Row, Btn, Opt, nice, LegalModal, C } from '../ui';

const slides = [['Upload a selfie', 'A front photo and a side photo. Even light, no filters.'], ['Get your ratings', 'Nine features scored out of 10 with a blunt verdict each.'], ['Follow your plan', 'Ranked actions and a coach who knows your scan.']];
const Q = [['gender', 'Gender', ['male', 'female', 'other']], ['age_range', 'Age range', ['18 to 24', '25 to 34', '35 to 44', '45 plus']], ['main_goal', 'Main goal', ['Better jawline', 'Better skin', 'Better hair', 'Overall glow up', 'Social confidence']]];
const labels = ['I am 18 or older.', 'I agree to the Terms & Conditions and Privacy Policy.', 'I consent to Maxora processing my face photos to produce ratings.'];

export default function Onboard({ done }) {
  const [step, setStep] = useState(0), [a, setA] = useState({}), [ck, setCk] = useState([false, false, false]), [err, setErr] = useState(''), [legal, setLegal] = useState(null);
  if (step < 3) return <View style={{ justifyContent: 'center', flex: 1 }}><T k="h1">{slides[step][0]}</T><T k="g" style={{ marginVertical: 12 }}>{slides[step][1]}</T><Btn onPress={() => setStep(step + 1)}>{step === 2 ? 'Get started' : 'Next'}</Btn></View>;
  if (step < 6) { const [k, t, o] = Q[step - 3]; return <View style={{ justifyContent: 'center', flex: 1 }}><T k="h1" style={{ marginBottom: 10 }}>{t}</T>{o.map(x => <Opt key={x} on={a[k] === x} onPress={() => { setA({ ...a, [k]: x }); setStep(step + 1); }}>{nice(x)}</Opt>)}</View>; }
  return <View style={{ justifyContent: 'center', flex: 1 }}><T k="h1">Before you scan</T>
    {labels.map((l, i) => <Card key={i}><Row><View style={{ flex: 1 }}>{i === 1
      ? <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}><T>I agree to the </T><Pressable onPress={() => setLegal('terms')}><T style={{ color: '#D9E5F2', textDecorationLine: 'underline' }}>Terms & Conditions</T></Pressable><T> and </T><Pressable onPress={() => setLegal('privacy')}><T style={{ color: '#D9E5F2', textDecorationLine: 'underline' }}>Privacy Policy</T></Pressable><T>.</T></View>
      : <T>{l}</T>}</View><Switch trackColor={{ false: C.alt, true: C.v }} thumbColor="#fff" value={ck[i]} onValueChange={() => setCk(ck.map((x, j) => j === i ? !x : x))} /></Row></Card>)}
    {!!err && <T k="err">{err}</T>}
    <Btn disabled={!ck.every(Boolean)} onPress={async () => { try { await api('profile', { ...a, age_confirmed: true, consent_accepted: true }); done(); } catch (e) { setErr(e.message); } }}>Continue</Btn>
    <LegalModal doc={legal} onClose={() => setLegal(null)} />
  </View>;
}
