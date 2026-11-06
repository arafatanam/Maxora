'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, ImageOff, Equal } from 'lucide-react';
import { api, nice, FEATS, fmtDate } from '@/lib/client';
import { Reveal, PageHead, Score, Skeleton, Alert } from './ui';

function useWidth() {
  const ref = useRef(null), [w, setW] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function Chart({ pts }) {
  const [ref, W] = useWidth(), H = 200, L = 32, R = 12, T = 12, B = 28;
  const x = i => L + (pts.length < 2 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1)), y = v => T + (10 - v) * (H - T - B) / 10;
  const line = pts.map((p, i) => `${x(i)},${y(p.overall)}`).join(' ');
  const labels = pts.length <= 6 ? pts.map((_, i) => i) : [0, Math.floor((pts.length - 1) / 2), pts.length - 1];
  return <div ref={ref} style={{ width: '100%' }}>
    {W > 0 && <svg className="chart" width={W} height={H} role="img" aria-label={`Overall score over ${pts.length} scans, from ${pts[0].overall.toFixed(1)} to ${pts.at(-1).overall.toFixed(1)}`}>
      {[0, 5, 10].map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(163,158,149,0.16)" strokeDasharray={v === 0 ? '' : '3 4'} /><text x={L - 10} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
      <polyline points={line} fill="none" stroke="var(--light)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={p.id} cx={x(i)} cy={y(p.overall)} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? 'var(--accent-fg)' : 'var(--light)'} stroke="var(--surface)" strokeWidth="2" />)}
      {labels.map(i => <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 && pts.length > 1 ? 'start' : i === pts.length - 1 && pts.length > 1 ? 'end' : 'middle'}>{new Date(pts[i].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>)}
    </svg>}
  </div>;
}

export default function History({ go }) {
  const [list, setList] = useState(null), [cmp, setCmp] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api('scans').then(r => setList(r.scans)).catch(e => setErr(e.message)); }, []);
  if (err) return <><PageHead title="History" /><Alert>{err}</Alert></>;
  if (!list) return <Skeleton />;
  const pts = [...list].reverse();
  const compare = async () => {
    try { const [a, b] = await Promise.all(list.slice(0, 2).map(s => api('scan?id=' + s.id))); setCmp([a.scan, b.scan]); }
    catch (e) { setErr(e.message); }
  };
  if (!list.length) return <Reveal>
    <PageHead title="History" sub="Your scans and progress over time will show here." />
    <div><button className="btn btn-primary" onClick={() => go('scan')}>Start a scan</button></div>
  </Reveal>;
  return <Reveal>
    <PageHead title="History" sub={`${list.length} scan${list.length === 1 ? '' : 's'} on this device`}>
      {list.length > 1 && !cmp && <button className="btn btn-secondary" onClick={compare}>Compare last two</button>}
    </PageHead>
    <div className="stack">
      {pts.length > 1 && <section className="card"><div className="card-head"><h2>Overall score</h2><span className="meta">0 to 10</span></div><Chart pts={pts} /></section>}
      {cmp && <section className="card">
        <div className="card-head"><h2>Latest vs previous</h2><button className="btn btn-ghost btn-sm" onClick={() => setCmp(null)}>Close</button></div>
        <div className="grid-2" style={{ columnGap: 32, rowGap: 0 }}>
          {FEATS.map(f => {
            const now = cmp[0].feature_scores?.[f]?.score, was = cmp[1].feature_scores?.[f]?.score;
            if (now == null || was == null) return null;
            const d = Math.round((now - was) * 10) / 10, I = d > 0 ? ArrowUp : d < 0 ? ArrowDown : Equal;
            return <div key={f} className="row" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted">{nice(f)}</span>
              <span className="row" style={{ gap: 14 }}><Score v={now} /><span className={`delta ${d > 0 ? 'tone-hi' : 'tone-lo'}`}><I size={14} aria-hidden />{d > 0 ? '+' : ''}{d.toFixed(1)}</span></span>
            </div>;
          })}
        </div>
      </section>}
      <section className="card" style={{ paddingTop: 8, paddingBottom: 8 }} aria-label="All scans">
        {list.map(s => <button key={s.id} className="scan-row" style={{ margin: 0, width: '100%' }} onClick={() => go('results', s.id)}>
          {s.thumb ? <img className="thumb" src={s.thumb} alt="" /> : <span className="thumb" title="Photo deleted"><ImageOff size={18} aria-hidden /></span>}
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontWeight: 500 }}>{fmtDate(s.created_at)}</span><span className="meta">{s.tier}</span></span>
          <Score v={s.overall} className="score-md" />
          <ChevronRight size={18} color="var(--fg-3)" aria-hidden />
        </button>)}
      </section>
      <p className="meta">Photos are deleted 7 days after each scan. Scores stay in your history.</p>
    </div>
  </Reveal>;
}
