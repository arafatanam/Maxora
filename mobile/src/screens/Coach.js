import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { ArrowUp } from '../icons';
import { api } from '../api';
import { T, Btn, Chip, Chips, Head, C, R, F, fmtTime } from '../ui';

const STARTERS = ['What should I do first?', 'Build me a skincare routine', 'Which haircut suits my face?', 'How do I improve my jawline?'];

const Bubble = ({ m }) => <View style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%', backgroundColor: m.role === 'user' ? C.card2 : C.card, borderWidth: m.role === 'user' ? 0 : 1, borderColor: m.error ? C.dangerLine : C.line, paddingVertical: 11, paddingHorizontal: 15, borderRadius: R.surface, borderCurve: 'continuous', borderBottomRightRadius: m.role === 'user' ? 6 : R.surface, borderBottomLeftRadius: m.role === 'user' ? R.surface : 6 }}>
  <T selectable>{m.content}</T></View>;

export default function Coach({ me, scan, go, toEnd, onLimit }) {
  const [msgs, setMsgs] = useState(null), [t, setT] = useState(''), [busy, setBusy] = useState(false), [left, setLeft] = useState(me.limits.coach.remaining);
  useEffect(() => { if (scan) api('chat').then(r => setMsgs(r.messages)).catch(() => setMsgs([])); }, [scan]);
  useEffect(() => { if (msgs?.length) setTimeout(toEnd, 80); }, [msgs, busy]);
  if (!scan) return <View><Head title="Coach Vee" sub="Coach Vee gives advice based on your scan results. Run a scan first." /><Btn onPress={() => go('scan')}>Start a scan</Btn></View>;
  const out = left === 0;
  const send = async text => {
    text = text.trim();
    if (!text || busy || out) return;
    setT(''); setBusy(true); setMsgs(m => [...(m || []), { role: 'user', content: text }]);
    try { const r = await api('coach', { message: text }); setMsgs(m => [...m, { role: 'assistant', content: r.reply }]); setLeft(r.remaining); onLimit(r.remaining); }
    catch (e) { setMsgs(m => [...m, { role: 'assistant', content: e.message, error: true }]); if (e.status === 429) { setLeft(0); onLimit(0); } }
    setBusy(false);
  };
  return <View style={{ flex: 1 }}>
    <Head title="Coach Vee" sub="Practical advice on grooming, skin, hair, fitness, posture and style, based on your latest scan." />
    <View style={{ gap: 10, flex: 1 }}>
      {msgs === null && <ActivityIndicator color={C.light} style={{ alignSelf: 'flex-start' }} />}
      {msgs?.length === 0 && <View style={{ gap: 10 }}><T k="meta">Try one of these</T><Chips>{STARTERS.map(c => <Chip key={c} onPress={() => send(c)}>{c}</Chip>)}</Chips></View>}
      {msgs?.map((m, i) => <Bubble key={i} m={m} />)}
      {busy && <View style={{ alignSelf: 'flex-start', padding: 14 }}><ActivityIndicator color={C.light} /></View>}
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 6, marginTop: 20, borderRadius: R.surface, borderCurve: 'continuous', backgroundColor: C.raised, borderWidth: 1, borderColor: C.lineStrong }}>
      <TextInput style={{ flex: 1, color: C.fg, fontFamily: F.body, fontSize: 16, paddingHorizontal: 10, paddingVertical: 10, maxHeight: 140 }} multiline maxLength={1000} editable={!out}
        value={t} onChangeText={setT} placeholder={out ? `Daily limit reached. Back after ${fmtTime(me.limits.coach.reset)}.` : 'Ask Coach Vee'} placeholderTextColor={C.fg3} accessibilityLabel="Message Coach Vee" />
      <Pressable onPress={() => send(t)} disabled={!t.trim() || busy || out} accessibilityRole="button" accessibilityLabel="Send message"
        style={({ pressed }) => ({ width: 44, height: 44, borderRadius: R.control, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', opacity: !t.trim() || busy || out ? 0.45 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
        <ArrowUp size={20} color={C.onAccent} /></Pressable>
    </View>
    <T k="meta" style={{ textAlign: 'center', marginTop: 8 }}>{left} of {me.limits.coach.max} messages left today · Not medical advice</T>
  </View>;
}
