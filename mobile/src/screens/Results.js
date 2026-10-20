import React, { useRef } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { T, Card, Row, Btn, Bar, Gauge, col, nice, FEATS, DISC } from '../ui';

export default function Results({ s, go }) {
  const ref = useRef();
  if (!s) return <T k="g">Loading...</T>;
  const share = async () => { try { const uri = await captureRef(ref, { format: 'png', quality: 1 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri); } catch {} };
  const top = (s.plan || []).slice(0, 3);
  return <View>
    <View ref={ref} collapsable={false} style={{ backgroundColor: '#16161F', borderRadius: 16, padding: 16, alignItems: 'center', marginVertical: 8 }}>
      <Gauge v={s.overall_score} /><T k="h1">{s.tier_label}</T>
      <T k="g">{s.psl_tier}{s.potential_score != null ? ` · Potential ${s.potential_score.toFixed(1)}` : ''}</T>
      <T k="sm" style={{ marginTop: 6 }}>Maxora estimate</T>
    </View>
    <Btn small onPress={share}>Share score card</Btn>
    {s.locked ? <Card>
      <View style={{ opacity: 0.3 }}>{FEATS.map(f => <View key={f} style={{ marginVertical: 8 }}><Row><T>{nice(f)}</T><T k="h3">7.0</T></Row><Bar v={7} /></View>)}</View>
      <T k="h2" style={{ textAlign: 'center' }}>Full report locked</T><Btn onPress={() => go('paywall')}>Unlock now</Btn>
    </Card> : <>
      <T k="g" style={{ marginTop: 8 }}>{s.summary}</T>
      {top.length > 0 && <><T k="h2">Do this first</T>{top.map(p => <Card key={p.id}><T k="h3">{p.title}</T><T k="g">{p.reason}</T></Card>)}</>}
      <T k="h2">Feature scores (AI estimate)</T>
      {FEATS.map(f => s.feature_scores?.[f] && <Card key={f}><Row><T k="h3">{nice(f)}</T><T k="h3" style={{ color: col(s.feature_scores[f].score) }}>{s.feature_scores[f].score.toFixed(1)}</T></Row><Bar v={s.feature_scores[f].score} /><T k="g" style={{ marginTop: 6 }}>{s.feature_scores[f].verdict}</T></Card>)}
      <T k="h2">Face profile</T><Card>{Object.entries(s.face_profile || {}).map(([k, v]) => <Row key={k}><T k="g">{nice(k)}</T><T k="h3">{nice(String(v))}</T></Row>)}</Card>
      <T k="h2">Strengths</T><Card>{(s.strengths || []).map(x => <T key={x}>• {x}</T>)}</Card>
      <T k="h2">Weaknesses</T><Card>{(s.weaknesses || []).map(x => <T key={x}>• {x}</T>)}</Card>
      <Btn onPress={() => go('plan')}>Open improvement plan</Btn><Btn alt onPress={() => go('coach')}>Ask Coach Vee</Btn>
    </>}
    <T k="sm" style={{ marginTop: 16 }}>{DISC}</T>
  </View>;
}
