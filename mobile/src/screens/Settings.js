import React, { useState } from 'react';
import { View, Switch, Alert, Linking, Platform } from 'react-native';
import { api, API_URL, sb } from '../api';
import { T, Card, Row, Btn, Chip, nice, LegalModal } from '../ui';

const OPTS = [['gender', ['male', 'female', 'other']], ['age_range', ['18 to 24', '25 to 34', '35 to 44', '45 plus']], ['main_goal', ['Better jawline', 'Better skin', 'Better hair', 'Overall glow up', 'Social confidence']]];
const SUBS = Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';

export default function Settings({ me, reload, go }) {
  const [msg, setMsg] = useState(''), [legal, setLegal] = useState(null);
  const p = me.profile || {};
  const set = async (k, v) => { await api('settings', { [k]: v }); reload(); };
  const del = mode => Alert.alert(mode === 'account' ? 'Delete your account and all data?' : 'Delete all your photos?', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    {text: 'Delete', style: 'destructive', onPress: async () => { await api('delete', { mode }); if (mode === 'account') await sb.auth.signOut(); else setMsg('Photos deleted.'); } },
  ]);
  return <View><T k="h1">Profile</T><T k="g">{me.guest ? 'Guest session' : me.email}</T>
    {OPTS.map(([k, o]) => <View key={k}><T k="h2">{nice(k)}</T><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{o.map(x => <Chip key={x} on={p[k] === x} onPress={() => set(k, x)}>{nice(x)}</Chip>)}</View></View>)}
    <T k="h2">Subscription</T>
    <Card><T>{me.sub ? `${nice(me.sub.plan)} · ${me.sub.status}` : 'Free'}</T>
      {me.sub?.current_period_end && <T k="g">Renews {new Date(me.sub.current_period_end).toLocaleDateString()}</T>}
      {me.paid ? <Btn alt onPress={() => me.test ? api('cancel', {}).then(reload) : Linking.openURL(SUBS)}>{me.test ? 'Cancel subscription' : 'Manage subscription'}</Btn> : <Btn onPress={() => go('paywall')}>Upgrade</Btn>}</Card>
    <T k="h2">Privacy</T>
    <Card><Row><T style={{ flex: 1 }}>Keep photos for progress tracking</T><Switch value={!!p.keep_photos} onValueChange={v => set('keep_photos', v)} /></Row>
      <Btn alt onPress={() => del('photos')}>Delete all photos</Btn><Btn alt onPress={() => del('account')}>Delete my account and data</Btn>{!!msg && <T k="g">{msg}</T>}</Card>
    <T k="h2">Legal and help</T>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {['terms', 'privacy', 'biometric'].map(k => <Chip key={k} onPress={() => setLegal(k)}>{nice(k)}</Chip>)}
      <Chip onPress={() => setLegal('help')}>Help & support</Chip>
      <Chip onPress={() => Linking.openURL('https://findahelpline.com')}>Find a helpline</Chip></View>
    <LegalModal doc={legal} onClose={() => setLegal(null)} />
  </View>;
}
