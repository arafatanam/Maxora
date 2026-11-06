import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { parseBlocks, parseInline } from '../markdown';
import { ArrowUp } from '../icons';
import { api } from '../api';
import { T, Btn, Chip, Chips, Head, C, R, F, fmtTime } from '../ui';

const STARTERS = ['What should I do first?', 'Build me a skincare routine', 'Which haircut suits my face?', 'How do I improve my jawline?'];

// Inline runs are nested Text so bold and italic flow with the line. Custom fonts need the exact face per style.
const face = p => p.b && p.i ? F.semiItalic : p.b ? F.semi : p.i ? F.italic : undefined;
const Inline = ({ text }) => parseInline(text).map((p, k) => <Text key={k} style={p.code
  ? { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 14, backgroundColor: C.card2 }
  : face(p) && { fontFamily: face(p) }}>{p.text}</Text>);

// Renders a Coach Maxy reply from parsed Markdown. Nothing is treated as markup beyond the parsed styles.
function Markdown({ text }) {
  return <View style={{ gap: 10 }}>{parseBlocks(text).map((b, k) => {
    if (b.type === 'h') return <T key={k} selectable style={{ fontFamily: F.head, marginTop: k ? 4 : 0 }}><Inline text={b.text} /></T>;
    if (b.type === 'p') return <T key={k} selectable><Inline text={b.text} /></T>;
    return <View key={k} style={{ gap: 6 }}>{b.items.map((it, j) => <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
      <T style={{ color: C.light, minWidth: b.type === 'ol' ? 18 : 10 }}>{b.type === 'ol' ? `${it.n || j + 1}.` : '•'}</T>
      <T selectable style={{ flex: 1 }}><Inline text={it.text} /></T>
    </View>)}</View>;
  })}</View>;
}

const Bubble = ({ m }) => <View style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', backgroundColor: m.role === 'user' ? C.card2 : C.card, borderWidth: m.role === 'user' ? 0 : 1, borderColor: m.error ? C.dangerLine : C.line, paddingVertical: 11, paddingHorizontal: 15, borderRadius: R.surface, borderCurve: 'continuous', borderBottomRightRadius: m.role === 'user' ? 6 : R.surface, borderBottomLeftRadius: m.role === 'user' ? R.surface : 6 }}>
  {m.role === 'assistant' && !m.error ? <Markdown text={m.content} /> : <T selectable>{m.content}</T>}</View>;

export default function Coach({ me, scan, go, toEnd, onLimit }) {
  const [msgs, setMsgs] = useState(null), [t, setT] = useState(''), [busy, setBusy] = useState(false), [left, setLeft] = useState(me.limits.coach.remaining);
  useEffect(() => { if (scan) api('chat').then(r => setMsgs(r.messages)).catch(() => setMsgs([])); }, [scan]);
  useEffect(() => { if (msgs?.length) setTimeout(toEnd, 80); }, [msgs, busy]);
  if (!scan) return <View><Head title="Coach Maxy" sub="Coach Maxy gives advice based on your scan results. Run a scan first." /><Btn onPress={() => go('scan')}>Start a scan</Btn></View>;
  const out = left === 0;
  const send = async text => {
    text = text.trim();
    if (!text || busy || out) return;
    setT(''); setBusy(true); setMsgs(m => [...(m || []), { role: 'user', content: text }]);
    try { const r = await api('coach', { message: text }); setMsgs(m => [...m, { role: 'assistant', content: r.reply }]); setLeft(r.remaining); onLimit(r.remaining); }
    catch (e) { setMsgs(m => [...m, { role: 'assistant', content: e.message, error: true }]); if (e.status === 429 && e.data?.limit) { setLeft(0); onLimit(0); } }
    setBusy(false);
  };
  return <View style={{ flex: 1 }}>
    <Head title="Coach Maxy" sub="Practical advice on grooming, skin, hair, fitness, posture and style, based on your latest scan." />
    <View style={{ gap: 10, flex: 1 }}>
      {msgs === null && <ActivityIndicator color={C.light} style={{ alignSelf: 'flex-start' }} />}
      {msgs?.length === 0 && <View style={{ gap: 10 }}><T k="meta">Try one of these</T><Chips>{STARTERS.map(c => <Chip key={c} onPress={() => send(c)}>{c}</Chip>)}</Chips></View>}
      {msgs?.map((m, i) => <Bubble key={i} m={m} />)}
      {busy && <View style={{ alignSelf: 'flex-start', padding: 14 }}><ActivityIndicator color={C.light} /></View>}
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 6, marginTop: 20, borderRadius: R.surface, borderCurve: 'continuous', backgroundColor: C.raised, borderWidth: 1, borderColor: C.lineStrong }}>
      <TextInput style={{ flex: 1, color: C.fg, fontFamily: F.body, fontSize: 16, paddingHorizontal: 10, paddingVertical: 10, maxHeight: 140 }} multiline maxLength={1000} editable={!out}
        value={t} onChangeText={setT} placeholder={out ? `Daily limit reached. Back after ${fmtTime(me.limits.coach.reset)}.` : 'Ask Coach Maxy'} placeholderTextColor={C.fg3} accessibilityLabel="Message Coach Maxy" />
      <Pressable onPress={() => send(t)} disabled={!t.trim() || busy || out} accessibilityRole="button" accessibilityLabel="Send message"
        style={({ pressed }) => ({ width: 44, height: 44, borderRadius: R.control, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', opacity: !t.trim() || busy || out ? 0.45 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
        <ArrowUp size={20} color={C.onAccent} /></Pressable>
    </View>
    <T k="meta" style={{ textAlign: 'center', marginTop: 8 }}>{left} of {me.limits.coach.max} messages left today · Not medical advice</T>
  </View>;
}
