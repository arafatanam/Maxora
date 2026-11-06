// AI provider chain. Every provider here speaks the OpenAI chat-completions format.
//
// AI_VISION (face analysis) and AI_CHAT (Coach Maxy) are comma-separated lists of
// "provider:model". Each request tries them in order and moves on when one fails or is
// out of quota, so a second provider adds capacity on top of the first one's free tier.
//
//   AI_VISION=groq:qwen/qwen3.8-27b,cloudflare:@cf/qwen/qwen3.8-27b
//   AI_CHAT=groq:openai/gpt-oss-120b,groq:qwen/qwen3.8-27b
//
// Free-tier quotas are usually per model, so giving the coach its own model keeps chat
// from using up the daily budget that scans need. If AI_VISION is unset, GROQ_MODEL is
// used; if AI_CHAT is unset, the vision list is used.
//
// Only add providers that do not train on API data: these requests contain face photos.

const PROVIDERS = {
  groq: {
    url: () => 'https://api.groq.com/openai/v1/chat/completions',
    key: () => process.env.GROQ_API_KEY,
    needs: 'GROQ_API_KEY',
  },
  cloudflare: {
    url: () => `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
    key: () => (process.env.CLOUDFLARE_ACCOUNT_ID ? process.env.CLOUDFLARE_API_TOKEN : ''),
    needs: 'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN',
  },
};

const TIMEOUT = 45_000;

function chain(kind) {
  const raw = kind === 'chat'
    ? process.env.AI_CHAT || process.env.AI_VISION
    : process.env.AI_VISION;
  const list = (raw || (process.env.GROQ_MODEL ? `groq:${process.env.GROQ_MODEL}` : ''))
    .split(',').map(s => s.trim()).filter(Boolean)
    .map(s => { const i = s.indexOf(':'); return { name: s.slice(0, i), model: s.slice(i + 1) }; });
  if (!list.length) throw new Error('No AI model is configured. Set AI_VISION (or GROQ_MODEL).');
  return list;
}

// Messages use { type: 'image', source: { media_type, data } } and { type: 'text', text } parts.
const toOpenAI = messages => messages.map(m => ({
  role: m.role,
  content: Array.isArray(m.content)
    ? m.content.map(p => p.type === 'image'
      ? { type: 'image_url', image_url: { url: `data:${p.source.media_type};base64,${p.source.data}` } }
      : { type: 'text', text: p.text })
    : m.content,
}));

// Reasoning models may prepend their thinking. Keep only the answer.
const clean = t => String(t || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

async function call({ name, model }, system, messages, max) {
  const p = PROVIDERS[name];
  if (!p) throw new Error(`Unknown AI provider "${name}".`);
  const key = p.key();
  if (!key) throw new Error(`${name} needs ${p.needs}.`);
  const r = await fetch(p.url(), {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: max, messages: [{ role: 'system', content: system }, ...toOpenAI(messages)] }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = j.error?.message || j.errors?.[0]?.message || 'request failed';
    throw new Error(r.status === 429 ? `${name} is at its usage limit` : `${name} error ${r.status}: ${msg}`);
  }
  const text = clean(j.choices?.[0]?.message?.content);
  if (!text) throw new Error(`${name} returned an empty reply`);
  return text;
}

// kind: 'vision' or 'chat'. Throws only after every configured model has failed.
export async function complete(kind, system, messages, max) {
  const errors = [];
  for (const target of chain(kind)) {
    try { return await call(target, system, messages, max); }
    catch (e) {
      const msg = e.name === 'TimeoutError' ? `${target.name} timed out` : e.message;
      console.error(`[ai] ${kind} ${target.name}:${target.model} failed: ${msg}`);
      errors.push(msg);
    }
  }
  // Details are in the server log above; users get a plain message.
  throw new Error(errors.every(m => m.includes('usage limit'))
    ? 'The AI service has reached its daily capacity. Please try again later.'
    : 'The AI service is unavailable right now. Please try again in a few minutes.');
}
