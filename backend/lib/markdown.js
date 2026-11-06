// Minimal Markdown for Coach Maxy replies: headings, bullet and numbered lists, paragraphs,
// **bold**, __bold__, *italic*, ***bold italic*** and `code`.
// It returns plain data that each app renders with its own components, never as HTML,
// so model output can't inject markup. The same file lives in mobile/src/markdown.js. Keep them in sync.

const LIST = /^\s*([-*•+]|\d{1,3}[.)])\s+(.*)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const HEAD = /^\s*#{1,6}\s+(.*?)\s*#*\s*$/;

// [{ type: 'h' | 'p', text }] or [{ type: 'ul' | 'ol', items: [{ n, text }] }]
export function parseBlocks(src) {
  const blocks = [];
  let para = [];
  const flush = () => { if (para.length) { blocks.push({ type: 'p', text: para.join('\n') }); para = []; } };
  for (const raw of String(src || '').replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line || RULE.test(raw)) { flush(); continue; }
    const h = HEAD.exec(raw);
    if (h) { flush(); blocks.push({ type: 'h', text: h[1] }); continue; }
    const li = LIST.exec(raw);
    const last = blocks[blocks.length - 1];
    if (li) {
      flush();
      const type = /\d/.test(li[1]) ? 'ol' : 'ul';
      const item = { n: parseInt(li[1], 10) || 0, text: li[2].trim() };
      if (last?.type === type) last.items.push(item); else blocks.push({ type, items: [item] });
      continue;
    }
    // An indented line right after a list item continues that item.
    if (!para.length && (last?.type === 'ul' || last?.type === 'ol') && /^\s+/.test(raw)) {
      last.items[last.items.length - 1].text += ' ' + line;
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

const INLINE = /(\*\*\*[^*\n]+?\*\*\*|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\s](?:[^*\n]*?[^*\s])?\*|`[^`\n]+`)/;

// [{ text, b?, i?, code? }]. split() with a capture group puts the matches at odd indexes.
export function parseInline(text) {
  return String(text || '').split(INLINE).map((s, k) => {
    if (k % 2 === 0) return { text: s };
    if (s.startsWith('***')) return { text: s.slice(3, -3), b: true, i: true };
    if (s.startsWith('**') || s.startsWith('__')) return { text: s.slice(2, -2), b: true };
    if (s.startsWith('`')) return { text: s.slice(1, -1), code: true };
    return { text: s.slice(1, -1), i: true };
  }).filter(p => p.text);
}
