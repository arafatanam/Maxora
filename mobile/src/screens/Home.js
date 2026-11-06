import React, { useEffect, useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { ChevronRight, ImageOff, ShieldCheck } from '../icons';
import { api } from '../api';
import { T, Card, Row, Btn, Gauge, Bar, Score, Head, Section, C, R, fmtDate, fmtTime } from '../ui';

export function Allowance({ limits }) {
  const s = limits.scan, c = limits.coach;
  return <Card style={{ gap: 10 }}>
    <T k="h2">Today's allowance</T>
    <View style={{ flexDirection: 'row', gap: 6 }}>{Array.from({ length: s.max }, (_, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < s.remaining ? C.accent : C.track }} />)}</View>
    <T><T k="num" style={{ fontSize: 15 }}>{s.remaining} of {s.max}</T> scans left</T>
    <T k="meta">{c.remaining} of {c.max} Coach Maxy messages left · resets {fmtTime(s.reset)}</T>
  </Card>;
}

export const ScanRow = ({ s, onPress, last }) => <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Scan from ${fmtDate(s.created_at)}, score ${Number(s.overall).toFixed(1)}`}
  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: pressed ? 'rgba(185,167,255,0.07)' : 'transparent', borderBottomWidth: last ? 0 : 1, borderBottomColor: C.line })}>
  {s.thumb ? <Image source={{ uri: s.thumb }} style={{ width: 48, height: 48, borderRadius: 10 }} /> : <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}><ImageOff size={18} color={C.fg3} /></View>}
  <View style={{ flex: 1 }}><T style={{ fontFamily: 'Inter_500Medium' }}>{fmtDate(s.created_at)}</T><T k="meta">{s.tier}</T></View>
  <Score v={s.overall} size={20} /><ChevronRight size={18} color={C.fg3} />
</Pressable>;

export default function Home({ me, scan, go, open }) {
  const [recent, setRecent] = useState(null);
  useEffect(() => { if (scan) api('scans').then(r => setRecent(r.scans.slice(0, 3))).catch(() => setRecent([])); }, [scan]);
  const out = me.limits.scan.remaining === 0;

  if (!scan) return <View>
    <Head title="Welcome to Maxora" sub="Take two photos to get your first rating and a personal plan." />
    <Card style={{ gap: 18 }}>
      <T k="h2">Get your first rating</T>
      {[['Front photo', 'Face the camera straight on, in even light.'], ['Side profile', 'Turn 90 degrees so your jawline and ear are visible.'], ['Results and plan', 'Nine feature scores and ranked next steps.']].map(([t, d], i) =>
        <View key={t} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 30, height: 30, borderRadius: R.pill, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}><T k="num" style={{ color: C.light, fontSize: 13 }}>{i + 1}</T></View>
          <View style={{ flex: 1 }}><T k="h3">{t}</T><T k="muted" style={{ fontSize: 14 }}>{d}</T></View>
        </View>)}
      <Btn disabled={out} onPress={() => go('scan')}>Start your first scan</Btn>
    </Card>
    <View style={{ gap: 12, marginTop: 12 }}>
      <Allowance limits={me.limits} />
      <Card style={{ flexDirection: 'row', gap: 12 }}><ShieldCheck size={20} color={C.light} /><View style={{ flex: 1, gap: 2 }}><T k="h3">Private by default</T><T k="muted" style={{ fontSize: 14 }}>No account needed. Photos are deleted {me.photo_days} days after each scan.</T></View></Card>
    </View>
  </View>;

  const plan = scan.plan || [], done = plan.filter(p => p.completed).length, next = plan.filter(p => !p.completed).slice(0, 3);
  return <View>
    <Head title="Overview" sub={`Latest scan from ${fmtDate(scan.created_at)}`} />
    <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
      <Gauge v={scan.overall_score} />
      <View style={{ alignItems: 'center', gap: 2 }}>
        <T k="eyebrow">{scan.psl_tier}</T>
        <T k="h1" style={{ fontSize: 24 }}>{scan.tier_label}</T>
        {scan.potential_score != null && <T k="muted">Estimated potential <Score v={scan.potential_score} size={15} /></T>}
      </View>
      <View style={{ alignSelf: 'stretch', gap: 10 }}>
        <Btn disabled={out} onPress={() => go('scan')}>New scan</Btn>
        <Btn variant="secondary" onPress={() => open(scan.id)}>View full results</Btn>
      </View>
    </Card>
    {next.length > 0 && <Section title="Do this next" right={<Btn small variant="ghost" onPress={() => go('plan')}>Open plan</Btn>}>
      <Card>{next.map((p, i) => <View key={p.id} style={{ flexDirection: 'row', gap: 12 }}><T k="num" style={{ color: C.accent, width: 18 }}>{i + 1}</T><View style={{ flex: 1 }}><T k="h3">{p.title}</T><T k="muted" style={{ fontSize: 14 }}>{p.reason}</T></View></View>)}</Card>
    </Section>}
    <View style={{ gap: 12, marginTop: 28 }}>
      <Allowance limits={me.limits} />
      {plan.length > 0 && <Card style={{ gap: 10 }}>
        <Row><T k="h2">Plan progress</T><T k="num">{Math.round(done / plan.length * 100)}%</T></Row>
        <Bar v={done} max={plan.length} color={C.accent} />
        <T k="meta">{done} of {plan.length} actions done</T>
      </Card>}
    </View>
    <Section title="Recent scans" right={<Btn small variant="ghost" onPress={() => go('history')}>All</Btn>}>
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        {!recent ? <View style={{ height: 120 }} /> : recent.map((s, i) => <ScanRow key={s.id} s={s} last={i === recent.length - 1} onPress={() => open(s.id)} />)}
      </Card>
    </Section>
  </View>;
}
