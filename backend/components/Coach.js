'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { api, fmtTime } from '@/lib/client';
import { Reveal, PageHead } from './ui';

const STARTERS = ['What should I do first?', 'Build me a skincare routine', 'Which haircut suits my face?', 'How do I improve my jawline?'];

export default function Coach({ me, scan, go, onLimit }) {
  const [msgs, setMsgs] = useState(null), [t, setT] = useState(''), [busy, setBusy] = useState(false), [left, setLeft] = useState(me.limits.coach.remaining);
  const end = useRef(null), box = useRef(null);
  useEffect(() => { if (scan) api('chat').then(r => setMsgs(r.messages)).catch(() => setMsgs([])); }, [scan]);
  useEffect(() => { if (msgs?.length) end.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'end' }); }, [msgs, busy]);
  const grow = el => { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; };

  if (!scan) return <Reveal>
    <PageHead title="Coach Maxy" sub="Coach Maxy gives advice based on your scan results. Run a scan first." />
    <div><button className="btn btn-primary" onClick={() => go('scan')}>Start a scan</button></div>
  </Reveal>;

  const send = async text => {
    text = text.trim();
    if (!text || busy || left === 0) return;
    setT(''); if (box.current) box.current.style.height = 'auto';
    setBusy(true); setMsgs(m => [...(m || []), { role: 'user', content: text }]);
    try {
      const r = await api('coach', { message: text });
      setMsgs(m => [...m, { role: 'assistant', content: r.reply }]);
      setLeft(r.remaining); onLimit(r.remaining);
    } catch (e) {
      setMsgs(m => [...m, { role: 'assistant', content: e.message, error: true }]);
      if (e.status === 429 && e.data?.limit) { setLeft(0); onLimit(0); }
    }
    setBusy(false);
  };
  const out = left === 0;
  return <div className="chat">
    <PageHead title="Coach Maxy" sub="Practical advice on grooming, skincare, hair, fitness, posture and style, based on your latest scan." />
    <div className="messages" aria-live="polite">
      {msgs === null && <div className="sk" style={{ height: 80, width: '60%' }} />}
      {msgs?.length === 0 && <div className="stack" style={{ gap: 12 }}>
        <p className="meta">Try one of these</p>
        <div className="chips">{STARTERS.map(c => <button key={c} className="chip" onClick={() => send(c)} disabled={out}>{c}</button>)}</div>
      </div>}
      {msgs?.map((m, i) => <div key={i} className={`msg ${m.role}${m.error ? ' error' : ''}`}>{m.content}</div>)}
      {busy && <div className="msg assistant typing" aria-label="Coach Maxy is typing"><i /><i /><i /></div>}
      <div ref={end} />
    </div>
    <form className="composer" onSubmit={e => { e.preventDefault(); send(t); }}>
      <label htmlFor="coach-input" className="sr-only">Message Coach Maxy</label>
      <textarea id="coach-input" ref={box} rows={1} value={t} disabled={out} maxLength={1000}
        placeholder={out ? `Daily limit reached. Back after ${fmtTime(me.limits.coach.reset)}.` : 'Ask Coach Maxy'}
        onChange={e => { setT(e.target.value); grow(e.target); }}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(t); } }} />
      <button className="btn btn-primary" aria-label="Send message" disabled={!t.trim() || busy || out}><ArrowUp size={20} aria-hidden /></button>
    </form>
    <p className="meta" style={{ textAlign: 'center', marginTop: 10 }}>{left} of {me.limits.coach.max} messages left today · Not medical advice</p>
  </div>;
}
