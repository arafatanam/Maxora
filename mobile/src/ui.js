import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Polygon, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { AlertCircle, Info, X } from './icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Brand: dark #2B1B5A, light #B9A7FF, accent #5EF2C2. Headings: Sora. Body: Inter.
// Shape rule: controls 12, surfaces 16, chips and badges are pills. The accent is reserved for
// the primary action, the active tab and progress.
export const C = {
  dark: '#2B1B5A', light: '#B9A7FF', accent: '#5EF2C2', onAccent: '#1D1240',
  bg: '#150D2E', raised: '#1A1139', card: '#20154A', card2: '#2B1B5A',
  line: 'rgba(185,167,255,0.13)', lineStrong: 'rgba(185,167,255,0.26)', track: 'rgba(185,167,255,0.13)',
  fg: '#F5F3FF', fg2: 'rgba(245,243,255,0.74)', fg3: 'rgba(245,243,255,0.56)',
  danger: '#FFA3B5', dangerLine: 'rgba(255,163,181,0.38)', lo: '#A59BC9',
};
export const F = { head: 'Sora_600SemiBold', headBold: 'Sora_700Bold', body: 'Inter_400Regular', medium: 'Inter_500Medium', semi: 'Inter_600SemiBold', italic: 'Inter_400Regular_Italic', semiItalic: 'Inter_600SemiBold_Italic' };
export const R = { control: 12, surface: 16, pill: 999 };

export const nice = s => (s || '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
export const FEATS = ['symmetry', 'jawline', 'cheekbones', 'eye_area', 'nose', 'lips', 'skin_quality', 'facial_harmony', 'dimorphism'];
export const CATS = ['grooming', 'skincare', 'hair', 'fitness', 'posture', 'style', 'habits'];
export const OPTIONS = { gender: ['male', 'female', 'other'], age_range: ['18 to 24', '25 to 34', '35 to 44', '45 plus'], main_goal: ['Better jawline', 'Better skin', 'Better hair', 'Overall glow up', 'Social confidence'] };
export const DISC = 'Scores are AI estimates for self-improvement. They do not define your worth and are not medical advice.';
export const tone = s => s >= 7 ? C.accent : s >= 5 ? C.light : C.lo;
export const fmtDate = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = d => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
export const tap = () => Haptics.selectionAsync().catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

const kinds = {
  display: { fontFamily: F.head, fontSize: 30, lineHeight: 37, letterSpacing: -0.6 },
  h1: { fontFamily: F.head, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  h2: { fontFamily: F.head, fontSize: 18, lineHeight: 25, letterSpacing: -0.3 },
  h3: { fontFamily: F.head, fontSize: 15, lineHeight: 21, letterSpacing: -0.15 },
  muted: { color: C.fg2 },
  meta: { fontSize: 13, lineHeight: 18, color: C.fg3 },
  eyebrow: { fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: C.light },
  num: { fontFamily: F.head, fontVariant: ['tabular-nums'] },
};
export const T = ({ k, style, ...p }) => <Text maxFontSizeMultiplier={1.6} style={[{ color: C.fg, fontFamily: F.body, fontSize: 15, lineHeight: 22 }, kinds[k], style]} {...p} />;
export const Score = ({ v, size = 17, style }) => <T k="num" style={[{ color: tone(v), fontSize: size, lineHeight: size * 1.25 }, style]}>{Number(v).toFixed(1)}</T>;

export const Card = ({ style, ...p }) => <View style={[{ backgroundColor: C.card, borderRadius: R.surface, borderCurve: 'continuous', padding: 18, borderWidth: 1, borderColor: C.line, gap: 12 }, style]} {...p} />;
export const Row = ({ style, ...p }) => <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, style]} {...p} />;

const BTN = {
  primary: { bg: C.accent, fg: C.onAccent, border: C.accent },
  secondary: { bg: 'transparent', fg: C.fg, border: C.lineStrong },
  danger: { bg: 'transparent', fg: C.danger, border: C.dangerLine },
  ghost: { bg: 'transparent', fg: C.light, border: 'transparent' },
};
export function Btn({ children, onPress, variant = 'primary', small, disabled, icon: Icon, style, label }) {
  const v = BTN[variant];
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} hitSlop={small ? 6 : 0}
    style={({ pressed }) => [{ flexDirection: 'row', gap: 8, backgroundColor: v.bg, minHeight: small ? 40 : 50, paddingHorizontal: small ? 14 : 20, borderRadius: R.control, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: v.border, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }], alignSelf: small ? 'flex-start' : 'stretch' }, style]}>
    {Icon && <Icon size={18} color={v.fg} />}
    {children != null && <Text style={{ color: v.fg, fontFamily: F.semi, fontSize: small ? 14 : 15 }}>{children}</Text>}
  </Pressable>;
}

export const Chip = ({ on, onPress, children }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={() => { tap(); onPress(); }}
  style={({ pressed }) => ({ minHeight: 40, justifyContent: 'center', paddingHorizontal: 16, borderRadius: R.pill, borderWidth: 1, borderColor: on ? C.accent : C.lineStrong, backgroundColor: on ? 'rgba(94,242,194,0.10)' : pressed ? 'rgba(185,167,255,0.07)' : 'transparent' })}>
  <Text style={{ color: on ? C.fg : C.fg2, fontFamily: F.medium, fontSize: 14 }}>{children}</Text></Pressable>;
export const Chips = ({ children }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
export const Badge = ({ children, accent }) => <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, height: 26, justifyContent: 'center', borderRadius: R.pill, backgroundColor: accent ? 'rgba(94,242,194,0.12)' : 'rgba(185,167,255,0.10)' }}>
  <Text style={{ color: accent ? C.accent : C.light, fontFamily: F.medium, fontSize: 12 }}>{children}</Text></View>;

export const Bar = ({ v, max = 10, color }) => <View style={{ height: 6, borderRadius: R.pill, backgroundColor: C.track, overflow: 'hidden' }}>
  <View style={{ width: `${Math.max(0, Math.min(100, (v / max) * 100))}%`, height: 6, borderRadius: R.pill, backgroundColor: color || tone(v) }} /></View>;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export function Gauge({ v, size = 168 }) {
  const r = 74, c = 2 * Math.PI * r, p = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(p, { toValue: v / 10, duration: 900, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: false }).start(); }, [v]);
  return <View accessible accessibilityRole="image" accessibilityLabel={`Overall score ${v.toFixed(1)} out of 10`} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 170 170" style={{ position: 'absolute' }}>
      <Circle cx="85" cy="85" r={r} fill="none" stroke={C.track} strokeWidth="8" />
      <AnimatedCircle cx="85" cy="85" r={r} fill="none" stroke={tone(v)} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c} ${c}`}
        strokeDashoffset={p.interpolate({ inputRange: [0, 1], outputRange: [c, 0] })} rotation="-90" origin="85, 85" />
    </Svg>
    <T k="num" style={{ fontSize: 46, lineHeight: 52 }}>{v.toFixed(1)}</T>
    <T k="meta">out of 10</T>
  </View>;
}

const FACETS = ['50,20 30,33 40,46', '50,20 40,46 60,46', '50,20 60,46 70,33', '30,33 28,56 40,46', '70,33 72,56 60,46', '28,56 40,46 50,62', '72,56 60,46 50,62', '28,56 50,62 50,80', '72,56 50,62 50,80'];
export const Logo = ({ size = 32 }) => <Svg width={size} height={size} viewBox="0 0 100 100">
  <Rect width="100" height="100" rx="22" fill={C.dark} />
  <G fill={C.light} stroke={C.dark} strokeWidth="2.4" strokeLinejoin="round">
    {FACETS.map(p => <Polygon key={p} points={p} />)}
    <Polygon points="40,46 60,46 50,62" fill={C.accent} />
  </G>
</Svg>;

export const Head = ({ title, sub, eyebrow, right }) => <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
  <View style={{ flex: 1, gap: 4 }}>{eyebrow && <T k="eyebrow">{eyebrow}</T>}<T k="h1" accessibilityRole="header">{title}</T>{sub && <T k="muted">{sub}</T>}</View>
  {right}
</View>;
export const Section = ({ title, right, children, style }) => <View style={[{ gap: 12, marginTop: 28 }, style]}>
  <Row><T k="h2" accessibilityRole="header">{title}</T>{right}</Row>{children}</View>;
export const ErrorText = ({ children }) => <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: R.control, borderWidth: 1, borderColor: C.dangerLine, backgroundColor: 'rgba(255,163,181,0.06)' }}>
  <AlertCircle size={18} color={C.danger} style={{ marginTop: 2 }} /><T style={{ flex: 1 }}>{children}</T></View>;
export const Note = ({ children, icon: I = Info }) => <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: R.control, backgroundColor: 'rgba(185,167,255,0.07)' }}>
  <I size={18} color={C.light} style={{ marginTop: 2 }} /><T k="muted" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{children}</T></View>;

const LEGAL = {
  terms: ['Terms of Service', ['Maxora is a free self-improvement tool for adults aged 18 and over. Ratings are AI estimates. They are not medical, professional or objective judgments, and they do not define your worth.', 'Only upload photos of yourself. You are responsible for the photos and information you provide.', 'To keep the service available for everyone, usage is limited per network each day. Automated or abusive use is not allowed.', 'Advice from the app or Coach Maxy is general information, not medical advice.']],
  privacy: ['Privacy Policy', ['There are no accounts. Your results are linked to a random identifier stored on this phone. Deleting the app removes that link.', 'Your photos are stored privately and used only to produce your ratings. They are deleted automatically 7 days after each scan. You can delete them sooner, or delete all your data, in Settings.', 'Scores, your plan and Coach Maxy messages are kept until you delete them, so you can track progress.', 'To prevent abuse we count requests per IP address, stored only as a one-way hash. Counters are deleted daily.', 'We never sell your data, share your photos, or use them to train AI models.']],
  biometric: ['Biometric Data Notice', ['Face photos may count as biometric data. Maxora processes them only to generate the ratings and recommendations you ask for.', 'Maxora does not identify you, and does not use your photos for decisions about employment, housing, credit or insurance.', 'Photos are deleted 7 days after each scan. You can withdraw consent at any time by deleting your data in Settings.']],
  help: ['Help and support', ['For questions about scans or your data, contact support@example.com.', 'If appearance-related content is upsetting you, take a break from Maxora and talk to someone you trust, a qualified professional, or a local helpline.']],
};

// A native page sheet on iOS; a full-screen modal on Android. Both close with the system back gesture.
export function LegalModal({ doc, onClose }) {
  const ins = useSafeAreaInsets();
  if (!doc) return null;
  const [title, body] = LEGAL[doc] || LEGAL.help;
  return <Modal visible animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'ios' ? 8 : ins.top }}>
      <Row style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <T k="h2" accessibilityRole="header" style={{ flex: 1 }}>{title}</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10} style={{ width: 40, height: 40, borderRadius: R.pill, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}><X size={20} color={C.fg} /></Pressable>
      </Row>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: ins.bottom + 32, gap: 16 }}>
        <T k="meta">Placeholder text. Have it reviewed before launch.</T>
        {body.map(p => <T key={p} k="muted" style={{ fontSize: 16, lineHeight: 25 }}>{p}</T>)}
      </ScrollView>
    </View>
  </Modal>;
}
