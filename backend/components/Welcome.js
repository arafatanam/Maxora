'use client';
import { useState } from 'react';
import { ScanFace, Gauge as GaugeIcon, ListChecks, ShieldCheck } from 'lucide-react';
import { api, nice, OPTIONS } from '@/lib/client';
import { Logo, Reveal, Alert } from './ui';

const POINTS = [
  [ScanFace, 'Two photos, one minute', 'A front photo and a side profile. No account, no sign-in.'],
  [GaugeIcon, 'Nine features, scored', 'Each feature rated out of 10 with a clear, specific verdict.'],
  [ListChecks, 'A plan that fits you', 'Ranked, safe actions and a coach that knows your results.'],
  [ShieldCheck, 'Private by default', 'Photos are deleted automatically 7 days after each scan.'],
];
const QUESTIONS = [['gender', 'Gender'], ['age_range', 'Age range'], ['main_goal', 'Main goal']];

export default function Welcome({ done }) {
  const [a, setA] = useState({}), [ck, setCk] = useState([false, false, false]), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const ready = QUESTIONS.every(([k]) => a[k]) && ck.every(Boolean);
  const submit = async e => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true); setErr('');
    try { await api('profile', { ...a, age_confirmed: true, consent_accepted: true }); await done(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };
  const toggle = i => setCk(ck.map((x, j) => j === i ? !x : x));
  return <main className="welcome" id="main">
    <div className="welcome-inner">
      <Reveal className="stack-lg">
        <span className="brand"><Logo size={40} />Maxora</span>
        <div className="stack">
          <h1>Understand your face. Improve what matters.</h1>
          <p className="lead">An honest AI read on your facial features, with a focused plan to get better. Free to use.</p>
        </div>
        <ul className="points">
          {POINTS.map(([Icon, t, d]) => <li key={t}><span className="ico"><Icon size={20} aria-hidden /></span><div><h3>{t}</h3><p>{d}</p></div></li>)}
        </ul>
      </Reveal>

      <Reveal as="form" className="card stack-lg" onSubmit={submit}>
        <div className="stack" style={{ gap: 6 }}>
          <h2>About you</h2>
          <p>This helps tailor your ratings and plan. You can change it later.</p>
        </div>
        {QUESTIONS.map(([k, label]) => <fieldset key={k} className="field" style={{ border: 0 }}>
          <legend className="field-label" style={{ marginBottom: 10 }}>{label}</legend>
          <div className="chips">{OPTIONS[k].map(x => <button type="button" key={x} className="chip" aria-pressed={a[k] === x} onClick={() => setA({ ...a, [k]: x })}>{nice(x)}</button>)}</div>
        </fieldset>)}
        <div>
          <hr className="divider" style={{ marginBottom: 4 }} />
          <label className="check"><input type="checkbox" checked={ck[0]} onChange={() => toggle(0)} />I am 18 or older.</label>
          <label className="check"><input type="checkbox" checked={ck[1]} onChange={() => toggle(1)} />
            <span>I agree to the <a href="/legal/terms" target="_blank" rel="noreferrer">Terms</a> and <a href="/legal/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>
          <label className="check"><input type="checkbox" checked={ck[2]} onChange={() => toggle(2)} />
            <span>I consent to Maxora processing my face photos to produce ratings (<a href="/legal/biometric" target="_blank" rel="noreferrer">biometric notice</a>).</span></label>
        </div>
        {err && <Alert>{err}</Alert>}
        <div className="stack" style={{ gap: 10 }}>
          <button className="btn btn-primary btn-block" disabled={!ready || busy}>{busy ? 'Setting up…' : 'Continue'}</button>
          {!ready && <p className="meta" style={{ textAlign: 'center' }}>Answer all three and tick each box to continue.</p>}
        </div>
      </Reveal>
    </div>
  </main>;
}
