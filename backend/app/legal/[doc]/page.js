import { Logo } from '@/components/Logo';

// Placeholder copy. Have a lawyer review these before launch.
const D = {
  terms: ['Terms of Service', [
    'Maxora is a free self-improvement tool for adults aged 18 and over. Ratings are AI estimates. They are not medical, professional or objective judgments, and they do not define your worth.',
    'You must only upload photos of yourself. You are responsible for the photos and information you provide.',
    'To keep the service available for everyone, usage is limited per network each day. Automated or abusive use is not allowed.',
    'The service is provided as is, without warranties. Advice from the app or Coach Vee is general information, not medical advice.',
  ]],
  privacy: ['Privacy Policy', [
    'There are no accounts. Your results are linked to a random identifier stored on your device. Clearing the app or browser data removes that link.',
    'Your photos are stored privately and used only to produce your ratings. They are deleted automatically 7 days after each scan. You can delete them sooner, or delete all your data, from Settings at any time.',
    'Scores, your plan and Coach Vee messages are kept until you delete them, so you can track progress.',
    'To prevent abuse we count requests per IP address. The address is stored only as a one-way hash, and the counters are deleted daily.',
    'We never sell your data, share your photos, or use them to train AI models. Photos are sent to our AI provider only to produce your rating.',
  ]],
  biometric: ['Biometric Data Notice', [
    'Face photos may count as biometric data. Maxora processes them only to generate the ratings and recommendations you ask for.',
    'Maxora does not identify you, and does not use your photos for decisions about employment, housing, credit or insurance.',
    'Photos are deleted 7 days after each scan. You can withdraw consent at any time by deleting your data in Settings.',
  ]],
};

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(D).map(doc => ({ doc }));
export const generateMetadata = ({ params }) => ({ title: D[params.doc][0] });

export default function Page({ params }) {
  const [title, body] = D[params.doc];
  return <main className="legal">
    <a className="brand" href="/"><Logo size={32} />Maxora</a>
    <h1 style={{ marginTop: 24 }}>{title}</h1>
    <p className="meta">Placeholder text. Last updated 6 November 2026.</p>
    {body.map(p => <p key={p}>{p}</p>)}
    <p>Questions? Contact <a href="mailto:support@example.com">support@example.com</a>.</p>
  </main>;
}
