const D = {
  terms: ['Terms of Service', 'Placeholder text. Replace with reviewed terms. You must be 18 or older. Subscriptions renew weekly until you cancel in your App Store or Google Play settings. Refunds follow store rules.'],
  privacy: ['Privacy Policy', 'Placeholder text. Replace with a reviewed policy. Photos sit in private storage. We never sell, share or train models on your photos. Photos delete after 30 days unless you keep them. Delete photos or your account any time in Settings.'],
  biometric: ['Biometric Data Notice', 'Placeholder text. Replace with a reviewed notice. Face photos count as biometric data. We use them only to produce your ratings.'],
};
export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(D).map(doc => ({ doc }));
export default function Page({ params }) {
  const d = D[params.doc];
  return <main style={{ maxWidth: 640, margin: '40px auto', padding: 16, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}><h1>{d[0]}</h1><p>{d[1]}</p></main>;
}
