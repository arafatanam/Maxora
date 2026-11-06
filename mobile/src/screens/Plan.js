import React from 'react';
import { View, Pressable } from 'react-native';
import { Check } from '../icons';
import { api } from '../api';
import { T, Card, Row, Btn, Bar, Badge, Head, Section, C, nice, CATS, tap } from '../ui';

export default function Plan({ s, go, setS }) {
  if (!s) return <View><Head title="Improvement plan" sub="Your plan is built from your scan results. Run a scan to get one." /><Btn onPress={() => go('scan')}>Start a scan</Btn></View>;
  const plan = s.plan || [], done = plan.filter(p => p.completed).length;
  const tog = async p => {
    tap();
    const completed = !p.completed, set = c => setS(x => ({ ...x, plan: x.plan.map(i => i.id === p.id ? { ...i, completed: c } : i) }));
    set(completed);
    try { await api('plan/toggle', { id: p.id, completed }); } catch { set(!completed); }
  };
  const groups = [...CATS.filter(c => plan.some(p => p.category === c)).map(c => [nice(c), plan.filter(p => p.category === c)])];
  const other = plan.filter(p => !CATS.includes(p.category));
  if (other.length) groups.push(['Other', other]);
  return <View>
    <Head title="Improvement plan" sub="Ranked by impact for the effort. Tick actions off as you build them into your routine." />
    <Card style={{ gap: 10 }}>
      <Row><T k="h2">{done === plan.length && plan.length ? 'All done' : 'Progress'}</T><T k="num">{done} / {plan.length}</T></Row>
      <Bar v={done} max={plan.length || 1} color={C.accent} />
    </Card>
    {groups.map(([title, items]) => <Section key={title} title={title}>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {items.map((p, i) => <Pressable key={p.id} onPress={() => tog(p)} accessibilityRole="checkbox" accessibilityState={{ checked: !!p.completed }} accessibilityLabel={p.title}
          style={({ pressed }) => ({ flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: C.line, opacity: pressed ? 0.7 : 1 })}>
          <View style={{ width: 22, height: 22, marginTop: 1, borderRadius: 7, borderWidth: 1.5, borderColor: p.completed ? C.accent : C.lineStrong, backgroundColor: p.completed ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {p.completed && <Check size={14} strokeWidth={3} color={C.onAccent} />}</View>
          <View style={{ flex: 1, gap: 2 }}>
            <T k="h3" style={p.completed ? { color: C.fg3, textDecorationLine: 'line-through' } : null}>{p.title}</T>
            <T k="muted" style={{ fontSize: 14, lineHeight: 20 }}>{p.reason}</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {!!p.impact && <Badge accent>Impact {p.impact}</Badge>}{!!p.effort && <Badge>Effort {p.effort}</Badge>}{!!p.time_to_result && <Badge>{p.time_to_result}</Badge>}
            </View>
          </View>
        </Pressable>)}
      </Card>
    </Section>)}
  </View>;
}
