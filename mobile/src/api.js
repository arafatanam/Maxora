import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// No accounts: a random device id, created once and kept on the phone, identifies this install to the API.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const KEY = 'maxora.device';
let cached = null;

export async function getDeviceId() {
  if (cached) return cached;
  let id = await AsyncStorage.getItem(KEY).catch(() => null);
  if (!id) { id = Crypto.randomUUID(); await AsyncStorage.setItem(KEY, id).catch(() => {}); }
  return (cached = id);
}

export async function resetDeviceId() {
  cached = null;
  await AsyncStorage.removeItem(KEY).catch(() => {});
}

async function request(path, init) {
  const id = await getDeviceId();
  let r;
  try { r = await fetch(`${API_URL}/api/${path}`, { ...init, headers: { 'x-device-id': id, ...init.headers } }); }
  catch (e) { throw new Error(`Could not reach Maxora at ${API_URL}. Check your connection and try again.`); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'Something went wrong. Try again.'), { status: r.status, data: j });
  return j;
}

export const api = (path, body) => request(path, body
  ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
  : { method: 'GET', headers: {} });

// Resize to at most 1280px on the long side and save as JPEG before upload.
export async function compress(asset) {
  const landscape = (asset.width || 0) >= (asset.height || 0);
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width || 0, asset.height || 0) > 1280) ctx.resize(landscape ? { width: 1280 } : { height: 1280 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ compress: 0.86, format: SaveFormat.JPEG });
  return out.uri;
}

export async function uploadPhoto(scanId, k, uri) {
  const blob = await (await fetch(uri)).blob();
  return request(`scan/photo?id=${scanId}&k=${k}`, { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob });
}
