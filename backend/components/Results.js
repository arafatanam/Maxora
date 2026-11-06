'use client';
import { useEffect, useState } from 'react';
import { Download, Plus, Minus, ArrowRight, MessagesSquare, ImageOff } from 'lucide-react';
import { api, nice, FEATS, DISCLAIMER, fmtDate, tone } from '@/lib/client';
import { Reveal, PageHead, Gauge, Bar, Score, Skeleton, Alert } from './ui';

const TONES = { hi: '#5EF2C2', mid: '#B9A7FF', lo: '#A59BC9' };
import { FACETS, CORE } from './Logo';

// Renders a 1080x1350 share image in the brand palette and downloads it.
async function shareCard(s) {
  const css = getComputedStyle(document.body), head = css.getPropertyValue('--font-sora').trim() || 'sans-serif', body = css.getPropertyValue('--font-inter').trim() || 'sans-serif';
  await document.fonts?.ready;
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#150D2E'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#20154A'; x.beginPath(); x.roundRect(60, 60, W - 120, H - 120, 40); x.fill();
  x.save(); x.translate(110, 110); x.scale(0.9, 0.9);
  x.fillStyle = '#2B1B5A'; x.beginPath(); x.roundRect(0, 0, 100, 100, 22); x.fill();
  x.strokeStyle = '#2B1B5A'; x.lineWidth = 2.4; x.lineJoin = 'round';
  [...FACETS.map(p => [p, '#B9A7FF']), [CORE, '#5EF2C2']].forEach(([p, f]) => {
    const pts = p.split(' ').map(q => q.split(',').map(Number));
    x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fillStyle = f; x.fill(); x.stroke();
  });
  x.restore();
  x.fillStyle = '#F5F3FF'; x.font = `600 44px ${head}`; x.fillText('Maxora', 225, 172);
  x.fillStyle = TONES[tone(s.overall_score)]; x.font = `600 260px ${head}`; x.fillText(s.overall_score.toFixed(1), 104, 520);
  x.fillStyle = 'rgba(245,243,255,0.56)'; x.font = `400 34px ${body}`; x.fillText('out of 10', 112, 580);
  x.fillStyle = '#F5F3FF'; x.font = `600 64px ${head}`; x.fillText(s.tier_label, 110, 700);
  x.fillStyle = '#B9A7FF'; x.font = `500 36px ${body}`; x.fillText(s.psl_tier, 112, 760);
  const top = Object.entries(s.feature_scores || {}).sort((a, b) => b[1].score - a[1].score).slice(0, 3);
  top.forEach(([k, v], i) => {
    const y = 880 + i * 110;
    x.fillStyle = 'rgba(245,243,255,0.74)'; x.font = `400 36px ${body}`; x.fillText(nice(k), 112, y);
    x.fillStyle = TONES[tone(v.score)]; x.font = `600 40px ${head}`; x.textAlign = 'right'; x.fillText(v.score.toFixed(1), W - 112, y); x.textAlign = 'left';
    x.fillStyle = 'rgba(185,167,255,0.14)'; x.beginPath(); x.roundRect(112, y + 26, W - 224, 10, 5); x.fill();
    x.fillStyle = TONES[tone(v.score)]; x.beginPath(); x.roundRect(112, y + 26, (W - 224) * v.score / 10, 10, 5); x.fill();
  });
  x.fillStyle = 'rgba(245,243,255,0.56)'; x.font = `400 28px ${body}`; x.fillText('AI estimate · maxora', 112, H - 120);
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'maxora-score.png'; a.click();
}

export default function Results({ id, latest, go }) {
  const [s, setS] = useState(id && id !== latest?.id ? null : latest), [err, setErr] = useState('');
  useEffect(() => {
    if (!id || id === latest?.id) { setS(latest); return; }
    setS(null); api('scan?id=' + id).then(r => r.scan ? setS(r.scan) : setErr('This scan no longer exists.')).catch(e => setErr(e.message));
  }, [id, latest]);
  if (err) return <><PageHead title="Results" back={{ label: 'Overview', onClick: () => go('home') }} /><Alert>{err}</Alert></>;
  if (!s) return latest === null && !id ? <EmptyResults go={go} /> : <Skeleton />;
  const top = (s.plan || []).slice(0, 3), isLatest = s.id === latest?.id;
  const deleteOn = new Date(new Date(s.created_at).getTime() + 7 * 864e5);
  return <Reveal deps={[s.id]}>
    <PageHead title="Your results" eyebrow={fmtDate(s.created_at)} back={{ label: 'Back', onClick: () => history.length > 1 ? history.back() : go('home') }} />
    <div className="results">
      <aside className="stack">
        <section className="card stack" style={{ justifyItems: 'center', textAlign: 'center' }} aria-label="Overall score">
          <Gauge v={s.overall_score} size={200} />
          <div className="stack" style={{ gap: 4 }}>
            <h2 style={{ fontSize: 26 }}>{s.tier_label}</h2>
            <p>{s.psl_tier}</p>
          </div>
          {s.potential_score != null && <div className="row" style={{ width: '100%', paddingTop: 12, borderTop: '1px solid var(--border)' }}><span className="muted">Estimated potential</span><Score v={s.potential_score} className="score-sm" /></div>}
          <button className="btn btn-secondary btn-block" onClick={() => shareCard(s)}><Download size={18} aria-hidden />Save score card</button>
        </section>
        <p className="meta" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 4px' }}><ImageOff size={14} aria-hidden style={{ flex: 'none' }} />
          {s.photos_deleted ? 'Photos for this scan were deleted. Scores are kept.' : `Photos for this scan are deleted on ${fmtDate(deleteOn)}.`}</p>
      </aside>

      <div className="stack-lg">
        {s.summary && <p style={{ fontSize: 18, color: 'var(--fg)', lineHeight: 1.6, maxWidth: '65ch' }}>{s.summary}</p>}
        {top.length > 0 && <section className="card">
          <div className="card-head"><h2>Do this first</h2>{isLatest && <button className="btn btn-ghost btn-sm" onClick={() => go('plan')}>Full plan<ArrowRight size={16} aria-hidden /></button>}</div>
          <ol className="do-first">{top.map(p => <li key={p.id}><div><h3>{p.title}</h3><p>{p.reason}</p></div></li>)}</ol>
        </section>}

        <section className="section" aria-labelledby="feat-h">
          <div className="section-head"><h2 id="feat-h">Feature scores</h2><span className="badge">AI estimate</span></div>
          <div className="grid-feat">{FEATS.map(f => s.feature_scores?.[f] && <article key={f} className="card stack" style={{ gap: 10 }}>
            <div className="row"><h3>{nice(f)}</h3><Score v={s.feature_scores[f].score} className="score-sm" /></div>
            <Bar v={s.feature_scores[f].score} />
            <p style={{ fontSize: 15 }}>{s.feature_scores[f].verdict}</p>
          </article>)}</div>
        </section>

        <div className="grid-2">
          <section className="card"><h2 style={{ marginBottom: 14 }}>Strengths</h2><ul className="list">{(s.strengths || []).map(x => <li key={x}><Plus size={16} color="var(--accent)" aria-hidden /><span>{x}</span></li>)}</ul></section>
          <section className="card"><h2 style={{ marginBottom: 14 }}>To work on</h2><ul className="list">{(s.weaknesses || []).map(x => <li key={x}><Minus size={16} color="var(--light)" aria-hidden /><span>{x}</span></li>)}</ul></section>
        </div>

        {s.face_profile && <section className="card"><h2 style={{ marginBottom: 6 }}>Face profile</h2>
          <dl className="kv">{Object.entries(s.face_profile).map(([k, v]) => <div key={k}><dt>{nice(k)}</dt><dd>{nice(String(v))}</dd></div>)}</dl></section>}

        {isLatest && <div className="actions">
          <button className="btn btn-primary" onClick={() => go('plan')}>Open improvement plan<ArrowRight size={18} aria-hidden /></button>
          <button className="btn btn-secondary" onClick={() => go('coach')}><MessagesSquare size={18} aria-hidden />Ask Coach Maxy</button>
        </div>}
        <p className="meta">{DISCLAIMER}</p>
      </div>
    </div>
  </Reveal>;
}

function EmptyResults({ go }) {
  return <Reveal>
    <PageHead title="Results" sub="You haven't completed a scan yet." />
    <div><button className="btn btn-primary" onClick={() => go('scan')}>Start a scan</button></div>
  </Reveal>;
}
