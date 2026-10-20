import { Platform } from 'react-native';
// react-native-purchases is a native module. Expo Go cannot run it, so every call is guarded.
let P = null;
try { P = require('react-native-purchases').default; } catch { P = null; }
let ready = false;
export async function initPurchases(uid) {
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_RC_IOS_KEY : process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
  if (!P || !key) return false;
  try { P.configure({ apiKey: key, appUserID: uid }); ready = true; } catch { ready = false; }
  return ready;
}
export const iapReady = () => ready;
export async function getPackages() {
  if (!ready) return [];
  try { const o = await P.getOfferings(); return o.current?.availablePackages || []; } catch { return []; }
}
export const buyPackage = pkg => P.purchasePackage(pkg);
export const restore = () => (ready ? P.restorePurchases() : Promise.resolve());
