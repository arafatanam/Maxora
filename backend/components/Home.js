'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, ImageOff, ShieldCheck } from 'lucide-react';
import { api, fmtDate, fmtTime } from '@/lib/client';
import { Reveal, PageHead, Gauge, Bar, Score } from './ui';

export function Allowance({ limits }) {
  const s = limits.scan, c = limits.coach;
  return <section className="card" aria-labelledby="allow-h">
    <h2 id="allow-h">Today's allowance</h2>
    <div className="allowance" aria-hidden>{Array.from({ length: s.max }, (_, i) => <span key={i} className={i < s.remaining ? 'on' : ''} />)}</div>
    <p><span className="num" style={{ color: 'var(--fg)', fontWeight: 600 }}>{s.remaining} of {s.max}</span> scans left</p>
    <p className="meta">{c.remaining} of {c.max} Coach Maxy messages left · resets {fmtTime(s.reset)}</p>
  </section>;
}

export default function Home({ me, scan, go }) {
  const [recent, setRecent] = useState(null);
  useEffect(() => { if (scan) api('scans').then(r => setRecent(r.scans.slice(0, 3))).catch(() => setRecent([])); }, [scan]);
  const plan = scan?.plan || [], done = plan.filter(p => p.completed).length;
  const next = plan.filter(p => !p.completed).slice(0, 3);
  const noScans = me.limits.scan.remaining === 0;

  if (!scan) return <Reveal>
    <PageHead title="Welcome to Maxora" sub="Take two photos to get your first rating and a personal improvement plan." />
    <div className="overview">
      <section className="card stack-lg">
        <div className="stack" style={{ gap: 6 }}><h2>Get your first rating</h2><p>It takes about a minute.</p></div>
        <ol className="steps">
          <li><div><h3>Front photo</h3><p>Face the camera straight on, in even light.</p></div></li>
          <li><div><h3>Side profile</h3><p>Turn 90 degrees so your jawline and ear are visible.</p></div></li>
          <li><div><h3>Results and plan</h3><p>Nine feature scores, strengths, and ranked next steps.</p></div></li>
        </ol>
        <div><button className="btn btn-primary" onClick={() => go('scan')} disabled={noScans}>Start your first scan<ArrowRight size={18} aria-hidden /></button></div>
      </section>
      <div className="stack">
        <Allowance limits={me.limits} />
        <section className="card stack" style={{ gap: 10 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShieldCheck size={20} color="var(--light)" aria-hidden />Private by default</h2>
          <p>No account needed. Your photos are deleted automatically {me.photo_days} days after each scan.</p>
        </section>
      </div>
    </div>
  </Reveal>;

  return <Reveal>
    <PageHead title="Overview" sub={`Latest scan from ${fmtDate(scan.created_at)}`}>
      <button className="btn btn-primary" onClick={() => go('scan')} disabled={noScans}>New scan</button>
    </PageHead>
    <div className="overview">
      <div className="stack">
        <section className="card score-hero" aria-label="Latest score">
          <Gauge v={scan.overall_score} />
          <div className="stack" style={{ gap: 8 }}>
            <span className="eyebrow">{scan.psl_tier}</span>
            <h2 style={{ fontSize: 26 }}>{scan.tier_label}</h2>
            {scan.potential_score != null && <p>Estimated potential <Score v={scan.potential_score} /> with the plan below.</p>}
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => go('results', scan.id)}>View full results</button>
            </div>
          </div>
        </section>
        {next.length > 0 && <section className="card">
          <div className="card-head"><h2>Do this next</h2><button className="btn btn-ghost btn-sm" onClick={() => go('plan')}>Open plan<ChevronRight size={16} aria-hidden /></button></div>
          <ol className="do-first">{next.map(p => <li key={p.id}><div><h3>{p.title}</h3><p>{p.reason}</p></div></li>)}</ol>
        </section>}
      </div>
      <div className="stack">
        <Allowance limits={me.limits} />
        {plan.length > 0 && <section className="card stack" style={{ gap: 12 }}>
          <div className="row"><h2>Plan progress</h2><span className="num" style={{ fontWeight: 600 }}>{Math.round(done / plan.length * 100)}%</span></div>
          <Bar v={done} max={plan.length} fill="fill-accent" />
          <p className="meta">{done} of {plan.length} actions done</p>
        </section>}
        <section className="card">
          <div className="card-head" style={{ marginBottom: 8 }}><h2>Recent scans</h2><button className="btn btn-ghost btn-sm" onClick={() => go('history')}>All<ChevronRight size={16} aria-hidden /></button></div>
          {!recent ? <div className="sk" style={{ height: 120 }} /> : recent.map(s => <button key={s.id} className="scan-row" onClick={() => go('results', s.id)}>
            {s.thumb ? <img className="thumb" src={s.thumb} alt="" /> : <span className="thumb"><ImageOff size={18} aria-hidden /></span>}
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontWeight: 500 }}>{fmtDate(s.created_at)}</span><span className="meta">{s.tier}</span></span>
            <Score v={s.overall} className="score-md" />
          </button>)}
        </section>
      </div>
    </div>
  </Reveal>;
}
