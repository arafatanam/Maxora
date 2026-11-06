import React, { useRef } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Share2, Plus, Minus, MessagesSquare, ImageOff, ChevronLeft } from '../icons';
import { T, Card, Row, Btn, Bar, Gauge, Score, Badge, Section, Logo, C, nice, FEATS, DISC, fmtDate } from '../ui';

export default function Results({ s, isLatest, go, back }) {
  const ref = useRef();
  if (!s) return <T k="muted">Loading…</T>;
  const share = async () => { try { const uri = await captureRef(ref, { format: 'png', quality: 1 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri); } catch {} };
  const top = (s.plan || []).slice(0, 3);
  const deleteOn = new Date(new Date(s.created_at).getTime() + 7 * 864e5);
  return <View>
    <Btn small variant="ghost" icon={ChevronLeft} onPress={back} style={{ marginLeft: -12, marginBottom: 4 }}>Back</Btn>
    <T k="eyebrow">{fmtDate(s.created_at)}</T>
    <T k="h1" accessibilityRole="header" style={{ marginBottom: 16 }}>Your results</T>

    <View ref={ref} collapsable={false} style={{ backgroundColor: C.card, borderRadius: 16, borderCurve: 'continuous', borderWidth: 1, borderColor: C.line, padding: 20, alignItems: 'center', gap: 12 }}>
      <Row style={{ alignSelf: 'stretch' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Logo size={24} /><T k="h3">Maxora</T></View><T k="meta">AI estimate</T></Row>
      <Gauge v={s.overall_score} />
      <View style={{ alignItems: 'center' }}><T k="h1" style={{ fontSize: 24 }}>{s.tier_label}</T><T k="muted">{s.psl_tier}</T></View>
      {s.potential_score != null && <Row style={{ alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12 }}><T k="muted">Estimated potential</T><Score v={s.potential_score} /></Row>}
    </View>
    <View style={{ gap: 10, marginTop: 12 }}>
      <Btn variant="secondary" icon={Share2} onPress={share}>Share score card</Btn>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 4 }}><ImageOff size={14} color={C.fg3} />
        <T k="meta" style={{ flex: 1 }}>{s.photos_deleted ? 'Photos for this scan were deleted. Scores are kept.' : `Photos for this scan are deleted on ${fmtDate(deleteOn)}.`}</T></View>
    </View>

    {!!s.summary && <T style={{ fontSize: 17, lineHeight: 26, marginTop: 24 }}>{s.summary}</T>}
    {top.length > 0 && <Section title="Do this first" right={isLatest && <Btn small variant="ghost" onPress={() => go('plan')}>Full plan</Btn>}>
      <Card>{top.map((p, i) => <View key={p.id} style={{ flexDirection: 'row', gap: 12 }}><T k="num" style={{ color: C.accent, width: 18 }}>{i + 1}</T><View style={{ flex: 1 }}><T k="h3">{p.title}</T><T k="muted" style={{ fontSize: 14 }}>{p.reason}</T></View></View>)}</Card>
    </Section>}

    <Section title="Feature scores" right={<Badge>AI estimate</Badge>}>
      {FEATS.map(f => s.feature_scores?.[f] && <Card key={f} style={{ gap: 10 }}>
        <Row><T k="h3">{nice(f)}</T><Score v={s.feature_scores[f].score} /></Row>
        <Bar v={s.feature_scores[f].score} />
        <T k="muted" style={{ fontSize: 14, lineHeight: 20 }}>{s.feature_scores[f].verdict}</T>
      </Card>)}
    </Section>

    <Section title="Strengths"><Card>{(s.strengths || []).map(x => <View key={x} style={{ flexDirection: 'row', gap: 10 }}><Plus size={16} color={C.accent} style={{ marginTop: 3 }} /><T style={{ flex: 1 }}>{x}</T></View>)}</Card></Section>
    <Section title="To work on"><Card>{(s.weaknesses || []).map(x => <View key={x} style={{ flexDirection: 'row', gap: 10 }}><Minus size={16} color={C.light} style={{ marginTop: 3 }} /><T style={{ flex: 1 }}>{x}</T></View>)}</Card></Section>
    {s.face_profile && <Section title="Face profile"><Card style={{ gap: 0, paddingVertical: 6 }}>{Object.entries(s.face_profile).map(([k, v], i, a) =>
      <Row key={k} style={{ paddingVertical: 12, borderBottomWidth: i < a.length - 1 ? 1 : 0, borderBottomColor: C.line }}><T k="muted">{nice(k)}</T><T style={{ fontFamily: 'Inter_500Medium', flexShrink: 1, textAlign: 'right' }}>{nice(String(v))}</T></Row>)}</Card></Section>}

    {isLatest && <View style={{ gap: 10, marginTop: 28 }}>
      <Btn onPress={() => go('plan')}>Open improvement plan</Btn>
      <Btn variant="secondary" icon={MessagesSquare} onPress={() => go('coach')}>Ask Coach Maxy</Btn>
    </View>}
    <T k="meta" style={{ marginTop: 20 }}>{DISC}</T>
  </View>;
}
