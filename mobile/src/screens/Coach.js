import React, { useEffect, useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { T, Card, Btn, Chip, C, input } from '../ui';

const Bubble = ({ m }) => <View style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: m.role === 'user' ? C.v : C.card, padding: 12, borderRadius: 16, marginVertical: 4 }}><T>{m.content}</T></View>;

export default function Coach({ me, go, toEnd }) {
  const [msgs, setMsgs] = useState([]), [t, setT] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { if (me.paid) api('chat').then(r => setMsgs(r.messages)).catch(() => {}); }, [me.paid]);
  useEffect(() => { setTimeout(toEnd, 100); }, [msgs, busy]);
  if (!me.paid) return <View><T k="h1">Coach Vee</T><Card><View style={{ opacity: 0.3 }}><Bubble m={{ role: 'assistant', content: 'Your jawline is not the issue. Your body fat is.' }} /><Bubble m={{ role: 'user', content: 'What should I do first?' }} /></View><Btn onPress={() => go('paywall')}>Unlock Coach Vee</Btn></Card></View>;
  const send = async text => {
    if (!text.trim() || busy) return; setT(''); setBusy(true); setMsgs(m => [...m, { role: 'user', content: text }]);
    try { const r = await api('coach', { message: text }); setMsgs(m => [...m, { role: 'assistant', content: r.reply }]); } catch (e) { setMsgs(m => [...m, { role: 'assistant', content: e.message }]); }
    setBusy(false);
  };
  return <View><T k="h1">Coach Vee</T>
    {!msgs.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>{['Fix my jawline', 'Best haircut for me', 'Skincare routine', 'What should I do first?'].map(c => <Chip key={c} onPress={() => send(c)}>{c}</Chip>)}</View>}
    {msgs.map((m, i) => <Bubble key={i} m={m} />)}
    {busy && <ActivityIndicator color={C.c} style={{ alignSelf: 'flex-start', margin: 8 }} />}
    <TextInput style={input} value={t} placeholder="Ask Coach Vee" placeholderTextColor={C.g} onChangeText={setT} onSubmitEditing={() => send(t)} returnKeyType="send" />
    <Btn small onPress={() => send(t)}>Send</Btn>
  </View>;
}
