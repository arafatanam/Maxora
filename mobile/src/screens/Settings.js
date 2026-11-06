import React, { useState } from 'react';
import { View, Alert, Linking, Pressable } from 'react-native';
import { ChevronRight, ExternalLink, Trash2 } from '../icons';
import { api, resetDeviceId } from '../api';
import { T, Card, Row, Btn, Chip, Chips, Head, Section, Note, LegalModal, C, nice, OPTIONS, fmtTime } from '../ui';

const FIELDS = [['gender', 'Gender'], ['age_range', 'Age range'], ['main_goal', 'Main goal']];

const LinkRow = ({ label, onPress, external, last }) => <Pressable onPress={onPress} accessibilityRole={external ? 'link' : 'button'}
  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 18, backgroundColor: pressed ? 'rgba(163,158,149,0.07)' : 'transparent', borderBottomWidth: last ? 0 : 1, borderBottomColor: C.line })}>
  <T style={{ flex: 1 }}>{label}</T>{external ? <ExternalLink size={16} color={C.fg3} /> : <ChevronRight size={18} color={C.fg3} />}
</Pressable>;

const KV = ({ rows }) => <View>{rows.map(([k, v], i) => <Row key={k} style={{ paddingVertical: 11, borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: C.line }}><T k="muted" style={{ flex: 1 }}>{k}</T><T style={{ fontFamily: 'Inter_500Medium', textAlign: 'right', flexShrink: 1 }}>{v}</T></Row>)}</View>;

export default function Settings({ me, setMe, reset }) {
  const [msg, setMsg] = useState(''), [legal, setLegal] = useState(null);
  const p = me.profile || {};
  const set = async (k, v) => {
    const before = p[k];
    setMe(m => ({ ...m, profile: { ...m.profile, [k]: v } }));
    try { await api('settings', { [k]: v }); } catch { setMe(m => ({ ...m, profile: { ...m.profile, [k]: before } })); setMsg('Could not save. Try again.'); }
  };
  const del = mode => Alert.alert(
    mode === 'all' ? 'Delete all your data?' : 'Delete your photos?',
    mode === 'all' ? 'This permanently deletes your photos, scores, plan and chat history, and starts Maxora fresh on this phone.' : 'This permanently deletes every photo from your scans. Your scores and plan are kept.',
    [{ text: 'Cancel', style: 'cancel' }, {
      text: mode === 'all' ? 'Delete everything' : 'Delete photos', style: 'destructive', onPress: async () => {
        try {
          await api('delete', { mode });
          if (mode === 'all') { await resetDeviceId(); reset(); } else setMsg('Photos deleted.');
        } catch (e) { setMsg(e.message); }
      },
    }]);
  return <View>
    <Head title="Settings" sub="No account needed. Everything here applies to this phone only." />
    <Card style={{ gap: 18 }}>
      <View style={{ gap: 2 }}><T k="h2">About you</T><T k="muted" style={{ fontSize: 14 }}>Used to tailor your ratings, plan and coaching.</T></View>
      {FIELDS.map(([k, label]) => <View key={k} style={{ gap: 10 }}>
        <T style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{label}</T>
        <Chips>{OPTIONS[k].map(x => <Chip key={x} on={p[k] === x} onPress={() => p[k] !== x && set(k, x)}>{nice(x)}</Chip>)}</Chips>
      </View>)}
    </Card>

    <Section title="Privacy and data">
      <Card>
        <KV rows={[['Photo storage', `Deleted after ${me.photo_days} days`], ['Scores and plans', 'Kept until you delete them'], ['Linked to', 'This phone only']]} />
        <Note>Deleting the app starts you fresh. Your old results can't be recovered after that.</Note>
        <Btn variant="secondary" onPress={() => del('photos')}>Delete my photos now</Btn>
        <Btn variant="danger" icon={Trash2} onPress={() => del('all')}>Delete all my data</Btn>
        {!!msg && <T k="muted" accessibilityLiveRegion="polite">{msg}</T>}
      </Card>
    </Section>

    <Section title="Fair use">
      <Card>
        <T k="muted" style={{ fontSize: 14, lineHeight: 20 }}>Maxora is free. To keep it fast for everyone, each network gets a daily allowance. Limits reset at {fmtTime(me.limits.scan.reset)}.</T>
        <KV rows={[['Scans per day', `${me.limits.scan.remaining} of ${me.limits.scan.max} left`], ['Coach Maxy messages', `${me.limits.coach.remaining} of ${me.limits.coach.max} left`]]} />
      </Card>
    </Section>

    <Section title="Legal and support">
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        <LinkRow label="Terms of Service" onPress={() => setLegal('terms')} />
        <LinkRow label="Privacy Policy" onPress={() => setLegal('privacy')} />
        <LinkRow label="Biometric data notice" onPress={() => setLegal('biometric')} />
        <LinkRow label="Help and support" onPress={() => setLegal('help')} />
        <LinkRow label="Find a helpline" external last onPress={() => Linking.openURL('https://findahelpline.com')} />
      </Card>
    </Section>
    <LegalModal doc={legal} onClose={() => setLegal(null)} />
  </View>;
}
