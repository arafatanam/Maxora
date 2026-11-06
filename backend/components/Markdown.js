import { Fragment } from 'react';
import { parseBlocks, parseInline } from '@/lib/markdown';

function Inline({ text }) {
  return parseInline(text).map((p, k) => {
    if (p.code) return <code key={k}>{p.text}</code>;
    let el = p.text;
    if (p.i) el = <em>{el}</em>;
    if (p.b) el = <strong>{el}</strong>;
    return <Fragment key={k}>{el}</Fragment>;
  });
}

// Renders a Coach Maxy reply. Text goes through React, so nothing in the reply is treated as HTML.
export default function Markdown({ text }) {
  return <div className="md">{parseBlocks(text).map((b, k) => {
    if (b.type === 'h') return <p key={k} className="md-h"><Inline text={b.text} /></p>;
    if (b.type === 'p') return <p key={k}><Inline text={b.text} /></p>;
    const List = b.type === 'ol' ? 'ol' : 'ul';
    return <List key={k}>{b.items.map((it, j) => <li key={j} value={b.type === 'ol' && it.n ? it.n : undefined}><Inline text={it.text} /></li>)}</List>;
  })}</div>;
}
