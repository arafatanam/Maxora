'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Sun, Smile, GlassesIcon, Scissors, Clock } from 'lucide-react';
import { api, compress, uploadPhoto, fmtTime } from '@/lib/client';
import { Reveal, PageHead, Alert, Note } from './ui';

const TIPS = [[Sun, 'Even, natural light'], [Smile, 'Neutral expression'], [GlassesIcon, 'No glasses or filters'], [Scissors, 'Hair off your forehead']];
const OK = /^image\/(jpeg|png|webp|heic|heif)$/;

function Drop({ k, label, hint, file, preview, onPick }) {
  const [over, setOver] = useState(false);
  return <label className={`drop${file ? ' filled' : ''}${over ? ' over' : ''}`}
    onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
    onDrop={e => { e.preventDefault(); setOver(false); onPick(k, e.dataTransfer.files[0]); }}>
    <input className="sr-only" type="file" accept="image/*" onChange={e => { onPick(k, e.target.files[0]); e.target.value = ''; }} aria-label={`${label}. ${hint}`} />
    {preview ? <>
      <img src={preview} alt={`${label} preview`} />
      <span className="drop-label"><Check size={14} color="var(--accent)" aria-hidden />{label}</span>
      <span className="drop-change">Change</span>
    </> : <span className="drop-empty">
      <span className="drop-icon"><ImagePlus size={24} aria-hidden /></span>
      <span className="head" style={{ fontWeight: 600 }}>{label}</span>
      <span className="meta">{hint}</span>
      <span className="meta" style={{ color: 'var(--light)' }}>Choose a photo or drop it here</span>
    </span>}
  </label>;
}

export function Scan({ me, go, reload }) {
  const [files, setFiles] = useState({}), [prev, setPrev] = useState({}), [err, setErr] = useState(''), [phase, setPhase] = useState('pick');
  const urls = useRef({});
  useEffect(() => () => Object.values(urls.current).forEach(u => URL.revokeObjectURL(u)), []);
  const pick = (k, f) => {
    if (!f) return;
    if (!OK.test(f.type)) return setErr('That file is not a photo. Use a JPG, PNG or WEBP image.');
    if (f.size > 25 * 1024 * 1024) return setErr('That photo is over 25 MB. Pick a smaller one.');
    if (urls.current[k]) URL.revokeObjectURL(urls.current[k]);
    urls.current[k] = URL.createObjectURL(f);
    setErr(''); setFiles(x => ({ ...x, [k]: f })); setPrev(x => ({ ...x, [k]: urls.current[k] }));
  };
  const lim = me.limits.scan, out = lim.remaining === 0;
  if (phase === 'run') return <Analyzing files={files} preview={prev.front} done={async id => { await reload(); go('results', id, { replace: true }); }} retake={() => { setPhase('pick'); reload(); }} />;
  return <Reveal>
    <PageHead title="New scan" sub="Add a front photo and a side profile. We'll rate nine features and build your plan.">
      <span className={`badge${out ? '' : ' accent'}`}>{lim.remaining} of {lim.max} scans left today</span>
    </PageHead>
    <div className="stack-lg">
      <div className="tips">{TIPS.map(([I, t]) => <div className="tip" key={t}><I size={18} aria-hidden />{t}</div>)}</div>
      <div className="drops">
        <Drop k="front" label="Front photo" hint="Look straight at the camera" file={files.front} preview={prev.front} onPick={pick} />
        <Drop k="side" label="Side profile" hint="Turn 90°, ear and jawline visible" file={files.side} preview={prev.side} onPick={pick} />
      </div>
      {err && <Alert>{err}</Alert>}
      {out && <Note icon={Clock}>You've used today's {lim.max} scans. You can scan again after {fmtTime(lim.reset)}.</Note>}
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <p className="meta" style={{ maxWidth: '52ch' }}>Photos are resized on your device before upload and deleted automatically {me.photo_days} days after your scan. Only a successful analysis uses a scan.</p>
        <button className="btn btn-primary" disabled={!files.front || !files.side || out} onClick={() => setPhase('run')}>Analyze my face</button>
      </div>
    </div>
  </Reveal>;
}

const STEPS = ['Uploading photos', 'Mapping facial features', 'Rating nine features', 'Building your plan'];

function Analyzing({ files, preview, done, retake }) {
  const [step, setStep] = useState(0), [err, setErr] = useState(''), state = useRef({ id: null, uploaded: false }), started = useRef(false);
  const run = async () => {
    setErr(''); setStep(0);
    let timer;
    try {
      const s = state.current;
      if (!s.id) s.id = (await api('scan/start', {})).id;
      if (!s.uploaded) {
        for (const k of ['front', 'side']) {
          const blob = await compress(files[k]);
          if (!/^image\/(jpeg|png|webp)$/.test(blob.type)) throw new Error('This photo format is not supported. Use a JPG or PNG photo.');
          await uploadPhoto(s.id, k, blob);
        }
        s.uploaded = true;
      }
      setStep(1);
      timer = setInterval(() => setStep(x => Math.min(x + 1, 3)), 3500);
      const r = await api('analyze', { id: s.id });
      clearInterval(timer); setStep(4);
      await done(r.id);
    } catch (e) {
      clearInterval(timer);
      if (e.status === 404) state.current = { id: null, uploaded: false };
      if (e.status === 400 && /upload/i.test(e.message)) state.current.uploaded = false;
      setErr(e.message);
    }
  };
  useEffect(() => { if (!started.current) { started.current = true; run(); } }, []);
  return <div className="analyzing">
    <div className="scanbox">{preview && <img src={preview} alt="Your front photo" />}{!err && <div className="sweep" />}</div>
    {err ? <div className="stack">
      <Alert>{err}</Alert>
      <div className="actions"><button className="btn btn-primary" onClick={run}>Try again</button><button className="btn btn-secondary" onClick={retake}>Retake photos</button></div>
    </div> : <div className="stack">
      <h1 style={{ fontSize: 24 }} aria-live="polite">{STEPS[Math.min(step, 3)]}…</h1>
      <ol className="progress-steps">{STEPS.map((t, i) => <li key={t} data-state={i < step ? 'done' : i === step ? 'active' : 'todo'}>
        <span className="dot">{i < step ? <Check size={13} strokeWidth={3} aria-hidden /> : i === step ? <span className="spinner" /> : null}</span>{t}</li>)}</ol>
      <p className="meta">This usually takes 10 to 20 seconds. Keep this page open.</p>
    </div>}
  </div>;
}
