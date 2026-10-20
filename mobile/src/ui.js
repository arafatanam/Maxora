import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SText } from 'react-native-svg';

export const C = { bg: '#0B0B10', card: '#16161F', v: '#7C5CFF', c: '#22D3EE', g: '#A1A1B5', line: '#2a2a38', alt: '#22222e' };
export const col = s => s < 4 ? '#F87171' : s < 6 ? '#FBBF24' : s < 8 ? '#34D399' : '#7C5CFF';
export const nice = s => (s || '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
export const FEATS = ['symmetry', 'jawline', 'cheekbones', 'eye_area', 'nose', 'lips', 'skin_quality', 'facial_harmony', 'dimorphism'];
export const CATS = ['grooming', 'skincare', 'hair', 'fitness', 'posture', 'style', 'habits'];
export const DISC = 'Scores are AI estimates for entertainment and self-improvement. They do not define your worth. This app gives no medical advice.';

const kinds = {
  h1: { fontSize: 28, fontWeight: '800' }, h2: { fontSize: 20, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  h3: { fontWeight: '700' }, g: { color: C.g }, sm: { fontSize: 12, color: C.g }, err: { color: '#F87171', marginVertical: 8 },
};
export const T = ({ k, style, ...p }) => <Text style={[{ color: '#fff', fontSize: 15, lineHeight: 21 }, kinds[k], style]} {...p} />;
export const Card = ({ style, ...p }) => <View style={[{ backgroundColor: C.card, borderRadius: 16, padding: 16, marginVertical: 8 }, style]} {...p} />;
export const Row = ({ style, ...p }) => <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, style]} {...p} />;

export function Btn({ children, onPress, alt, small, disabled, style }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [{ backgroundColor: alt ? C.alt : C.v, padding: small ? 10 : 16, borderRadius: 14, alignItems: 'center', marginVertical: small ? 4 : 8, opacity: disabled ? 0.5 : pressed ? 0.8 : 1, alignSelf: small ? 'flex-start' : 'stretch' }, style]}>
    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{children}</Text>
  </Pressable>;
}
export const Opt = ({ on, onPress, children }) => <Pressable accessibilityRole="button" onPress={onPress}
  style={{ padding: 14, marginVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: on ? C.v : C.line, backgroundColor: on ? '#1f1b3a' : C.card }}>
  <Text style={{ color: '#fff', fontSize: 15 }}>{children}</Text></Pressable>;
export const Chip = ({ on, onPress, children }) => <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: on ? C.v : C.alt, margin: 4 }}>
  <Text style={{ color: '#fff', fontSize: 13 }}>{children}</Text></Pressable>;
export const Tag = ({ children }) => <Text style={{ fontSize: 12, color: C.g, backgroundColor: C.alt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', marginRight: 6 }}>{children}</Text>;
export const Bar = ({ v }) => <View style={{ height: 8, borderRadius: 4, backgroundColor: C.alt, overflow: 'hidden' }}><View style={{ width: `${Math.max(0, Math.min(100, v * 10))}%`, height: 8, backgroundColor: col(v) }} /></View>;
export const Gauge = ({ v }) => {
  const r = 70, c = 2 * Math.PI * r;
  return <Svg width={180} height={180} viewBox="0 0 180 180" accessibilityLabel={`Overall score ${v.toFixed(1)} out of 10`}>
    <Circle cx="90" cy="90" r={r} fill="none" stroke={C.alt} strokeWidth="12" />
    <Circle cx="90" cy="90" r={r} fill="none" stroke={col(v)} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 10)} rotation="-90" origin="90, 90" />
    <SText x="90" y="104" textAnchor="middle" fontSize="46" fontWeight="800" fill="#fff">{v.toFixed(1)}</SText>
  </Svg>;
};
export const input = { backgroundColor: '#0f0f16', color: '#fff', borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 14, fontSize: 15, marginVertical: 6 };
