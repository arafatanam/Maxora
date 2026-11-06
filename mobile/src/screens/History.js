import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SText } from 'react-native-svg';
import { ArrowUp, ArrowDown, Equal } from '../icons';
import { api } from '../api';
import { T, Card, Row, Btn, Head, Section, Score, ErrorText, C, nice, FEATS } from '../ui';
import { ScanRow } from './Home';

export default function History({ go, open, maxWidth }) {
  const [list, setList] = useState(null), [cmp, setCmp] = useState(null), [err, setErr] = useState('');
  const { width } = useWindowDimensions();
  useEffect(() => { api('scans').then(r => setList(r.scans)).catch(e => setErr(e.message)); }, []);
  if (err) return <View><Head title="History" /><ErrorText>{err}</ErrorText></View>;
  if (!list) return <T k="muted">Loading…</T>;
  if (!list.length) return <View><Head title="History" sub="Your scans and progress over time will show here." /><Btn onPress={() => go('scan')}>Start a scan</Btn></View>;
  const pts = [...list].reverse();
  const W = Math.min(width, maxWidth) - 32 - 36, H = 160, L = 22, B = 22;
  const x = i => L + (pts.length < 2 ? (W - L) / 2 : i * (W - L - 8) / (pts.length - 1)), y = v => 8 + (10 - v) * (H - 8 - B) / 10;
  const compare = async () => {
    try { const [a, b] = await Promise.all(list.slice(0, 2).map(s => api('scan?id=' + s.id))); setCmp([a.scan, b.scan]); }
    catch (e) { setErr(e.message); }
  };
  return <View>
    <Head title="History" sub={`${list.length} scan${list.length === 1 ? '' : 's'} on this phone`} />
    {pts.length > 1 && <Card>
      <Row><T k="h2">Overall score</T><T k="meta">0 to 10</T></Row>
      <Svg width={W} height={H} accessibilityLabel={`Overall score over ${pts.length} scans, from ${pts[0].overall.toFixed(1)} to ${pts.at(-1).overall.toFixed(1)}`}>
        {[0, 5, 10].map(v => <React.Fragment key={v}><Line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke={C.track} strokeDasharray={v ? '3 4' : undefined} /><SText x={L - 8} y={y(v) + 4} fill={C.fg3} fontSize="11" textAnchor="end">{v}</SText></React.Fragment>)}
        <Polyline points={pts.map((p, i) => `${x(i)},${y(p.overall)}`).join(' ')} fill="none" stroke={C.light} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <Circle key={p.id} cx={x(i)} cy={y(p.overall)} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? C.accent : C.light} stroke={C.card} strokeWidth="2" />)}
        {[0, pts.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => <SText key={i} x={x(i)} y={H - 4} fill={C.fg3} fontSize="11" textAnchor={i === 0 ? 'start' : 'end'}>{new Date(pts[i].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</SText>)}
      </Svg>
    </Card>}
    {list.length > 1 && !cmp && <Btn variant="secondary" onPress={compare} style={{ marginTop: 12 }}>Compare last two</Btn>}
    {cmp && <Section title="Latest vs previous" right={<Btn small variant="ghost" onPress={() => setCmp(null)}>Close</Btn>}>
      <Card style={{ gap: 0, paddingVertical: 6 }}>{FEATS.map((f, i) => {
        const now = cmp[0].feature_scores?.[f]?.score, was = cmp[1].feature_scores?.[f]?.score;
        if (now == null || was == null) return null;
        const d = Math.round((now - was) * 10) / 10, I = d > 0 ? ArrowUp : d < 0 ? ArrowDown : Equal, col = d > 0 ? C.accent : C.lo;
        return <Row key={f} style={{ paddingVertical: 11, borderBottomWidth: i < FEATS.length - 1 ? 1 : 0, borderBottomColor: C.line }}>
          <T k="muted">{nice(f)}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Score v={now} size={15} /><View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 52, justifyContent: 'flex-end' }}><I size={13} color={col} /><T k="num" style={{ color: col, fontSize: 14 }}>{d > 0 ? '+' : ''}{d.toFixed(1)}</T></View></View>
        </Row>;
      })}</Card>
    </Section>}
    <Section title="All scans">
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>{list.map((s, i) => <ScanRow key={s.id} s={s} last={i === list.length - 1} onPress={() => open(s.id)} />)}</Card>
    </Section>
    <T k="meta" style={{ marginTop: 12 }}>Photos are deleted 7 days after each scan. Scores stay in your history.</T>
  </View>;
}
