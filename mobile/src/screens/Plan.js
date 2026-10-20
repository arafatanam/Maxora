import React from 'react';
import { View, Switch } from 'react-native';
import { api } from '../api';
import { T, Card, Row, Btn, Bar, Tag, nice, CATS } from '../ui';

export default function Plan({ s, go, setS }) {
  if (!s) return <View><T k="h1">Plan</T><T k="g">Run a scan to get your plan.</T><Btn onPress={() => go('scan')}>Scan now</Btn></View>;
  if (s.locked) return <View><T k="h1">Plan</T><Card><T k="g">Your ranked plan is part of the full report.</T><Btn onPress={() => go('paywall')}>Unlock now</Btn></Card></View>;
  const plan = s.plan || [], pct = plan.length ? Math.round(plan.filter(p => p.completed).length / plan.length * 100) : 0;
  const tog = async p => { const completed = !p.completed; setS({ ...s, plan: plan.map(x => x.id === p.id ? { ...x, completed } : x) }); try { await api('plan/toggle', { id: p.id, completed }); } catch {} };
  return <View><T k="h1">Plan</T><T k="g" style={{ marginBottom: 6 }}>{pct}% done</T><Bar v={pct / 10} />
    {CATS.filter(c => plan.some(p => p.category === c)).map(c => <View key={c}><T k="h2">{nice(c)}</T>
      {plan.filter(p => p.category === c).map(p => <Card key={p.id}><Row style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}><T k="h3">{p.title}</T><T k="g">{p.reason}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 }}><Tag>Effort {p.effort}</Tag><Tag>Impact {p.impact}</Tag><Tag>{p.time_to_result}</Tag></View></View>
        <Switch value={!!p.completed} onValueChange={() => tog(p)} /></Row></Card>)}</View>)}
  </View>;
}
