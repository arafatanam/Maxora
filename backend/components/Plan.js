'use client';
import { api, nice, CATS } from '@/lib/client';
import { Reveal, PageHead, Bar } from './ui';

export default function Plan({ scan, setScan, go }) {
  if (!scan) return <Reveal>
    <PageHead title="Improvement plan" sub="Your plan is built from your scan results. Run a scan to get one." />
    <div><button className="btn btn-primary" onClick={() => go('scan')}>Start a scan</button></div>
  </Reveal>;
  const plan = scan.plan || [], done = plan.filter(p => p.completed).length;
  const toggle = async p => {
    const completed = !p.completed, set = c => setScan(s => ({ ...s, plan: s.plan.map(x => x.id === p.id ? { ...x, completed: c } : x) }));
    set(completed);
    try { await api('plan/toggle', { id: p.id, completed }); } catch { set(!completed); }
  };
  const groups = CATS.filter(c => plan.some(p => p.category === c));
  const other = plan.filter(p => !CATS.includes(p.category));
  return <Reveal>
    <PageHead title="Improvement plan" sub="Ranked by impact for the effort. Tick actions off as you build them into your routine." />
    <section className="card stack" style={{ gap: 12 }} aria-label="Progress">
      <div className="row"><h2>{done === plan.length && plan.length ? 'All done' : 'Progress'}</h2><span className="num" style={{ fontWeight: 600 }}>{done} / {plan.length}</span></div>
      <Bar v={done} max={plan.length || 1} fill="fill-accent" />
    </section>
    {[...groups.map(c => [nice(c), plan.filter(p => p.category === c)]), ...(other.length ? [['Other', other]] : [])].map(([title, items]) =>
      <section key={title} className="section" style={{ marginTop: 28 }}>
        <h2>{title}</h2>
        <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
          {items.map(p => <label key={p.id} className={`plan-item check${p.completed ? ' done' : ''}`}>
            <input type="checkbox" checked={!!p.completed} onChange={() => toggle(p)} />
            <div style={{ minWidth: 0 }}>
              <h3>{p.title}</h3>
              <p style={{ fontSize: 15, marginTop: 2 }}>{p.reason}</p>
              <div className="tags">
                {p.impact && <span className="badge accent">Impact {p.impact}</span>}
                {p.effort && <span className="badge">Effort {p.effort}</span>}
                {p.time_to_result && <span className="badge">{p.time_to_result}</span>}
              </div>
            </div>
          </label>)}
        </div>
      </section>)}
  </Reveal>;
}
