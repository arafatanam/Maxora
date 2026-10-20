import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Pressable, Alert, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { sb, api } from '../api';
import { T, Card, Btn, C } from '../ui';

export function Scan({ go }) {
  const [f, setF] = useState({}), [err, setErr] = useState('');
  const run = async (k, cam) => {
    const perm = cam ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setErr('Allow access in your phone settings to continue.');
    const opts = { quality: 0.8, mediaTypes: ['images'] };
    const r = cam ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled) return;
    const a = r.assets[0];
    if (a.fileSize && a.fileSize > 10 * 1024 * 1024) return setErr('Photo is over 10 MB.');
    setErr(''); setF(x => ({ ...x, [k]: a }));
  };
  const pick = k => Alert.alert('Add photo', 'Neutral face, even light, no filters.', [{ text: 'Camera', onPress: () => run(k, true) }, { text: 'Gallery', onPress: () => run(k, false) }, { text: 'Cancel', style: 'cancel' }]);
  const Slot = ({ k, label }) => <Pressable onPress={() => pick(k)} accessibilityRole="button" accessibilityLabel={label}>
    <Card style={{ alignItems: 'center', height: 220, justifyContent: 'center', overflow: 'hidden', padding: 0 }}>
      {f[k] ? <Image source={{ uri: f[k].uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <T k="g" style={{ textAlign: 'center' }}>Tap to add{'\n'}<T k="h3">{label}</T></T>}
    </Card></Pressable>;
  return <View>
    <T k="h1">Scan</T><T k="g">Neutral face. Hair off forehead. Even light. No filters. No glasses.</T>
    <Slot k="front" label="Front photo" /><Slot k="side" label="Side profile photo" />
    {!!err && <T k="err">{err}</T>}
    <Btn disabled={!f.front || !f.side} onPress={() => go('analyzing', f)}>Analyze my face</Btn>
  </View>;
}

const LINES = ['Mapping facial points', 'Measuring proportions', 'Rating features', 'Building your plan'];
export function Analyzing({ files, done, fail, paywall }) {
  const [i, setI] = useState(0), [err, setErr] = useState(''), ran = useRef(false), y = useRef(new Animated.Value(0)).current;
  const run = async () => {
    setErr('');
    try {
      const { data: { user }, error } = await sb.auth.getUser();
      if (error || !user) throw new Error('Your guest session expired. Restart the app and try again.');
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8), paths = {};
      for (const k of ['front', 'side']) {
        let mime = (files[k].mimeType || 'image/jpeg').replace('image/jpg', 'image/jpeg');
        if (!/^image\/(jpeg|png|webp)$/.test(mime)) throw new Error('Use a JPG, PNG or WEBP photo.');
        paths[k] = `${user.id}/${id}-${k}.${mime.split('/')[1].replace('jpeg', 'jpg')}`;
        const buf = await (await fetch(files[k].uri)).arrayBuffer();
        const { error } = await sb.storage.from('photos').upload(paths[k], buf, { contentType: mime });
        if (error) throw new Error('Upload failed. Try again.');
      }
      const r = await api('analyze', paths); done(r.id);
    } catch (e) { if (e.status === 402) paywall(); else setErr(e.message); }
  };
  useEffect(() => {
    if (!ran.current) { ran.current = true; run(); }
    const t = setInterval(() => setI(x => (x + 1) % 4), 2200);
    const loop = Animated.loop(Animated.sequence([Animated.timing(y, { toValue: 253, duration: 1800, useNativeDriver: true }), Animated.timing(y, { toValue: 0, duration: 1800, useNativeDriver: true })]));
    loop.start(); return () => { clearInterval(t); loop.stop(); };
  }, []);
  return <View style={{ marginTop: 20 }}>
    <View style={{ height: 260, borderRadius: 16, overflow: 'hidden', backgroundColor: C.card }}>
      <Image source={{ uri: files.front.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {!err && <Animated.View style={{ position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: C.c, transform: [{ translateY: y }] }} />}
    </View>
    {err ? <><T k="err">{err}</T><Btn onPress={run}>Retry</Btn><Btn alt onPress={fail}>Retake photos</Btn></> : <T k="h2">{LINES[i]}...</T>}
  </View>;
}
