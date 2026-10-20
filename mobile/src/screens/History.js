import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, Dimensions } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { api } from '../api';
import { T, Card, Row, Btn, col, nice, FEATS, C } from '../ui';

export default function History({ go, open, me }) {
  const [list, setList] = useState(null), [cmp, setCmp] = useState(null);
  useEffect(() => { api('scans').then(r => setList(r.scans)).catch(() => setList([])); }, []);
  if (!list) return <T k="g">Loading...</T>;
  const W = Dimensions.get('window').width - 64, H = 120, pts = [...list].reverse();
  const xs = i => pts.length < 2 ? W / 2 : 10 + i * (W - 20) / (pts.length - 1), ys = v => H - 10 - Number(v) * (H - 20) / 10;
  const compare = async () => { const [a, b] = await Promise.all(list.slice(0, 2).map(s => api('scan?id=' + s.id))); setCmp([a.scan, b.scan]); };
  return <View><T k="h1">History</T>
    {list.length === 0 && <T k="g">No scans yet.</T>}
    {me.paid && pts.length > 1 && <Card><Svg width={W} height={H}><Polyline fill="none" stroke={C.v} strokeWidth="3" points={pts.map((p, i) => `${xs(i)},${ys(p.overall)}`).join(' ')} />{pts.map((p, i) => <Circle key={p.id} cx={xs(i)} cy={ys(p.overall)} r="4" fill={C.c} />)}</Svg></Card>}
    {list.map(s => <Pressable key={s.id} onPress={() => open(s.id)}><Card><Row>
      <Row style={{ gap: 12 }}>{s.thumb ? <Image source={{ uri: s.thumb }} style={{ width: 48, height: 48, borderRadius: 10 }} /> : <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: C.alt }} />}
        <View><T>{new Date(s.created_at).toLocaleDateString()}</T><T k="g">{s.tier}</T></View></Row>
      <T style={{ color: col(s.overall), fontSize: 22, fontWeight: '800' }}>{Number(s.overall).toFixed(1)}</T></Row></Card></Pressable>)}
    {me.paid && list.length > 1 && !cmp && <Btn alt onPress={compare}>Compare last two scans</Btn>}
    {cmp && <Card><T k="h3" style={{ marginBottom: 6 }}>Latest vs previous</T>{FEATS.map(f => { const d = (cmp[0].feature_scores?.[f]?.score ?? 0) - (cmp[1].feature_scores?.[f]?.score ?? 0); return <Row key={f}><T>{nice(f)}</T><T k="h3" style={{ color: d >= 0 ? '#34D399' : '#F87171' }}>{d >= 0 ? '+' : ''}{d.toFixed(1)}</T></Row>; })}</Card>}
    {!me.paid && list.length > 0 && <Btn onPress={() => go('paywall')}>Unlock history and compare</Btn>}
  </View>;
}
