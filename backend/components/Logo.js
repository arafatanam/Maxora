// The Maxora mark, drawn from assets/icon.svg so it stays crisp at any size.
// `plain` drops the square background and crops to the gem.
export const FACETS = ['50,20 30,33 40,46', '50,20 40,46 60,46', '50,20 60,46 70,33', '30,33 28,56 40,46', '70,33 72,56 60,46', '28,56 40,46 50,62', '72,56 60,46 50,62', '28,56 50,62 50,80', '72,56 50,62 50,80'];
export const CORE = '40,46 60,46 50,62';

export function Logo({ size = 32, plain = false, title }) {
  return <svg width={size} height={size} viewBox={plain ? '24 16 52 68' : '0 0 100 100'} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    {!plain && <rect width="100" height="100" fill="#2B1B5A" />}
    <g fill="#B9A7FF" stroke="#2B1B5A" strokeWidth="2.4" strokeLinejoin="round">
      {FACETS.map(p => <polygon key={p} points={p} />)}
      <polygon points={CORE} fill="#5EF2C2" />
    </g>
  </svg>;
}
