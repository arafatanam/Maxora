import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Text as SText } from 'react-native-svg';

export const C = { bg: '#080A0D', card: '#11151B', v: '#002366', c: '#002366', g: '#9AA3AE', line: '#28313C', alt: '#1A2028' };
export const col = s => s < 4 ? '#9AA3AE' : s < 8 ? '#6D8199' : '#FFFFFF';
export const nice = s => (s || '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
export const FEATS = ['symmetry', 'jawline', 'cheekbones', 'eye_area', 'nose', 'lips', 'skin_quality', 'facial_harmony', 'dimorphism'];
export const CATS = ['grooming', 'skincare', 'hair', 'fitness', 'posture', 'style', 'habits'];
export const DISC = 'Scores are AI estimates for entertainment and self-improvement. They do not define your worth. This app gives no medical advice.';

const kinds = {
  h1: { fontFamily: 'IBMPlexSerif_700Bold', fontSize: 30, lineHeight: 40, fontWeight: '800', marginBottom: 8 },
  h2: { fontFamily: 'IBMPlexSerif_700Bold', fontSize: 21, lineHeight: 29, fontWeight: '700', marginTop: 22, marginBottom: 10 },
  h3: { fontFamily: 'IBMPlexSerif_700Bold', fontWeight: '700' }, g: { color: C.g }, sm: { fontSize: 12, color: C.g }, err: { color: '#C7D0DA', marginVertical: 8 },
};
export const T = ({ k, style, ...p }) => <Text style={[{ color: '#fff', fontFamily: 'IBMPlexSans_400Regular', fontSize: 15, lineHeight: 22 }, kinds[k], style]} {...p} />;
export const Card = ({ style, ...p }) => <View style={[{ backgroundColor: C.card, borderRadius: 14, padding: 17, marginVertical: 8, borderWidth: 1, borderColor: C.line }, style]} {...p} />;
export const Row = ({ style, ...p }) => <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, style]} {...p} />;

export function Btn({ children, onPress, alt, small, disabled, style }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [{ backgroundColor: alt ? C.alt : C.v, padding: small ? 10 : 16, borderRadius: 10, alignItems: 'center', marginVertical: small ? 4 : 8, opacity: disabled ? 0.5 : pressed ? 0.75 : 1, alignSelf: small ? 'flex-start' : 'stretch', borderWidth: 1, borderColor: alt ? C.line : C.v }, style]}>
    <Text style={{ color: '#fff', fontFamily: 'IBMPlexSans_600SemiBold', fontSize: 15 }}>{children}</Text>
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

const LEGAL = {
  terms: ['Terms & Conditions', 'Maxora is a self-improvement and entertainment experience for adults aged 18 and over. Ratings are estimates and are not medical, professional, or objective judgments. You are responsible for the photos and information you provide. Subscriptions renew weekly until cancelled in your App Store or Google Play settings. Refunds follow the rules of the store where you subscribed.'],
  privacy: ['Privacy Policy', 'Maxora uses your photos to create your requested facial ratings and recommendations. Photos are stored privately, are not sold, and are not used to train models. You can delete your photos or account from Profile. Photos may be removed automatically after 30 days unless you choose to keep them for progress tracking.'],
  biometric: ['Biometric notice', 'Maxora processes facial images and measurements to generate your results. This processing is used only to provide the app experience you request. It does not identify you or make decisions about access to services, employment, housing, credit, or insurance. You can withdraw consent by deleting your account and photos.'],
  help: ['Help & support', 'For account, subscription, or scan questions, contact support@example.com. If you feel distressed by appearance-related content, pause your use of Maxora and seek support from a qualified professional or a local helpline.'],
};

export function LegalModal({ doc, onClose }) {
  if (!doc) return null;
  const [title, body] = LEGAL[doc] || LEGAL.help;
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 20 }}>
      <View style={{ maxHeight: '82%', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 20 }}>
        <ScrollView>
          <T k="h1">{title}</T>
          <T k="g">{body}</T>
        </ScrollView>
        <Btn alt onPress={onClose}>Close</Btn>
      </View>
    </View>
  </Modal>;
}
