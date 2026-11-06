import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Pressable, Alert, ActionSheetIOS, Animated, Easing, Platform, AccessibilityInfo } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Check, ImagePlus, Sun, Smile, Glasses, Scissors, Clock } from '../icons';
import { api, compress, uploadPhoto } from '../api';
import { T, Btn, Head, Badge, ErrorText, Note, C, R, fmtTime, tap, success } from '../ui';

const TIPS = [[Sun, 'Even, natural light'], [Smile, 'Neutral expression'], [Glasses, 'No glasses or filters'], [Scissors, 'Hair off your forehead']];

export function Scan({ me, go, onDone, reload }) {
  const [f, setF] = useState({}), [err, setErr] = useState(''), [run, setRun] = useState(false);
  const pickFrom = async (k, cam) => {
    const perm = cam ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setErr(`Allow ${cam ? 'camera' : 'photo'} access for Maxora in your phone's settings to continue.`);
    const opts = { quality: 1, mediaTypes: ['images'] };
    const r = cam ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled) return;
    setErr(''); tap(); setF(x => ({ ...x, [k]: r.assets[0] }));
  };
  const pick = k => {
    const opts = ['Take photo', 'Choose from library', 'Cancel'];
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options: opts, cancelButtonIndex: 2, title: 'Neutral face, even light, no filters' }, i => i < 2 && pickFrom(k, i === 0));
    else Alert.alert('Add photo', 'Neutral face, even light, no filters.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Library', onPress: () => pickFrom(k, false) }, { text: 'Camera', onPress: () => pickFrom(k, true) }]);
  };
  const lim = me.limits.scan, out = lim.remaining === 0;
  if (run) return <Analyzing files={f} done={async id => { success(); await onDone(id); }} retake={() => { setRun(false); reload(); }} />;

  const Slot = ({ k, label, hint }) => <Pressable onPress={() => pick(k)} accessibilityRole="button" accessibilityLabel={`${label}. ${f[k] ? 'Photo added. Tap to change.' : hint}`}
    style={({ pressed }) => ({ flex: 1, aspectRatio: 3 / 4, borderRadius: R.surface, borderCurve: 'continuous', overflow: 'hidden', borderWidth: 1.5, borderStyle: f[k] ? 'solid' : 'dashed', borderColor: f[k] ? C.line : C.lineStrong, backgroundColor: pressed ? C.card : C.raised, alignItems: 'center', justifyContent: 'center' })}>
    {f[k] ? <>
      <Image source={{ uri: f[k].uri }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      <View style={{ position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: R.pill, backgroundColor: 'rgba(21,13,46,0.86)' }}><Check size={13} color={C.accent} /><T style={{ fontSize: 12, fontFamily: 'Inter_500Medium' }}>{label}</T></View>
    </> : <View style={{ alignItems: 'center', gap: 8, padding: 12 }}>
      <View style={{ width: 48, height: 48, borderRadius: R.pill, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}><ImagePlus size={22} color={C.light} /></View>
      <T k="h3" style={{ textAlign: 'center' }}>{label}</T>
      <T k="meta" style={{ textAlign: 'center' }}>{hint}</T>
    </View>}
  </Pressable>;

  return <View>
    <Head title="New scan" sub="A front photo and a side profile. We'll rate nine features and build your plan." />
    <Badge accent={!out}>{lim.remaining} of {lim.max} scans left today</Badge>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, marginVertical: 20 }}>
      {TIPS.map(([I, t]) => <View key={t} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 }}><I size={16} color={C.light} /><T k="muted" style={{ fontSize: 13, flex: 1 }}>{t}</T></View>)}
    </View>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Slot k="front" label="Front photo" hint="Look straight at the camera" />
      <Slot k="side" label="Side profile" hint="Turn 90°, ear visible" />
    </View>
    <View style={{ gap: 12, marginTop: 20 }}>
      {!!err && <ErrorText>{err}</ErrorText>}
      {out && <Note icon={Clock}>You've used today's {lim.max} scans. You can scan again after {fmtTime(lim.reset)}.</Note>}
      <Btn disabled={!f.front || !f.side || out} onPress={() => setRun(true)}>Analyze my face</Btn>
      <T k="meta">Photos are resized on your phone before upload and deleted automatically {me.photo_days} days after your scan. Only a successful analysis uses a scan.</T>
    </View>
  </View>;
}

const STEPS = ['Uploading photos', 'Mapping facial features', 'Rating nine features', 'Building your plan'];

function Analyzing({ files, done, retake }) {
  const [step, setStep] = useState(0), [err, setErr] = useState(''), [h, setH] = useState(0);
  const st = useRef({ id: null, uploaded: false }), started = useRef(false), y = useRef(new Animated.Value(0)).current;
  const run = async () => {
    setErr(''); setStep(0);
    let timer;
    try {
      const s = st.current;
      if (!s.id) s.id = (await api('scan/start', {})).id;
      if (!s.uploaded) {
        for (const k of ['front', 'side']) await uploadPhoto(s.id, k, await compress(files[k]));
        s.uploaded = true;
      }
      setStep(1);
      timer = setInterval(() => setStep(x => Math.min(x + 1, 3)), 3500);
      const r = await api('analyze', { id: s.id });
      clearInterval(timer); setStep(4);
      await done(r.id);
    } catch (e) {
      clearInterval(timer);
      if (e.status === 404) st.current = { id: null, uploaded: false };
      if (e.status === 400 && /upload/i.test(e.message)) st.current.uploaded = false;
      setErr(e.message);
    }
  };
  useEffect(() => { if (!started.current) { started.current = true; run(); } }, []);
  useEffect(() => {
    if (!h || err) return;
    let loop;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (reduce) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(y, { toValue: h - 2, duration: 2200, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 2200, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
      ]));
      loop.start();
    });
    return () => loop?.stop();
  }, [h, err]);
  return <View style={{ gap: 24, paddingTop: 8 }}>
    <View onLayout={e => setH(e.nativeEvent.layout.height)} style={{ aspectRatio: 4 / 5, maxHeight: 420, width: '100%', borderRadius: R.surface, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.line }}>
      <Image source={{ uri: files.front.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {!err && <Animated.View style={{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: C.accent, boxShadow: '0 0 16px 2px rgba(94,242,194,0.55)', transform: [{ translateY: y }] }} />}
    </View>
    {err ? <View style={{ gap: 12 }}>
      <ErrorText>{err}</ErrorText>
      <Btn onPress={run}>Try again</Btn>
      <Btn variant="secondary" onPress={retake}>Retake photos</Btn>
    </View> : <View style={{ gap: 14 }}>
      <T k="h1" accessibilityLiveRegion="polite">{STEPS[Math.min(step, 3)]}…</T>
      {STEPS.map((t, i) => <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 22, height: 22, borderRadius: R.pill, borderWidth: 1.5, borderColor: i <= step ? C.accent : C.lineStrong, backgroundColor: i < step ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {i < step && <Check size={13} strokeWidth={3} color={C.onAccent} />}</View>
        <T style={{ color: i === step ? C.fg : i < step ? C.fg2 : C.fg3 }}>{t}</T>
      </View>)}
      <T k="meta">This usually takes 10 to 20 seconds. Keep the app open.</T>
    </View>}
  </View>;
}
