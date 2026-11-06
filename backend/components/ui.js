'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AlertCircle, ArrowLeft, Check, Info } from 'lucide-react';
import { tone } from '@/lib/client';

gsap.registerPlugin(useGSAP);
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { Logo } from './Logo';

// Staggered fade-up of direct children when a screen mounts. Skipped entirely with reduced motion.
export function Reveal({ as: Tag = 'div', className, children, deps = [], ...rest }) {
  const ref = useRef(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(ref.current.children, { opacity: 0, y: 8, duration: 0.32, stagger: 0.035, ease: 'power3.out', clearProps: 'opacity,transform' });
    });
    return () => mm.revert();
  }, { scope: ref, dependencies: deps });
  return <Tag ref={ref} className={className} {...rest}>{children}</Tag>;
}

export function CountUp({ value, decimals = 1, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) { el.textContent = value.toFixed(decimals); return; }
    const o = { v: 0 };
    const t = gsap.to(o, { v: value, duration: 1, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(decimals); } });
    return () => t.kill();
  }, [value, decimals]);
  return <span ref={ref} className={className}>{value.toFixed(decimals)}</span>;
}

export function Gauge({ v, size = 180 }) {
  const r = 80, c = 2 * Math.PI * r, [shown, setShown] = useState(reduced() ? v : 0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(v)); return () => cancelAnimationFrame(id); }, [v]);
  return <div className="gauge" style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 180 180" aria-hidden>
      <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(185,167,255,0.12)" strokeWidth="8" />
      <circle cx="90" cy="90" r={r} fill="none" stroke={`var(--tone-${tone(v)})`} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - shown / 10)} transform="rotate(-90 90 90)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.23,1,0.32,1)' }} />
    </svg>
    <div className="gauge-value" role="img" aria-label={`Overall score ${v.toFixed(1)} out of 10`}>
      <CountUp value={v} className="num" />
      <span className="meta">out of 10</span>
    </div>
  </div>;
}

export function Bar({ v, max = 10, fill }) {
  const [shown, setShown] = useState(reduced() ? v : 0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(v)); return () => cancelAnimationFrame(id); }, [v]);
  return <div className="bar" aria-hidden><i className={fill || `fill-${tone(v)}`} style={{ transform: `scaleX(${Math.max(0, Math.min(1, shown / max))})` }} /></div>;
}

export const Score = ({ v, className = '' }) => <span className={`num tone-${tone(v)} ${className}`}>{Number(v).toFixed(1)}</span>;

export function PageHead({ title, sub, eyebrow, back, children }) {
  return <header className="page-head">
    <div>
      {back && <button className="back" onClick={back.onClick}><ArrowLeft size={16} aria-hidden />{back.label}</button>}
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    {children}
  </header>;
}

export const Alert = ({ children }) => <div className="alert" role="alert"><AlertCircle size={18} aria-hidden /><div>{children}</div></div>;
export const Note = ({ children, icon: Icon = Info }) => <div className="note"><Icon size={18} aria-hidden /><div>{children}</div></div>;

// Native <dialog>: focus trap, Escape and backdrop are handled by the browser.
export function Confirm({ open, title, body, confirm, danger, busy, onConfirm, onClose }) {
  const ref = useRef(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  return <dialog ref={ref} onClose={onClose} aria-labelledby="dlg-title">
    <div className="stack">
      <h2 id="dlg-title">{title}</h2>
      <p>{body}</p>
      <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onClose} autoFocus>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirm}</button>
      </div>
    </div>
  </dialog>;
}

export function Toast({ msg, onDone }) {
  useEffect(() => { if (!msg) return; const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [msg, onDone]);
  return <div aria-live="polite">{msg && <div className="toast"><Check size={16} aria-hidden />{msg}</div>}</div>;
}

export function Skeleton() {
  return <div className="stack" aria-busy="true" aria-label="Loading">
    <div className="sk" style={{ height: 36, width: 220 }} />
    <div className="sk" style={{ height: 220 }} />
    <div className="grid-2"><div className="sk" style={{ height: 140 }} /><div className="sk" style={{ height: 140 }} /></div>
  </div>;
}
