import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { sb } from '../api';
import { T, Card, Btn, C, input } from '../ui';

export default function Auth() {
  const [em, setEm] = useState(''), [pw, setPw] = useState(''), [up, setUp] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr('');
    const { error } = up ? await sb.auth.signUp({ email: em.trim(), password: pw }) : await sb.auth.signInWithPassword({ email: em.trim(), password: pw });
    if (error) setErr(error.message);
    else if (up) { const r = await sb.auth.signInWithPassword({ email: em.trim(), password: pw }); if (r.error) setErr('Check your email to confirm, then sign in.'); }
    setBusy(false);
  };
  return <View style={{ marginTop: 60 }}>
    <T k="h1">Facet AI</T><T k="g" style={{ marginBottom: 16 }}>See your face. Fix what matters.</T>
    <Card>
      <TextInput style={input} placeholder="Email" placeholderTextColor={C.g} autoCapitalize="none" keyboardType="email-address" value={em} onChangeText={setEm} />
      <TextInput style={input} placeholder="Password (8+ characters)" placeholderTextColor={C.g} secureTextEntry value={pw} onChangeText={setPw} />
      {!!err && <T k="err">{err}</T>}
      <Btn disabled={busy || !em || pw.length < 8} onPress={go}>{up ? 'Create account' : 'Sign in'}</Btn>
      <Btn alt onPress={() => setUp(!up)}>{up ? 'I have an account' : 'Create an account'}</Btn>
    </Card>
  </View>;
}
