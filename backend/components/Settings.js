'use client';
import { useState } from 'react';
import { ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import { api, nice, OPTIONS, fmtTime, resetDeviceId } from '@/lib/client';
import { Reveal, PageHead, Confirm, Note } from './ui';

const FIELDS = [['gender', 'Gender'], ['age_range', 'Age range'], ['main_goal', 'Main goal']];
const LINKS = [['/legal/terms', 'Terms of Service'], ['/legal/privacy', 'Privacy Policy'], ['/legal/biometric', 'Biometric data notice']];

export default function Settings({ me, setMe, toast, reset }) {
  const [dlg, setDlg] = useState(null), [busy, setBusy] = useState(false);
  const p = me.profile || {};
  const set = async (k, v) => {
    const before = p[k];
    setMe(m => ({ ...m, profile: { ...m.profile, [k]: v } }));
    try { await api('settings', { [k]: v }); toast('Saved'); }
    catch { setMe(m => ({ ...m, profile: { ...m.profile, [k]: before } })); toast('Could not save. Try again.'); }
  };
  const del = async () => {
    setBusy(true);
    try {
      await api('delete', { mode: dlg });
      if (dlg === 'all') { resetDeviceId(); setDlg(null); reset(); return; }
      toast('Photos deleted');
    } catch (e) { toast(e.message); }
    setBusy(false); setDlg(null);
  };
  return <Reveal>
    <PageHead title="Settings" sub="No account needed. Everything here applies to this device only." />
    <div className="stack-lg">
      <section className="card stack-lg" aria-labelledby="about-h">
        <div className="stack" style={{ gap: 4 }}><h2 id="about-h">About you</h2><p>Used to tailor your ratings, plan and coaching.</p></div>
        {FIELDS.map(([k, label]) => <fieldset key={k} className="field" style={{ border: 0 }}>
          <legend className="field-label" style={{ marginBottom: 10 }}>{label}</legend>
          <div className="chips">{OPTIONS[k].map(x => <button type="button" key={x} className="chip" aria-pressed={p[k] === x} onClick={() => p[k] !== x && set(k, x)}>{nice(x)}</button>)}</div>
        </fieldset>)}
      </section>

      <section className="card stack" aria-labelledby="priv-h">
        <h2 id="priv-h">Privacy and data</h2>
        <dl className="kv">
          <div><dt>Photo storage</dt><dd>Deleted {me.photo_days} days after each scan</dd></div>
          <div><dt>Scores and plans</dt><dd>Kept until you delete them</dd></div>
          <div><dt>Linked to</dt><dd>This browser only</dd></div>
        </dl>
        <Note>Clearing this browser's site data starts you fresh. Your old results can't be recovered after that.</Note>
        <div className="actions" style={{ marginTop: 4 }}>
          <button className="btn btn-secondary" onClick={() => setDlg('photos')}>Delete my photos now</button>
          <button className="btn btn-danger" onClick={() => setDlg('all')}><Trash2 size={18} aria-hidden />Delete all my data</button>
        </div>
      </section>

      <section className="card stack" aria-labelledby="limit-h">
        <h2 id="limit-h">Fair use</h2>
        <p>Maxora is free. To keep it fast for everyone, each network gets a daily allowance. Limits reset at {fmtTime(me.limits.scan.reset)}.</p>
        <dl className="kv">
          <div><dt>Scans per day</dt><dd>{me.limits.scan.remaining} of {me.limits.scan.max} left</dd></div>
          <div><dt>Coach Vee messages per day</dt><dd>{me.limits.coach.remaining} of {me.limits.coach.max} left</dd></div>
        </dl>
      </section>

      <section className="card" style={{ paddingTop: 8, paddingBottom: 8 }} aria-label="Legal and support">
        {LINKS.map(([href, label]) => <a key={href} href={href} className="scan-row" style={{ margin: 0, color: 'var(--fg)', textDecoration: 'none' }}><span style={{ flex: 1 }}>{label}</span><ChevronRight size={18} color="var(--fg-3)" aria-hidden /></a>)}
        <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="scan-row" style={{ margin: 0, color: 'var(--fg)', textDecoration: 'none' }}><span style={{ flex: 1 }}>Find a helpline</span><ExternalLink size={16} color="var(--fg-3)" aria-hidden /></a>
      </section>
    </div>

    <Confirm open={!!dlg} busy={busy} danger={dlg === 'all'} onClose={() => !busy && setDlg(null)} onConfirm={del}
      title={dlg === 'all' ? 'Delete all your data?' : 'Delete your photos?'}
      body={dlg === 'all' ? 'This permanently deletes your photos, scores, plan and chat history, and starts Maxora fresh on this browser.' : 'This permanently deletes every photo from your scans. Your scores and plan are kept.'}
      confirm={dlg === 'all' ? 'Delete everything' : 'Delete photos'} />
  </Reveal>;
}
